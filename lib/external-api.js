"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports._generateBoostingProof = exports._getHiddenPools = exports._getAllGauges = exports._getFactoryAPYsAndVolumes = exports._getLegacyAPYsAndVolumes = exports._getSubgraphData = exports._getAllPoolsFromApi = exports._getPoolsFromApi = void 0;
const axios_1 = __importDefault(require("axios"));
const memoizee_1 = __importDefault(require("memoizee"));
exports._getPoolsFromApi = (0, memoizee_1.default)(async (network, poolType) => {
    const url = `https://api.curve.fi/api/getPools/${network}/${poolType}`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return response.data.data ?? { poolData: [], tvl: 0, tvlAll: 0 };
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
const _getAllPoolsFromApi = async (network) => {
    return await Promise.all([
        (0, exports._getPoolsFromApi)(network, "main"),
        (0, exports._getPoolsFromApi)(network, "crypto"),
        (0, exports._getPoolsFromApi)(network, "factory"),
        (0, exports._getPoolsFromApi)(network, "factory-crvusd"),
        (0, exports._getPoolsFromApi)(network, "factory-eywa"),
        (0, exports._getPoolsFromApi)(network, "factory-crypto"),
        (0, exports._getPoolsFromApi)(network, "factory-tricrypto"),
        (0, exports._getPoolsFromApi)(network, "factory-stable-ng"),
    ]);
};
exports._getAllPoolsFromApi = _getAllPoolsFromApi;
exports._getSubgraphData = (0, memoizee_1.default)(async (network) => {
    const url = `https://api.curve.fi/api/getSubgraphData/${network}`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return {
        poolsData: response.data.data.poolList ?? [],
        totalVolume: response.data.data.totalVolume ?? 0,
        cryptoVolume: response.data.data.cryptoVolume ?? 0,
        cryptoShare: response.data.data.cryptoShare ?? 0,
    };
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
// Moonbeam and Aurora only
exports._getLegacyAPYsAndVolumes = (0, memoizee_1.default)(async (network) => {
    if (["kava", "celo", "zksync", "base", "bsc"].includes(network))
        return {}; // Exclude Kava, Celo, ZkSync, Base and Bsc
    const url = "https://api.curve.fi/api/getMainPoolsAPYs/" + network;
    const data = (await axios_1.default.get(url, { validateStatus: () => true })).data;
    const result = {};
    Object.keys(data.apy.day).forEach((poolId) => {
        result[poolId] = { apy: { day: 0, week: 0 }, volume: 0 };
        result[poolId].apy.day = data.apy.day[poolId] * 100;
        result[poolId].apy.week = data.apy.week[poolId] * 100;
        result[poolId].volume = data.volume[poolId];
    });
    return result;
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
// Base, Bsc, ZkSync, Moonbeam, Kava and Celo only
exports._getFactoryAPYsAndVolumes = (0, memoizee_1.default)(async (network) => {
    if (network === "aurora")
        return []; // Exclude Aurora
    const url = `https://api.curve.fi/api/getFactoryAPYs-${network}`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return response.data.data.poolDetails ?? [];
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
exports._getAllGauges = (0, memoizee_1.default)(async () => {
    const url = `https://api.curve.fi/api/getAllGauges`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return response.data.data;
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
exports._getHiddenPools = (0, memoizee_1.default)(async () => {
    const url = `https://api.curve.fi/api/getHiddenPools`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return response.data.data;
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
exports._generateBoostingProof = (0, memoizee_1.default)(async (block, address) => {
    const url = `https://prices.curve.fi/v1/general/get_merkle_proof?block=${block}&account_address=${address}`;
    const response = await axios_1.default.get(url, { validateStatus: () => true });
    return { block_header_rlp: response.data.block_header_rlp, proof_rlp: response.data.proof_rlp };
}, {
    promise: true,
    maxAge: 5 * 60 * 1000, // 5m
});
