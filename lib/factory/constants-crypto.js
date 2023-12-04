"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CRYPTO_FACTORY_CONSTANTS = exports.basePoolIdZapDictBsc = exports.basePoolIdZapDictBase = exports.basePoolIdZapDictZkSync = exports.basePoolIdZapDictCelo = exports.basePoolIdZapDictKava = exports.basePoolIdZapDictMoonbeam = exports.basePoolIdZapDictXDai = exports.basePoolIdZapDictOptimism = exports.basePoolIdZapDictArbitrum = exports.basePoolIdZapDictAvalanche = exports.basePoolIdZapDictFantom = exports.basePoolIdZapDictPolygon = exports.basePoolIdZapDictEthereum = exports.lpTokenBasePoolIdDictBsc = exports.lpTokenBasePoolIdDictBase = exports.lpTokenBasePoolIdDictZkSync = exports.lpTokenBasePoolIdDictCelo = exports.lpTokenBasePoolIdDictKava = exports.lpTokenBasePoolIdDictMoonbeam = exports.lpTokenBasePoolIdDictXDai = exports.lpTokenBasePoolIdDictOptimism = exports.lpTokenBasePoolIdDictArbitrum = exports.lpTokenBasePoolIdDictAvalanche = exports.lpTokenBasePoolIdDictFantom = exports.lpTokenBasePoolIdDictPolygon = exports.lpTokenBasePoolIdDictEthereum = void 0;
const utils_js_1 = require("../constants/utils.js");
// --- ZAPS --
const base_pool_zap_json_1 = __importDefault(require("../constants/abis/atricrypto3/base_pool_zap.json"));
const meta_zap_crypto_json_1 = __importDefault(require("../constants/abis/3pool/meta_zap_crypto.json"));
const meta_zap_crypto_json_2 = __importDefault(require("../constants/abis/fraxusdc/meta_zap_crypto.json"));
exports.lpTokenBasePoolIdDictEthereum = (0, utils_js_1.lowerCaseKeys)({
    '0x6c3F90f043a72FA612cbac8115EE7e52BDe6E490': '3pool',
    '0x3175Df0976dFA876431C2E9eE6Bc45b65d3473CC': 'fraxusdc',
});
exports.lpTokenBasePoolIdDictPolygon = (0, utils_js_1.lowerCaseKeys)({
    '0xdAD97F7713Ae9437fa9249920eC8507e5FbB23d3': 'atricrypto3',
});
exports.lpTokenBasePoolIdDictFantom = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictAvalanche = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictArbitrum = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictOptimism = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictXDai = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictMoonbeam = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictKava = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictCelo = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictZkSync = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictBase = (0, utils_js_1.lowerCaseKeys)({});
exports.lpTokenBasePoolIdDictBsc = (0, utils_js_1.lowerCaseKeys)({});
exports.basePoolIdZapDictEthereum = {
    '3pool': {
        address: "0x97aDC08FA1D849D2C48C5dcC1DaB568B169b0267".toLowerCase(),
        ABI: meta_zap_crypto_json_1.default,
    },
    fraxusdc: {
        address: "0x5de4ef4879f4fe3bbadf2227d2ac5d0e2d76c895".toLowerCase(),
        ABI: meta_zap_crypto_json_2.default,
    },
};
exports.basePoolIdZapDictPolygon = {
    atricrypto3: {
        address: "0x3d8EADb739D1Ef95dd53D718e4810721837c69c1".toLowerCase(),
        ABI: base_pool_zap_json_1.default,
    },
};
exports.basePoolIdZapDictFantom = {};
exports.basePoolIdZapDictAvalanche = {};
exports.basePoolIdZapDictArbitrum = {};
exports.basePoolIdZapDictOptimism = {};
exports.basePoolIdZapDictXDai = {};
exports.basePoolIdZapDictMoonbeam = {};
exports.basePoolIdZapDictKava = {};
exports.basePoolIdZapDictCelo = {};
exports.basePoolIdZapDictZkSync = {};
exports.basePoolIdZapDictBase = {};
exports.basePoolIdZapDictBsc = {};
exports.CRYPTO_FACTORY_CONSTANTS = {
    1: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictEthereum,
        basePoolIdZapDict: exports.basePoolIdZapDictEthereum,
    },
    10: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictOptimism,
        basePoolIdZapDict: exports.basePoolIdZapDictOptimism,
    },
    56: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictBsc,
        basePoolIdZapDict: exports.basePoolIdZapDictBsc,
    },
    100: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictXDai,
        basePoolIdZapDict: exports.basePoolIdZapDictXDai,
    },
    137: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictPolygon,
        basePoolIdZapDict: exports.basePoolIdZapDictPolygon,
    },
    250: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictFantom,
        basePoolIdZapDict: exports.basePoolIdZapDictFantom,
    },
    324: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictZkSync,
        basePoolIdZapDict: exports.basePoolIdZapDictZkSync,
    },
    1284: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictMoonbeam,
        basePoolIdZapDict: exports.basePoolIdZapDictMoonbeam,
    },
    2222: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictKava,
        basePoolIdZapDict: exports.basePoolIdZapDictKava,
    },
    8453: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictBase,
        basePoolIdZapDict: exports.basePoolIdZapDictBase,
    },
    42220: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictCelo,
        basePoolIdZapDict: exports.basePoolIdZapDictCelo,
    },
    43114: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictAvalanche,
        basePoolIdZapDict: exports.basePoolIdZapDictAvalanche,
    },
    42161: {
        lpTokenBasePoolIdDict: exports.lpTokenBasePoolIdDictArbitrum,
        basePoolIdZapDict: exports.basePoolIdZapDictArbitrum,
    },
};
