"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSwappedAmount = exports.swap = exports.swapEstimateGas = exports.swapApprove = exports.swapApproveEstimateGas = exports.swapIsApproved = exports.swapPriceImpact = exports.swapRequired = exports.swapExpected = exports.getArgs = exports.getBestRouteAndOutput = void 0;
const axios_1 = __importDefault(require("axios"));
const memoizee_1 = __importDefault(require("memoizee"));
const ethers_1 = require("ethers");
const curve_js_1 = require("./curve.js");
const utils_js_1 = require("./utils.js");
const index_js_1 = require("./pools/index.js");
const utils_js_2 = require("./pools/utils.js");
const L2Networks_js_1 = require("./constants/L2Networks.js");
const MAX_STEPS = 5;
const ROUTE_LENGTH = (MAX_STEPS * 2) + 1;
const GRAPH_MAX_EDGES = 3;
const MAX_ROUTES_FOR_ONE_COIN = 5;
const _removeDuplications = (routes) => {
    return routes.filter((r, i, _routes) => {
        const routesByPoolIds = _routes.map((r) => r.route.map((s) => s.poolId).toString());
        return routesByPoolIds.indexOf(r.route.map((s) => s.poolId).toString()) === i;
    });
};
const _sortByTvl = (a, b) => b.minTvl - a.minTvl || b.totalTvl - a.totalTvl || a.route.length - b.route.length;
const _sortByLength = (a, b) => a.route.length - b.route.length || b.minTvl - a.minTvl || b.totalTvl - a.totalTvl;
const _getTVL = (0, memoizee_1.default)(async (poolId) => Number(await ((0, index_js_1.getPool)(poolId)).stats.totalLiquidity()), {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
// 4 --> 6, 5 --> 7 not allowed
// 4 --> 7, 5 --> 6 allowed
const _handleSwapType = (swapType) => {
    if (swapType === 6)
        return "4";
    if (swapType === 7)
        return "5";
    return swapType.toString();
};
const SNX = {
    1: {
        swap: "0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F".toLowerCase(),
        coins: [
            "0x57Ab1ec28D129707052df4dF418D58a2D46d5f51",
            "0xD71eCFF9342A5Ced620049e616c5035F1dB98620",
            "0x5e74C9036fb86BD7eCdcb084a0673EFc32eA31cb",
            "0xfE18be6b3Bd88A2D2A7f928d00292E7a9963CfC6", // sBTC
        ].map((a) => a.toLowerCase()),
    },
    10: {
        swap: "0x8700dAec35aF8Ff88c16BdF0418774CB3D7599B4".toLowerCase(),
        coins: [
            "0x8c6f28f2f1a3c87f0f938b96d27520d9751ec8d9",
            "0xFBc4198702E81aE77c06D58f81b629BDf36f0a71",
            "0xe405de8f52ba7559f9df3c368500b6e6ae6cee49",
            "0x298b9b95708152ff6968aafd889c6586e9169f1d", // sBTC
        ].map((a) => a.toLowerCase()),
    },
};
const _buildRouteGraph = (0, memoizee_1.default)(async () => {
    const routerGraph = {};
    // ETH <-> WETH (exclude Celo)
    if (curve_js_1.curve.chainId !== 42220) {
        routerGraph[curve_js_1.curve.constants.NATIVE_TOKEN.address] = {};
        routerGraph[curve_js_1.curve.constants.NATIVE_TOKEN.address][curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress] = [{
                poolId: "WETH wrapper",
                swapAddress: curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress,
                inputCoinAddress: curve_js_1.curve.constants.NATIVE_TOKEN.address,
                outputCoinAddress: curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
        routerGraph[curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress] = {};
        routerGraph[curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress][curve_js_1.curve.constants.NATIVE_TOKEN.address] = [{
                poolId: "WETH wrapper",
                swapAddress: curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress,
                inputCoinAddress: curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress,
                outputCoinAddress: curve_js_1.curve.constants.NATIVE_TOKEN.address,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
    }
    // ETH -> stETH, ETH -> frxETH, ETH -> wBETH (Ethereum only)
    if (curve_js_1.curve.chainId == 1) {
        for (const outCoin of ["stETH", "frxETH", "wBETH"]) {
            routerGraph[curve_js_1.curve.constants.NATIVE_TOKEN.address][curve_js_1.curve.constants.COINS[outCoin.toLowerCase()]] = [{
                    poolId: outCoin + " minter",
                    swapAddress: outCoin === "frxETH" ? "0xbAFA44EFE7901E04E39Dad13167D089C559c1138".toLowerCase() : curve_js_1.curve.constants.COINS[outCoin.toLowerCase()],
                    inputCoinAddress: curve_js_1.curve.constants.NATIVE_TOKEN.address,
                    outputCoinAddress: curve_js_1.curve.constants.COINS[outCoin.toLowerCase()],
                    swapParams: [0, 0, 8, 0, 0],
                    poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                    basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                    baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                    secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                    secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                    tvl: Infinity,
                }];
        }
    }
    // stETH <-> wstETH (Ethereum only)
    if (curve_js_1.curve.chainId === 1) {
        routerGraph[curve_js_1.curve.constants.COINS.steth] = {};
        routerGraph[curve_js_1.curve.constants.COINS.steth][curve_js_1.curve.constants.COINS.wsteth] = [{
                poolId: "wstETH wrapper",
                swapAddress: curve_js_1.curve.constants.COINS.wsteth,
                inputCoinAddress: curve_js_1.curve.constants.COINS.steth,
                outputCoinAddress: curve_js_1.curve.constants.COINS.wsteth,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
        routerGraph[curve_js_1.curve.constants.COINS.wsteth] = {};
        routerGraph[curve_js_1.curve.constants.COINS.wsteth][curve_js_1.curve.constants.COINS.steth] = [{
                poolId: "wstETH wrapper",
                swapAddress: curve_js_1.curve.constants.COINS.wsteth,
                inputCoinAddress: curve_js_1.curve.constants.COINS.wsteth,
                outputCoinAddress: curve_js_1.curve.constants.COINS.steth,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
    }
    // frxETH <-> sfrxETH (Ethereum only)
    if (curve_js_1.curve.chainId === 1) {
        routerGraph[curve_js_1.curve.constants.COINS.frxeth] = {};
        routerGraph[curve_js_1.curve.constants.COINS.frxeth][curve_js_1.curve.constants.COINS.sfrxeth] = [{
                poolId: "sfrxETH wrapper",
                swapAddress: curve_js_1.curve.constants.COINS.sfrxeth,
                inputCoinAddress: curve_js_1.curve.constants.COINS.frxeth,
                outputCoinAddress: curve_js_1.curve.constants.COINS.sfrxeth,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
        routerGraph[curve_js_1.curve.constants.COINS.sfrxeth] = {};
        routerGraph[curve_js_1.curve.constants.COINS.sfrxeth][curve_js_1.curve.constants.COINS.frxeth] = [{
                poolId: "sfrxETH wrapper",
                swapAddress: curve_js_1.curve.constants.COINS.sfrxeth,
                inputCoinAddress: curve_js_1.curve.constants.COINS.sfrxeth,
                outputCoinAddress: curve_js_1.curve.constants.COINS.frxeth,
                swapParams: [0, 0, 8, 0, 0],
                poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                tvl: Infinity,
            }];
    }
    // SNX swaps
    if (curve_js_1.curve.chainId in SNX) {
        // @ts-ignore
        for (const inCoin of SNX[curve_js_1.curve.chainId].coins) {
            // @ts-ignore
            for (const outCoin of SNX[curve_js_1.curve.chainId].coins) {
                if (inCoin === outCoin)
                    continue;
                if (!routerGraph[inCoin])
                    routerGraph[inCoin] = {};
                routerGraph[inCoin][outCoin] = [{
                        poolId: "SNX exchanger",
                        // @ts-ignore
                        swapAddress: SNX[curve_js_1.curve.chainId].swap,
                        inputCoinAddress: inCoin,
                        outputCoinAddress: outCoin,
                        swapParams: [0, 0, 9, 0, 0],
                        poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                        basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        tvl: Infinity,
                    }];
            }
        }
    }
    const ALL_POOLS = Object.entries(curve_js_1.curve.getPoolsData()).filter(([id, _]) => id !== "crveth");
    const amplificationCoefficientDict = await (0, utils_js_2._getAmplificationCoefficientsFromApi)();
    for (const [poolId, poolData] of ALL_POOLS) {
        const wrappedCoinAddresses = poolData.wrapped_coin_addresses.map((a) => a.toLowerCase());
        const underlyingCoinAddresses = poolData.underlying_coin_addresses.map((a) => a.toLowerCase());
        const poolAddress = poolData.swap_address.toLowerCase();
        const tokenAddress = poolData.token_address.toLowerCase();
        const isAaveLikeLending = poolData.is_lending && wrappedCoinAddresses.length === 3 && !poolData.deposit_address;
        const poolType = poolData.is_llamma ? 4 : poolData.is_crypto ? Math.min(poolData.wrapped_coins.length, 3) : 1;
        const tvlMultiplier = poolData.is_crypto ? 1 : (amplificationCoefficientDict[poolData.swap_address] ?? 1);
        const basePool = poolData.is_meta ? { ...curve_js_1.curve.constants.POOLS_DATA, ...curve_js_1.curve.constants.FACTORY_POOLS_DATA }[poolData.base_pool] : null;
        const basePoolAddress = basePool ? basePool.swap_address.toLowerCase() : curve_js_1.curve.constants.ZERO_ADDRESS;
        let baseTokenAddress = basePool ? basePool.token_address.toLowerCase() : curve_js_1.curve.constants.ZERO_ADDRESS;
        const secondBasePool = basePool && basePool.base_pool ? {
            ...curve_js_1.curve.constants.POOLS_DATA,
            ...curve_js_1.curve.constants.FACTORY_POOLS_DATA,
            ...curve_js_1.curve.constants.CRVUSD_FACTORY_POOLS_DATA,
        }[basePool.base_pool] : null;
        const secondBasePoolAddress = secondBasePool ? secondBasePool.swap_address.toLowerCase() : curve_js_1.curve.constants.ZERO_ADDRESS;
        // for double meta underlying (crv/tricrypto, wmatic/tricrypto)
        if (basePool && secondBasePoolAddress !== curve_js_1.curve.constants.ZERO_ADDRESS)
            baseTokenAddress = basePool.deposit_address?.toLowerCase();
        const secondBaseTokenAddress = secondBasePool ? secondBasePool.token_address.toLowerCase() : curve_js_1.curve.constants.ZERO_ADDRESS;
        const metaCoinAddresses = basePool ? basePool.underlying_coin_addresses.map((a) => a.toLowerCase()) : [];
        let swapAddress = poolData.is_fake ? poolData.deposit_address?.toLowerCase() : poolAddress;
        const tvl = (await _getTVL(poolId)) * tvlMultiplier;
        // Skip empty pools
        if (curve_js_1.curve.chainId === 1 && tvl < 1000)
            continue;
        if (curve_js_1.curve.chainId !== 1 && tvl < 100)
            continue;
        const excludedUnderlyingSwaps = (poolId === 'aave' && curve_js_1.curve.chainId === 1) || (poolId === 'geist' && curve_js_1.curve.chainId === 250);
        // Wrapped coin <-> LP "swaps" (actually add_liquidity/remove_liquidity_one_coin)
        if (!poolData.is_fake && !poolData.is_llamma && wrappedCoinAddresses.length < 6) {
            const coins = [tokenAddress, ...wrappedCoinAddresses];
            for (let k = 0; k < coins.length; k++) {
                for (let l = 0; l < coins.length; l++) {
                    if (k > 0 && l > 0)
                        continue;
                    if (k == 0 && l == 0)
                        continue;
                    const i = Math.max(k - 1, 0);
                    const j = Math.max(l - 1, 0);
                    const swapType = k == 0 ? 6 : 4;
                    if (!routerGraph[coins[k]])
                        routerGraph[coins[k]] = {};
                    if (!routerGraph[coins[k]][coins[l]])
                        routerGraph[coins[k]][coins[l]] = [];
                    routerGraph[coins[k]][coins[l]].push({
                        poolId,
                        swapAddress,
                        inputCoinAddress: coins[k],
                        outputCoinAddress: coins[l],
                        swapParams: [i, j, swapType, poolType, wrappedCoinAddresses.length],
                        poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                        basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        tvl,
                    });
                }
            }
        }
        // Underlying coin <-> LP "swaps" (actually add_liquidity/remove_liquidity_one_coin)
        if ((poolData.is_fake || isAaveLikeLending) && underlyingCoinAddresses.length < 6 && !excludedUnderlyingSwaps) {
            const coins = [tokenAddress, ...underlyingCoinAddresses];
            for (let k = 0; k < coins.length; k++) {
                for (let l = 0; l < coins.length; l++) {
                    if (k > 0 && l > 0)
                        continue;
                    if (k == 0 && l == 0)
                        continue;
                    const i = Math.max(k - 1, 0);
                    const j = Math.max(l - 1, 0);
                    let swapType = isAaveLikeLending ? 7 : 6;
                    if (k > 0)
                        swapType = isAaveLikeLending ? 5 : 4;
                    if (!routerGraph[coins[k]])
                        routerGraph[coins[k]] = {};
                    if (!routerGraph[coins[k]][coins[l]])
                        routerGraph[coins[k]][coins[l]] = [];
                    routerGraph[coins[k]][coins[l]].push({
                        poolId,
                        swapAddress,
                        inputCoinAddress: coins[k],
                        outputCoinAddress: coins[l],
                        swapParams: [i, j, swapType, poolType, underlyingCoinAddresses.length],
                        poolAddress: curve_js_1.curve.constants.ZERO_ADDRESS,
                        basePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        baseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBasePool: curve_js_1.curve.constants.ZERO_ADDRESS,
                        secondBaseToken: curve_js_1.curve.constants.ZERO_ADDRESS,
                        tvl,
                    });
                }
            }
        }
        // Wrapped swaps
        if (!poolData.is_fake) {
            for (let i = 0; i < wrappedCoinAddresses.length; i++) {
                for (let j = 0; j < wrappedCoinAddresses.length; j++) {
                    if (i == j)
                        continue;
                    if (!routerGraph[wrappedCoinAddresses[i]])
                        routerGraph[wrappedCoinAddresses[i]] = {};
                    if (!routerGraph[wrappedCoinAddresses[i]][wrappedCoinAddresses[j]])
                        routerGraph[wrappedCoinAddresses[i]][wrappedCoinAddresses[j]] = [];
                    routerGraph[wrappedCoinAddresses[i]][wrappedCoinAddresses[j]] = routerGraph[wrappedCoinAddresses[i]][wrappedCoinAddresses[j]].concat({
                        poolId,
                        swapAddress,
                        inputCoinAddress: wrappedCoinAddresses[i],
                        outputCoinAddress: wrappedCoinAddresses[j],
                        swapParams: [i, j, 1, poolType, wrappedCoinAddresses.length],
                        poolAddress,
                        basePool: basePoolAddress,
                        baseToken: baseTokenAddress,
                        secondBasePool: secondBasePoolAddress,
                        secondBaseToken: secondBaseTokenAddress,
                        tvl,
                    }).sort((a, b) => b.tvl - a.tvl).slice(0, GRAPH_MAX_EDGES);
                }
            }
        }
        // Only for underlying swaps
        swapAddress = (poolData.is_crypto && poolData.is_meta) || (basePool?.is_lending && poolData.is_factory) ?
            poolData.deposit_address : poolData.swap_address;
        // Underlying swaps
        if (!poolData.is_plain && !excludedUnderlyingSwaps) {
            for (let i = 0; i < underlyingCoinAddresses.length; i++) {
                for (let j = 0; j < underlyingCoinAddresses.length; j++) {
                    if (i === j)
                        continue;
                    // Don't swap metacoins since they can be swapped directly in base pool
                    if (metaCoinAddresses.includes(underlyingCoinAddresses[i]) && metaCoinAddresses.includes(underlyingCoinAddresses[j]))
                        continue;
                    const hasEth = underlyingCoinAddresses.includes(curve_js_1.curve.constants.NATIVE_TOKEN.address);
                    const swapType = (poolData.is_crypto && poolData.is_meta && poolData.is_factory) || (basePool?.is_lending && poolData.is_factory) ? 3
                        : hasEth && poolId !== 'avaxcrypto' ? 1 : 2;
                    if (!routerGraph[underlyingCoinAddresses[i]])
                        routerGraph[underlyingCoinAddresses[i]] = {};
                    if (!routerGraph[underlyingCoinAddresses[i]][underlyingCoinAddresses[j]])
                        routerGraph[underlyingCoinAddresses[i]][underlyingCoinAddresses[j]] = [];
                    routerGraph[underlyingCoinAddresses[i]][underlyingCoinAddresses[j]] = routerGraph[underlyingCoinAddresses[i]][underlyingCoinAddresses[j]].concat({
                        poolId,
                        swapAddress,
                        inputCoinAddress: underlyingCoinAddresses[i],
                        outputCoinAddress: underlyingCoinAddresses[j],
                        swapParams: [i, j, swapType, poolType, underlyingCoinAddresses.length],
                        poolAddress,
                        basePool: basePoolAddress,
                        baseToken: baseTokenAddress,
                        secondBasePool: secondBasePoolAddress,
                        secondBaseToken: secondBaseTokenAddress,
                        tvl,
                    }).sort((a, b) => b.tvl - a.tvl).slice(0, GRAPH_MAX_EDGES);
                }
            }
        }
    }
    return routerGraph;
}, {
    promise: true,
    maxAge: 5 * 1000, // 5m
});
const _isVisitedCoin = (coinAddress, route) => {
    return route.route.map((r) => r.inputCoinAddress).includes(coinAddress);
};
const _isVisitedPool = (poolId, route) => {
    return route.route.map((r) => r.poolId).includes(poolId);
};
// Breadth-first search
const _findRoutes = async (inputCoinAddress, outputCoinAddress) => {
    inputCoinAddress = inputCoinAddress.toLowerCase();
    outputCoinAddress = outputCoinAddress.toLowerCase();
    const routes = [{ route: [], minTvl: Infinity, totalTvl: 0 }];
    let targetRoutes = [];
    const routerGraph = await _buildRouteGraph();
    const ALL_POOLS = curve_js_1.curve.getPoolsData();
    while (routes.length > 0) {
        // @ts-ignore
        const route = routes.pop();
        const inCoin = route.route.length > 0 ? route.route[route.route.length - 1].outputCoinAddress : inputCoinAddress;
        if (inCoin === outputCoinAddress) {
            targetRoutes.push(route);
        }
        else if (route.route.length < 5) {
            for (const outCoin in routerGraph[inCoin]) {
                if (_isVisitedCoin(outCoin, route))
                    continue;
                for (const step of routerGraph[inCoin][outCoin]) {
                    const poolData = ALL_POOLS[step.poolId];
                    if (!poolData?.is_lending && _isVisitedPool(step.poolId, route))
                        continue;
                    // 4 --> 6, 5 --> 7 not allowed
                    // 4 --> 7, 5 --> 6 allowed
                    const routePoolIdsPlusSwapType = route.route.map((s) => s.poolId + "+" + _handleSwapType(s.swapParams[2]));
                    if (routePoolIdsPlusSwapType.includes(step.poolId + "+" + _handleSwapType(step.swapParams[2])))
                        continue;
                    const poolCoins = poolData ? poolData.wrapped_coin_addresses.concat(poolData.underlying_coin_addresses) : [];
                    // Exclude such cases as:
                    // cvxeth -> tricrypto2 -> tusd -> susd (cvxeth -> tricrypto2 -> tusd instead)
                    if (!poolData?.is_lending && poolCoins.includes(outputCoinAddress) && outCoin !== outputCoinAddress)
                        continue;
                    // Exclude such cases as:
                    // aave -> aave -> 3pool (aave -> aave instead)
                    if (poolData?.is_lending && poolCoins.includes(outputCoinAddress) && outCoin !== outputCoinAddress && outCoin !== poolData.token_address)
                        continue;
                    routes.push({
                        route: [...route.route, step],
                        minTvl: Math.min(step.tvl, route.minTvl),
                        totalTvl: route.totalTvl + step.tvl,
                    });
                }
            }
        }
    }
    targetRoutes = _removeDuplications([
        ...targetRoutes.sort(_sortByTvl).slice(0, MAX_ROUTES_FOR_ONE_COIN),
        ...targetRoutes.sort(_sortByLength).slice(0, MAX_ROUTES_FOR_ONE_COIN),
    ]);
    return targetRoutes.map((r) => r.route);
};
const _getRouteKey = (route, inputCoinAddress, outputCoinAddress) => {
    const sortedCoins = [inputCoinAddress, outputCoinAddress].sort();
    let key = `${sortedCoins[0]}-->`;
    for (const routeStep of route) {
        key += `${routeStep.poolId}-->`;
    }
    key += sortedCoins[1];
    return key;
};
const _getExchangeArgs = (route) => {
    let _route = [];
    if (route.length > 0)
        _route.push(route[0].inputCoinAddress);
    let _swapParams = [];
    let _pools = [];
    let _basePools = [];
    let _baseTokens = [];
    let _secondBasePools = [];
    let _secondBaseTokens = [];
    for (const routeStep of route) {
        _route.push(routeStep.swapAddress, routeStep.outputCoinAddress);
        _swapParams.push(routeStep.swapParams);
        _pools.push(routeStep.poolAddress);
        _basePools.push(routeStep.basePool);
        _baseTokens.push(routeStep.baseToken);
        _secondBasePools.push(routeStep.secondBasePool);
        _secondBaseTokens.push(routeStep.secondBaseToken);
    }
    _route = _route.concat(Array(ROUTE_LENGTH - _route.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    _swapParams = _swapParams.concat(Array(MAX_STEPS - _swapParams.length).fill([0, 0, 0, 0, 0]));
    _pools = _pools.concat(Array(MAX_STEPS - _pools.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    _basePools = _basePools.concat(Array(MAX_STEPS - _basePools.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    _baseTokens = _baseTokens.concat(Array(MAX_STEPS - _baseTokens.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    _secondBasePools = _secondBasePools.concat(Array(MAX_STEPS - _secondBasePools.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    _secondBaseTokens = _secondBaseTokens.concat(Array(MAX_STEPS - _secondBaseTokens.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    return { _route, _swapParams, _pools, _basePools, _baseTokens, _secondBasePools, _secondBaseTokens };
};
const _estimatedGasForDifferentRoutesCache = {};
const _estimateGasForDifferentRoutes = async (routes, inputCoinAddress, outputCoinAddress, _amount) => {
    inputCoinAddress = inputCoinAddress.toLowerCase();
    outputCoinAddress = outputCoinAddress.toLowerCase();
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
    const gasPromises = [];
    const value = (0, utils_js_1.isEth)(inputCoinAddress) ? _amount : curve_js_1.curve.parseUnits("0");
    for (const route of routes) {
        const routeKey = _getRouteKey(route, inputCoinAddress, outputCoinAddress);
        let gasPromise;
        const { _route, _swapParams, _pools } = _getExchangeArgs(route);
        if ((_estimatedGasForDifferentRoutesCache[routeKey]?.time || 0) + 3600000 < Date.now()) {
            gasPromise = contract.exchange.estimateGas(_route, _swapParams, _amount, 0, _pools, { ...curve_js_1.curve.constantOptions, value });
        }
        else {
            gasPromise = Promise.resolve(_estimatedGasForDifferentRoutesCache[routeKey].gas);
        }
        gasPromises.push(gasPromise);
    }
    try {
        const _gasAmounts = await Promise.all(gasPromises);
        routes.forEach((route, i) => {
            const routeKey = _getRouteKey(route, inputCoinAddress, outputCoinAddress);
            _estimatedGasForDifferentRoutesCache[routeKey] = { 'gas': _gasAmounts[i], 'time': Date.now() };
        });
        return _gasAmounts.map((_g) => (0, utils_js_1.smartNumber)(_g));
    }
    catch (err) { // No allowance
        return routes.map(() => 0);
    }
};
const _getBestRoute = (0, memoizee_1.default)(async (inputCoinAddress, outputCoinAddress, amount) => {
    const [inputCoinDecimals, outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
    if (_amount === curve_js_1.curve.parseUnits("0"))
        return [];
    const routesRaw = (await _findRoutes(inputCoinAddress, outputCoinAddress)).map((route) => ({ route, _output: curve_js_1.curve.parseUnits("0"), outputUsd: 0, txCostUsd: 0 }));
    const routes = [];
    try {
        const calls = [];
        const multicallContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].multicallContract;
        for (const r of routesRaw) {
            const { _route, _swapParams, _pools } = _getExchangeArgs(r.route);
            calls.push(multicallContract.get_dy(_route, _swapParams, _amount, _pools));
        }
        const _outputAmounts = await curve_js_1.curve.multicallProvider.all(calls);
        for (let i = 0; i < _outputAmounts.length; i++) {
            routesRaw[i]._output = _outputAmounts[i];
            routes.push(routesRaw[i]);
        }
    }
    catch (err) {
        // const promises = [];
        // const contract = curve.contracts[curve.constants.ALIASES.router].contract;
        // for (const r of routesRaw) {
        //     const { _route, _swapParams, _pools } = _getExchangeArgs(r.route);
        //     promises.push(contract.get_dy(_route, _swapParams, _amount, _pools, curve.constantOptions));
        // }
        //
        // const res = await Promise.allSettled(promises);
        //
        // for (let i = 0; i < res.length; i++) {
        //     if (res[i].status === 'rejected') {
        //         console.log(`Route ${(routesRaw[i].route.map((s) => s.poolId)).join(" --> ")} is unavailable`);
        //         continue;
        //     }
        //     routesRaw[i]._output = (res[i] as PromiseFulfilledResult<bigint>).value;
        //     routes.push(routesRaw[i]);
        // }
        const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
        const _outputs = [];
        for (const r of routesRaw) {
            const { _route, _swapParams, _pools } = _getExchangeArgs(r.route);
            try {
                _outputs.push(await contract.get_dy(_route, _swapParams, _amount, _pools, curve_js_1.curve.constantOptions));
            }
            catch (e) {
                _outputs.push(curve_js_1.curve.parseUnits('-1', 0));
            }
        }
        for (let i = 0; i < _outputs.length; i++) {
            if (_outputs[i] < 0) {
                console.log(`Route ${(routesRaw[i].route.map((s) => s.poolId)).join(" --> ")} is unavailable`);
                continue;
            }
            routesRaw[i]._output = _outputs[i];
            routes.push(routesRaw[i]);
        }
    }
    if (routes.length === 0)
        return [];
    if (routes.length === 1)
        return routes[0].route;
    const [gasAmounts, outputCoinUsdRate, gasData, ethUsdRate] = await Promise.all([
        _estimateGasForDifferentRoutes(routes.map((r) => r.route), inputCoinAddress, outputCoinAddress, _amount),
        (0, utils_js_1._getUsdRate)(outputCoinAddress),
        axios_1.default.get("https://api.curve.fi/api/getGas"),
        (0, utils_js_1._getUsdRate)(utils_js_1.ETH_ADDRESS),
    ]);
    const gasPrice = gasData.data.data.gas.standard;
    const expectedAmounts = (routes).map((route) => Number(curve_js_1.curve.formatUnits(route._output, outputCoinDecimals)));
    const expectedAmountsUsd = expectedAmounts.map((a) => a * outputCoinUsdRate);
    const L1GasPrice = L2Networks_js_1.L2Networks.includes(curve_js_1.curve.chainId) ? await (0, utils_js_1.getGasPriceFromL1)() : 0;
    const txCostsUsd = gasAmounts.map((a) => (0, utils_js_1.getTxCostsUsd)(ethUsdRate, gasPrice, a, L1GasPrice));
    routes.forEach((route, i) => {
        route.outputUsd = expectedAmountsUsd[i];
        route.txCostUsd = txCostsUsd[i];
    });
    return routes.reduce((route1, route2) => {
        const diff = (route1.outputUsd - route1.txCostUsd) - (route2.outputUsd - route2.txCostUsd);
        if (diff > 0)
            return route1;
        if (diff === 0 && route1.route.length < route2.route.length)
            return route1;
        return route2;
    }).route;
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
const _getOutputForRoute = (0, memoizee_1.default)(async (route, _amount) => {
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
    const { _route, _swapParams, _pools } = _getExchangeArgs(route);
    return await contract.get_dy(_route, _swapParams, _amount, _pools, curve_js_1.curve.constantOptions);
}, {
    promise: true,
    maxAge: 15 * 1000, // 15s
});
const getBestRouteAndOutput = async (inputCoin, outputCoin, amount) => {
    const [inputCoinAddress, outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(inputCoin, outputCoin);
    const [inputCoinDecimals, outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    const route = await _getBestRoute(inputCoinAddress, outputCoinAddress, amount); // 5 minutes cache
    if (route.length === 0)
        return { route, output: '0.0' };
    const _output = await _getOutputForRoute(route, (0, utils_js_1.parseUnits)(amount, inputCoinDecimals)); // 15 seconds cache, so we call it to get fresh output estimation
    return { route, output: curve_js_1.curve.formatUnits(_output + BigInt(1), outputCoinDecimals) };
};
exports.getBestRouteAndOutput = getBestRouteAndOutput;
const getArgs = (route) => {
    return _getExchangeArgs(route);
};
exports.getArgs = getArgs;
const swapExpected = async (inputCoin, outputCoin, amount) => {
    return (await (0, exports.getBestRouteAndOutput)(inputCoin, outputCoin, amount))['output'];
};
exports.swapExpected = swapExpected;
const swapRequired = async (inputCoin, outputCoin, outAmount) => {
    const [inputCoinAddress, outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(inputCoin, outputCoin);
    const [inputCoinDecimals, outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    const _outAmount = (0, utils_js_1.parseUnits)(outAmount, outputCoinDecimals);
    const p1 = (await (0, utils_js_1._getUsdRate)(inputCoinAddress)) || 1;
    const p2 = (await (0, utils_js_1._getUsdRate)(outputCoinAddress)) || 1;
    const approximateRequiredAmount = Number(outAmount) * p2 / p1;
    const route = await _getBestRoute(inputCoinAddress, outputCoinAddress, approximateRequiredAmount);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
    const { _route, _swapParams, _pools, _basePools, _baseTokens, _secondBasePools, _secondBaseTokens } = _getExchangeArgs(route);
    let _required = 0;
    if ("get_dx(address[11],uint256[5][5],uint256,address[5],address[5],address[5],address[5],address[5])" in contract) {
        _required = await contract.get_dx(_route, _swapParams, _outAmount, _pools, _basePools, _baseTokens, _secondBasePools, _secondBaseTokens, curve_js_1.curve.constantOptions);
    }
    else {
        _required = await contract.get_dx(_route, _swapParams, _outAmount, _pools, _basePools, _baseTokens, curve_js_1.curve.constantOptions);
    }
    return curve_js_1.curve.formatUnits(_required, inputCoinDecimals);
};
exports.swapRequired = swapRequired;
const swapPriceImpact = async (inputCoin, outputCoin, amount) => {
    const [inputCoinAddress, outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(inputCoin, outputCoin);
    const [inputCoinDecimals, outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    const { route, output } = await (0, exports.getBestRouteAndOutput)(inputCoinAddress, outputCoinAddress, amount);
    const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
    const _output = (0, utils_js_1.parseUnits)(output, outputCoinDecimals);
    const smallAmountIntBN = (0, utils_js_1._get_small_x)(_amount, _output, inputCoinDecimals, outputCoinDecimals);
    const amountIntBN = (0, utils_js_1.toBN)(_amount, 0);
    if (smallAmountIntBN.gte(amountIntBN))
        return 0;
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
    let _smallAmount = (0, utils_js_1.fromBN)(smallAmountIntBN.div(10 ** inputCoinDecimals), inputCoinDecimals);
    const { _route, _swapParams, _pools } = _getExchangeArgs(route);
    let _smallOutput;
    try {
        _smallOutput = await contract.get_dy(_route, _swapParams, _smallAmount, _pools, curve_js_1.curve.constantOptions);
    }
    catch (e) {
        _smallAmount = curve_js_1.curve.parseUnits("1", inputCoinDecimals); // Dirty hack
        _smallOutput = await contract.get_dy(_route, _swapParams, _smallAmount, _pools, curve_js_1.curve.constantOptions);
    }
    const priceImpactBN = (0, utils_js_1._get_price_impact)(_amount, _output, _smallAmount, _smallOutput, inputCoinDecimals, outputCoinDecimals);
    return Number((0, utils_js_1._cutZeros)(priceImpactBN.toFixed(4)));
};
exports.swapPriceImpact = swapPriceImpact;
const swapIsApproved = async (inputCoin, amount) => {
    return await (0, utils_js_1.hasAllowance)([inputCoin], [amount], curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.router);
};
exports.swapIsApproved = swapIsApproved;
const swapApproveEstimateGas = async (inputCoin, amount) => {
    return await (0, utils_js_1.ensureAllowanceEstimateGas)([inputCoin], [amount], curve_js_1.curve.constants.ALIASES.router);
};
exports.swapApproveEstimateGas = swapApproveEstimateGas;
const swapApprove = async (inputCoin, amount) => {
    return await (0, utils_js_1.ensureAllowance)([inputCoin], [amount], curve_js_1.curve.constants.ALIASES.router);
};
exports.swapApprove = swapApprove;
const swapEstimateGas = async (inputCoin, outputCoin, amount) => {
    const [inputCoinAddress, outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(inputCoin, outputCoin);
    const [inputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    const { route } = await (0, exports.getBestRouteAndOutput)(inputCoinAddress, outputCoinAddress, amount);
    if (route.length === 0)
        return 0;
    const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
    const [gas] = await _estimateGasForDifferentRoutes([route], inputCoinAddress, outputCoinAddress, _amount);
    return gas;
};
exports.swapEstimateGas = swapEstimateGas;
const swap = async (inputCoin, outputCoin, amount, slippage = 0.5) => {
    const [inputCoinAddress, outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(inputCoin, outputCoin);
    const [inputCoinDecimals, outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(inputCoinAddress, outputCoinAddress);
    await (0, exports.swapApprove)(inputCoin, amount);
    const { route, output } = await (0, exports.getBestRouteAndOutput)(inputCoinAddress, outputCoinAddress, amount);
    if (route.length === 0) {
        throw new Error("This pair can't be exchanged");
    }
    const { _route, _swapParams, _pools } = _getExchangeArgs(route);
    const _amount = (0, utils_js_1.parseUnits)(amount, inputCoinDecimals);
    const minRecvAmountBN = (0, utils_js_1.BN)(output).times(100 - slippage).div(100);
    const _minRecvAmount = (0, utils_js_1.fromBN)(minRecvAmountBN, outputCoinDecimals);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.router].contract;
    const value = (0, utils_js_1.isEth)(inputCoinAddress) ? _amount : curve_js_1.curve.parseUnits("0");
    await curve_js_1.curve.updateFeeData();
    const gasLimit = ((0, utils_js_1.DIGas)(await contract.exchange.estimateGas(_route, _swapParams, _amount, _minRecvAmount, _pools, { ...curve_js_1.curve.constantOptions, value }))) * (curve_js_1.curve.chainId === 1 ? curve_js_1.curve.parseUnits("130", 0) : curve_js_1.curve.parseUnits("160", 0)) / curve_js_1.curve.parseUnits("100", 0);
    return await contract.exchange(_route, _swapParams, _amount, _minRecvAmount, _pools, { ...curve_js_1.curve.options, value, gasLimit });
};
exports.swap = swap;
const getSwappedAmount = async (tx, outputCoin) => {
    const [outputCoinAddress] = (0, utils_js_1._getCoinAddresses)(outputCoin);
    const [outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(outputCoinAddress);
    const txInfo = await tx.wait();
    if (txInfo === null)
        return '0.0';
    let res;
    for (let i = 1; i <= txInfo.logs.length; i++) {
        try {
            const abiCoder = ethers_1.ethers.AbiCoder.defaultAbiCoder();
            res = abiCoder.decode([`address[${ROUTE_LENGTH}]`, `uint256[${MAX_STEPS}][${MAX_STEPS}]`, `address[${MAX_STEPS}]`, 'uint256', 'uint256'], ethers_1.ethers.dataSlice(txInfo.logs[txInfo.logs.length - i].data, 0));
            break;
        }
        catch (err) { }
    }
    if (res === undefined)
        return '0.0';
    return curve_js_1.curve.formatUnits(res[res.length - 1], outputCoinDecimals);
};
exports.getSwappedAmount = getSwappedAmount;
