import { ethers } from "ethers";
import BigNumber from 'bignumber.js'
import {
    _getDecimals,
    _getBalances,
    _getBalancesBN,
    ensureAllowance,
    getPoolNameBySwapAddress,
    BN,
    toBN,
    fromBN,
    toStringFromBN,
    getCrvRate,
    isEth,
    getEthIndex,
} from './utils';
import { DictInterface } from './interfaces';
import registryExchangeABI from './constants/abis/json/registry_exchange.json';
import registryABI from './constants/abis/json/registry.json';
import { poolsData } from './constants/abis/abis-ethereum';
import { ALIASES, curve } from "./curve";


export class Pool {
    name: string;
    swap: string;
    zap: string | null;
    lpToken: string;
    gauge: string;

    underlyingCoins: string[];
    coins: string[];
    underlyingDecimals: number[];
    decimals: number[];
    useLending: boolean[];

    constructor(name: string) {
        const poolData = poolsData[name];
        
        this.name = name;
        this.swap = poolData.swap_address;
        this.zap = poolData.deposit_address || null;
        this.lpToken = poolData.token_address;
        this.gauge = poolData.gauge_address;
        this.underlyingCoins = poolData.underlying_coins;
        this.coins = poolData.coins;
        this.underlyingDecimals = poolData.underlying_decimals;
        this.decimals = poolData.decimals;
        this.useLending = poolData.use_lending;
    }

    private _calcLpTokenAmount = async (amounts: ethers.BigNumber[], isDeposit = true): Promise<ethers.BigNumber> => {
        return await curve.contracts[this.swap].contract.calc_token_amount(amounts, isDeposit);
    }

    private _calcLpTokenAmountZap = async (amounts: ethers.BigNumber[], isDeposit = true): Promise<ethers.BigNumber> => {
        return await curve.contracts[this.zap as string].contract.calc_token_amount(amounts, isDeposit);
    }

    // TODO refactor
    private _getRates = async(): Promise<ethers.BigNumber[]> => {
        const _rates: ethers.BigNumber[] = [];
        for (let i = 0; i < this.coins.length; i++) {
            const addr = this.coins[i];
            if (this.useLending[i]) {
                if (['compound', 'usdt', 'ib'].includes(this.name)) {
                    _rates.push(await curve.contracts[addr].contract.exchangeRateStored());
                } else if (['y', 'busd', 'pax'].includes(this.name)) {
                    _rates.push(await curve.contracts[addr].contract.getPricePerFullShare());
                } else {
                    _rates.push(ethers.BigNumber.from(10).pow(18)); // Aave ratio 1:1
                }
            } else {
                _rates.push(ethers.BigNumber.from(10).pow(18));
            }
        }

        return _rates
    }

    private _calcLpTokenAmountWithUnderlying = async (_underlying_amounts: ethers.BigNumber[], isDeposit = true): Promise<ethers.BigNumber> => {
        const _rates: ethers.BigNumber[] = await this._getRates();
        const _wrapped_amounts = _underlying_amounts.map((amount: ethers.BigNumber, i: number) =>
            amount.mul(ethers.BigNumber.from(10).pow(18)).div(_rates[i]));

        return await curve.contracts[this.swap].contract.calc_token_amount(_wrapped_amounts, isDeposit);
    }

    private _addLiquidityPlain = async (amounts: ethers.BigNumber[]): Promise<string> => {
        await ensureAllowance(this.underlyingCoins, amounts, this.swap);

        const _minMintAmount = (await this._calcLpTokenAmount(amounts)).div(100).mul(99);
        const contract = curve.contracts[this.swap].contract;

        const ethIndex = getEthIndex(this.underlyingCoins);
        if (ethIndex !== -1) {
            // TODO figure out, how to set gasPrice
            return (await contract.add_liquidity(amounts, _minMintAmount, { ...curve.options, value: amounts[ethIndex] })).hash;
        }

        return (await contract.add_liquidity(amounts, _minMintAmount, curve.options)).hash;
    }

