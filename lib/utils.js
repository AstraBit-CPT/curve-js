"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assetTypeNameHandler = exports.getPoolName = exports.getCountArgsOfMethodByContract = exports.hasRouter = exports.hasDepositAndStake = exports.getCoinsData = exports._get_price_impact = exports._get_small_x = exports._setContracts = exports.getVolume = exports.getTVL = exports.getTxCostsUsd = exports.getGasPriceFromL2 = exports.getGasPriceFromL1 = exports.getUsdRate = exports._getUsdRate = exports._getRewardsFromApi = exports._getCrvApyFromApi = exports._getUsdPricesFromApi = exports.getPoolIdBySwapAddress = exports.ensureAllowance = exports.ensureAllowanceEstimateGas = exports._ensureAllowance = exports.hasAllowance = exports.getAllowance = exports._getAllowance = exports.getBalances = exports._prepareAddresses = exports._getBalances = exports._getCoinDecimals = exports._getCoinAddresses = exports._getCoinAddressesNoCheck = exports.gasSum = exports.getGasFromArray = exports.DIGas = exports.smartNumber = exports.mulBy1_3 = exports.getEthIndex = exports.isEth = exports.fromBN = exports.toStringFromBN = exports.toBN = exports.BN = exports.parseUnits = exports.formatNumber = exports.checkNumber = exports._cutZeros = exports.MAX_ALLOWANCE = exports.ETH_ADDRESS = void 0;
const axios_1 = __importDefault(require("axios"));
const ethers_1 = require("ethers");
const index_js_1 = require("./dependencies/ethcall/index.js");
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const curve_js_1 = require("./curve.js");
const external_api_js_1 = require("./external-api.js");
const ERC20_json_1 = __importDefault(require("./constants/abis/ERC20.json"));
const L2Networks_js_1 = require("./constants/L2Networks.js");
exports.ETH_ADDRESS = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
// export const MAX_ALLOWANCE = curve.parseUnits(new BigNumber(2).pow(256).minus(1).toFixed(), 0);
exports.MAX_ALLOWANCE = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935"); // 2**256 - 1
// Formatting numbers
const _cutZeros = (strn) => {
    return strn.replace(/0+$/gi, '').replace(/\.$/gi, '');
};
exports._cutZeros = _cutZeros;
const checkNumber = (n) => {
    if (Number(n) !== Number(n))
        throw Error(`${n} is not a number`); // NaN
    return n;
};
exports.checkNumber = checkNumber;
const formatNumber = (n, decimals = 18) => {
    if (Number(n) !== Number(n))
        throw Error(`${n} is not a number`); // NaN
    const [integer, fractional] = String(n).split(".");
    return !fractional ? integer : integer + "." + fractional.slice(0, decimals);
};
exports.formatNumber = formatNumber;
const parseUnits = (n, decimals = 18) => {
    return curve_js_1.curve.parseUnits((0, exports.formatNumber)(n, decimals), decimals);
};
exports.parseUnits = parseUnits;
// bignumber.js
const BN = (val) => new bignumber_js_1.default((0, exports.checkNumber)(val));
exports.BN = BN;
const toBN = (n, decimals = 18) => {
    return (0, exports.BN)(curve_js_1.curve.formatUnits(n, decimals));
};
exports.toBN = toBN;
const toStringFromBN = (bn, decimals = 18) => {
    return bn.toFixed(decimals);
};
exports.toStringFromBN = toStringFromBN;
const fromBN = (bn, decimals = 18) => {
    return curve_js_1.curve.parseUnits((0, exports.toStringFromBN)(bn, decimals), decimals);
};
exports.fromBN = fromBN;
// -------------------
const isEth = (address) => address.toLowerCase() === exports.ETH_ADDRESS.toLowerCase();
exports.isEth = isEth;
const getEthIndex = (addresses) => addresses.map((address) => address.toLowerCase()).indexOf(exports.ETH_ADDRESS.toLowerCase());
exports.getEthIndex = getEthIndex;
const mulBy1_3 = (n) => n * curve_js_1.curve.parseUnits("130", 0) / curve_js_1.curve.parseUnits("100", 0);
exports.mulBy1_3 = mulBy1_3;
const smartNumber = (abstractNumber) => {
    if (Array.isArray(abstractNumber)) {
        return [Number(abstractNumber[0]), Number(abstractNumber[1])];
    }
    else {
        return Number(abstractNumber);
    }
};
exports.smartNumber = smartNumber;
const DIGas = (gas) => {
    if (Array.isArray(gas)) {
        return gas[0];
    }
    else {
        return gas;
    }
};
exports.DIGas = DIGas;
const getGasFromArray = (gas) => {
    if (gas[1] === 0) {
        return gas[0];
    }
    else {
        return gas;
    }
};
exports.getGasFromArray = getGasFromArray;
const gasSum = (gas, currentGas) => {
    if (Array.isArray(currentGas)) {
        gas[0] = gas[0] + currentGas[0];
        gas[1] = gas[1] + currentGas[1];
    }
    else {
        gas[0] = gas[0] + currentGas;
    }
    return gas;
};
exports.gasSum = gasSum;
// coins can be either addresses or symbols
const _getCoinAddressesNoCheck = (...coins) => {
    if (coins.length == 1 && Array.isArray(coins[0]))
        coins = coins[0];
    coins = coins;
    return coins.map((c) => c.toLowerCase()).map((c) => curve_js_1.curve.constants.COINS[c] || c);
};
exports._getCoinAddressesNoCheck = _getCoinAddressesNoCheck;
const _getCoinAddresses = (...coins) => {
    const coinAddresses = (0, exports._getCoinAddressesNoCheck)(...coins);
    const availableAddresses = [...Object.keys(curve_js_1.curve.constants.DECIMALS), ...curve_js_1.curve.constants.GAUGES];
    for (const coinAddr of coinAddresses) {
        if (!availableAddresses.includes(coinAddr))
            throw Error(`Coin with address '${coinAddr}' is not available`);
    }
    return coinAddresses;
};
exports._getCoinAddresses = _getCoinAddresses;
const _getCoinDecimals = (...coinAddresses) => {
    if (coinAddresses.length == 1 && Array.isArray(coinAddresses[0]))
        coinAddresses = coinAddresses[0];
    coinAddresses = coinAddresses;
    return coinAddresses.map((coinAddr) => curve_js_1.curve.constants.DECIMALS[coinAddr.toLowerCase()] ?? 18); // 18 for gauges
};
exports._getCoinDecimals = _getCoinDecimals;
const _getBalances = async (coins, addresses) => {
    const coinAddresses = (0, exports._getCoinAddresses)(coins);
    const decimals = (0, exports._getCoinDecimals)(coinAddresses);
    const ethIndex = (0, exports.getEthIndex)(coinAddresses);
    if (ethIndex !== -1) {
        coinAddresses.splice(ethIndex, 1);
    }
    const contractCalls = [];
    for (const coinAddr of coinAddresses) {
        contractCalls.push(...addresses.map((address) => curve_js_1.curve.contracts[coinAddr].multicallContract.balanceOf(address)));
    }
    const _response = await curve_js_1.curve.multicallProvider.all(contractCalls);
    if (ethIndex !== -1) {
        const ethBalances = [];
        for (const address of addresses) {
            ethBalances.push(await curve_js_1.curve.provider.getBalance(address));
        }
        _response.splice(ethIndex * addresses.length, 0, ...ethBalances);
    }
    const _balances = {};
    addresses.forEach((address, i) => {
        _balances[address] = coins.map((_, j) => _response[i + (j * addresses.length)]);
    });
    const balances = {};
    for (const address of addresses) {
        balances[address] = _balances[address].map((b, i) => curve_js_1.curve.formatUnits(b, decimals[i]));
    }
    return balances;
};
exports._getBalances = _getBalances;
const _prepareAddresses = (addresses) => {
    if (addresses.length == 1 && Array.isArray(addresses[0]))
        addresses = addresses[0];
    if (addresses.length === 0 && curve_js_1.curve.signerAddress !== '')
        addresses = [curve_js_1.curve.signerAddress];
    addresses = addresses;
    return addresses.filter((val, idx, arr) => arr.indexOf(val) === idx);
};
exports._prepareAddresses = _prepareAddresses;
const getBalances = async (coins, ...addresses) => {
    addresses = (0, exports._prepareAddresses)(addresses);
    const balances = await (0, exports._getBalances)(coins, addresses);
    return addresses.length === 1 ? balances[addresses[0]] : balances;
};
exports.getBalances = getBalances;
const _getAllowance = async (coins, address, spender) => {
    const _coins = [...coins];
    const ethIndex = (0, exports.getEthIndex)(_coins);
    if (ethIndex !== -1) {
        _coins.splice(ethIndex, 1);
    }
    let allowance;
    if (_coins.length === 1) {
        allowance = [await curve_js_1.curve.contracts[_coins[0]].contract.allowance(address, spender, curve_js_1.curve.constantOptions)];
    }
    else {
        const contractCalls = _coins.map((coinAddr) => curve_js_1.curve.contracts[coinAddr].multicallContract.allowance(address, spender));
        allowance = await curve_js_1.curve.multicallProvider.all(contractCalls);
    }
    if (ethIndex !== -1) {
        allowance.splice(ethIndex, 0, exports.MAX_ALLOWANCE);
    }
    return allowance;
};
exports._getAllowance = _getAllowance;
// coins can be either addresses or symbols
const getAllowance = async (coins, address, spender) => {
    const coinAddresses = (0, exports._getCoinAddresses)(coins);
    const decimals = (0, exports._getCoinDecimals)(coinAddresses);
    const _allowance = await (0, exports._getAllowance)(coinAddresses, address, spender);
    return _allowance.map((a, i) => curve_js_1.curve.formatUnits(a, decimals[i]));
};
exports.getAllowance = getAllowance;
// coins can be either addresses or symbols
const hasAllowance = async (coins, amounts, address, spender) => {
    const coinAddresses = (0, exports._getCoinAddresses)(coins);
    const decimals = (0, exports._getCoinDecimals)(coinAddresses);
    const _allowance = await (0, exports._getAllowance)(coinAddresses, address, spender);
    const _amounts = amounts.map((a, i) => (0, exports.parseUnits)(a, decimals[i]));
    return _allowance.map((a, i) => a >= _amounts[i]).reduce((a, b) => a && b);
};
exports.hasAllowance = hasAllowance;
const _ensureAllowance = async (coins, amounts, spender, isMax = true) => {
    const address = curve_js_1.curve.signerAddress;
    const allowance = await (0, exports._getAllowance)(coins, address, spender);
    const txHashes = [];
    for (let i = 0; i < allowance.length; i++) {
        if (allowance[i] < amounts[i]) {
            const contract = curve_js_1.curve.contracts[coins[i]].contract;
            const _approveAmount = isMax ? exports.MAX_ALLOWANCE : amounts[i];
            await curve_js_1.curve.updateFeeData();
            if (allowance[i] > curve_js_1.curve.parseUnits("0")) {
                const gasLimit = (0, exports.mulBy1_3)((0, exports.DIGas)(await contract.approve.estimateGas(spender, curve_js_1.curve.parseUnits("0"), curve_js_1.curve.constantOptions)));
                txHashes.push((await contract.approve(spender, curve_js_1.curve.parseUnits("0"), { ...curve_js_1.curve.options, gasLimit })).hash);
            }
            const gasLimit = (0, exports.mulBy1_3)((0, exports.DIGas)(await contract.approve.estimateGas(spender, _approveAmount, curve_js_1.curve.constantOptions)));
            txHashes.push((await contract.approve(spender, _approveAmount, { ...curve_js_1.curve.options, gasLimit })).hash);
        }
    }
    return txHashes;
};
exports._ensureAllowance = _ensureAllowance;
// coins can be either addresses or symbols
const ensureAllowanceEstimateGas = async (coins, amounts, spender, isMax = true) => {
    const coinAddresses = (0, exports._getCoinAddresses)(coins);
    const decimals = (0, exports._getCoinDecimals)(coinAddresses);
    const _amounts = amounts.map((a, i) => (0, exports.parseUnits)(a, decimals[i]));
    const address = curve_js_1.curve.signerAddress;
    const allowance = await (0, exports._getAllowance)(coinAddresses, address, spender);
    let gas = [0, 0];
    for (let i = 0; i < allowance.length; i++) {
        if (allowance[i] < _amounts[i]) {
            const contract = curve_js_1.curve.contracts[coinAddresses[i]].contract;
            const _approveAmount = isMax ? exports.MAX_ALLOWANCE : _amounts[i];
            if (allowance[i] > curve_js_1.curve.parseUnits("0")) {
                const currentGas = (0, exports.smartNumber)(await contract.approve.estimateGas(spender, curve_js_1.curve.parseUnits("0"), curve_js_1.curve.constantOptions));
                gas = (0, exports.gasSum)(gas, currentGas);
            }
            const currentGas = (0, exports.smartNumber)(await contract.approve.estimateGas(spender, _approveAmount, curve_js_1.curve.constantOptions));
            gas = (0, exports.gasSum)(gas, currentGas);
        }
    }
    return (0, exports.getGasFromArray)(gas);
};
exports.ensureAllowanceEstimateGas = ensureAllowanceEstimateGas;
// coins can be either addresses or symbols
const ensureAllowance = async (coins, amounts, spender, isMax = true) => {
    const coinAddresses = (0, exports._getCoinAddresses)(coins);
    const decimals = (0, exports._getCoinDecimals)(coinAddresses);
    const _amounts = amounts.map((a, i) => (0, exports.parseUnits)(a, decimals[i]));
    return await (0, exports._ensureAllowance)(coinAddresses, _amounts, spender, isMax);
};
exports.ensureAllowance = ensureAllowance;
const getPoolIdBySwapAddress = (swapAddress) => {
    const poolsData = curve_js_1.curve.getPoolsData();
    return Object.entries(poolsData).filter(([_, poolData]) => poolData.swap_address.toLowerCase() === swapAddress.toLowerCase())[0][0];
};
exports.getPoolIdBySwapAddress = getPoolIdBySwapAddress;
const _getTokenAddressBySwapAddress = (swapAddress) => {
    const poolsData = curve_js_1.curve.getPoolsData();
    const res = Object.entries(poolsData).filter(([_, poolData]) => poolData.swap_address.toLowerCase() === swapAddress.toLowerCase());
    if (res.length === 0)
        return "";
    return res[0][1].token_address;
};
const _getUsdPricesFromApi = async () => {
    const network = curve_js_1.curve.constants.NETWORK_NAME;
    const allTypesExtendedPoolData = await (0, external_api_js_1._getAllPoolsFromApi)(network);
    const priceDict = {};
    const priceDictByMaxTvl = {};
    for (const extendedPoolData of allTypesExtendedPoolData) {
        for (const pool of extendedPoolData.poolData) {
            const lpTokenAddress = pool.lpTokenAddress ?? pool.address;
            const totalSupply = pool.totalSupply / (10 ** 18);
            if (lpTokenAddress.toLowerCase() in priceDict) {
                priceDict[lpTokenAddress.toLowerCase()].push({
                    price: pool.usdTotal && totalSupply ? pool.usdTotal / totalSupply : 0,
                    tvl: pool.usdTotal,
                });
            }
            else {
                priceDict[lpTokenAddress.toLowerCase()] = [];
                priceDict[lpTokenAddress.toLowerCase()].push({
                    price: pool.usdTotal && totalSupply ? pool.usdTotal / totalSupply : 0,
                    tvl: pool.usdTotal,
                });
            }
            for (const coin of pool.coins) {
                if (typeof coin.usdPrice === "number") {
                    if (coin.address.toLowerCase() in priceDict) {
                        priceDict[coin.address.toLowerCase()].push({
                            price: coin.usdPrice,
                            tvl: pool.usdTotal,
                        });
                    }
                    else {
                        priceDict[coin.address.toLowerCase()] = [];
                        priceDict[coin.address.toLowerCase()].push({
                            price: coin.usdPrice,
                            tvl: pool.usdTotal,
                        });
                    }
                }
            }
            for (const coin of pool.gaugeRewards ?? []) {
                if (typeof coin.tokenPrice === "number") {
                    if (coin.tokenAddress.toLowerCase() in priceDict) {
                        priceDict[coin.tokenAddress.toLowerCase()].push({
                            price: coin.tokenPrice,
                            tvl: pool.usdTotal,
                        });
                    }
                    else {
                        priceDict[coin.tokenAddress.toLowerCase()] = [];
                        priceDict[coin.tokenAddress.toLowerCase()].push({
                            price: coin.tokenPrice,
                            tvl: pool.usdTotal,
                        });
                    }
                }
            }
        }
    }
    for (const address in priceDict) {
        if (priceDict[address].length > 0) {
            const maxTvlItem = priceDict[address].reduce((prev, current) => {
                if (+current.tvl > +prev.tvl) {
                    return current;
                }
                else {
                    return prev;
                }
            });
            priceDictByMaxTvl[address] = maxTvlItem.price;
        }
        else {
            priceDictByMaxTvl[address] = 0;
        }
    }
    return priceDictByMaxTvl;
};
exports._getUsdPricesFromApi = _getUsdPricesFromApi;
const _getCrvApyFromApi = async () => {
    const network = curve_js_1.curve.constants.NETWORK_NAME;
    const allTypesExtendedPoolData = await (0, external_api_js_1._getAllPoolsFromApi)(network);
    const apyDict = {};
    for (const extendedPoolData of allTypesExtendedPoolData) {
        for (const pool of extendedPoolData.poolData) {
            if (pool.gaugeAddress) {
                if (!pool.gaugeCrvApy) {
                    apyDict[pool.gaugeAddress.toLowerCase()] = [0, 0];
                }
                else {
                    apyDict[pool.gaugeAddress.toLowerCase()] = [pool.gaugeCrvApy[0] ?? 0, pool.gaugeCrvApy[1] ?? 0];
                }
            }
        }
    }
    return apyDict;
};
exports._getCrvApyFromApi = _getCrvApyFromApi;
const _getRewardsFromApi = async () => {
    const network = curve_js_1.curve.constants.NETWORK_NAME;
    const allTypesExtendedPoolData = await (0, external_api_js_1._getAllPoolsFromApi)(network);
    const rewardsDict = {};
    for (const extendedPoolData of allTypesExtendedPoolData) {
        for (const pool of extendedPoolData.poolData) {
            if (pool.gaugeAddress) {
                rewardsDict[pool.gaugeAddress.toLowerCase()] = (pool.gaugeRewards ?? [])
                    .filter((r) => curve_js_1.curve.chainId === 1 || r.tokenAddress.toLowerCase() !== curve_js_1.curve.constants.COINS.crv);
            }
        }
    }
    return rewardsDict;
};
exports._getRewardsFromApi = _getRewardsFromApi;
const _usdRatesCache = {};
const _getUsdRate = async (assetId) => {
    if (curve_js_1.curve.chainId === 1 && assetId.toLowerCase() === '0x8762db106b2c2a0bccb3a80d1ed41273552616e8')
        return 0; // RSR
    const pricesFromApi = await (0, exports._getUsdPricesFromApi)();
    if (assetId.toLowerCase() in pricesFromApi)
        return pricesFromApi[assetId.toLowerCase()];
    if (assetId === 'USD' || (curve_js_1.curve.chainId === 137 && (assetId.toLowerCase() === curve_js_1.curve.constants.COINS.am3crv.toLowerCase())))
        return 1;
    let chainName = {
        1: 'ethereum',
        10: 'optimistic-ethereum',
        56: "binance-smart-chain",
        100: 'xdai',
        137: 'polygon-pos',
        250: 'fantom',
        324: 'zksync',
        1284: 'moonbeam',
        2222: 'kava',
        8453: 'base',
        42220: 'celo',
        43114: 'avalanche',
        42161: 'arbitrum-one',
        1313161554: 'aurora',
    }[curve_js_1.curve.chainId];
    const nativeTokenName = {
        1: 'ethereum',
        10: 'ethereum',
        56: 'bnb',
        100: 'xdai',
        137: 'matic-network',
        250: 'fantom',
        324: 'ethereum',
        1284: 'moonbeam',
        2222: 'kava',
        8453: 'ethereum',
        42220: 'celo',
        43114: 'avalanche-2',
        42161: 'ethereum',
        1313161554: 'ethereum',
    }[curve_js_1.curve.chainId];
    if (chainName === undefined) {
        throw Error('curve object is not initialized');
    }
    assetId = {
        'CRV': 'curve-dao-token',
        'EUR': 'stasis-eurs',
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'LINK': 'link',
    }[assetId.toUpperCase()] || assetId;
    assetId = (0, exports.isEth)(assetId) ? nativeTokenName : assetId.toLowerCase();
    // No EURT on Coingecko Polygon
    if (curve_js_1.curve.chainId === 137 && assetId.toLowerCase() === curve_js_1.curve.constants.COINS.eurt) {
        chainName = 'ethereum';
        assetId = '0xC581b735A1688071A1746c968e0798D642EDE491'.toLowerCase(); // EURT Ethereum
    }
    // CRV
    if (assetId.toLowerCase() === curve_js_1.curve.constants.ALIASES.crv) {
        assetId = 'curve-dao-token';
    }
    if ((_usdRatesCache[assetId]?.time || 0) + 600000 < Date.now()) {
        const url = [nativeTokenName, 'ethereum', 'bitcoin', 'link', 'curve-dao-token', 'stasis-eurs'].includes(assetId.toLowerCase()) ?
            `https://api.coingecko.com/api/v3/simple/price?ids=${assetId}&vs_currencies=usd` :
            `https://api.coingecko.com/api/v3/simple/token_price/${chainName}?contract_addresses=${assetId}&vs_currencies=usd`;
        const response = await axios_1.default.get(url);
        try {
            _usdRatesCache[assetId] = { 'rate': response.data[assetId]['usd'] ?? 0, 'time': Date.now() };
        }
        catch (err) { // TODO pay attention!
            _usdRatesCache[assetId] = { 'rate': 0, 'time': Date.now() };
        }
    }
    return _usdRatesCache[assetId]['rate'];
};
exports._getUsdRate = _getUsdRate;
const getUsdRate = async (coin) => {
    const [coinAddress] = (0, exports._getCoinAddressesNoCheck)(coin);
    return await (0, exports._getUsdRate)(coinAddress);
};
exports.getUsdRate = getUsdRate;
const getGasPriceFromL1 = async () => {
    if (L2Networks_js_1.L2Networks.includes(curve_js_1.curve.chainId)) {
        const gasPrice = await curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gas_oracle].contract.l1BaseFee();
        return Number(gasPrice) + 1e9; // + 1 gwei
    }
    else {
        throw Error("This method exists only for L2 networks");
    }
};
exports.getGasPriceFromL1 = getGasPriceFromL1;
const getGasPriceFromL2 = async () => {
    if (L2Networks_js_1.L2Networks.includes(curve_js_1.curve.chainId)) {
        const gasPrice = await curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gas_oracle].contract.gasPrice();
        return Number(gasPrice);
    }
    else {
        throw Error("This method exists only for L2 networks");
    }
};
exports.getGasPriceFromL2 = getGasPriceFromL2;
const getTxCostsUsd = (ethUsdRate, gasPrice, gas, gasPriceL1 = 0) => {
    if (Array.isArray(gas)) {
        return ethUsdRate * ((gas[0] * gasPrice / 1e18) + (gas[1] * gasPriceL1 / 1e18));
    }
    else {
        return ethUsdRate * gas * gasPrice / 1e18;
    }
};
exports.getTxCostsUsd = getTxCostsUsd;
const _getNetworkName = (network = curve_js_1.curve.chainId) => {
    if (typeof network === "number" && curve_js_1.NETWORK_CONSTANTS[network]) {
        return curve_js_1.NETWORK_CONSTANTS[network].NAME;
    }
    else if (typeof network === "string" && Object.values(curve_js_1.NETWORK_CONSTANTS).map((n) => n.NAME).includes(network)) {
        return network;
    }
    else {
        throw Error(`Wrong network name or id: ${network}`);
    }
};
const _getChainId = (network = curve_js_1.curve.chainId) => {
    if (typeof network === "number" && curve_js_1.NETWORK_CONSTANTS[network]) {
        return network;
    }
    else if (typeof network === "string" && Object.values(curve_js_1.NETWORK_CONSTANTS).map((n) => n.NAME).includes(network)) {
        const idx = Object.values(curve_js_1.NETWORK_CONSTANTS).map((n) => n.NAME).indexOf(network);
        return Number(Object.keys(curve_js_1.NETWORK_CONSTANTS)[idx]);
    }
    else {
        throw Error(`Wrong network name or id: ${network}`);
    }
};
const getTVL = async (network = curve_js_1.curve.chainId) => {
    network = _getNetworkName(network);
    const allTypesExtendedPoolData = await (0, external_api_js_1._getAllPoolsFromApi)(network);
    return allTypesExtendedPoolData.reduce((sum, data) => sum + (data.tvl ?? data.tvlAll ?? 0), 0);
};
exports.getTVL = getTVL;
const getVolume = async (network = curve_js_1.curve.chainId) => {
    network = _getNetworkName(network);
    if (["zksync", "moonbeam", "kava", "base", "celo", "aurora", "bsc"].includes(network)) {
        const chainId = _getChainId(network);
        if (curve_js_1.curve.chainId !== chainId)
            throw Error("To get volume for ZkSync, Moonbeam, Kava, Base, Celo, Aurora or Bsc connect to the network first");
        const [mainPoolsData, factoryPoolsData] = await Promise.all([
            (0, external_api_js_1._getLegacyAPYsAndVolumes)(network),
            (0, external_api_js_1._getFactoryAPYsAndVolumes)(network),
        ]);
        let volume = 0;
        for (const id in mainPoolsData) {
            volume += mainPoolsData[id].volume ?? 0;
        }
        for (const pool of factoryPoolsData) {
            const lpToken = _getTokenAddressBySwapAddress(pool.poolAddress);
            const lpPrice = lpToken ? await (0, exports._getUsdRate)(lpToken) : 0;
            volume += pool.volume * lpPrice;
        }
        return { totalVolume: volume, cryptoVolume: 0, cryptoShare: 0 };
    }
    const { totalVolume, cryptoVolume, cryptoShare } = await (0, external_api_js_1._getSubgraphData)(network);
    return { totalVolume, cryptoVolume, cryptoShare };
};
exports.getVolume = getVolume;
const _setContracts = (address, abi) => {
    curve_js_1.curve.contracts[address] = {
        contract: new ethers_1.Contract(address, abi, curve_js_1.curve.signer || curve_js_1.curve.provider),
        multicallContract: new index_js_1.Contract(address, abi),
    };
};
exports._setContracts = _setContracts;
// Find k for which x * k = target_x or y * k = target_y
// k = max(target_x / x, target_y / y)
// small_x = x * k
const _get_small_x = (_x, _y, x_decimals, y_decimals) => {
    const target_x = (0, exports.BN)(10 ** (x_decimals > 5 ? x_decimals - 3 : x_decimals));
    const target_y = (0, exports.BN)(10 ** (y_decimals > 5 ? y_decimals - 3 : y_decimals));
    const x_int_BN = (0, exports.toBN)(_x, 0);
    const y_int_BN = (0, exports.toBN)(_y, 0);
    const k = bignumber_js_1.default.max(target_x.div(x_int_BN), target_y.div(y_int_BN));
    return bignumber_js_1.default.min(x_int_BN.times(k), (0, exports.BN)(10 ** x_decimals));
};
exports._get_small_x = _get_small_x;
const _get_price_impact = (_x, _y, _small_x, _small_y, x_decimals, y_decimals) => {
    const x_BN = (0, exports.toBN)(_x, x_decimals);
    const y_BN = (0, exports.toBN)(_y, y_decimals);
    const small_x_BN = (0, exports.toBN)(_small_x, x_decimals);
    const small_y_BN = (0, exports.toBN)(_small_y, y_decimals);
    const rateBN = y_BN.div(x_BN);
    const smallRateBN = small_y_BN.div(small_x_BN);
    if (rateBN.gt(smallRateBN))
        return (0, exports.BN)(0);
    return (0, exports.BN)(1).minus(rateBN.div(smallRateBN)).times(100);
};
exports._get_price_impact = _get_price_impact;
const getCoinsData = async (...coins) => {
    if (coins.length == 1 && Array.isArray(coins[0]))
        coins = coins[0];
    coins = coins;
    const coinAddresses = (0, exports._getCoinAddressesNoCheck)(coins);
    console.log(coinAddresses);
    const ethIndex = (0, exports.getEthIndex)(coinAddresses);
    if (ethIndex !== -1) {
        coinAddresses.splice(ethIndex, 1);
    }
    const contractCalls = [];
    for (const coinAddr of coinAddresses) {
        const coinContract = new index_js_1.Contract(coinAddr, ERC20_json_1.default);
        contractCalls.push(coinContract.name(), coinContract.symbol(), coinContract.decimals());
    }
    const _response = await curve_js_1.curve.multicallProvider.all(contractCalls);
    if (ethIndex !== -1) {
        _response.splice(ethIndex * 2, 0, ...['Ethereum', 'ETH', 18]);
    }
    const res = [];
    coins.forEach((address, i) => {
        res.push({
            name: _response.shift(),
            symbol: _response.shift(),
            decimals: Number(curve_js_1.curve.formatUnits(_response.shift(), 0)),
        });
    });
    return res;
};
exports.getCoinsData = getCoinsData;
const hasDepositAndStake = () => curve_js_1.curve.constants.ALIASES.deposit_and_stake !== curve_js_1.curve.constants.ZERO_ADDRESS;
exports.hasDepositAndStake = hasDepositAndStake;
const hasRouter = () => curve_js_1.curve.constants.ALIASES.router !== curve_js_1.curve.constants.ZERO_ADDRESS;
exports.hasRouter = hasRouter;
const getCountArgsOfMethodByContract = (contract, methodName) => {
    const func = contract.interface.fragments.find((item) => item.name === methodName);
    if (func) {
        return func.inputs.length;
    }
    else {
        return -1;
    }
};
exports.getCountArgsOfMethodByContract = getCountArgsOfMethodByContract;
const getPoolName = (name) => {
    const separatedName = name.split(": ");
    if (separatedName.length > 1) {
        return separatedName[1].trim();
    }
    else {
        return separatedName[0].trim();
    }
};
exports.getPoolName = getPoolName;
const assetTypeNameHandler = (assetTypeName) => {
    if (assetTypeName.toUpperCase() === 'UNKNOWN') {
        return 'OTHER';
    }
    else {
        return assetTypeName.toUpperCase();
    }
};
exports.assetTypeNameHandler = assetTypeNameHandler;
