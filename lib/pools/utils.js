"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._getAmplificationCoefficientsFromApi = exports.getUserPoolList = exports.getUserClaimable = exports.getUserPoolListByClaimable = exports.getUserLiquidityUSD = exports.getUserPoolListByLiquidity = void 0;
const poolConstructor_js_1 = require("./poolConstructor.js");
const curve_js_1 = require("../curve.js");
const utils_js_1 = require("../utils.js");
const external_api_js_1 = require("../external-api.js");
const ERC20_json_1 = __importDefault(require("../constants/abis/ERC20.json"));
// _userLpBalance: { address: { poolId: { _lpBalance: 0, time: 0 } } }
const _userLpBalanceCache = {};
const _isUserLpBalanceCacheExpired = (address, poolId) => (_userLpBalanceCache[address]?.[poolId]?.time || 0) + 600000 < Date.now();
const _getUserLpBalances = async (pools, address, useCache) => {
    const poolsToFetch = useCache ? pools.filter((poolId) => _isUserLpBalanceCacheExpired(address, poolId)) : pools;
    if (poolsToFetch.length > 0) {
        const calls = [];
        for (const poolId of poolsToFetch) {
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            calls.push(curve_js_1.curve.contracts[pool.lpToken].multicallContract.balanceOf(address));
            if (pool.gauge !== curve_js_1.curve.constants.ZERO_ADDRESS)
                calls.push(curve_js_1.curve.contracts[pool.gauge].multicallContract.balanceOf(address));
        }
        const _rawBalances = await curve_js_1.curve.multicallProvider.all(calls);
        for (const poolId of poolsToFetch) {
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            let _balance = _rawBalances.shift();
            if (pool.gauge !== curve_js_1.curve.constants.ZERO_ADDRESS)
                _balance = _balance + _rawBalances.shift();
            if (!_userLpBalanceCache[address])
                _userLpBalanceCache[address] = {};
            _userLpBalanceCache[address][poolId] = { '_lpBalance': _balance, 'time': Date.now() };
        }
    }
    const _lpBalances = [];
    for (const poolId of pools) {
        _lpBalances.push(_userLpBalanceCache[address]?.[poolId]._lpBalance);
    }
    return _lpBalances;
};
const getUserPoolListByLiquidity = async (address = curve_js_1.curve.signerAddress) => {
    const pools = curve_js_1.curve.getPoolList();
    const _lpBalances = await _getUserLpBalances(pools, address, false);
    const userPoolList = [];
    for (let i = 0; i < pools.length; i++) {
        if (_lpBalances[i] > 0) {
            userPoolList.push(pools[i]);
        }
    }
    return userPoolList;
};
exports.getUserPoolListByLiquidity = getUserPoolListByLiquidity;
const getUserLiquidityUSD = async (pools, address = curve_js_1.curve.signerAddress) => {
    const _lpBalances = await _getUserLpBalances(pools, address, true);
    const userLiquidityUSD = [];
    for (let i = 0; i < pools.length; i++) {
        const pool = (0, poolConstructor_js_1.getPool)(pools[i]);
        const price = await (0, utils_js_1._getUsdRate)(pool.lpToken);
        userLiquidityUSD.push((0, utils_js_1.toBN)(_lpBalances[i]).times(price).toFixed(8));
    }
    return userLiquidityUSD;
};
exports.getUserLiquidityUSD = getUserLiquidityUSD;
// _userClaimable: { address: { poolId: { rewards: [ { token: '0x111...', 'symbol': 'TST', '', 'amount': 0 } ], time: 0 } }
const _userClaimableCache = {};
const _isUserClaimableCacheExpired = (address, poolId) => (_userClaimableCache[address]?.[poolId]?.time || 0) + 600000 < Date.now();
const _getUserClaimable = async (pools, address, useCache) => {
    const poolsToFetch = useCache ? pools.filter((poolId) => _isUserClaimableCacheExpired(address, poolId)) : pools;
    if (poolsToFetch.length > 0) {
        // --- 1. CRV ---
        const hasCrvReward = [];
        for (const poolId of poolsToFetch) {
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (curve_js_1.curve.chainId === 324 || curve_js_1.curve.chainId === 2222 || pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) { // TODO remove this for ZkSync and Kava
                hasCrvReward.push(false);
                continue;
            }
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            hasCrvReward.push('inflation_rate()' in gaugeContract || 'inflation_rate(uint256)' in gaugeContract);
        }
        // --- 2. The number of reward tokens ---
        const rewardCount = [];
        for (const poolId of poolsToFetch) {
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) {
                rewardCount.push(0);
                continue;
            }
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            if ("reward_tokens(uint256)" in gaugeContract) { // gauge_v2, gauge_v3, gauge_v4, gauge_v5, gauge_factory, gauge_rewards_only, gauge_child
                rewardCount.push(8);
            }
            else if ('claimable_reward(address)' in gaugeContract) { // gauge_synthetix
                rewardCount.push(-1);
            }
            else { // gauge
                rewardCount.push(0);
            }
        }
        // --- 3. Reward tokens ---
        const rewardTokenCalls = [];
        for (let i = 0; i < poolsToFetch.length; i++) {
            const pool = (0, poolConstructor_js_1.getPool)(poolsToFetch[i]);
            if (rewardCount[i] !== -1) { // no_gauge, gauge, gauge_v2, gauge_v3, gauge_v4, gauge_v5, gauge_factory, gauge_rewards_only, gauge_child
                for (let count = 0; count < rewardCount[i]; count++) {
                    const gaugeContract = curve_js_1.curve.contracts[pool.gauge].multicallContract;
                    rewardTokenCalls.push(gaugeContract.reward_tokens(count));
                }
            }
            else { // gauge_synthetix
                rewardCount[i] = 1;
                const rewardContract = curve_js_1.curve.contracts[pool.sRewardContract].contract;
                const rewardMulticallContract = curve_js_1.curve.contracts[pool.sRewardContract].multicallContract;
                const method = "snx()" in rewardContract ? "snx" : "rewardsToken"; // susd, tbtc : dusd, musd, rsv, sbtc
                rewardTokenCalls.push(rewardMulticallContract[method]());
            }
        }
        const rawRewardTokens = (await curve_js_1.curve.multicallProvider.all(rewardTokenCalls)).map((t) => t.toLowerCase());
        const rewardTokens = {};
        for (let i = 0; i < poolsToFetch.length; i++) {
            rewardTokens[poolsToFetch[i]] = [];
            for (let j = 0; j < rewardCount[i]; j++) {
                const rewardAddress = rawRewardTokens.shift();
                if (rewardAddress === curve_js_1.curve.constants.ZERO_ADDRESS)
                    continue;
                if (curve_js_1.curve.chainId !== 1 && rewardAddress === curve_js_1.curve.constants.COINS.crv)
                    continue;
                // REYIELD shitcoin which breaks things, because symbol() throws an error
                if (rewardAddress === "0xf228ec3476318aCB4E719D2b290bb2ef8B34DFfA".toLowerCase())
                    continue;
                rewardTokens[poolsToFetch[i]].push(rewardAddress);
            }
        }
        // --- 4. Reward info ---
        const rewardInfoCalls = [];
        for (let i = 0; i < poolsToFetch.length; i++) {
            const poolId = poolsToFetch[i];
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                continue;
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            const gaugeMulticallContract = curve_js_1.curve.contracts[pool.gauge].multicallContract;
            if (hasCrvReward[i]) {
                rewardInfoCalls.push(gaugeMulticallContract.claimable_tokens(address));
            }
            for (const token of rewardTokens[poolId]) {
                (0, utils_js_1._setContracts)(token, ERC20_json_1.default);
                const tokenMulticallContract = curve_js_1.curve.contracts[token].multicallContract;
                rewardInfoCalls.push(tokenMulticallContract.symbol(), tokenMulticallContract.decimals());
                if ('claimable_reward(address,address)' in gaugeContract) {
                    rewardInfoCalls.push(gaugeMulticallContract.claimable_reward(address, token));
                }
                else if ('claimable_reward(address)' in gaugeContract) { // Synthetix Gauge
                    rewardInfoCalls.push(gaugeMulticallContract.claimable_reward(address), gaugeMulticallContract.claimed_rewards_for(address));
                }
            }
        }
        const rawRewardInfo = await curve_js_1.curve.multicallProvider.all(rewardInfoCalls);
        for (let i = 0; i < poolsToFetch.length; i++) {
            const poolId = poolsToFetch[i];
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (!_userClaimableCache[address])
                _userClaimableCache[address] = {};
            _userClaimableCache[address][poolId] = { rewards: [], time: Date.now() };
            if (pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                continue;
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            if (hasCrvReward[i]) {
                const token = curve_js_1.curve.constants.ALIASES.crv;
                const symbol = 'CRV';
                const decimals = 18;
                const _amount = rawRewardInfo.shift();
                const amount = curve_js_1.curve.formatUnits(_amount, decimals);
                if (Number(amount) > 0)
                    _userClaimableCache[address][poolId].rewards.push({ token, symbol, amount });
            }
            for (const token of rewardTokens[poolId]) {
                const symbol = rawRewardInfo.shift();
                const decimals = rawRewardInfo.shift();
                let _amount = rawRewardInfo.shift();
                if ('claimable_reward(address)' in gaugeContract) {
                    const _claimedAmount = rawRewardInfo.shift();
                    _amount = _amount - _claimedAmount;
                }
                const amount = curve_js_1.curve.formatUnits(_amount, decimals);
                if (Number(amount) > 0)
                    _userClaimableCache[address][poolId].rewards.push({ token, symbol, amount });
            }
        }
    }
    const _claimable = [];
    for (const poolId of pools) {
        _claimable.push(_userClaimableCache[address]?.[poolId].rewards);
    }
    return _claimable;
};
const _getUserClaimableUseApi = async (pools, address, useCache) => {
    const poolsToFetch = useCache ? pools.filter((poolId) => _isUserClaimableCacheExpired(address, poolId)) : pools;
    if (poolsToFetch.length > 0) {
        // --- 1. CRV ---
        const hasCrvReward = [];
        for (const poolId of poolsToFetch) {
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (curve_js_1.curve.chainId === 324 || curve_js_1.curve.chainId === 2222 || pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS) { // TODO remove this for ZkSync and Kava
                hasCrvReward.push(false);
                continue;
            }
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            hasCrvReward.push('inflation_rate()' in gaugeContract || 'inflation_rate(uint256)' in gaugeContract);
        }
        // --- 2. Reward tokens ---
        const rewardTokens = {};
        for (let i = 0; i < poolsToFetch.length; i++) {
            const pool = (0, poolConstructor_js_1.getPool)(poolsToFetch[i]);
            const rewards = await (0, utils_js_1._getRewardsFromApi)();
            rewardTokens[poolsToFetch[i]] = (rewards[pool.gauge] ?? [])
                .map((r) => ({ token: r.tokenAddress, symbol: r.symbol, decimals: Number(r.decimals) }));
        }
        // --- 3. Reward info ---
        const rewardInfoCalls = [];
        for (let i = 0; i < poolsToFetch.length; i++) {
            const poolId = poolsToFetch[i];
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                continue;
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            const gaugeMulticallContract = curve_js_1.curve.contracts[pool.gauge].multicallContract;
            if (hasCrvReward[i]) {
                rewardInfoCalls.push(gaugeMulticallContract.claimable_tokens(address));
            }
            for (const r of rewardTokens[poolId]) {
                (0, utils_js_1._setContracts)(r.token, ERC20_json_1.default);
                if ('claimable_reward(address,address)' in gaugeContract) {
                    rewardInfoCalls.push(gaugeMulticallContract.claimable_reward(address, r.token));
                }
                else if ('claimable_reward(address)' in gaugeContract) { // Synthetix Gauge
                    rewardInfoCalls.push(gaugeMulticallContract.claimable_reward(address), gaugeMulticallContract.claimed_rewards_for(address));
                }
            }
        }
        const rawRewardInfo = await curve_js_1.curve.multicallProvider.all(rewardInfoCalls);
        for (let i = 0; i < poolsToFetch.length; i++) {
            const poolId = poolsToFetch[i];
            const pool = (0, poolConstructor_js_1.getPool)(poolId);
            if (!_userClaimableCache[address])
                _userClaimableCache[address] = {};
            _userClaimableCache[address][poolId] = { rewards: [], time: Date.now() };
            if (pool.gauge === curve_js_1.curve.constants.ZERO_ADDRESS)
                continue;
            const gaugeContract = curve_js_1.curve.contracts[pool.gauge].contract;
            if (hasCrvReward[i]) {
                const token = curve_js_1.curve.constants.ALIASES.crv;
                const symbol = 'CRV';
                const decimals = 18;
                const _amount = rawRewardInfo.shift();
                const amount = curve_js_1.curve.formatUnits(_amount, decimals);
                if (Number(amount) > 0)
                    _userClaimableCache[address][poolId].rewards.push({ token, symbol, amount });
            }
            for (const r of rewardTokens[poolId]) {
                let _amount = rawRewardInfo.shift();
                if ('claimable_reward(address)' in gaugeContract) {
                    const _claimedAmount = rawRewardInfo.shift();
                    _amount = _amount - _claimedAmount;
                }
                const amount = curve_js_1.curve.formatUnits(_amount, r.decimals);
                if (Number(amount) > 0)
                    _userClaimableCache[address][poolId].rewards.push({ token: r.token, symbol: r.symbol, amount });
            }
        }
    }
    const _claimable = [];
    for (const poolId of pools) {
        _claimable.push(_userClaimableCache[address]?.[poolId].rewards);
    }
    return _claimable;
};
const getUserPoolListByClaimable = async (address = curve_js_1.curve.signerAddress) => {
    const pools = curve_js_1.curve.getPoolList();
    const _claimable = await _getUserClaimable(pools, address, false);
    const userPoolList = [];
    for (let i = 0; i < pools.length; i++) {
        if (_claimable[i].length > 0) {
            userPoolList.push(pools[i]);
        }
    }
    return userPoolList;
};
exports.getUserPoolListByClaimable = getUserPoolListByClaimable;
const getUserClaimable = async (pools, address = curve_js_1.curve.signerAddress) => {
    const _claimable = await _getUserClaimable(pools, address, true);
    const claimableWithPrice = [];
    for (let i = 0; i < pools.length; i++) {
        claimableWithPrice.push([]);
        for (const c of _claimable[i]) {
            const price = await (0, utils_js_1._getUsdRate)(c.token);
            claimableWithPrice[claimableWithPrice.length - 1].push({ ...c, price });
        }
    }
    return claimableWithPrice;
};
exports.getUserClaimable = getUserClaimable;
const getUserPoolList = async (address = curve_js_1.curve.signerAddress, useApi = true) => {
    const pools = curve_js_1.curve.getPoolList();
    const [_lpBalances, _claimable] = await Promise.all([
        _getUserLpBalances(pools, address, false),
        useApi ? _getUserClaimableUseApi(pools, address, false) : _getUserClaimable(pools, address, false),
    ]);
    const userPoolList = [];
    for (let i = 0; i < pools.length; i++) {
        if (_lpBalances[i] > 0 || _claimable[i].length > 0) {
            userPoolList.push(pools[i]);
        }
    }
    return userPoolList;
};
exports.getUserPoolList = getUserPoolList;
const _getAmplificationCoefficientsFromApi = async () => {
    const network = curve_js_1.curve.constants.NETWORK_NAME;
    const allTypesExtendedPoolData = await (0, external_api_js_1._getAllPoolsFromApi)(network);
    const amplificationCoefficientDict = {};
    for (const extendedPoolData of allTypesExtendedPoolData) {
        for (const pool of extendedPoolData.poolData) {
            amplificationCoefficientDict[pool.address.toLowerCase()] = Number(pool.amplificationCoefficient);
        }
    }
    return amplificationCoefficientDict;
};
exports._getAmplificationCoefficientsFromApi = _getAmplificationCoefficientsFromApi;