    private _addLiquidity = async (_amounts: ethers.BigNumber[], useUnderlying= true): Promise<string> => {
        await ensureAllowance(this.underlyingCoins, _amounts, this.swap);

        // TODO add calc for wrapped
        const _minMintAmount = (await this._calcLpTokenAmountWithUnderlying(_amounts)).div(100).mul(99);
        const contract = curve.contracts[this.swap].contract;

        const ethIndex = getEthIndex(this.underlyingCoins);
        if (ethIndex !== -1) {
            // TODO figure out, how to set gasPrice
            return (await contract.add_liquidity(_amounts, _minMintAmount, useUnderlying, { ...curve.options, value: _amounts[ethIndex] })).hash;
        }

        return (await contract.add_liquidity(_amounts, _minMintAmount, useUnderlying, curve.options)).hash;
    }

    private _addLiquidityZap = async (amounts: ethers.BigNumber[]): Promise<string> => {
        await ensureAllowance(this.underlyingCoins, amounts, this.zap as string);

        let minMintAmount;
        if (this.name === 'gusd') {
            minMintAmount = (await this._calcLpTokenAmountZap(amounts)).div(100).mul(99)
        } else {
            minMintAmount = (await this._calcLpTokenAmountWithUnderlying(amounts)).div(100).mul(99);
        }

        const ethIndex = getEthIndex(this.underlyingCoins);
        if (ethIndex !== -1) {
            // TODO figure out, how to set gasPrice
            return (await curve.contracts[this.zap as string].contract.add_liquidity(amounts, minMintAmount, { ...curve.options, value: amounts[ethIndex] })).hash;
        }

        return (await curve.contracts[this.zap as string].contract.add_liquidity(amounts, minMintAmount, curve.options)).hash;
    }

    public addLiquidity = async (amounts: string[]): Promise<string> => {
        if (amounts.length !== this.coins.length) {
            throw Error(`${this.name} pool has ${this.coins.length} coins (amounts provided for ${amounts.length})`);
        }
        const _amounts: ethers.BigNumber[] = amounts.map((amount: string, i: number) =>
            ethers.utils.parseUnits(amount, this.underlyingDecimals[i]));

        if (['compound', 'usdt', 'y', 'busd', 'pax'].includes(this.name) || ['gusd'].includes(this.name)) {
            return await this._addLiquidityZap(_amounts);
        }

        if (['aave', 'saave', 'ib'].includes(this.name)) {
            return await this._addLiquidity(_amounts, true);
        }

        return await this._addLiquidityPlain(_amounts);
    }

    public gaugeDeposit = async (lpTokenAmount: string): Promise<string> => {
        const _lpTokenAmount = ethers.utils.parseUnits(lpTokenAmount);
        await ensureAllowance([this.lpToken], [_lpTokenAmount], this.gauge)

        return (await curve.contracts[this.gauge].contract.deposit(_lpTokenAmount, curve.options)).hash;
    }

    public gaugeWithdraw = async (lpTokenAmount: string): Promise<string> => {
        const _lpTokenAmount = ethers.utils.parseUnits(lpTokenAmount);
        return (await curve.contracts[this.gauge].contract.withdraw(_lpTokenAmount, curve.options)).hash;
    }

    // TODO refactor
    private _calcUnderlyingAmounts = async (amount: ethers.BigNumber): Promise<ethers.BigNumber[]> => {
        const underlyingCoinBalances: DictInterface<BigNumber[]> = await _getBalancesBN([this.swap], this.underlyingCoins);
        const totalSupply: BigNumber = toBN(await curve.contracts[this.lpToken].contract.totalSupply());

        const minAmounts: BigNumber[] = [];
        for (const underlyingCoinBalance of underlyingCoinBalances[this.swap]) {
            minAmounts.push(underlyingCoinBalance.times(toBN(amount)).div(totalSupply).times(0.99));
        }

        return minAmounts.map((amount: BigNumber, i: number) =>
            fromBN(amount, this.underlyingDecimals[i]));
    }

