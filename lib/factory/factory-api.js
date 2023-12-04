"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFactoryPoolsDataFromApi = exports.lowerCasePoolDataAddresses = void 0;
const curve_js_1 = require("../curve.js");
const gauge_factory_json_1 = __importDefault(require("../constants/abis/gauge_factory.json"));
const gauge_child_json_1 = __importDefault(require("../constants/abis/gauge_child.json"));
const ERC20_json_1 = __importDefault(require("../constants/abis/ERC20.json"));
const factory_crypto_pool_2_json_1 = __importDefault(require("../constants/abis/factory-crypto/factory-crypto-pool-2.json"));
const factory_tricrypto_pool_json_1 = __importDefault(require("../constants/abis/factory-tricrypto/factory-tricrypto-pool.json"));
const constants_js_1 = require("./constants.js");
const constants_crypto_js_1 = require("./constants-crypto.js");
const common_js_1 = require("./common.js");
const external_api_js_1 = require("../external-api.js");
const utils_js_1 = require("../utils.js");
const lowerCasePoolDataAddresses = (poolsData) => {
    for (const poolData of poolsData) {
        poolData.address = poolData.address.toLowerCase();
        if (poolData.lpTokenAddress)
            poolData.lpTokenAddress = poolData.lpTokenAddress.toLowerCase();
        if (poolData.gaugeAddress)
            poolData.gaugeAddress = poolData.gaugeAddress.toLowerCase();
        if (poolData.implementationAddress)
            poolData.implementationAddress = poolData.implementationAddress.toLowerCase();
        for (const coin of poolData.coins) {
            coin.address = coin.address.toLowerCase();
        }
        for (const reward of poolData.gaugeRewards ?? []) {
            reward.gaugeAddress = reward.gaugeAddress.toLowerCase();
            reward.tokenAddress = reward.tokenAddress.toLowerCase();
        }
    }
    return poolsData;
};
exports.lowerCasePoolDataAddresses = lowerCasePoolDataAddresses;
function setFactorySwapContracts(rawPoolList, factoryType) {
    if (factoryType === "factory-crypto") {
        rawPoolList.forEach((pool) => {
            this.setContract(pool.address, factory_crypto_pool_2_json_1.default);
        });
    }
    else if (factoryType === "factory-tricrypto") {
        rawPoolList.forEach((pool) => {
            this.setContract(pool.address, factory_tricrypto_pool_json_1.default);
        });
    }
    else {
        const implementationABIDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].implementationABIDict;
        rawPoolList.forEach((pool) => {
            this.setContract(pool.address, implementationABIDict[pool.implementationAddress]);
        });
    }
}
function setCryptoFactoryTokenContracts(rawPoolList) {
    rawPoolList.forEach((pool) => {
        this.setContract(pool.lpTokenAddress, ERC20_json_1.default);
    });
}
function setFactoryGaugeContracts(rawPoolList) {
    rawPoolList.forEach((pool) => {
        if (pool.gaugeAddress) {
            this.setContract(pool.gaugeAddress, this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default);
        }
    });
}
function setFactoryCoinsContracts(rawPoolList) {
    for (const pool of rawPoolList) {
        for (const coin of pool.coins) {
            if (coin.address in this.contracts)
                continue;
            this.setContract(coin.address, ERC20_json_1.default);
        }
    }
}
async function getFactoryPoolsDataFromApi(factoryType) {
    const network = this.constants.NETWORK_NAME;
    const isCrypto = factoryType === "factory-crypto" || factoryType === "factory-tricrypto";
    let rawPoolList = (0, exports.lowerCasePoolDataAddresses)((await (0, external_api_js_1._getPoolsFromApi)(network, factoryType)).poolData);
    if (!isCrypto) {
        rawPoolList = rawPoolList.filter((p) => p.implementationAddress in constants_js_1.FACTORY_CONSTANTS[this.chainId].implementationABIDict);
    }
    // Filter duplications
    const mainAddresses = Object.values(this.constants.POOLS_DATA).map((pool) => pool.swap_address);
    rawPoolList = rawPoolList.filter((p) => !mainAddresses.includes(p.address));
    setFactorySwapContracts.call(this, rawPoolList, factoryType);
    if (factoryType === "factory-crypto")
        setCryptoFactoryTokenContracts.call(this, rawPoolList);
    setFactoryGaugeContracts.call(this, rawPoolList);
    setFactoryCoinsContracts.call(this, rawPoolList);
    common_js_1.setFactoryZapContracts.call(this, isCrypto);
    const FACTORY_POOLS_DATA = {};
    rawPoolList.forEach((pool) => {
        const nativeToken = this.constants.NATIVE_TOKEN;
        let coinAddresses = pool.coins.map((c) => c.address);
        if (this.chainId === 137) {
            coinAddresses = coinAddresses.map((a) => a === "0x0000000000000000000000000000000000001010" ? nativeToken.wrappedAddress : a);
        }
        const coinNames = pool.coins.map((c) => c.symbol);
        const coinDecimals = pool.coins.map((c) => Number(c.decimals));
        if (isCrypto) {
            const wrappedCoinNames = pool.coins.map((c) => c.symbol === nativeToken.symbol ? nativeToken.wrappedSymbol : c.symbol);
            const underlyingCoinNames = pool.coins.map((c) => c.symbol === nativeToken.wrappedSymbol ? nativeToken.symbol : c.symbol);
            const underlyingCoinAddresses = coinAddresses.map((addr) => addr === nativeToken.wrappedAddress ? nativeToken.address : addr);
            const isPlain = !coinAddresses.includes(nativeToken.wrappedAddress);
            const lpTokenBasePoolIdDict = constants_crypto_js_1.CRYPTO_FACTORY_CONSTANTS[this.chainId].lpTokenBasePoolIdDict;
            const basePoolIdZapDict = constants_crypto_js_1.CRYPTO_FACTORY_CONSTANTS[this.chainId].basePoolIdZapDict;
            const basePoolId = lpTokenBasePoolIdDict[coinAddresses[1]];
            if (factoryType !== "factory-tricrypto" && basePoolId) { // isMeta
                const allPoolsData = { ...this.constants.POOLS_DATA, ...FACTORY_POOLS_DATA };
                const basePoolCoinNames = [...allPoolsData[basePoolId].underlying_coins];
                const basePoolCoinAddresses = [...allPoolsData[basePoolId].underlying_coin_addresses];
                const basePoolDecimals = [...allPoolsData[basePoolId].underlying_decimals];
                const basePoolZap = basePoolIdZapDict[basePoolId];
                FACTORY_POOLS_DATA[pool.id] = {
                    name: (0, utils_js_1.getPoolName)(pool.name),
                    full_name: pool.name,
                    symbol: pool.symbol,
                    reference_asset: "CRYPTO",
                    swap_address: pool.address,
                    token_address: pool.lpTokenAddress,
                    gauge_address: pool.gaugeAddress ? pool.gaugeAddress : curve_js_1.curve.constants.ZERO_ADDRESS,
                    deposit_address: basePoolZap.address,
                    is_meta: true,
                    is_crypto: true,
                    is_factory: true,
                    base_pool: basePoolId,
                    underlying_coins: [underlyingCoinNames[0], ...basePoolCoinNames],
                    wrapped_coins: wrappedCoinNames,
                    underlying_coin_addresses: [underlyingCoinAddresses[0], ...basePoolCoinAddresses],
                    wrapped_coin_addresses: coinAddresses,
                    underlying_decimals: [coinDecimals[0], ...basePoolDecimals],
                    wrapped_decimals: coinDecimals,
                    swap_abi: factory_crypto_pool_2_json_1.default,
                    gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
                    deposit_abi: basePoolZap.ABI,
                    in_api: true,
                };
            }
            else {
                FACTORY_POOLS_DATA[pool.id] = {
                    name: factoryType === "factory-tricrypto" ? pool.name : (0, utils_js_1.getPoolName)(pool.name),
                    full_name: pool.name,
                    symbol: pool.symbol,
                    reference_asset: "CRYPTO",
                    swap_address: pool.address,
                    token_address: pool.lpTokenAddress,
                    gauge_address: pool.gaugeAddress ? pool.gaugeAddress : curve_js_1.curve.constants.ZERO_ADDRESS,
                    is_crypto: true,
                    is_plain: isPlain,
                    is_factory: true,
                    underlying_coins: underlyingCoinNames,
                    wrapped_coins: wrappedCoinNames,
                    underlying_coin_addresses: underlyingCoinAddresses,
                    wrapped_coin_addresses: coinAddresses,
                    underlying_decimals: coinDecimals,
                    wrapped_decimals: coinDecimals,
                    swap_abi: factoryType === "factory-tricrypto" ? factory_tricrypto_pool_json_1.default : factory_crypto_pool_2_json_1.default,
                    gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
                    in_api: true,
                };
            }
        }
        else if (pool.isMetaPool) {
            const implementationABIDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].implementationABIDict;
            const allPoolsData = { ...this.constants.POOLS_DATA, ...FACTORY_POOLS_DATA };
            const basePoolId = (0, common_js_1.getPoolIdByAddress)(rawPoolList, pool.basePoolAddress);
            const basePoolCoinNames = allPoolsData[basePoolId]?.underlying_coins;
            const basePoolCoinAddresses = allPoolsData[basePoolId]?.underlying_coin_addresses;
            const basePoolDecimals = allPoolsData[basePoolId]?.underlying_decimals;
            const basePoolIdZapDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].basePoolIdZapDict;
            const basePoolZap = basePoolIdZapDict[basePoolId];
            FACTORY_POOLS_DATA[pool.id] = {
                name: (0, utils_js_1.getPoolName)(pool.name),
                full_name: pool.name,
                symbol: pool.symbol,
                reference_asset: (0, utils_js_1.assetTypeNameHandler)(pool.assetTypeName),
                swap_address: pool.address,
                token_address: pool.address,
                gauge_address: pool.gaugeAddress ? pool.gaugeAddress : curve_js_1.curve.constants.ZERO_ADDRESS,
                deposit_address: basePoolZap.address,
                implementation_address: pool.implementationAddress,
                is_meta: true,
                is_factory: true,
                base_pool: basePoolId,
                underlying_coins: [coinNames[0], ...basePoolCoinNames],
                wrapped_coins: coinNames,
                underlying_coin_addresses: [coinAddresses[0], ...basePoolCoinAddresses],
                wrapped_coin_addresses: coinAddresses,
                underlying_decimals: [coinDecimals[0], ...basePoolDecimals],
                wrapped_decimals: coinDecimals,
                swap_abi: implementationABIDict[pool.implementationAddress],
                gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
                deposit_abi: basePoolZap.ABI,
                in_api: true,
            };
        }
        else {
            const implementationABIDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].implementationABIDict;
            FACTORY_POOLS_DATA[pool.id] = {
                name: (0, utils_js_1.getPoolName)(pool.name),
                full_name: pool.name,
                symbol: pool.symbol,
                reference_asset: (0, utils_js_1.assetTypeNameHandler)(pool.assetTypeName),
                swap_address: pool.address,
                token_address: pool.address,
                gauge_address: pool.gaugeAddress ? pool.gaugeAddress : curve_js_1.curve.constants.ZERO_ADDRESS,
                implementation_address: pool.implementationAddress,
                is_plain: true,
                is_factory: true,
                underlying_coins: coinNames,
                wrapped_coins: coinNames,
                underlying_coin_addresses: coinAddresses,
                wrapped_coin_addresses: coinAddresses,
                underlying_decimals: coinDecimals,
                wrapped_decimals: coinDecimals,
                swap_abi: implementationABIDict[pool.implementationAddress],
                gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
                in_api: true,
            };
        }
    });
    return FACTORY_POOLS_DATA;
}
exports.getFactoryPoolsDataFromApi = getFactoryPoolsDataFromApi;
