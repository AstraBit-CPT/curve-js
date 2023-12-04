"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PoolTemplate = void 0;
const memoizee_1 = __importDefault(require("memoizee"));
const external_api_js_1 = require("../external-api.js");
const utils_js_1 = require("../utils.js");
const curve_js_1 = require("../curve.js");
const ERC20_json_1 = __importDefault(require("../constants/abis/ERC20.json"));
const DAY = 86400;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;
class PoolTemplate {
    constructor(id) {
        this.statsParameters = async () => {
            const multicallContract = curve_js_1.curve.contracts[this.address].multicallContract;
            const lpMulticallContract = curve_js_1.curve.contracts[this.lpToken].multicallContract;
            const calls = [
                multicallContract.get_virtual_price(),
                multicallContract.fee(),
                "admin_fee" in multicallContract ? multicallContract.admin_fee() : multicallContract.ADMIN_FEE(),
                multicallContract.A(),
                lpMulticallContract.totalSupply(),
            ];
            if (this.isCrypto) {
                calls.push(multicallContract.gamma());
                if (this.wrappedCoins.length === 2) {
                    calls.push(multicallContract.price_oracle());
                    calls.push(multicallContract.price_scale());
                }
                else {
                    for (let i = 0; i < this.wrappedCoins.length - 1; i++) {
                        calls.push(multicallContract.price_oracle(i));
                        calls.push(multicallContract.price_scale(i));
                    }
                }
            }
            const additionalCalls = this.isCrypto ? [] : [multicallContract.future_A()];
            if ('initial_A' in multicallContract) {
                additionalCalls.push(multicallContract.initial_A(), multicallContract.future_A_time(), multicallContract.initial_A_time());
            }
            let _virtualPrice = curve_js_1.curve.parseUnits("0");
            let _fee = curve_js_1.curve.parseUnits("0");
            let _prices, _adminFee, _A, _lpTokenSupply, _gamma;
            try {
                [_virtualPrice, _fee, _adminFee, _A, _lpTokenSupply, _gamma, ..._prices] = await curve_js_1.curve.multicallProvider.all(calls);
            }
            catch (e) { // Empty pool
                calls.shift();
                if (this.isCrypto) {
                    calls.shift();
                    [_adminFee, _A, _lpTokenSupply, _gamma, ..._prices] = await curve_js_1.curve.multicallProvider.all(calls);
                }
                else {
                    [_fee, _adminFee, _A, _lpTokenSupply, _gamma, ..._prices] = await curve_js_1.curve.multicallProvider.all(calls);
                }
            }
            const [virtualPrice, fee, adminFee, A, lpTokenSupply, gamma] = [
                curve_js_1.curve.formatUnits(_virtualPrice),
                curve_js_1.curve.formatUnits(_fee, 8),
                curve_js_1.curve.formatUnits(_adminFee * _fee),
                curve_js_1.curve.formatUnits(_A, 0),
                curve_js_1.curve.formatUnits(_lpTokenSupply),
                _gamma ? curve_js_1.curve.formatUnits(_gamma) : undefined,
            ];
            let priceOracle, priceScale;
            if (this.isCrypto) {
                const prices = _prices.map((_p) => curve_js_1.curve.formatUnits(_p));
                priceOracle = [];
                priceScale = [];
                for (let i = 0; i < this.wrappedCoins.length - 1; i++) {
                    priceOracle.push(prices.shift());
                    priceScale.push(prices.shift());
                }
            }
            const A_PRECISION = curve_js_1.curve.chainId === 1 && ['compound', 'usdt', 'y', 'busd', 'susd', 'pax', 'ren', 'sbtc', 'hbtc', '3pool'].includes(this.id) ? 1 : 100;
            const [_future_A, _initial_A, _future_A_time, _initial_A_time] = await curve_js_1.curve.multicallProvider.all(additionalCalls);
            const [future_A, initial_A, future_A_time, initial_A_time] = [
                _future_A ? String(Number(curve_js_1.curve.formatUnits(_future_A, 0)) / A_PRECISION) : undefined,
                _initial_A ? String(Number(curve_js_1.curve.formatUnits(_initial_A, 0)) / A_PRECISION) : undefined,
                _future_A_time ? Number(curve_js_1.curve.formatUnits(_future_A_time, 0)) * 1000 : undefined,
                _initial_A_time ? Number(curve_js_1.curve.formatUnits(_initial_A_time, 0)) * 1000 : undefined,
            ];
            return { lpTokenSupply, virtualPrice, fee, adminFee, A, future_A, initial_A, future_A_time, initial_A_time, gamma, priceOracle, priceScale };
        };
        this.statsTotalLiquidity = async (useApi = true) => {
            if (this.isLlamma) {
                const stablecoinContract = curve_js_1.curve.contracts[this.underlyingCoinAddresses[0]].multicallContract;
                const collateralContract = curve_js_1.curve.contracts[this.underlyingCoinAddresses[1]].multicallContract;
                const ammContract = curve_js_1.curve.contracts[this.address].multicallContract;
                const [_balance_x, _fee_x, _balance_y, _fee_y] = await curve_js_1.curve.multicallProvider.all([
                    stablecoinContract.balanceOf(this.address),
                    ammContract.admin_fees_x(),
                    collateralContract.balanceOf(this.address),
                    ammContract.admin_fees_y(),
                ]);
                const collateralRate = await (0, utils_js_1._getUsdRate)(this.underlyingCoinAddresses[1]);
                const stablecoinTvlBN = (0, utils_js_1.toBN)(_balance_x).minus((0, utils_js_1.toBN)(_fee_x));
                const collateralTvlBN = (0, utils_js_1.toBN)(_balance_y).minus((0, utils_js_1.toBN)(_fee_y)).times(collateralRate);
                return stablecoinTvlBN.plus(collateralTvlBN).toString();
            }
            if (useApi) {
                const network = curve_js_1.curve.constants.NETWORK_NAME;
                let poolType = this.isCrypto ? "crypto" : "main";
                if (this.id.startsWith("factory")) {
                    poolType = this.id.replace(/-\d+$/, '');
                    poolType = poolType.replace(/-v2$/, '');
                }
                const poolsData = (await (0, external_api_js_1._getPoolsFromApi)(network, poolType)).poolData;
                try {
                    const totalLiquidity = poolsData.filter((data) => data.address.toLowerCase() === this.address.toLowerCase())[0].usdTotal;
                    return String(totalLiquidity);
                }
                catch (err) {
                    console.log(this.id, err.message);
                }
            }
            const balances = await this.statsUnderlyingBalances();
            const promises = [];
            for (const addr of this.underlyingCoinAddresses) {
                promises.push((0, utils_js_1._getUsdRate)(addr));
            }
            const prices = await Promise.all(promises);
            const totalLiquidity = balances.reduce((liquidity, b, i) => liquidity + (Number(b) * prices[i]), 0);
            return totalLiquidity.toFixed(8);
        };
        this.statsVolume = async () => {
            if ([56, 324, 1284, 2222, 8453, 42220, 1313161554].includes(curve_js_1.curve.chainId)) { // Bsc || ZkSync || Moonbeam || Kava || Base || Celo || Aurora || Bsc
                const [mainPoolsData, factoryPoolsData] = await Promise.all([
                    (0, external_api_js_1._getLegacyAPYsAndVolumes)(curve_js_1.curve.constants.NETWORK_NAME),
                    (0, external_api_js_1._getFactoryAPYsAndVolumes)(curve_js_1.curve.constants.NETWORK_NAME),
                ]);
                if (this.id in mainPoolsData) {
                    return (mainPoolsData[this.id].volume ?? 0).toString();
                }
                const poolData = factoryPoolsData.find((d) => d.poolAddress.toLowerCase() === this.address);
                if (!poolData)
                    throw Error(`Can't get Volume for ${this.name} (id: ${this.id})`);
                const lpPrice = await (0, utils_js_1._getUsdRate)(this.lpToken);
                return (poolData.volume * lpPrice).toString();
            }
            const network = curve_js_1.curve.constants.NETWORK_NAME;
            const poolsData = (await (0, external_api_js_1._getSubgraphData)(network)).poolsData;
            const poolData = poolsData.find((d) => d.address.toLowerCase() === this.address);
            if (!poolData)
                throw Error(`Can't get Volume for ${this.name} (id: ${this.id})`);
            return poolData.volumeUSD.toString();
        };
        this.statsBaseApy = async () => {
            if ([56, 324, 1284, 2222, 8453, 42220, 1313161554].includes(curve_js_1.curve.chainId)) { // Bsc || ZkSync || Moonbeam || Kava || Base || Celo || Aurora
                const [mainPoolsData, factoryPoolsData] = await Promise.all([
                    (0, external_api_js_1._getLegacyAPYsAndVolumes)(curve_js_1.curve.constants.NETWORK_NAME),
                    (0, external_api_js_1._getFactoryAPYsAndVolumes)(curve_js_1.curve.constants.NETWORK_NAME),
                ]);
                if (this.id in mainPoolsData) {
                    return {
                        day: mainPoolsData[this.id].apy.day.toString(),
                        week: mainPoolsData[this.id].apy.week.toString(),
                    };
                }
                const poolData = factoryPoolsData.find((d) => d.poolAddress.toLowerCase() === this.address);
                if (!poolData)
                    throw Error(`Can't get base APY for ${this.name} (id: ${this.id})`);
                return {
                    day: poolData.apy.toString(),
                    week: poolData.apy.toString(),
                };
            }
            const network = curve_js_1.curve.constants.NETWORK_NAME;
            const poolsData = (await (0, external_api_js_1._getSubgraphData)(network)).poolsData;
            const poolData = poolsData.find((d) => d.address.toLowerCase() === this.address);
            if (!poolData)
                throw Error(`Can't get base APY for ${this.name} (id: ${this.id})`);
            return {
                day: poolData.latestDailyApy.toString(),
                week: poolData.latestWeeklyApy.toString(),
            };
        };
        this.statsTokenApy = async (useApi = true) => {
            if (this.rewardsOnly())
                throw Error(`${this.name} has Rewards-Only Gauge. Use stats.rewardsApy instead`);
            const isDisabledChain = [1313161554].includes(curve_js_1.curve.chainId); // Disable Aurora
            if (useApi && !isDisabledChain) {
                const crvAPYs = await (0, utils_js_1._getCrvApyFromApi)();
                const poolCrvApy = crvAPYs[this.gauge] ?? [0, 0]; // new pools might be missing
                return [poolCrvApy[0], poolCrvApy[1]];
            }
            const totalLiquidityUSD = await this.statsTotalLiquidity();
            if (Number(totalLiquidityUSD) === 0)
                return [0, 0];
            let inflationRateBN, workingSupplyBN, totalSupplyBN;
            if (curve_js_1.curve.chainId !== 1) {
                const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
                const lpTokenContract = curve_js_1.curve.contracts[this.lpToken].multicallContract;
                const crvContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.crv].contract;
                const currentWeek = Math.floor(Date.now() / 1000 / WEEK);
                [inflationRateBN, workingSupplyBN, totalSupplyBN] = (await curve_js_1.curve.multicallProvider.all([
                    gaugeContract.inflation_rate(currentWeek),
                    gaugeContract.working_supply(),
                    lpTokenContract.totalSupply(),
                ])).map((value) => (0, utils_js_1.toBN)(value));
                if (inflationRateBN.eq(0)) {
                    inflationRateBN = (0, utils_js_1.toBN)(await crvContract.balanceOf(this.gauge, curve_js_1.curve.constantOptions)).div(WEEK);
                }
            }
            else {
                const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
                const lpTokenContract = curve_js_1.curve.contracts[this.lpToken].multicallContract;
                const gaugeControllerContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_controller].multicallContract;
                let weightBN;
                [inflationRateBN, weightBN, workingSupplyBN, totalSupplyBN] = (await curve_js_1.curve.multicallProvider.all([
                    gaugeContract.inflation_rate(),
                    gaugeControllerContract.gauge_relative_weight(this.gauge),
                    gaugeContract.working_supply(),
                    lpTokenContract.totalSupply(),
                ])).map((value) => (0, utils_js_1.toBN)(value));
                inflationRateBN = inflationRateBN.times(weightBN);
            }
            if (inflationRateBN.eq(0))
                return [0, 0];
            const rateBN = inflationRateBN.times(31536000).times(0.4).div(workingSupplyBN).times(totalSupplyBN).div(Number(totalLiquidityUSD));
            const crvPrice = await (0, utils_js_1._getUsdRate)(curve_js_1.curve.constants.ALIASES.crv);
            const baseApyBN = rateBN.times(crvPrice);
            const boostedApyBN = baseApyBN.times(2.5);
            return [baseApyBN.times(100).toNumber(), boostedApyBN.times(100).toNumber()];
        };
        this.statsRewardsApy = async (useApi = true) => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                return [];
            const isDisabledChain = [1313161554].includes(curve_js_1.curve.chainId); // Disable Aurora
            if (useApi && !isDisabledChain) {
                const rewards = await (0, utils_js_1._getRewardsFromApi)();
                if (!rewards[this.gauge])
                    return [];
                return rewards[this.gauge].map((r) => ({ gaugeAddress: r.gaugeAddress, tokenAddress: r.tokenAddress, symbol: r.symbol, apy: r.apy }));
            }
            const apy = [];
            const rewardTokens = await this.rewardTokens(false);
            for (const rewardToken of rewardTokens) {
                const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
                const lpTokenContract = curve_js_1.curve.contracts[this.lpToken].multicallContract;
                const rewardContract = curve_js_1.curve.contracts[this.sRewardContract || this.gauge].multicallContract;
                const totalLiquidityUSD = await this.statsTotalLiquidity();
                const rewardRate = await (0, utils_js_1._getUsdRate)(rewardToken.token);
                const [rewardData, _stakedSupply, _totalSupply] = await curve_js_1.curve.multicallProvider.all([
                    rewardContract.reward_data(rewardToken.token),
                    gaugeContract.totalSupply(),
                    lpTokenContract.totalSupply(),
                ]);
                const stakedSupplyBN = (0, utils_js_1.toBN)(_stakedSupply);
                const totalSupplyBN = (0, utils_js_1.toBN)(_totalSupply);
                const inflationBN = (0, utils_js_1.toBN)(rewardData.rate, rewardToken.decimals);
                const periodFinish = Number(curve_js_1.curve.formatUnits(rewardData.period_finish, 0)) * 1000;
                const baseApy = periodFinish > Date.now() ?
                    inflationBN.times(31536000).times(rewardRate).div(stakedSupplyBN).times(totalSupplyBN).div(Number(totalLiquidityUSD)) :
                    (0, utils_js_1.BN)(0);
                apy.push({
                    gaugeAddress: this.gauge,
                    tokenAddress: rewardToken.token,
                    symbol: rewardToken.symbol,
                    apy: baseApy.times(100).toNumber(),
                });
            }
            return apy;
        };
        this._calcLpTokenAmount = (0, memoizee_1.default)(async (_amounts, isDeposit = true, useUnderlying = true) => {
            if (this.isCrypto) {
                try {
                    return await this._pureCalcLpTokenAmount(_amounts, isDeposit, useUnderlying);
                }
                catch (e) { // Seeding
                    const lpContract = curve_js_1.curve.contracts[this.lpToken].contract;
                    const _lpTotalSupply = await lpContract.totalSupply(curve_js_1.curve.constantOptions);
                    if (_lpTotalSupply > curve_js_1.curve.parseUnits("0"))
                        throw e; // Already seeded
                    if (this.isMeta && useUnderlying)
                        throw Error("Initial deposit for crypto meta pools must be in wrapped coins");
                    const decimals = useUnderlying ? this.underlyingDecimals : this.wrappedDecimals;
                    const amounts = _amounts.map((_a, i) => curve_js_1.curve.formatUnits(_a, decimals[i]));
                    const seedAmounts = await this.cryptoSeedAmounts(amounts[0]); // Checks N coins is 2 or 3 and amounts > 0
                    amounts.forEach((a, i) => {
                        if (!(0, utils_js_1.BN)(a).eq((0, utils_js_1.BN)(seedAmounts[i])))
                            throw Error(`Amounts must be = ${seedAmounts}`);
                    });
                    return (0, utils_js_1.parseUnits)(Math.pow(amounts.map(Number).reduce((a, b) => a * b), 1 / amounts.length));
                }
            }
            try {
                const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.stable_calc].contract;
                if (curve_js_1.curve.constants.ALIASES.stable_calc === curve_js_1.curve.constants.ZERO_ADDRESS || this.id.startsWith("factory-stable-ng")) {
                    return await this._pureCalcLpTokenAmount(_amounts, isDeposit, useUnderlying);
                }
                else if (this.isMeta) {
                    const basePool = new PoolTemplate(this.basePool);
                    return await contract.calc_token_amount_meta(this.address, this.lpToken, _amounts.concat(Array(10 - _amounts.length).fill(curve_js_1.curve.parseUnits("0"))), _amounts.length, basePool.address, basePool.lpToken, isDeposit, useUnderlying);
                }
                else {
                    return await contract.calc_token_amount(this.address, this.lpToken, _amounts.concat(Array(10 - _amounts.length).fill(curve_js_1.curve.parseUnits("0"))), _amounts.length, isDeposit, useUnderlying && this.isLending);
                }
            }
            catch (e) { // Seeding
                if (!isDeposit)
                    throw e; // Seeding is only for deposit
                const lpContract = curve_js_1.curve.contracts[this.lpToken].contract;
                const _lpTotalSupply = await lpContract.totalSupply(curve_js_1.curve.constantOptions);
                if (_lpTotalSupply > curve_js_1.curve.parseUnits("0"))
                    throw e; // Already seeded
                const decimals = useUnderlying ? this.underlyingDecimals : this.wrappedDecimals;
                const amounts = _amounts.map((_a, i) => curve_js_1.curve.formatUnits(_a, decimals[i]));
                if (this.isMeta && useUnderlying) {
                    const seedAmounts = this.metaUnderlyingSeedAmounts(amounts[0]); // Checks N coins == 2 and amounts > 0
                    amounts.forEach((a, i) => {
                        if (!(0, utils_js_1.BN)(a).eq((0, utils_js_1.BN)(seedAmounts[i])))
                            throw Error(`Amounts must be = ${seedAmounts}`);
                    });
                }
                else {
                    if (_amounts[0] <= curve_js_1.curve.parseUnits("0"))
                        throw Error("Initial deposit amounts must be > 0");
                    amounts.forEach((a) => {
                        if (a !== amounts[0])
                            throw Error("Initial deposit amounts must be equal");
                    });
                }
                const _amounts18Decimals = amounts.map((a) => (0, utils_js_1.parseUnits)(a));
                return _amounts18Decimals.reduce((_a, _b) => _a + _b);
            }
        }, {
            primitive: true,
            promise: true,
            maxAge: 30 * 1000,
            length: 3,
        });
        // ---------------- CRV PROFIT, CLAIM, BOOSTING ----------------
        this.crvProfit = async (address = "") => {
            if (this.rewardsOnly())
                throw Error(`${this.name} has Rewards-Only Gauge. Use rewardsProfit instead`);
            address = address || curve_js_1.curve.signerAddress;
            if (!address)
                throw Error("Need to connect wallet or pass address into args");
            let inflationRateBN, workingSupplyBN, workingBalanceBN;
            if (curve_js_1.curve.chainId !== 1) {
                const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
                const crvContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.crv].contract;
                const currentWeek = Math.floor(Date.now() / 1000 / WEEK);
                [inflationRateBN, workingBalanceBN, workingSupplyBN] = (await curve_js_1.curve.multicallProvider.all([
                    gaugeContract.inflation_rate(currentWeek),
                    gaugeContract.working_balances(address),
                    gaugeContract.working_supply(),
                ])).map((value) => (0, utils_js_1.toBN)(value));
                if (inflationRateBN.eq(0)) {
                    inflationRateBN = (0, utils_js_1.toBN)(await crvContract.balanceOf(this.gauge, curve_js_1.curve.constantOptions)).div(WEEK);
                }
            }
            else {
                const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
                const gaugeControllerContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_controller].multicallContract;
                let weightBN;
                [inflationRateBN, weightBN, workingBalanceBN, workingSupplyBN] = (await curve_js_1.curve.multicallProvider.all([
                    gaugeContract.inflation_rate(),
                    gaugeControllerContract.gauge_relative_weight(this.gauge),
                    gaugeContract.working_balances(address),
                    gaugeContract.working_supply(),
                ])).map((value) => (0, utils_js_1.toBN)(value));
                inflationRateBN = inflationRateBN.times(weightBN);
            }
            const crvPrice = await (0, utils_js_1._getUsdRate)('CRV');
            if (workingSupplyBN.eq(0))
                return {
                    day: "0.0",
                    week: "0.0",
                    month: "0.0",
                    year: "0.0",
                    token: curve_js_1.curve.constants.ALIASES.crv,
                    symbol: 'CRV',
                    price: crvPrice,
                };
            const dailyIncome = inflationRateBN.times(DAY).times(workingBalanceBN).div(workingSupplyBN);
            const weeklyIncome = inflationRateBN.times(WEEK).times(workingBalanceBN).div(workingSupplyBN);
            const monthlyIncome = inflationRateBN.times(MONTH).times(workingBalanceBN).div(workingSupplyBN);
            const annualIncome = inflationRateBN.times(YEAR).times(workingBalanceBN).div(workingSupplyBN);
            return {
                day: dailyIncome.toString(),
                week: weeklyIncome.toString(),
                month: monthlyIncome.toString(),
                year: annualIncome.toString(),
                token: curve_js_1.curve.constants.ALIASES.crv,
                symbol: 'CRV',
                price: crvPrice,
            };
        };
        this.boost = async (address = "") => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                throw Error(`${this.name} doesn't have gauge`);
            address = address || curve_js_1.curve.signerAddress;
            if (!address)
                throw Error("Need to connect wallet or pass address into args");
            const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
            const [workingBalanceBN, balanceBN] = (await curve_js_1.curve.multicallProvider.all([
                gaugeContract.working_balances(address),
                gaugeContract.balanceOf(address),
            ])).map((value) => (0, utils_js_1.toBN)(value));
            const boostBN = workingBalanceBN.div(0.4).div(balanceBN);
            if (boostBN.lt(1))
                return '1.0';
            if (boostBN.gt(2.5))
                return '2.5';
            return boostBN.toFixed(4).replace(/([0-9])0+$/, '$1');
        };
        this.userCrvApy = async (address = "") => {
            address = address || curve_js_1.curve.signerAddress;
            if (!address)
                throw Error("Need to connect wallet or pass address into args");
            const [baseApy, maxApy] = await this.statsTokenApy();
            const boost = await this.boost(address);
            if (boost == "2.5")
                return maxApy;
            if (boost === "NaN")
                return NaN;
            return (0, utils_js_1.BN)(baseApy).times((0, utils_js_1.BN)(boost)).toNumber();
        };
        this.maxBoostedStake = async (...addresses) => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                throw Error(`${this.name} doesn't have gauge`);
            if (addresses.length == 1 && Array.isArray(addresses[0]))
                addresses = addresses[0];
            if (addresses.length === 0 && curve_js_1.curve.signerAddress !== '')
                addresses = [curve_js_1.curve.signerAddress];
            if (addresses.length === 0)
                throw Error("Need to connect wallet or pass addresses into args");
            const votingEscrowContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].multicallContract;
            const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
            const contractCalls = [votingEscrowContract.totalSupply(), gaugeContract.totalSupply()];
            addresses.forEach((account) => {
                contractCalls.push(votingEscrowContract.balanceOf(account));
            });
            const _response = await curve_js_1.curve.multicallProvider.all(contractCalls);
            const responseBN = _response.map((value) => (0, utils_js_1.toBN)(value));
            const [veTotalSupplyBN, gaugeTotalSupplyBN] = responseBN.splice(0, 2);
            const resultBN = {};
            addresses.forEach((acct, i) => {
                resultBN[acct] = responseBN[i].div(veTotalSupplyBN).times(gaugeTotalSupplyBN);
            });
            const result = {};
            for (const entry of Object.entries(resultBN)) {
                result[entry[0]] = (0, utils_js_1.toStringFromBN)(entry[1]);
            }
            return addresses.length === 1 ? result[addresses[0]] : result;
        };
        // ---------------- REWARDS PROFIT, CLAIM ----------------
        this.rewardTokens = (0, memoizee_1.default)(async (useApi = true) => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                return [];
            if (useApi) {
                const rewards = await (0, utils_js_1._getRewardsFromApi)();
                if (!rewards[this.gauge])
                    return [];
                rewards[this.gauge].forEach((r) => (0, utils_js_1._setContracts)(r.tokenAddress, ERC20_json_1.default));
                return rewards[this.gauge].map((r) => ({ token: r.tokenAddress, symbol: r.symbol, decimals: Number(r.decimals) }));
            }
            const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
            const gaugeMulticallContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
            if ("reward_tokens(uint256)" in gaugeContract) {
                let rewardCount = 8; // gauge_v2, gauge_v3, gauge_rewards_only, gauge_child
                if ("reward_count()" in gaugeContract) { // gauge_v4, gauge_v5, gauge_factory
                    rewardCount = Number(curve_js_1.curve.formatUnits(await gaugeContract.reward_count(curve_js_1.curve.constantOptions), 0));
                }
                const tokenCalls = [];
                for (let i = 0; i < rewardCount; i++) {
                    tokenCalls.push(gaugeMulticallContract.reward_tokens(i));
                }
                const tokens = (await curve_js_1.curve.multicallProvider.all(tokenCalls))
                    .filter((addr) => addr !== curve_js_1.curve.constants.ZERO_ADDRESS)
                    .map((addr) => addr.toLowerCase())
                    .filter((addr) => curve_js_1.curve.chainId === 1 || addr !== curve_js_1.curve.constants.COINS.crv);
                const tokenInfoCalls = [];
                for (const token of tokens) {
                    (0, utils_js_1._setContracts)(token, ERC20_json_1.default);
                    const tokenMulticallContract = curve_js_1.curve.contracts[token].multicallContract;
                    tokenInfoCalls.push(tokenMulticallContract.symbol(), tokenMulticallContract.decimals());
                }
                const tokenInfo = await curve_js_1.curve.multicallProvider.all(tokenInfoCalls);
                for (let i = 0; i < tokens.length; i++) {
                    curve_js_1.curve.constants.DECIMALS[tokens[i]] = tokenInfo[(i * 2) + 1];
                }
                return tokens.map((token, i) => ({ token, symbol: tokenInfo[i * 2], decimals: tokenInfo[(i * 2) + 1] }));
            }
            else if ('claimable_reward(address)' in gaugeContract) { // gauge_synthetix
                const rewardContract = curve_js_1.curve.contracts[this.sRewardContract].contract;
                const method = "snx()" in rewardContract ? "snx" : "rewardsToken"; // susd, tbtc : dusd, musd, rsv, sbtc
                const token = (await rewardContract[method](curve_js_1.curve.constantOptions)).toLowerCase();
                (0, utils_js_1._setContracts)(token, ERC20_json_1.default);
                const tokenMulticallContract = curve_js_1.curve.contracts[token].multicallContract;
                const res = await curve_js_1.curve.multicallProvider.all([
                    tokenMulticallContract.symbol(),
                    tokenMulticallContract.decimals(),
                ]);
                const symbol = res[0];
                const decimals = res[1];
                return [{ token, symbol, decimals }];
            }
            return []; // gauge
        }, {
            promise: true,
            maxAge: 30 * 60 * 1000, // 30m
        });
        this.rewardsProfit = async (address = "") => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                throw Error(`${this.name} doesn't have gauge`);
            address = address || curve_js_1.curve.signerAddress;
            if (!address)
                throw Error("Need to connect wallet or pass address into args");
            const rewardTokens = await this.rewardTokens();
            const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
            const result = [];
            if ('reward_data(address)' in curve_js_1.curve.contracts[this.gauge].contract) {
                const calls = [gaugeContract.balanceOf(address), gaugeContract.totalSupply()];
                for (const rewardToken of rewardTokens) {
                    calls.push(gaugeContract.reward_data(rewardToken.token));
                }
                const res = await curve_js_1.curve.multicallProvider.all(calls);
                const balanceBN = (0, utils_js_1.toBN)(res.shift());
                const totalSupplyBN = (0, utils_js_1.toBN)(res.shift());
                for (const rewardToken of rewardTokens) {
                    const _rewardData = res.shift();
                    const periodFinish = Number(curve_js_1.curve.formatUnits(_rewardData.period_finish, 0)) * 1000;
                    const inflationRateBN = periodFinish > Date.now() ? (0, utils_js_1.toBN)(_rewardData.rate, rewardToken.decimals) : (0, utils_js_1.BN)(0);
                    const tokenPrice = await (0, utils_js_1._getUsdRate)(rewardToken.token);
                    result.push({
                        day: inflationRateBN.times(DAY).times(balanceBN).div(totalSupplyBN).toString(),
                        week: inflationRateBN.times(WEEK).times(balanceBN).div(totalSupplyBN).toString(),
                        month: inflationRateBN.times(MONTH).times(balanceBN).div(totalSupplyBN).toString(),
                        year: inflationRateBN.times(YEAR).times(balanceBN).div(totalSupplyBN).toString(),
                        token: rewardToken.token,
                        symbol: rewardToken.symbol,
                        price: tokenPrice,
                    });
                }
            }
            else if (this.sRewardContract && "rewardRate()" in curve_js_1.curve.contracts[this.sRewardContract].contract && "periodFinish()" && rewardTokens.length === 1) {
                const rewardToken = rewardTokens[0];
                const sRewardContract = curve_js_1.curve.contracts[this.sRewardContract].multicallContract;
                const [_inflationRate, _periodFinish, _balance, _totalSupply] = await curve_js_1.curve.multicallProvider.all([
                    sRewardContract.rewardRate(),
                    sRewardContract.periodFinish(),
                    gaugeContract.balanceOf(address),
                    gaugeContract.totalSupply(),
                ]);
                const periodFinish = Number(_periodFinish) * 1000;
                const inflationRateBN = periodFinish > Date.now() ? (0, utils_js_1.toBN)(_inflationRate, rewardToken.decimals) : (0, utils_js_1.BN)(0);
                const balanceBN = (0, utils_js_1.toBN)(_balance);
                const totalSupplyBN = (0, utils_js_1.toBN)(_totalSupply);
                const tokenPrice = await (0, utils_js_1._getUsdRate)(rewardToken.token);
                result.push({
                    day: inflationRateBN.times(DAY).times(balanceBN).div(totalSupplyBN).toString(),
                    week: inflationRateBN.times(WEEK).times(balanceBN).div(totalSupplyBN).toString(),
                    month: inflationRateBN.times(MONTH).times(balanceBN).div(totalSupplyBN).toString(),
                    year: inflationRateBN.times(YEAR).times(balanceBN).div(totalSupplyBN).toString(),
                    token: rewardToken.token,
                    symbol: rewardToken.symbol,
                    price: tokenPrice,
                });
            }
            else if (['aave', 'saave', 'ankreth'].includes(this.id)) {
                for (const rewardToken of rewardTokens) {
                    const tokenPrice = await (0, utils_js_1._getUsdRate)(rewardToken.token);
                    result.push({
                        day: "0",
                        week: "0",
                        month: "0",
                        year: "0",
                        token: rewardToken.token,
                        symbol: rewardToken.symbol,
                        price: tokenPrice,
                    });
                }
            }
            return result;
        };
        // ---------------- ... ----------------
        this.gaugeOptimalDeposits = async (...accounts) => {
            if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                throw Error(`${this.name} doesn't have gauge`);
            if (accounts.length == 1 && Array.isArray(accounts[0]))
                accounts = accounts[0];
            const votingEscrowContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].multicallContract;
            const lpTokenContract = curve_js_1.curve.contracts[this.lpToken].multicallContract;
            const gaugeContract = curve_js_1.curve.contracts[this.gauge].multicallContract;
            const contractCalls = [votingEscrowContract.totalSupply(), gaugeContract.totalSupply()];
            accounts.forEach((account) => {
                contractCalls.push(votingEscrowContract.balanceOf(account), lpTokenContract.balanceOf(account), gaugeContract.balanceOf(account));
            });
            const _response = await curve_js_1.curve.multicallProvider.all(contractCalls);
            const response = _response.map((value) => (0, utils_js_1.toBN)(value));
            const [veTotalSupply, gaugeTotalSupply] = response.splice(0, 2);
            const votingPower = {};
            let totalBalance = (0, utils_js_1.BN)(0);
            for (const acct of accounts) {
                votingPower[acct] = response[0];
                totalBalance = totalBalance.plus(response[1]).plus(response[2]);
                response.splice(0, 3);
            }
            const totalPower = Object.values(votingPower).reduce((sum, item) => sum.plus(item));
            // @ts-ignore
            const optimalBN = Object.fromEntries(accounts.map((acc) => [acc, (0, utils_js_1.BN)(0)]));
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
            }
            else {
                if (totalPower.lt(0)) {
                    for (const acct of accounts) {
                        optimalBN[acct] = totalBalance.times(votingPower[acct]).div(totalPower);
                    }
                }
                optimalBN[accounts[0]] = optimalBN[accounts[0]].plus(totalBalance.minus(Object.values(optimalBN).reduce((sum, item) => sum.plus(item))));
            }
            const optimal = {};
            for (const entry of Object.entries(optimalBN)) {
                optimal[entry[0]] = (0, utils_js_1.toStringFromBN)(entry[1]);
            }
            return optimal;
        };
        this._getCoinIdx = (coin, useUnderlying = true) => {
            if (typeof coin === 'number') {
                const coins_N = useUnderlying ? this.underlyingCoins.length : this.wrappedCoins.length;
                const idx = coin;
                if (!Number.isInteger(idx)) {
                    throw Error('Index must be integer');
                }
                if (idx < 0) {
                    throw Error('Index must be >= 0');
                }
                if (idx > coins_N - 1) {
                    throw Error(`Index must be < ${coins_N}`);
                }
                return idx;
            }
            const [coinAddress] = (0, utils_js_1._getCoinAddresses)(coin);
            const lowerCaseCoinAddresses = useUnderlying ?
                this.underlyingCoinAddresses.map((c) => c.toLowerCase()) :
                this.wrappedCoinAddresses.map((c) => c.toLowerCase());
            const idx = lowerCaseCoinAddresses.indexOf(coinAddress.toLowerCase());
            if (idx === -1) {
                throw Error(`There is no ${coin} among ${this.name} pool ${useUnderlying ? 'underlying' : 'wrapped'} coins`);
            }
            return idx;
        };
        // Used by mixins
        this._getRates = async () => {
            const _rates = [];
            for (let i = 0; i < this.wrappedCoinAddresses.length; i++) {
                const addr = this.wrappedCoinAddresses[i];
                if (this.useLending[i]) {
                    if (['compound', 'usdt', 'ib'].includes(this.id)) {
                        _rates.push(await curve_js_1.curve.contracts[addr].contract.exchangeRateStored());
                    }
                    else if (['y', 'busd', 'pax'].includes(this.id)) {
                        _rates.push(await curve_js_1.curve.contracts[addr].contract.getPricePerFullShare());
                    }
                    else {
                        _rates.push(curve_js_1.curve.parseUnits(String(10 ** 18), 0)); // Aave ratio 1:1
                    }
                }
                else {
                    _rates.push(curve_js_1.curve.parseUnits(String(10 ** 18), 0));
                }
            }
            return _rates;
        };
        this._balances = async (rawCoinNames, rawCoinAddresses, ...addresses) => {
            const coinNames = [];
            const coinAddresses = [];
            // removing duplicates
            for (let i = 0; i < rawCoinAddresses.length; i++) {
                if (!coinAddresses.includes(rawCoinAddresses[i])) {
                    coinNames.push(rawCoinNames[i]);
                    coinAddresses.push(rawCoinAddresses[i]);
                }
            }
            addresses = (0, utils_js_1._prepareAddresses)(addresses);
            const rawBalances = await (0, utils_js_1._getBalances)(coinAddresses, addresses);
            const balances = {};
            for (const address of addresses) {
                balances[address] = {};
                for (const coinName of coinNames) {
                    balances[address][coinName] = rawBalances[address].shift();
                }
            }
            return addresses.length === 1 ? balances[addresses[0]] : balances;
        };
        this._underlyingPrices = async () => {
            const promises = [];
            for (const addr of this.underlyingCoinAddresses) {
                promises.push((0, utils_js_1._getUsdRate)(addr));
            }
            return await Promise.all(promises);
        };
        // NOTE! It may crash!
        this._wrappedPrices = async () => {
            const promises = [];
            for (const addr of this.wrappedCoinAddresses) {
                promises.push((0, utils_js_1._getUsdRate)(addr));
            }
            return await Promise.all(promises);
        };
        const poolData = curve_js_1.curve.getPoolsData()[id];
        this.id = id;
        this.name = poolData.name;
        this.fullName = poolData.full_name;
        this.symbol = poolData.symbol;
        this.referenceAsset = poolData.reference_asset;
        this.address = poolData.swap_address;
        this.lpToken = poolData.token_address;
        this.gauge = poolData.gauge_address;
        this.zap = poolData.deposit_address || null;
        this.sRewardContract = poolData.sCurveRewards_address || null;
        this.rewardContract = poolData.reward_contract || null;
        this.implementation = poolData.implementation_address || null;
        this.isPlain = poolData.is_plain || false;
        this.isLending = poolData.is_lending || false;
        this.isMeta = poolData.is_meta || false;
        this.isCrypto = poolData.is_crypto || false;
        this.isFake = poolData.is_fake || false;
        this.isFactory = poolData.is_factory || false;
        this.isMetaFactory = (this.isMeta && this.isFactory) || this.zap === '0xa79828df1850e8a3a3064576f380d90aecdd3359';
        this.isLlamma = poolData.is_llamma || false;
        this.basePool = poolData.base_pool || '';
        this.metaCoinIdx = this.isMeta ? poolData.meta_coin_idx ?? poolData.wrapped_coins.length - 1 : -1;
        this.underlyingCoins = poolData.underlying_coins;
        this.wrappedCoins = poolData.wrapped_coins;
        this.underlyingCoinAddresses = poolData.underlying_coin_addresses;
        this.wrappedCoinAddresses = poolData.wrapped_coin_addresses;
        this.underlyingDecimals = poolData.underlying_decimals;
        this.wrappedDecimals = poolData.wrapped_decimals;
        this.useLending = poolData.use_lending || poolData.underlying_coin_addresses.map(() => false);
        this.inApi = poolData.in_api ?? false;
        this.isGaugeKilled = poolData.is_gauge_killed ?? false;
        this.gaugeStatus = poolData.gauge_status ?? null;
        this.estimateGas = {
            depositApprove: this.depositApproveEstimateGas.bind(this),
            deposit: this.depositEstimateGas.bind(this),
            depositWrappedApprove: this.depositWrappedApproveEstimateGas.bind(this),
            depositWrapped: this.depositWrappedEstimateGas.bind(this),
            stakeApprove: this.stakeApproveEstimateGas.bind(this),
            stake: this.stakeEstimateGas.bind(this),
            unstake: this.unstakeEstimateGas.bind(this),
            claimCrv: this.claimCrvEstimateGas.bind(this),
            claimRewards: this.claimRewardsEstimateGas.bind(this),
            depositAndStakeApprove: this.depositAndStakeApproveEstimateGas.bind(this),
            depositAndStake: this.depositAndStakeEstimateGas.bind(this),
            depositAndStakeWrappedApprove: this.depositAndStakeWrappedApproveEstimateGas.bind(this),
            depositAndStakeWrapped: this.depositAndStakeWrappedEstimateGas.bind(this),
            withdrawApprove: this.withdrawApproveEstimateGas.bind(this),
            withdraw: this.withdrawEstimateGas.bind(this),
            withdrawWrapped: this.withdrawWrappedEstimateGas.bind(this),
            withdrawImbalanceApprove: this.withdrawImbalanceApproveEstimateGas.bind(this),
            withdrawImbalance: this.withdrawImbalanceEstimateGas.bind(this),
            withdrawImbalanceWrapped: this.withdrawImbalanceWrappedEstimateGas.bind(this),
            withdrawOneCoinApprove: this.withdrawOneCoinApproveEstimateGas.bind(this),
            withdrawOneCoin: this.withdrawOneCoinEstimateGas.bind(this),
            withdrawOneCoinWrapped: this.withdrawOneCoinWrappedEstimateGas.bind(this),
            swapApprove: this.swapApproveEstimateGas.bind(this),
            swap: this.swapEstimateGas.bind(this),
            swapWrappedApprove: this.swapWrappedApproveEstimateGas.bind(this),
            swapWrapped: this.swapWrappedEstimateGas.bind(this),
        };
        this.stats = {
            parameters: this.statsParameters.bind(this),
            underlyingBalances: this.statsUnderlyingBalances.bind(this),
            wrappedBalances: this.statsWrappedBalances.bind(this),
            totalLiquidity: this.statsTotalLiquidity.bind(this),
            volume: this.statsVolume.bind(this),
            baseApy: this.statsBaseApy.bind(this),
            tokenApy: this.statsTokenApy.bind(this),
            rewardsApy: this.statsRewardsApy.bind(this),
        };
        this.wallet = {
            balances: this.walletBalances.bind(this),
            lpTokenBalances: this.walletLpTokenBalances.bind(this),
            underlyingCoinBalances: this.walletUnderlyingCoinBalances.bind(this),
            wrappedCoinBalances: this.walletWrappedCoinBalances.bind(this),
            allCoinBalances: this.walletAllCoinBalances.bind(this),
        };
    }
    hasVyperVulnerability() {
        if (curve_js_1.curve.chainId === 1 && this.id === "crveth")
            return true;
        if (curve_js_1.curve.chainId === 42161 && this.id === "tricrypto")
            return true;
        // @ts-ignore
        const vulnerable_implementations = {
            1: [
                "0x6326DEbBAa15bCFE603d831e7D75f4fc10d9B43E",
                "0x8c1aB78601c259E1B43F19816923609dC7d7de9B",
                "0x88855cdF2b0A8413D470B86952E726684de915be",
            ].map((a) => a.toLowerCase()),
            137: [
                "0xAe00f57663F4C85FC948B13963cd4627dAF01061",
                "0xA9134FaE98F92217f457918505375Ae91fdc5e3c",
                "0xf31bcdf0B9a5eCD7AB463eB905551fBc32e51856",
            ].map((a) => a.toLowerCase()),
            250: [
                "0xE6358f6a45B502477e83CC1CDa759f540E4459ee",
                "0x5d58Eb45e97B43e471AF05cD2b11CeB4106E1b1a",
                "0xb11Dc44A9f981fAF1669dca6DD40c3cc2554A2ce",
            ].map((a) => a.toLowerCase()),
            42161: [
                "0x7DA64233Fefb352f8F501B357c018158ED8aA455",
                "0xAAe75FAebCae43b9d541Fd875622BE48D9B4f5D0",
                "0x89287c32c2CAC1C76227F6d300B2DBbab6b75C08",
            ].map((a) => a.toLowerCase()),
            43114: [
                "0x64448B78561690B70E17CBE8029a3e5c1bB7136e",
                "0xF1f85a74AD6c64315F85af52d3d46bF715236ADc",
                "0x0eb0F1FaF5F509Ac53fA224477509EAD167cf410",
            ].map((a) => a.toLowerCase()),
        }[curve_js_1.curve.chainId] ?? [];
        return vulnerable_implementations.includes(this.implementation ?? "");
    }
    rewardsOnly() {
        if (curve_js_1.curve.chainId === 2222 || curve_js_1.curve.chainId === 324)
            return true; // TODO remove this for Kava and ZkSync
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
            throw Error(`${this.name} doesn't have gauge`);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        return !('inflation_rate()' in gaugeContract || 'inflation_rate(uint256)' in gaugeContract);
    }
    async statsWrappedBalances() {
        const contract = curve_js_1.curve.contracts[this.address].multicallContract;
        const calls = [];
        for (let i = 0; i < this.wrappedCoins.length; i++)
            calls.push(contract.balances(i));
        const _wrappedBalances = await curve_js_1.curve.multicallProvider.all(calls);
        return _wrappedBalances.map((_b, i) => curve_js_1.curve.formatUnits(_b, this.wrappedDecimals[i]));
    }
    // OVERRIDE
    async statsUnderlyingBalances() {
        return await this.statsWrappedBalances();
    }
    async _pureCalcLpTokenAmount(_amounts, isDeposit = true, useUnderlying = true) {
        const calcContractAddress = this.isMeta && useUnderlying ? this.zap : this.address;
        const N_coins = useUnderlying ? this.underlyingCoins.length : this.wrappedCoins.length;
        const contract = curve_js_1.curve.contracts[calcContractAddress].contract;
        if (this.isMetaFactory && useUnderlying) {
            if (`calc_token_amount(address,uint256[${N_coins}],bool)` in contract) {
                return await contract.calc_token_amount(this.address, _amounts, isDeposit, curve_js_1.curve.constantOptions);
            }
            return await contract.calc_token_amount(this.address, _amounts, curve_js_1.curve.constantOptions);
        }
        if (`calc_token_amount(uint256[${N_coins}],bool)` in contract) {
            return await contract.calc_token_amount(_amounts, isDeposit, curve_js_1.curve.constantOptions);
        }
        return await contract.calc_token_amount(_amounts, curve_js_1.curve.constantOptions);
    }
    async calcLpTokenAmount(amounts, isDeposit = true) {
        if (amounts.length !== this.underlyingCoinAddresses.length) {
            throw Error(`${this.name} pool has ${this.underlyingCoinAddresses.length} coins (amounts provided for ${amounts.length})`);
        }
        const _underlyingAmounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
        const _expected = await this._calcLpTokenAmount(_underlyingAmounts, isDeposit, true);
        return curve_js_1.curve.formatUnits(_expected);
    }
    async calcLpTokenAmountWrapped(amounts, isDeposit = true) {
        if (amounts.length !== this.wrappedCoinAddresses.length) {
            throw Error(`${this.name} pool has ${this.wrappedCoinAddresses.length} coins (amounts provided for ${amounts.length})`);
        }
        if (this.isFake) {
            throw Error(`${this.name} pool doesn't have this method`);
        }
        const _amounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[i]));
        const _expected = await this._calcLpTokenAmount(_amounts, isDeposit, false);
        return curve_js_1.curve.formatUnits(_expected);
    }
    // ---------------- DEPOSIT ----------------
    metaUnderlyingSeedAmounts(amount1) {
        if (this.isCrypto)
            throw Error(`Use cryptoSeedAmounts method for ${this.name} pool`);
        if (!this.isMeta)
            throw Error("metaUnderlyingSeedAmounts method exists only for meta stable pools");
        const amount1BN = (0, utils_js_1.BN)(amount1);
        if (amount1BN.lte(0))
            throw Error("Initial deposit amounts must be > 0");
        const amounts = [(0, utils_js_1._cutZeros)(amount1BN.toFixed(this.underlyingDecimals[0]))];
        for (let i = 1; i < this.underlyingDecimals.length; i++) {
            amounts.push(amount1BN.div(this.underlyingDecimals.length - 1).toFixed(this.underlyingDecimals[i]));
        }
        return amounts;
    }
    async cryptoSeedAmounts(amount1) {
        if (!this.isCrypto)
            throw Error("cryptoSeedAmounts method doesn't exist for stable pools");
        const decimals = this.isMeta ? this.wrappedDecimals : this.underlyingDecimals;
        const amount1BN = (0, utils_js_1.BN)(amount1);
        if (amount1BN.lte(0))
            throw Error("Initial deposit amounts must be > 0");
        if (decimals.length === 2) {
            const priceScaleBN = (0, utils_js_1.toBN)(await curve_js_1.curve.contracts[this.address].contract.price_scale(curve_js_1.curve.constantOptions));
            return [(0, utils_js_1._cutZeros)(amount1BN.toFixed(decimals[0])), (0, utils_js_1._cutZeros)(amount1BN.div(priceScaleBN).toFixed(decimals[1]))];
        }
        else if (decimals.length === 3) {
            const priceScaleBN = (await curve_js_1.curve.multicallProvider.all([
                curve_js_1.curve.contracts[this.address].multicallContract.price_scale(0),
                curve_js_1.curve.contracts[this.address].multicallContract.price_scale(1),
            ])).map((_p) => (0, utils_js_1.toBN)(_p));
            return [
                (0, utils_js_1._cutZeros)(amount1BN.toFixed(decimals[0])),
                (0, utils_js_1._cutZeros)(amount1BN.div(priceScaleBN[0]).toFixed(decimals[1])),
                (0, utils_js_1._cutZeros)(amount1BN.div(priceScaleBN[1]).toFixed(decimals[2])),
            ];
        }
        throw Error("cryptoSeedAmounts method doesn't exist for pools with N coins > 3");
    }
    // OVERRIDE
    async depositBalancedAmounts() {
        throw Error(`depositBalancedAmounts method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async depositExpected(amounts) {
        return await this.calcLpTokenAmount(amounts);
    }
    // | balanced[i] / sum(balanced[j]) = balance[i] / sum(balance[j]) |
    // | sum(pj * balanced[j]) = sum(aj * pj)                          |
    //
    // --- Answer ---
    // balanced[i] = sum(aj * pj) / sum(rj * pj / ri)
    //
    // totalValueBN = sum(aj * pj)
    // totalBalanceBN = sum(balance[j])
    // ratiosBN[i] = balancesBN[i] / totalBalanceBN = ri = balance[i] / sum(balance[j])
    // denominatorBN = sum(rj * pj / ri)
    _balancedAmountsWithSameValue(amountsBN, pricesBN, balancesBN) {
        const valuesBN = amountsBN.map((aBN, i) => aBN.times(pricesBN[i]));
        const totalValueBN = valuesBN.reduce((v1BN, v2BN) => v1BN.plus(v2BN));
        const totalBalanceBN = balancesBN.reduce((b1BN, b2BN) => b1BN.plus(b2BN));
        const ratiosBN = balancesBN.map((bBN) => bBN.div(totalBalanceBN));
        const balancedAmountsBN = [];
        for (let i = 0; i < amountsBN.length; i++) {
            const denominatorBN = ratiosBN.map((rBN, j) => rBN.times(pricesBN[j])
                .div(ratiosBN[i])).reduce((xBN, yBN) => xBN.plus(yBN));
            balancedAmountsBN.push(totalValueBN.div(denominatorBN));
        }
        return balancedAmountsBN.map(String);
    }
    async depositBonus(amounts) {
        const amountsBN = amounts.map(utils_js_1.BN);
        const prices = (this.isCrypto || this.id === 'wsteth') ? await this._underlyingPrices() : this.underlyingCoins.map(() => 1);
        const pricesBN = prices.map(utils_js_1.BN);
        const balancesBN = (await this.stats.underlyingBalances()).map(utils_js_1.BN);
        const balancedAmounts = this._balancedAmountsWithSameValue(amountsBN, pricesBN, balancesBN);
        const expectedBN = (0, utils_js_1.BN)(await this.depositExpected(amounts));
        const balancedExpectedBN = (0, utils_js_1.BN)(await this.depositExpected(balancedAmounts));
        return String(expectedBN.minus(balancedExpectedBN).div(balancedExpectedBN).times(100));
    }
    async depositIsApproved(amounts) {
        return await (0, utils_js_1.hasAllowance)(this.underlyingCoinAddresses, amounts, curve_js_1.curve.signerAddress, this.zap || this.address);
    }
    async depositApproveEstimateGas(amounts) {
        return await (0, utils_js_1.ensureAllowanceEstimateGas)(this.underlyingCoinAddresses, amounts, this.zap || this.address);
    }
    async depositApprove(amounts) {
        return await (0, utils_js_1.ensureAllowance)(this.underlyingCoinAddresses, amounts, this.zap || this.address);
    }
    // OVERRIDE
    async depositEstimateGas(amounts) {
        throw Error(`depositEstimateGas method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async deposit(amounts, slippage = 0.5) {
        throw Error(`deposit method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- DEPOSIT WRAPPED ----------------
    async depositWrappedBalancedAmounts() {
        throw Error(`depositWrappedBalancedAmounts method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async depositWrappedExpected(amounts) {
        if (this.isFake) {
            throw Error(`depositWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
        }
        return await this.calcLpTokenAmountWrapped(amounts);
    }
    async depositWrappedBonus(amounts) {
        const amountsBN = amounts.map(utils_js_1.BN);
        const pricesBN = (await this._wrappedPrices()).map(utils_js_1.BN);
        const balancesBN = (await this.stats.wrappedBalances()).map(utils_js_1.BN);
        const balancedAmounts = this._balancedAmountsWithSameValue(amountsBN, pricesBN, balancesBN);
        const expectedBN = (0, utils_js_1.BN)(await this.depositWrappedExpected(amounts));
        const balancedExpectedBN = (0, utils_js_1.BN)(await this.depositWrappedExpected(balancedAmounts));
        return String(expectedBN.minus(balancedExpectedBN).div(balancedExpectedBN).times(100));
    }
    async depositWrappedIsApproved(amounts) {
        if (this.isFake) {
            throw Error(`depositWrappedIsApproved method doesn't exist for pool ${this.name} (id: ${this.name})`);
        }
        return await (0, utils_js_1.hasAllowance)(this.wrappedCoinAddresses, amounts, curve_js_1.curve.signerAddress, this.address);
    }
    async depositWrappedApproveEstimateGas(amounts) {
        if (this.isFake) {
            throw Error(`depositWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        }
        return await (0, utils_js_1.ensureAllowanceEstimateGas)(this.wrappedCoinAddresses, amounts, this.address);
    }
    async depositWrappedApprove(amounts) {
        if (this.isFake) {
            throw Error(`depositWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        }
        return await (0, utils_js_1.ensureAllowance)(this.wrappedCoinAddresses, amounts, this.address);
    }
    // OVERRIDE
    async depositWrappedEstimateGas(amounts) {
        throw Error(`depositWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async depositWrapped(amounts, slippage = 0.5) {
        throw Error(`depositWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- STAKING ----------------
    async stakeIsApproved(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`stakeIsApproved method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.gauge);
    }
    async stakeApproveEstimateGas(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`stakeApproveEstimateGas method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.lpToken], [lpTokenAmount], this.gauge);
    }
    async stakeApprove(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`stakeApprove method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await (0, utils_js_1.ensureAllowance)([this.lpToken], [lpTokenAmount], this.gauge);
    }
    async stakeEstimateGas(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`stakeEstimateGas method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        return (0, utils_js_1.smartNumber)(await curve_js_1.curve.contracts[this.gauge].contract.deposit.estimateGas(_lpTokenAmount, curve_js_1.curve.constantOptions));
    }
    async stake(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`stake method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.gauge);
        await curve_js_1.curve.updateFeeData();
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await curve_js_1.curve.contracts[this.gauge].contract.deposit.estimateGas(_lpTokenAmount, curve_js_1.curve.constantOptions)));
        return (await curve_js_1.curve.contracts[this.gauge].contract.deposit(_lpTokenAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    }
    async unstakeEstimateGas(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`unstakeEstimateGas method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        return (0, utils_js_1.smartNumber)(await curve_js_1.curve.contracts[this.gauge].contract.withdraw.estimateGas(_lpTokenAmount, curve_js_1.curve.constantOptions));
    }
    async unstake(lpTokenAmount) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`unstake method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        await curve_js_1.curve.updateFeeData();
        const gasLimit = (0, utils_js_1.DIGas)((await curve_js_1.curve.contracts[this.gauge].contract.withdraw.estimateGas(_lpTokenAmount, curve_js_1.curve.constantOptions))) * curve_js_1.curve.parseUnits("200", 0) / curve_js_1.curve.parseUnits("100", 0);
        return (await curve_js_1.curve.contracts[this.gauge].contract.withdraw(_lpTokenAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    }
    async claimableCrv(address = "") {
        if (this.rewardsOnly())
            throw Error(`${this.name} has Rewards-Only Gauge. Use claimableRewards instead`);
        address = address || curve_js_1.curve.signerAddress;
        if (!address)
            throw Error("Need to connect wallet or pass address into args");
        return curve_js_1.curve.formatUnits(await curve_js_1.curve.contracts[this.gauge].contract.claimable_tokens(address, curve_js_1.curve.constantOptions));
    }
    async claimCrvEstimateGas() {
        if (this.rewardsOnly())
            throw Error(`${this.name} has Rewards-Only Gauge. Use claimRewards instead`);
        if (curve_js_1.curve.chainId === 1) {
            return Number(await curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.minter].contract.mint.estimateGas(this.gauge, curve_js_1.curve.constantOptions));
        }
        else {
            return (0, utils_js_1.smartNumber)(await curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_factory].contract.mint.estimateGas(this.gauge, curve_js_1.curve.constantOptions));
        }
    }
    async claimCrv() {
        if (this.rewardsOnly())
            throw Error(`${this.name} has Rewards-Only Gauge. Use claimRewards instead`);
        const contract = curve_js_1.curve.chainId === 1 ? curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.minter].contract : curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_factory].contract;
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.mint.estimateGas(this.gauge, curve_js_1.curve.constantOptions)));
        return (await contract.mint(this.gauge, { ...curve_js_1.curve.options, gasLimit })).hash;
    }
    // TODO 1. Fix aave and saave error
    async claimableRewards(address = "") {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`claimableRewards method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        address = address || curve_js_1.curve.signerAddress;
        if (!address)
            throw Error("Need to connect wallet or pass address into args");
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        const rewardTokens = await this.rewardTokens();
        const rewards = [];
        if ('claimable_reward(address,address)' in gaugeContract) {
            for (const rewardToken of rewardTokens) {
                const _amount = await gaugeContract.claimable_reward(address, rewardToken.token, curve_js_1.curve.constantOptions);
                rewards.push({
                    token: rewardToken.token,
                    symbol: rewardToken.symbol,
                    amount: curve_js_1.curve.formatUnits(_amount, rewardToken.decimals),
                });
            }
        }
        else if ('claimable_reward(address)' in gaugeContract && rewardTokens.length > 0) { // Synthetix Gauge
            const rewardToken = rewardTokens[0];
            const _totalAmount = await gaugeContract.claimable_reward(address, curve_js_1.curve.constantOptions);
            const _claimedAmount = await gaugeContract.claimed_rewards_for(address, curve_js_1.curve.constantOptions);
            rewards.push({
                token: rewardToken.token,
                symbol: rewardToken.symbol,
                amount: curve_js_1.curve.formatUnits(_totalAmount.sub(_claimedAmount), rewardToken.decimals),
            });
        }
        return rewards;
    }
    async claimRewardsEstimateGas() {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`claimRewards method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if (!("claim_rewards()" in gaugeContract))
            throw Error(`${this.name} pool doesn't have such method`);
        return (0, utils_js_1.smartNumber)(await gaugeContract.claim_rewards.estimateGas(curve_js_1.curve.constantOptions));
    }
    async claimRewards() {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`claimRewards method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if (!("claim_rewards()" in gaugeContract))
            throw Error(`${this.name} pool doesn't have such method`);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await gaugeContract.claim_rewards.estimateGas(curve_js_1.curve.constantOptions)));
        return (await gaugeContract.claim_rewards({ ...curve_js_1.curve.options, gasLimit })).hash;
    }
    // ---------------- DEPOSIT & STAKE ----------------
    async depositAndStakeExpected(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeExpected method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await this.depositExpected(amounts);
    }
    async depositAndStakeBonus(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeBonus method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await this.depositBonus(amounts);
    }
    async depositAndStakeIsApproved(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeIsApproved method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const coinsAllowance = await (0, utils_js_1.hasAllowance)(this.underlyingCoinAddresses, amounts, curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            return coinsAllowance && gaugeAllowance;
        }
        return coinsAllowance;
    }
    async depositAndStakeApproveEstimateGas(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeApprove method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const approveCoinsGas = await (0, utils_js_1.ensureAllowanceEstimateGas)(this.underlyingCoinAddresses, amounts, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            if (!gaugeAllowance) {
                const approveGaugeGas = (0, utils_js_1.smartNumber)(await gaugeContract.set_approve_deposit.estimateGas(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, curve_js_1.curve.constantOptions));
                if (Array.isArray(approveCoinsGas) && Array.isArray(approveGaugeGas)) {
                    return [approveCoinsGas[0] + approveGaugeGas[0], approveCoinsGas[1] + approveGaugeGas[1]];
                }
                if (!Array.isArray(approveCoinsGas) && !Array.isArray(approveGaugeGas)) {
                    return approveCoinsGas + approveGaugeGas;
                }
            }
        }
        return approveCoinsGas;
    }
    async depositAndStakeApprove(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeApprove method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        const approveCoinsTx = await (0, utils_js_1.ensureAllowance)(this.underlyingCoinAddresses, amounts, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            if (!gaugeAllowance) {
                const gasLimit = (0, utils_js_1.mulBy1_3)(await gaugeContract.set_approve_deposit.estimateGas(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, curve_js_1.curve.constantOptions));
                const approveGaugeTx = (await gaugeContract.set_approve_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, { ...curve_js_1.curve.options, gasLimit })).hash;
                return [...approveCoinsTx, approveGaugeTx];
            }
        }
        return approveCoinsTx;
    }
    async depositAndStakeEstimateGas(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStake method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await this._depositAndStake(amounts, 1, true, true);
    }
    async depositAndStake(amounts, slippage = 0.1) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStake method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        return await this._depositAndStake(amounts, slippage, true, false);
    }
    // ---------------- DEPOSIT & STAKE WRAPPED ----------------
    async depositAndStakeWrappedExpected(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this.depositWrappedExpected(amounts);
    }
    async depositAndStakeWrappedBonus(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrappedBonus method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrappedBonus method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this.depositWrappedBonus(amounts);
    }
    async depositAndStakeWrappedIsApproved(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrappedIsApproved method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrappedIsApproved method doesn't exist for pool ${this.name} (id: ${this.name})`);
        const coinsAllowance = await (0, utils_js_1.hasAllowance)(this.wrappedCoinAddresses, amounts, curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            return coinsAllowance && gaugeAllowance;
        }
        return coinsAllowance;
    }
    async depositAndStakeWrappedApproveEstimateGas(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        const approveCoinsGas = await (0, utils_js_1.ensureAllowanceEstimateGas)(this.wrappedCoinAddresses, amounts, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            if (!gaugeAllowance) {
                const approveGaugeGas = Number(await gaugeContract.set_approve_deposit.estimateGas(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, curve_js_1.curve.constantOptions));
                if (Array.isArray(approveCoinsGas) && Array.isArray(approveGaugeGas)) {
                    return [approveCoinsGas[0] + approveGaugeGas[0], approveCoinsGas[1] + approveGaugeGas[1]];
                }
                if (!Array.isArray(approveCoinsGas) && !Array.isArray(approveGaugeGas)) {
                    return approveCoinsGas + approveGaugeGas;
                }
            }
        }
        return approveCoinsGas;
    }
    async depositAndStakeWrappedApprove(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        const approveCoinsTx = await (0, utils_js_1.ensureAllowance)(this.wrappedCoinAddresses, amounts, curve_js_1.curve.constants.ALIASES.deposit_and_stake);
        const gaugeContract = curve_js_1.curve.contracts[this.gauge].contract;
        if ('approved_to_deposit' in gaugeContract) {
            const gaugeAllowance = await gaugeContract.approved_to_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
            if (!gaugeAllowance) {
                const gasLimit = (0, utils_js_1.mulBy1_3)(await gaugeContract.set_approve_deposit.estimateGas(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, curve_js_1.curve.constantOptions));
                const approveGaugeTx = (await gaugeContract.set_approve_deposit(curve_js_1.curve.constants.ALIASES.deposit_and_stake, true, { ...curve_js_1.curve.options, gasLimit })).hash;
                return [...approveCoinsTx, approveGaugeTx];
            }
        }
        return approveCoinsTx;
    }
    async depositAndStakeWrappedEstimateGas(amounts) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrapped method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this._depositAndStake(amounts, 1, false, true);
    }
    async depositAndStakeWrapped(amounts, slippage = 0.1) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            throw Error(`depositAndStakeWrapped method doesn't exist for pool ${this.name} (id: ${this.name}). There is no gauge`);
        }
        if (this.isPlain || this.isFake)
            throw Error(`depositAndStakeWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this._depositAndStake(amounts, slippage, false, false);
    }
    async _depositAndStake(amounts, slippage, isUnderlying, estimateGas) {
        const coinAddresses = isUnderlying ? [...this.underlyingCoinAddresses] : [...this.wrappedCoinAddresses];
        const coins = isUnderlying ? this.underlyingCoins : this.wrappedCoinAddresses;
        const decimals = isUnderlying ? this.underlyingDecimals : this.wrappedDecimals;
        const depositAddress = isUnderlying ? this.zap || this.address : this.address;
        if (amounts.length !== coinAddresses.length) {
            throw Error(`${this.name} pool has ${coinAddresses.length} coins (amounts provided for ${amounts.length})`);
        }
        const balances = isUnderlying ? Object.values(await this.walletUnderlyingCoinBalances()) : Object.values(await this.walletWrappedCoinBalances());
        for (let i = 0; i < balances.length; i++) {
            if (Number(balances[i]) < Number(amounts[i])) {
                throw Error(`Not enough ${coins[i]}. Actual: ${balances[i]}, required: ${amounts[i]}`);
            }
        }
        const allowance = isUnderlying ? await this.depositAndStakeIsApproved(amounts) : await this.depositAndStakeWrappedIsApproved(amounts);
        if (estimateGas && !allowance) {
            throw Error("Token allowance is needed to estimate gas");
        }
        if (!estimateGas) {
            if (isUnderlying) {
                await this.depositAndStakeApprove(amounts);
            }
            else {
                await this.depositAndStakeWrappedApprove(amounts);
            }
        }
        const _amounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, decimals[i]));
        const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.deposit_and_stake].contract;
        const useUnderlying = isUnderlying && (this.isLending || (this.isCrypto && !this.isPlain)) && (!this.zap || this.id == 'avaxcrypto');
        const _expectedLpTokenAmount = isUnderlying ?
            curve_js_1.curve.parseUnits(await this.depositAndStakeExpected(amounts)) :
            curve_js_1.curve.parseUnits(await this.depositAndStakeWrappedExpected(amounts));
        const minAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 - slippage).div(100);
        const _minMintAmount = (0, utils_js_1.fromBN)(minAmountBN);
        const ethIndex = (0, utils_js_1.getEthIndex)(coinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const maxCoins = curve_js_1.curve.chainId === 137 ? 6 : 5;
        for (let i = 0; i < maxCoins; i++) {
            coinAddresses[i] = coinAddresses[i] || curve_js_1.curve.constants.ZERO_ADDRESS;
            _amounts[i] = _amounts[i] || curve_js_1.curve.parseUnits("0");
        }
        const _gas = (await contract.deposit_and_stake.estimateGas(depositAddress, this.lpToken, this.gauge, coins.length, coinAddresses, _amounts, _minMintAmount, useUnderlying, this.isMetaFactory && isUnderlying ? this.address : curve_js_1.curve.constants.ZERO_ADDRESS, { ...curve_js_1.curve.constantOptions, value }));
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(_gas);
        await curve_js_1.curve.updateFeeData();
        const gasLimit = (0, utils_js_1.DIGas)(_gas) * curve_js_1.curve.parseUnits("200", 0) / curve_js_1.curve.parseUnits("100", 0);
        return (await contract.deposit_and_stake(depositAddress, this.lpToken, this.gauge, coins.length, coinAddresses, _amounts, _minMintAmount, useUnderlying, this.isMetaFactory && isUnderlying ? this.address : curve_js_1.curve.constants.ZERO_ADDRESS, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    }
    // ---------------- WITHDRAW ----------------
    // OVERRIDE
    async withdrawExpected(lpTokenAmount) {
        throw Error(`withdrawExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async withdrawIsApproved(lpTokenAmount) {
        if (!this.zap)
            return true;
        return await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.zap);
    }
    async withdrawApproveEstimateGas(lpTokenAmount) {
        if (!this.zap)
            return 0;
        return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.lpToken], [lpTokenAmount], this.zap);
    }
    async withdrawApprove(lpTokenAmount) {
        if (!this.zap)
            return [];
        return await (0, utils_js_1.ensureAllowance)([this.lpToken], [lpTokenAmount], this.zap);
    }
    // OVERRIDE
    async withdrawEstimateGas(lpTokenAmount) {
        throw Error(`withdraw method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdraw(lpTokenAmount, slippage = 0.5) {
        throw Error(`withdraw method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WITHDRAW WRAPPED ----------------
    // OVERRIDE
    async withdrawWrappedExpected(lpTokenAmount) {
        throw Error(`withdrawWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawWrappedEstimateGas(lpTokenAmount) {
        throw Error(`withdrawWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawWrapped(lpTokenAmount, slippage = 0.5) {
        throw Error(`withdrawWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WITHDRAW IMBALANCE ----------------
    async withdrawImbalanceExpected(amounts) {
        if (this.isCrypto)
            throw Error(`withdrawImbalanceExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this.calcLpTokenAmount(amounts, false);
    }
    async withdrawImbalanceBonus(amounts) {
        const prices = (this.isCrypto || this.id === 'wsteth') ? await this._underlyingPrices() : this.underlyingCoins.map(() => 1);
        const value = amounts.map(utils_js_1.checkNumber).map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        const lpTokenAmount = await this.withdrawImbalanceExpected(amounts);
        const balancedAmounts = await this.withdrawExpected(lpTokenAmount);
        const balancedValue = balancedAmounts.map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        return String((value - balancedValue) / balancedValue * 100);
    }
    async withdrawImbalanceIsApproved(amounts) {
        if (this.isCrypto)
            throw Error(`withdrawImbalanceIsApproved method doesn't exist for pool ${this.name} (id: ${this.name})`);
        if (this.zap) {
            const _amounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
            const _maxBurnAmount = (await this._calcLpTokenAmount(_amounts, false)) * curve_js_1.curve.parseUnits("101", 0) / curve_js_1.curve.parseUnits("100", 0);
            return await (0, utils_js_1.hasAllowance)([this.lpToken], [curve_js_1.curve.formatUnits(_maxBurnAmount, 18)], curve_js_1.curve.signerAddress, this.zap);
        }
        return true;
    }
    async withdrawImbalanceApproveEstimateGas(amounts) {
        if (this.isCrypto)
            throw Error(`withdrawImbalanceApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        if (this.zap) {
            const _amounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
            const _maxBurnAmount = (await this._calcLpTokenAmount(_amounts, false)) * curve_js_1.curve.parseUnits("101", 0) / curve_js_1.curve.parseUnits("100", 0);
            return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.lpToken], [curve_js_1.curve.formatUnits(_maxBurnAmount, 18)], this.zap);
        }
        return 0;
    }
    async withdrawImbalanceApprove(amounts) {
        if (this.isCrypto)
            throw Error(`withdrawImbalanceApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
        if (this.zap) {
            const _amounts = amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
            const _maxBurnAmount = (await this._calcLpTokenAmount(_amounts, false)) * curve_js_1.curve.parseUnits("101", 0) / curve_js_1.curve.parseUnits("100", 0);
            return await (0, utils_js_1.ensureAllowance)([this.lpToken], [curve_js_1.curve.formatUnits(_maxBurnAmount, 18)], this.zap);
        }
        return [];
    }
    // OVERRIDE
    async withdrawImbalanceEstimateGas(amounts) {
        throw Error(`withdrawImbalance method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawImbalance(amounts, slippage = 0.5) {
        throw Error(`withdrawImbalance method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WITHDRAW IMBALANCE WRAPPED ----------------
    async withdrawImbalanceWrappedExpected(amounts) {
        if (this.isCrypto || this.isPlain || this.isFake)
            throw Error(`withdrawImbalanceWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
        return await this.calcLpTokenAmountWrapped(amounts, false);
    }
    async withdrawImbalanceWrappedBonus(amounts) {
        const prices = await this._wrappedPrices();
        const value = amounts.map(utils_js_1.checkNumber).map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        const lpTokenAmount = Number(await this.withdrawImbalanceWrappedExpected(amounts));
        const balancedAmounts = await this.withdrawWrappedExpected(lpTokenAmount);
        const balancedValue = balancedAmounts.map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        return String((value - balancedValue) / balancedValue * 100);
    }
    // OVERRIDE
    async withdrawImbalanceWrappedEstimateGas(amounts) {
        throw Error(`withdrawImbalanceWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawImbalanceWrapped(amounts, slippage = 0.5) {
        throw Error(`withdrawImbalanceWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WITHDRAW ONE COIN ----------------
    // OVERRIDE
    async _withdrawOneCoinExpected(_lpTokenAmount, i) {
        throw Error(`withdrawOneCoinExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async withdrawOneCoinExpected(lpTokenAmount, coin) {
        const i = this._getCoinIdx(coin);
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expected = await this._withdrawOneCoinExpected(_lpTokenAmount, i);
        return curve_js_1.curve.formatUnits(_expected, this.underlyingDecimals[i]);
    }
    async withdrawOneCoinBonus(lpTokenAmount, coin) {
        const prices = (this.isCrypto || this.id === 'wsteth') ? await this._underlyingPrices() : this.underlyingCoins.map(() => 1);
        const coinPrice = prices[this._getCoinIdx(coin)];
        const amount = Number(await this.withdrawOneCoinExpected(lpTokenAmount, coin));
        const value = amount * coinPrice;
        const balancedAmounts = await this.withdrawExpected(lpTokenAmount);
        const balancedValue = balancedAmounts.map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        return String((value - balancedValue) / balancedValue * 100);
    }
    async withdrawOneCoinIsApproved(lpTokenAmount) {
        if (!this.zap)
            return true;
        return await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.zap);
    }
    async withdrawOneCoinApproveEstimateGas(lpTokenAmount) {
        if (!this.zap)
            return 0;
        return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.lpToken], [lpTokenAmount], this.zap);
    }
    async withdrawOneCoinApprove(lpTokenAmount) {
        if (!this.zap)
            return [];
        return await (0, utils_js_1.ensureAllowance)([this.lpToken], [lpTokenAmount], this.zap);
    }
    // OVERRIDE
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        throw Error(`withdrawOneCoin method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawOneCoin(lpTokenAmount, coin, slippage = 0.5) {
        throw Error(`withdrawOneCoin method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WITHDRAW ONE COIN WRAPPED ----------------
    // OVERRIDE
    async _withdrawOneCoinWrappedExpected(_lpTokenAmount, i) {
        throw Error(`withdrawOneCoinWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async withdrawOneCoinWrappedExpected(lpTokenAmount, coin) {
        const i = this._getCoinIdx(coin, false);
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expected = await this._withdrawOneCoinWrappedExpected(_lpTokenAmount, i);
        return curve_js_1.curve.formatUnits(_expected, this.wrappedDecimals[i]);
    }
    async withdrawOneCoinWrappedBonus(lpTokenAmount, coin) {
        const prices = await this._wrappedPrices();
        const coinPrice = prices[this._getCoinIdx(coin, false)];
        const amount = Number(await this.withdrawOneCoinWrappedExpected(lpTokenAmount, coin));
        const value = amount * coinPrice;
        const balancedAmounts = await this.withdrawWrappedExpected(lpTokenAmount);
        const balancedValue = balancedAmounts.map(Number).reduce((s, a, i) => s + (a * prices[i]), 0);
        return String((value - balancedValue) / balancedValue * 100);
    }
    // OVERRIDE
    async withdrawOneCoinWrappedEstimateGas(lpTokenAmount, coin) {
        throw Error(`withdrawOneCoinWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async withdrawOneCoinWrapped(lpTokenAmount, coin, slippage = 0.5) {
        throw Error(`withdrawOneCoinWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- WALLET BALANCES ----------------
    async walletBalances(...addresses) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            return await this._balances(['lpToken', ...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], [this.lpToken, ...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], ...addresses);
        }
        else {
            return await this._balances(['lpToken', 'gauge', ...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], [this.lpToken, this.gauge, ...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], ...addresses);
        }
    }
    async walletLpTokenBalances(...addresses) {
        if (this.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
            return await this._balances(['lpToken'], [this.lpToken], ...addresses);
        }
        else {
            return await this._balances(['lpToken', 'gauge'], [this.lpToken, this.gauge], ...addresses);
        }
    }
    async walletUnderlyingCoinBalances(...addresses) {
        return await this._balances(this.underlyingCoinAddresses, this.underlyingCoinAddresses, ...addresses);
    }
    async walletWrappedCoinBalances(...addresses) {
        return await this._balances(this.wrappedCoinAddresses, this.wrappedCoinAddresses, ...addresses);
    }
    async walletAllCoinBalances(...addresses) {
        return await this._balances([...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], [...this.underlyingCoinAddresses, ...this.wrappedCoinAddresses], ...addresses);
    }
    // ---------------- USER BALANCES, BASE PROFIT AND SHARE ----------------
    async _userLpTotalBalance(address) {
        const lpBalances = await this.walletLpTokenBalances(address);
        let lpTotalBalanceBN = (0, utils_js_1.BN)(lpBalances.lpToken);
        if ('gauge' in lpBalances)
            lpTotalBalanceBN = lpTotalBalanceBN.plus((0, utils_js_1.BN)(lpBalances.gauge));
        return lpTotalBalanceBN;
    }
    async userBalances(address = "") {
        address = address || curve_js_1.curve.signerAddress;
        if (!address)
            throw Error("Need to connect wallet or pass address into args");
        const lpTotalBalanceBN = await this._userLpTotalBalance(address);
        if (lpTotalBalanceBN.eq(0))
            return this.underlyingCoins.map(() => "0");
        return await this.withdrawExpected(lpTotalBalanceBN.toFixed(18));
    }
    async userWrappedBalances(address = "") {
        address = address || curve_js_1.curve.signerAddress;
        if (!address)
            throw Error("Need to connect wallet or pass address into args");
        const lpTotalBalanceBN = await this._userLpTotalBalance(address);
        if (lpTotalBalanceBN.eq(0))
            return this.wrappedCoins.map(() => "0");
        return await this.withdrawWrappedExpected(lpTotalBalanceBN.toFixed(18));
    }
    async userLiquidityUSD(address = "") {
        const lpBalanceBN = await this._userLpTotalBalance(address);
        const lpPrice = await (0, utils_js_1._getUsdRate)(this.lpToken);
        return lpBalanceBN.times(lpPrice).toFixed(8);
    }
    async baseProfit(address = "") {
        const apyData = await this.statsBaseApy();
        if (!('week' in apyData))
            return { day: "0", week: "0", month: "0", year: "0" };
        const apyBN = (0, utils_js_1.BN)(apyData.week).div(100);
        const totalLiquidityBN = (0, utils_js_1.BN)(await this.userLiquidityUSD(address));
        const annualProfitBN = apyBN.times(totalLiquidityBN);
        const monthlyProfitBN = annualProfitBN.div(12);
        const weeklyProfitBN = annualProfitBN.div(52);
        const dailyProfitBN = annualProfitBN.div(365);
        return {
            day: dailyProfitBN.toString(),
            week: weeklyProfitBN.toString(),
            month: monthlyProfitBN.toString(),
            year: annualProfitBN.toString(),
        };
    }
    async userShare(address = "") {
        const withGauge = this.gauge !== curve_js_1.curve.constants.ZERO_ADDRESS;
        address = address || curve_js_1.curve.signerAddress;
        if (!address)
            throw Error("Need to connect wallet or pass address into args");
        const userLpBalance = await this.walletLpTokenBalances(address);
        let userLpTotalBalanceBN = (0, utils_js_1.BN)(userLpBalance.lpToken);
        if (withGauge)
            userLpTotalBalanceBN = userLpTotalBalanceBN.plus((0, utils_js_1.BN)(userLpBalance.gauge));
        let totalLp, gaugeLp;
        if (withGauge) {
            [totalLp, gaugeLp] = (await curve_js_1.curve.multicallProvider.all([
                curve_js_1.curve.contracts[this.lpToken].multicallContract.totalSupply(),
                curve_js_1.curve.contracts[this.gauge].multicallContract.totalSupply(),
            ])).map((_supply) => curve_js_1.curve.formatUnits(_supply));
        }
        else {
            totalLp = curve_js_1.curve.formatUnits(await curve_js_1.curve.contracts[this.lpToken].contract.totalSupply(curve_js_1.curve.constantOptions));
        }
        return {
            lpUser: userLpTotalBalanceBN.toString(),
            lpTotal: totalLp,
            lpShare: (0, utils_js_1.BN)(totalLp).gt(0) ? userLpTotalBalanceBN.div(totalLp).times(100).toString() : '0',
            gaugeUser: userLpBalance.gauge,
            gaugeTotal: gaugeLp,
            gaugeShare: !withGauge ? undefined : (0, utils_js_1.BN)(gaugeLp).gt(0) ? (0, utils_js_1.BN)(userLpBalance.gauge).div(gaugeLp).times(100).toString() : '0',
        };
    }
    // ---------------- SWAP ----------------
    async _swapExpected(i, j, _amount) {
        const contractAddress = this.isCrypto && this.isMeta ? this.zap : this.address;
        const contract = curve_js_1.curve.contracts[contractAddress].contract;
        if ('get_dy_underlying' in contract) {
            return await contract.get_dy_underlying(i, j, _amount, curve_js_1.curve.constantOptions);
        }
        else {
            if ('get_dy(address,uint256,uint256,uint256)' in contract) { // atricrypto3 based metapools
                return await contract.get_dy(this.address, i, j, _amount, curve_js_1.curve.constantOptions);
            }
            return await contract.get_dy(i, j, _amount, curve_js_1.curve.constantOptions);
        }
    }
    async swapExpected(inputCoin, outputCoin, amount) {
        const i = this._getCoinIdx(inputCoin);
        const j = this._getCoinIdx(outputCoin);
        const _amount = (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]);
        const _expected = await this._swapExpected(i, j, _amount);
        return curve_js_1.curve.formatUnits(_expected, this.underlyingDecimals[j]);
    }
    async _swapRequired(i, j, _amount, isUnderlying) {
        if (this.isCrypto) {
            const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.crypto_calc].contract;
            if (this.isMeta && isUnderlying) {
                const basePool = new PoolTemplate(this.basePool);
                if (this.wrappedCoins.length === 3) {
                    return await contract.get_dx_tricrypto_meta_underlying(this.address, i, j, _amount, this.wrappedCoins.length, basePool.address, basePool.lpToken, curve_js_1.curve.constantOptions);
                }
                if (basePool.isFake) {
                    const secondPool = new PoolTemplate(basePool.basePool);
                    return await contract.get_dx_double_meta_underlying(this.address, i, j, _amount, basePool.address, basePool.zap, secondPool.address, secondPool.lpToken, curve_js_1.curve.constantOptions);
                }
                return await contract.get_dx_meta_underlying(this.address, i, j, _amount, this.underlyingCoins.length, basePool.address, basePool.lpToken, curve_js_1.curve.constantOptions);
            }
            else {
                return await contract.get_dx(this.address, i, j, _amount, this.wrappedCoins.length, curve_js_1.curve.constantOptions);
            }
        }
        else {
            if (this.id.startsWith("factory-stable-ng")) {
                const contract = curve_js_1.curve.contracts[this.address].contract;
                if (this.isMeta) {
                    if (isUnderlying) {
                        return await contract.get_dx_underlying(i, j, _amount, curve_js_1.curve.constantOptions);
                    }
                    else {
                        return await contract.get_dx(i, j, _amount, curve_js_1.curve.constantOptions);
                    }
                }
                else {
                    return await contract.get_dx(i, j, _amount);
                }
            }
            const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.stable_calc].contract;
            if (this.isMeta) {
                const basePool = new PoolTemplate(this.basePool);
                if (isUnderlying) {
                    return await contract.get_dx_meta_underlying(this.address, i, j, _amount, this.underlyingCoins.length, basePool.address, basePool.lpToken, curve_js_1.curve.constantOptions);
                }
                else {
                    return await contract.get_dx_meta(this.address, i, j, _amount, this.wrappedCoins.length, basePool.address, curve_js_1.curve.constantOptions);
                }
            }
            else {
                if (isUnderlying && this.isLending) {
                    return await contract.get_dx_underlying(this.address, i, j, _amount, this.underlyingCoins.length, curve_js_1.curve.constantOptions);
                }
                else {
                    return await contract.get_dx(this.address, i, j, _amount, this.wrappedCoins.length, curve_js_1.curve.constantOptions);
                }
            }
        }
    }
    async swapRequired(inputCoin, outputCoin, amount) {
        const i = this._getCoinIdx(inputCoin);
        const j = this._getCoinIdx(outputCoin);
        const _amount = (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[j]);
        const _required = await this._swapRequired(i, j, _amount, true);
        return curve_js_1.curve.formatUnits(_required, this.underlyingDecimals[i]);
    }
    // OVERRIDE
    async swapWrappedRequired(inputCoin, outputCoin, amount) {
        throw Error(`swapWrappedRequired method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async swapPriceImpact(inputCoin, outputCoin, amount) {
        const i = this._getCoinIdx(inputCoin);
        const j = this._getCoinIdx(outputCoin);
        const [inputCoinDecimals, outputCoinDecimals] = [this.underlyingDecimals[i], this.underlyingDecimals[j]];
        const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
        const _output = await this._swapExpected(i, j, _amount);
        const smallAmountIntBN = (0, utils_js_1._get_small_x)(_amount, _output, inputCoinDecimals, outputCoinDecimals);
        const amountIntBN = (0, utils_js_1.toBN)(_amount, 0);
        if (smallAmountIntBN.gte(amountIntBN))
            return 0;
        const _smallAmount = (0, utils_js_1.fromBN)(smallAmountIntBN.div(10 ** inputCoinDecimals), inputCoinDecimals);
        const _smallOutput = await this._swapExpected(i, j, _smallAmount);
        const priceImpactBN = (0, utils_js_1._get_price_impact)(_amount, _output, _smallAmount, _smallOutput, inputCoinDecimals, outputCoinDecimals);
        return Number((0, utils_js_1._cutZeros)(priceImpactBN.toFixed(4)));
    }
    _swapContractAddress() {
        return (this.isCrypto && this.isMeta) || (this.isMetaFactory && (new PoolTemplate(this.basePool).isLending)) ? this.zap : this.address;
    }
    async swapIsApproved(inputCoin, amount) {
        const contractAddress = this._swapContractAddress();
        const i = this._getCoinIdx(inputCoin);
        return await (0, utils_js_1.hasAllowance)([this.underlyingCoinAddresses[i]], [amount], curve_js_1.curve.signerAddress, contractAddress);
    }
    async swapApproveEstimateGas(inputCoin, amount) {
        const contractAddress = this._swapContractAddress();
        const i = this._getCoinIdx(inputCoin);
        return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.underlyingCoinAddresses[i]], [amount], contractAddress);
    }
    async swapApprove(inputCoin, amount) {
        const contractAddress = this._swapContractAddress();
        const i = this._getCoinIdx(inputCoin);
        return await (0, utils_js_1.ensureAllowance)([this.underlyingCoinAddresses[i]], [amount], contractAddress);
    }
    // OVERRIDE
    async swapEstimateGas(inputCoin, outputCoin, amount) {
        throw Error(`swap method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async swap(inputCoin, outputCoin, amount, slippage = 0.5) {
        throw Error(`swap method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // ---------------- SWAP WRAPPED ----------------
    async _swapWrappedExpected(i, j, _amount) {
        return await curve_js_1.curve.contracts[this.address].contract.get_dy(i, j, _amount, curve_js_1.curve.constantOptions);
    }
    // OVERRIDE
    async swapWrappedExpected(inputCoin, outputCoin, amount) {
        throw Error(`swapWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    async swapWrappedPriceImpact(inputCoin, outputCoin, amount) {
        if (this.isPlain || this.isFake) {
            throw Error(`swapWrappedPriceImpact method doesn't exist for pool ${this.name} (id: ${this.name})`);
        }
        const i = this._getCoinIdx(inputCoin, false);
        const j = this._getCoinIdx(outputCoin, false);
        const [inputCoinDecimals, outputCoinDecimals] = [this.wrappedDecimals[i], this.wrappedDecimals[j]];
        const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
        const _output = await this._swapWrappedExpected(i, j, _amount);
        const smallAmountIntBN = (0, utils_js_1._get_small_x)(_amount, _output, inputCoinDecimals, outputCoinDecimals);
        const amountIntBN = (0, utils_js_1.toBN)(_amount, 0);
        if (smallAmountIntBN.gte(amountIntBN))
            return 0;
        const _smallAmount = (0, utils_js_1.fromBN)(smallAmountIntBN.div(10 ** inputCoinDecimals), inputCoinDecimals);
        const _smallOutput = await this._swapWrappedExpected(i, j, _smallAmount);
        const priceImpactBN = (0, utils_js_1._get_price_impact)(_amount, _output, _smallAmount, _smallOutput, inputCoinDecimals, outputCoinDecimals);
        return Number((0, utils_js_1._cutZeros)(priceImpactBN.toFixed(4)));
    }
    // OVERRIDE
    async swapWrappedIsApproved(inputCoin, amount) {
        throw Error(`swapWrappedIsApproved method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async swapWrappedApproveEstimateGas(inputCoin, amount) {
        throw Error(`swapWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async swapWrappedApprove(inputCoin, amount) {
        throw Error(`swapWrappedApprove method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async swapWrappedEstimateGas(inputCoin, outputCoin, amount) {
        throw Error(`swapWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    // OVERRIDE
    async swapWrapped(inputCoin, outputCoin, amount, slippage = 0.5) {
        throw Error(`swapWrapped method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
}
exports.PoolTemplate = PoolTemplate;