    // TODO refactor
    private _calcUnderlyingAmountsZap = async (lpAmount: ethers.BigNumber): Promise<ethers.BigNumber[]> => {
        const coinBalancesBN: BigNumber[] = (await _getBalancesBN([this.swap], this.coins))[this.swap];
        const lpTotalSupplyBN: BigNumber = toBN(await curve.contracts[this.lpToken].contract.totalSupply());

        const minAmountsBN: BigNumber[] = [];
        const multiplier = toBN(lpAmount).div(lpTotalSupplyBN);
        for (const b of coinBalancesBN) {
            minAmountsBN.push(b.times(multiplier).times(0.99));
        }
        const _minAmounts = minAmountsBN.map((amountBN: BigNumber, i: number) => fromBN(amountBN, this.decimals[i]));
        const _rates: ethers.BigNumber[] = await this._getRates();

        return _minAmounts.map((_amount: ethers.BigNumber, i: number) => _amount.mul(_rates[i]).div(ethers.BigNumber.from(10).pow(18)))
    }

    public calcUnderlyingAmounts = async (amount: string): Promise<string[]> => {
        const underlyingAmounts: ethers.BigNumber[] = ['compound', 'usdt', 'y', 'busd', 'pax', 'ib'].includes(this.name) ?
            await this._calcUnderlyingAmountsZap(ethers.utils.parseUnits(amount)) :
            await this._calcUnderlyingAmounts(ethers.utils.parseUnits(amount));

        return underlyingAmounts.map((amount: ethers.BigNumber, i: number) => ethers.utils.formatUnits(amount, this.underlyingDecimals[i]));
    }

    private _removeLiquidityPlain = async (_lpTokenAmount: ethers.BigNumber): Promise<string> => {
        const _minAmounts = await this._calcUnderlyingAmounts(_lpTokenAmount);
        return (await curve.contracts[this.swap].contract.remove_liquidity(_lpTokenAmount, _minAmounts, curve.options)).hash;
    }

    private _removeLiquidity = async (_lpTokenAmount: ethers.BigNumber, useUnderlying = true): Promise<string> => {
        const _minAmounts = await this._calcUnderlyingAmountsZap(_lpTokenAmount);
        return (await curve.contracts[this.swap].contract.remove_liquidity(_lpTokenAmount, _minAmounts, useUnderlying, curve.options)).hash;
    }

    private _removeLiquidityZap = async (_lpTokenAmount: ethers.BigNumber): Promise<string> => {
        const _minAmounts = await this._calcUnderlyingAmountsZap(_lpTokenAmount);
        await ensureAllowance([this.lpToken], [_lpTokenAmount], this.zap as string);

        return (await curve.contracts[this.zap as string].contract.remove_liquidity(_lpTokenAmount, _minAmounts, curve.options)).hash;
    }

    public removeLiquidity = async (lpTokenAmount: string): Promise<string> => {
        const _lpTokenAmount = ethers.utils.parseUnits(lpTokenAmount);

        if (['compound', 'usdt', 'y', 'busd', 'pax'].includes(this.name)) {
            return await this._removeLiquidityZap(_lpTokenAmount);
        }

        if (['aave', 'saave', 'ib'].includes(this.name)) {
            return await this._removeLiquidity(_lpTokenAmount, true);
        }

        return await this._removeLiquidityPlain(_lpTokenAmount);
    }

