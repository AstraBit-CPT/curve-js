"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPoolIdByAddress = exports.setFactoryZapContracts = void 0;
const constants_js_1 = require("./constants.js");
const constants_crypto_js_1 = require("./constants-crypto.js");
const utils_js_1 = require("../utils.js");
function setFactoryZapContracts(isCrypto) {
    const basePoolIdZapDict = (isCrypto ? constants_crypto_js_1.CRYPTO_FACTORY_CONSTANTS : constants_js_1.FACTORY_CONSTANTS)[this.chainId].basePoolIdZapDict;
    for (const basePoolId in basePoolIdZapDict) {
        if (!Object.prototype.hasOwnProperty.call(basePoolIdZapDict, basePoolId))
            continue;
        const basePool = basePoolIdZapDict[basePoolId];
        if (basePool.address in this.constants)
            continue;
        this.setContract(basePool.address, basePool.ABI);
    }
}
exports.setFactoryZapContracts = setFactoryZapContracts;
function getPoolIdByAddress(poolList, address) {
    const pool = poolList.find((item) => item.address.toLowerCase() === address.toLowerCase());
    if (pool) {
        return pool.id;
    }
    else {
        return (0, utils_js_1.getPoolIdBySwapAddress)(address.toLowerCase());
    }
}
exports.getPoolIdByAddress = getPoolIdByAddress;