    private _removeLiquidityImbalancePlain = async (_amounts: ethers.BigNumber[]): Promise<string> => {
        let _maxBurnAmount = await this._calcLpTokenAmount(_amounts, false);
        _maxBurnAmount = _maxBurnAmount.div(100).mul(101);
        const  contract = curve.contracts[this.swap].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_imbalance(_amounts, _maxBurnAmount, curve.options);

        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, { ...curve.options, gasLimit })).hash;
    }

    private _removeLiquidityImbalance = async (_amounts: ethers.BigNumber[], useUnderlying = true): Promise<string> => {
        const _maxBurnAmount = (await this._calcLpTokenAmountWithUnderlying(_amounts, false)).div(100).mul(101);
        const  contract = curve.contracts[this.swap].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_imbalance(_amounts, _maxBurnAmount, useUnderlying, curve.options);

        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, useUnderlying, { ...curve.options, gasLimit })).hash;
    }

    private _removeLiquidityImbalanceZap = async (_amounts: ethers.BigNumber[]): Promise<string> => {
        let _maxBurnAmount = await this._calcLpTokenAmountWithUnderlying(_amounts, false);
        _maxBurnAmount = _maxBurnAmount.div(100).mul(101);
        await ensureAllowance([this.lpToken], [_maxBurnAmount], this.zap as string);
        const  contract = curve.contracts[this.zap as string].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_imbalance(_amounts, _maxBurnAmount, curve.options);

        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, { ...curve.options, gasLimit }));
    }

    public removeLiquidityImbalance = async (amounts: string[]): Promise<string> => {
        const _amounts: ethers.BigNumber[] = amounts.map((amount: string, i: number) => ethers.utils.parseUnits(amount, this.underlyingDecimals[i]));

        if (['compound', 'usdt', 'y', 'busd', 'pax'].includes(this.name)) {
            return await this._removeLiquidityImbalanceZap(_amounts);
        }

        if (['aave', 'saave', 'ib'].includes(this.name)) {
            return await this._removeLiquidityImbalance(_amounts, true);
        }

        return await this._removeLiquidityImbalancePlain(_amounts)
    }

    private _calcWithdrawOneCoin = async (_lpTokenAmount: ethers.BigNumber, i: number): Promise<ethers.BigNumber> => {
        return await curve.contracts[this.swap].contract.calc_withdraw_one_coin(_lpTokenAmount, i, curve.options);
    }

    private _calcWithdrawOneCoinWithUnderlying = async (_lpTokenAmount: ethers.BigNumber, i: number): Promise<ethers.BigNumber> => {
        return await curve.contracts[this.swap].contract.calc_withdraw_one_coin(_lpTokenAmount, i, true, curve.options);
    }

    private _calcWithdrawOneCoinZap = async (_lpTokenAmount: ethers.BigNumber, i: number): Promise<ethers.BigNumber> => {
        return await curve.contracts[this.zap as string].contract.calc_withdraw_one_coin(_lpTokenAmount, i, curve.options);
    }

    private _removeLiquidityOneCoinPlain = async (_lpTokenAmount: ethers.BigNumber, i: number): Promise<string> => {
        const _minAmount = (await this._calcWithdrawOneCoin(_lpTokenAmount, i)).div(100).mul(99);
        const  contract = curve.contracts[this.swap].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, curve.options);

        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, { ...curve.options, gasLimit })).hash
    }

    private _removeLiquidityOneCoin = async (_lpTokenAmount: ethers.BigNumber, i: number, useUnderlying = true): Promise<string> => {
        let _minAmount = this.name === 'ib' ? await this._calcWithdrawOneCoinWithUnderlying(_lpTokenAmount, i) :
            await this._calcWithdrawOneCoin(_lpTokenAmount, i);
        _minAmount = _minAmount.div(100).mul(99);
        const  contract = curve.contracts[this.swap].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, useUnderlying, curve.options);

        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, useUnderlying, { ...curve.options, gasLimit })).hash
    }

    public _removeLiquidityOneCoinZap = async (_lpTokenAmount: ethers.BigNumber, i: number): Promise<string> => {
        const _minAmount = (await this._calcWithdrawOneCoinZap(_lpTokenAmount, i)).div(100).mul(99);
        await ensureAllowance([this.lpToken], [_lpTokenAmount], this.zap as string);
        const  contract = curve.contracts[this.zap as string].contract;
        const gasLimit = await contract.estimateGas.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, curve.options);

        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, { ...curve.options, gasLimit })).hash
    }

    public removeLiquidityOneCoin = async (lpTokenAmount: string, i: number): Promise<string> => {
        const _lpTokenAmount = ethers.utils.parseUnits(lpTokenAmount);

        if (['compound', 'usdt', 'y', 'busd', 'pax'].includes(this.name) || this.name === 'susd') {
            return await this._removeLiquidityOneCoinZap(_lpTokenAmount, i);
        }

        if (['aave', 'saave', 'ib'].includes(this.name)) {
            return await this._removeLiquidityOneCoin(_lpTokenAmount, i,true);
        }

        return await this._removeLiquidityOneCoinPlain(_lpTokenAmount, i)
    }

    public balances = async (...addresses: string[] | string[][]): Promise<DictInterface<string[]>> =>  {
        if (addresses.length == 1 && Array.isArray(addresses[0])) addresses = addresses[0];
        addresses = addresses as string[];

        const rawBalances: DictInterface<ethers.BigNumber[]> = await _getBalances(addresses, [this.lpToken, this.gauge]);
        const balances: DictInterface<string[]> = {};
        for (const address of addresses) {
            balances[address] = rawBalances[address].map((b: ethers.BigNumber) => ethers.utils.formatUnits(b));
        }

        return balances
    }

    public lpTokenBalances = async (...addresses: string[] | string[][]): Promise<DictInterface<string>> =>  {
        if (addresses.length == 1 && Array.isArray(addresses[0])) addresses = addresses[0];
        addresses = addresses as string[];

        const rawBalances: DictInterface<ethers.BigNumber[]> = await _getBalances(addresses, [this.lpToken]);
        const balances: DictInterface<string> = {};
        for (const address of addresses) {
            balances[address] = ethers.utils.formatUnits(rawBalances[address][0]);
        }

        return balances;
    }

    public gaugeBalances = async (...addresses: string[] | string[][]): Promise<DictInterface<string>> =>  {
        if (addresses.length == 1 && Array.isArray(addresses[0])) addresses = addresses[0];
        addresses = addresses as string[];

        const rawBalances: DictInterface<ethers.BigNumber[]> = await _getBalances(addresses, [this.gauge])
        const balances: DictInterface<string> = {};
        for (const address of addresses) {
            balances[address] = ethers.utils.formatUnits(rawBalances[address][0]);
        }

        return balances
    }

    public _getSwapOutput = async (i: number, j: number, _amount: ethers.BigNumber): Promise<ethers.BigNumber> => {
        const contract = curve.contracts[this.swap].contract;
        if (Object.prototype.hasOwnProperty.call(curve.contracts[this.swap].contract, 'get_dy_underlying')) {
            return await contract.get_dy_underlying(i, j, _amount, curve.options)
        } else {
            return await contract.get_dy(i, j, _amount, curve.options);
        }
    }

    public getSwapOutput = async (i: number, j: number, amount: string): Promise<string> => {
        const _amount = ethers.utils.parseUnits(amount, this.underlyingDecimals[i]);
        const _expected = await this._getSwapOutput(i, j, _amount);

        return ethers.utils.formatUnits(_expected, this.underlyingDecimals[i])
    }

    public exchange = async (i: number, j: number, amount: string, maxSlippage = 0.01): Promise<string> => {
        const _amount = ethers.utils.parseUnits(amount, this.underlyingDecimals[i]);
        const _expected: ethers.BigNumber = await this._getSwapOutput(i, j, _amount);
        const _minRecvAmount = _expected.mul((1 - maxSlippage) * 100).div(100);
        await ensureAllowance([this.underlyingCoins[i]], [_amount], this.swap);
        const contract = curve.contracts[this.swap].contract;

        if (Object.prototype.hasOwnProperty.call(curve.contracts[this.swap].contract, 'exchange_underlying')) {
            if (isEth(this.underlyingCoins[i])) {
                const gasLimit = await contract.estimateGas.exchange_underlying(i, j, _amount, _minRecvAmount, { ...curve.options, value: _amount });
                return (await contract.exchange_underlying(i, j, _amount, _minRecvAmount, { ...curve.options, value: _amount, gasLimit })).hash
            }
            const gasLimit = await contract.estimateGas.exchange_underlying(i, j, _amount, _minRecvAmount, curve.options);
            return (await contract.exchange_underlying(i, j, _amount, _minRecvAmount, { ...curve.options, gasLimit })).hash
        }

        if (isEth(this.underlyingCoins[i])) {
            const gasLimit = await contract.estimateGas.exchange(i, j, _amount, _minRecvAmount, { ...curve.options, value: _amount });
            return (await contract.exchange(i, j, _amount, _minRecvAmount, { ...curve.options, value: _amount, gasLimit })).hash
        }
        const gasLimit = await contract.estimateGas.exchange(i, j, _amount, _minRecvAmount, curve.options);
        return (await contract.exchange(i, j, _amount, _minRecvAmount, { ...curve.options, gasLimit })).hash
    }

    public gaugeMaxBoostedDeposit = async (...addresses: string[]): Promise<DictInterface<string>> => {
        if (addresses.length == 1 && Array.isArray(addresses[0])) addresses = addresses[0];

        const votingEscrowContract = curve.contracts[ALIASES.voting_escrow].multicallContract;
        const gaugeContract = curve.contracts[this.gauge].multicallContract;

        const contractCalls = [votingEscrowContract.totalSupply(), gaugeContract.totalSupply()];
        addresses.forEach((account: string) => {
            contractCalls.push(votingEscrowContract.balanceOf(account));
        });
        const response: BigNumber[] = (await curve.multicallProvider.all(contractCalls)).map((value: ethers.BigNumber) => toBN(value));

        const [veTotalSupply, gaugeTotalSupply] = response.splice(0, 2);

        const resultBN: DictInterface<BigNumber> = {};
        addresses.forEach((acct: string, i: number) => {
            resultBN[acct] = response[i].div(veTotalSupply).times(gaugeTotalSupply);
        });

        const result: DictInterface<string> = {};
        for (const entry of Object.entries(resultBN)) {
            result[entry[0]] = toStringFromBN(entry[1]);
        }

        return result;
    }

    public gaugeOptimalDeposits = async (...accounts: string[]): Promise<DictInterface<string>> => {
        if (accounts.length == 1 && Array.isArray(accounts[0])) accounts = accounts[0];

        const votingEscrowContract = curve.contracts[ALIASES.voting_escrow].multicallContract;
        const lpTokenContract = curve.contracts[this.lpToken].multicallContract;
        const gaugeContract = curve.contracts[this.gauge].multicallContract;
        const contractCalls = [votingEscrowContract.totalSupply(), gaugeContract.totalSupply()];
        accounts.forEach((account: string) => {
            contractCalls.push(
                votingEscrowContract.balanceOf(account),
                lpTokenContract.balanceOf(account),
                gaugeContract.balanceOf(account)
            )
        });
        const response: BigNumber[] = (await curve.multicallProvider.all(contractCalls)).map((value: ethers.BigNumber) => toBN(value));

        const [veTotalSupply, gaugeTotalSupply] = response.splice(0,2);

        const votingPower: DictInterface<BigNumber> = {};
        let totalBalance = BN(0);
        for (const acct of accounts) {
            votingPower[acct] = response[0];
            totalBalance = totalBalance.plus(response[1]).plus(response[2]);
            response.splice(0, 3);
        }

        const totalPower = Object.values(votingPower).reduce((sum, item) => sum.plus(item));
        const optimalBN: DictInterface<BigNumber> = Object.fromEntries(accounts.map((acc) => [acc, BN(0)]));
        if (totalBalance.lt(gaugeTotalSupply.times(totalPower).div(veTotalSupply))) {
            for (const acct of accounts) {
                // min(voting, lp)
                const amount = gaugeTotalSupply.times(votingPower[acct]).div(veTotalSupply).lt(totalBalance) ?
                    gaugeTotalSupply.times(votingPower[acct]).div(veTotalSupply) : totalBalance;
                optimalBN[acct] = amount;
                totalBalance = totalBalance.minus(amount);
                if (totalBalance.lte(0)) {
                    break;
                }
            }
        } else {
            if (totalPower.lt(0)) {
                for (const acct of accounts) {
                    optimalBN[acct] = totalBalance.times(votingPower[acct]).div(totalPower);
                }
            }
            optimalBN[accounts[0]] = optimalBN[accounts[0]].plus(totalBalance.minus(Object.values(optimalBN).reduce((sum, item) => sum.plus(item))));
        }

        const optimal: DictInterface<string> = {};
        for (const entry of Object.entries(optimalBN)) {
            optimal[entry[0]] = toStringFromBN(entry[1]);
        }

        return optimal
    }

    public boost = async (address: string): Promise<string> => {
        const gaugeContract = curve.contracts[this.gauge].multicallContract;
        const [workingBalance, balance] = (await curve.multicallProvider.all([
            gaugeContract.working_balances(address),
            gaugeContract.balanceOf(address),
        ])).map((value: ethers.BigNumber) => Number(ethers.utils.formatUnits(value)));

        const boost = workingBalance / (0.4 * balance);

        return boost.toFixed(4).replace(/([0-9])0+$/, '$1')
    }

    public getApy = async (): Promise<string[]> => {
        const swapContract = curve.contracts[this.swap].multicallContract;
        const gaugeContract = curve.contracts[this.gauge].multicallContract;
        const gaugeControllerContract = curve.contracts[ALIASES.gauge_controller].multicallContract;

        const [inflation, weight, workingSupply, virtualPrice] = (await curve.multicallProvider.all([
            gaugeContract.inflation_rate(),
            gaugeControllerContract.gauge_relative_weight(this.gauge),
            gaugeContract.working_supply(),
            swapContract.get_virtual_price(),
        ])).map((value: ethers.BigNumber) => toBN(value));

        const rate = inflation.times(weight).times( 31536000).div(workingSupply).times( 0.4).div(virtualPrice);
        const crvRate = await getCrvRate();
        const baseApy = rate.times(crvRate);
        const boostedApy = baseApy.times(2.5);

        return [baseApy.toFixed(4), boostedApy.toFixed(4)]
    }
}


export const _getBestPoolAndOutput = async (inputCoinAddress: string, outputCoinAddress: string, amount: string): Promise<{ poolAddress: string, output: ethers.BigNumber }> => {
    const addressProviderContract = curve.contracts[ALIASES.address_provider].contract
    const registryExchangeAddress = await addressProviderContract.get_address(2);
    const registryExchangeContract = new ethers.Contract(registryExchangeAddress, registryExchangeABI, curve.signer);

    const _amount = ethers.utils.parseUnits(amount.toString(), await _getDecimals(inputCoinAddress));
    const [poolAddress, output] = await registryExchangeContract.get_best_rate(inputCoinAddress, outputCoinAddress, _amount);

    return { poolAddress, output }
}

export const getBestPoolAndOutput = async (inputCoinAddress: string, outputCoinAddress: string, amount: string): Promise<{ poolAddress: string, output: string }> => {
    const { poolAddress, output: outputBN } = await _getBestPoolAndOutput(inputCoinAddress, outputCoinAddress, amount);
    const output = ethers.utils.formatUnits(outputBN, await _getDecimals(outputCoinAddress));

    return { poolAddress, output }
}

export const swap = async (inputCoinAddress: string, outputCoinAddress: string, amount: string): Promise<void> => {
    const addressProviderContract = curve.contracts[ALIASES.address_provider].contract;
    const registryAddress = await addressProviderContract.get_registry();
    const registryContract = new ethers.Contract(registryAddress, registryABI, curve.signer);

    const { poolAddress } = await _getBestPoolAndOutput(inputCoinAddress, outputCoinAddress, amount);
    const poolName = getPoolNameBySwapAddress(poolAddress);
    const [i, j, is_underlying] = await registryContract.get_coin_indices(poolAddress, inputCoinAddress, outputCoinAddress);

    const pool = new Pool(poolName);

    await pool.exchange(i, j, amount);
}
