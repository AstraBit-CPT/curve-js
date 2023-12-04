"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeployedGaugeMirrorAddress = exports.getDeployedGaugeMirrorAddressByTx = exports.getDeployedGaugeAddress = exports.deployGaugeMirror = exports.deployGaugeMirrorEstimateGas = exports.deployGaugeSidechain = exports.deployGaugeSidechainEstimateGas = exports.deployGauge = exports.deployGaugeEstimateGas = exports.getDeployedTricryptoPoolAddress = exports.deployTricryptoPool = exports.deployTricryptoPoolEstimateGas = exports.getDeployedCryptoPoolAddress = exports.deployCryptoPool = exports.deployCryptoPoolEstimateGas = exports.getDeployedStableMetaPoolAddress = exports.deployStableNgMetaPool = exports.deployStableNgMetaPoolEstimateGas = exports.deployStableMetaPool = exports.deployStableMetaPoolEstimateGas = exports.setOracle = exports.setOracleEstimateGas = exports._setOracle = exports.getDeployedStablePlainPoolAddress = exports.deployStableNgPlainPool = exports.deployStableNgPlainPoolEstimateGas = exports.deployStablePlainPool = exports.deployStablePlainPoolEstimateGas = void 0;
const ethers_1 = require("ethers");
const curve_js_1 = require("../curve.js");
const index_js_1 = require("../pools/index.js");
const utils_js_1 = require("../utils.js");
const curve_lp_token_v5_json_1 = __importDefault(require("../constants/abis/curve_lp_token_v5.json"));
const Plain2ETHOracle_json_1 = __importDefault(require("../constants/abis/factory-v2/Plain2ETHOracle.json"));
// ------- STABLE PLAIN POOLS -------
const _deployStablePlainPool = async (name, symbol, coins, A, fee, // %
assetType, // 0 = USD, 1 = ETH, 2 = BTC, 3 = Other
implementationIdx, emaTime, // seconds
oracleAddress, methodName, estimateGas) => {
    if (name.length > 32)
        throw Error("Max name length = 32");
    if (symbol.length > 10)
        throw Error("Max symbol length = 10");
    if (![2, 3, 4].includes(coins.length))
        throw Error("Invalid number of coins. Must be 2, 3 or 4");
    if ((0, utils_js_1.BN)(fee).lt(0.04))
        throw Error(`fee must be >= 0.04%. Passed fee = ${fee}`);
    if ((0, utils_js_1.BN)(fee).gt(1))
        throw Error(`fee must be <= 1%. Passed fee = ${fee}`);
    if (![0, 1, 2, 3].includes(assetType))
        throw Error("Invalid assetType. Must be one of: 0 = USD, 1 = ETH, 2 = BTC, 3 = Other");
    if (curve_js_1.curve.chainId !== 1 || coins.length > 2) {
        if (![0, 1, 2, 3].includes(implementationIdx))
            throw Error("Invalid implementationIdx. Must be one 0, 1, 2 or 3");
    }
    else {
        if (![0, 1, 2, 3, 4, 5].includes(implementationIdx))
            throw Error("Invalid implementationIdx. Must be one 0, 1, 2, 3, 4 or 5");
    }
    if (emaTime <= 0)
        throw Error(`emaTime must be > 0. Passed emaTime = ${emaTime}`);
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _fee = (0, utils_js_1.parseUnits)(fee, 8);
    const _coins = coins.concat(Array(4 - coins.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS));
    const useProxy = (curve_js_1.curve.chainId === 1 && coins.length === 2 && implementationIdx === 4 && emaTime !== 600) ||
        (curve_js_1.curve.chainId === 1 && coins.length === 2 && implementationIdx === 5 && emaTime !== 600) ||
        ((curve_js_1.curve.chainId === 42161 || curve_js_1.curve.chainId == 10) && coins.length === 2 && implementationIdx === 0 && emaTime !== 600);
    const setOracle = ((curve_js_1.curve.chainId === 42161 || curve_js_1.curve.chainId == 10) && coins.length === 2 && implementationIdx === 2);
    const contractAddress = (useProxy || setOracle) ? curve_js_1.curve.constants.ALIASES.factory_admin : curve_js_1.curve.constants.ALIASES.factory;
    const contract = curve_js_1.curve.contracts[contractAddress].contract;
    const args = [name, symbol, _coins, _A, _fee, assetType, implementationIdx];
    if (useProxy || setOracle)
        args.push((0, utils_js_1.parseUnits)(Math.floor(emaTime / Math.log(2)), 0));
    if (setOracle) {
        const methodId = methodName === "0x00000000" ? "0x00000000" : ethers_1.ethers.id(methodName).substring(0, 10);
        args.push(methodId, oracleAddress);
    }
    const methodToCall = setOracle ? "deploy_plain_pool_and_set_oracle" : "deploy_plain_pool";
    const gas = await contract[methodToCall].estimateGas(...args, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract[methodToCall](...args, { ...curve_js_1.curve.options, gasLimit });
};
const deployStablePlainPoolEstimateGas = async (name, symbol, coins, A, fee, // %
assetType, // 0 = USD, 1 = ETH, 2 = BTC, 3 = Other
implementationIdx, emaTime = 600, // seconds
oracleAddress = curve_js_1.curve.constants.ZERO_ADDRESS, methodName = "0x00000000") => {
    return await _deployStablePlainPool(name, symbol, coins, A, fee, assetType, implementationIdx, emaTime, oracleAddress, methodName, true);
};
exports.deployStablePlainPoolEstimateGas = deployStablePlainPoolEstimateGas;
const deployStablePlainPool = async (name, symbol, coins, A, fee, // %
assetType, // 0 = USD, 1 = ETH, 2 = BTC, 3 = Other
implementationIdx, emaTime = 600, // seconds
oracleAddress = curve_js_1.curve.constants.ZERO_ADDRESS, methodName = "0x00000000") => {
    return await _deployStablePlainPool(name, symbol, coins, A, fee, assetType, implementationIdx, emaTime, oracleAddress, methodName, false);
};
exports.deployStablePlainPool = deployStablePlainPool;
const _deployStableNgPlainPool = async (name, symbol, coins, A, fee, // %
offpegFeeMultiplier, assetTypes, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
implementationIdx, emaTime = 600, // seconds
oracleAddresses, methodNames, estimateGas) => {
    if (name.length > 32)
        throw Error("Max name length = 32");
    if (symbol.length > 10)
        throw Error("Max symbol length = 10");
    if (coins.length < 1)
        throw Error("Invalid number of coins. Must be more than 1");
    if (coins.length > 9)
        throw Error("Invalid number of coins. Must be less than 9");
    if ((0, utils_js_1.BN)(fee).gt(1))
        throw Error(`fee must be <= 1%. Passed fee = ${fee}`);
    let _oracleAddresses;
    if (oracleAddresses.length === 0) {
        _oracleAddresses = new Array(coins.length).fill(curve_js_1.curve.constants.ZERO_ADDRESS);
    }
    else {
        _oracleAddresses = oracleAddresses;
    }
    let _methodNames;
    if (methodNames.length === 0) {
        _methodNames = new Array(coins.length).fill("0x00000000");
    }
    else {
        _methodNames = methodNames;
    }
    if (coins.length !== assetTypes.length)
        throw Error("Invalid length of assetTypes. Must be same coins length");
    if (coins.length !== _oracleAddresses.length)
        throw Error("Invalid length of oracleAddresses. Must be same coins length");
    if (coins.length !== _methodNames.length)
        throw Error("Invalid length of methodNames. Must be same coins length");
    assetTypes.forEach((item, index) => {
        if (![0, 1, 2, 3].includes(item))
            throw Error(`Invalid assetType. Must be one of: 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626 for assetTypes[${index}]`);
    });
    if (![0].includes(implementationIdx))
        throw Error("Invalid implementationIdx. Must be 0");
    if (emaTime <= 0)
        throw Error(`emaTime must be > 0. Passed emaTime = ${emaTime}`);
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _fee = (0, utils_js_1.parseUnits)(fee, 8);
    const _offpegFeeMultiplier = (0, utils_js_1.parseUnits)(offpegFeeMultiplier, 10);
    const _coins = coins;
    const contractAddress = curve_js_1.curve.constants.ALIASES.stable_ng_factory;
    const contract = curve_js_1.curve.contracts[contractAddress].contract;
    const methodIds = [];
    _methodNames.forEach((item) => {
        if (item === '0x00000000' || item === '') {
            methodIds.push('0x00000000');
        }
        else {
            methodIds.push(ethers_1.ethers.id(item).substring(0, 10));
        }
    });
    const args = [name, symbol, _coins, _A, _fee, _offpegFeeMultiplier, emaTime, implementationIdx, assetTypes, methodIds, _oracleAddresses];
    const gas = await contract.deploy_plain_pool.estimateGas(...args, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_plain_pool(...args, { ...curve_js_1.curve.options, gasLimit });
};
const deployStableNgPlainPoolEstimateGas = async (name, symbol, coins, A, fee, // %
offpegFeeMultiplier, assetTypes, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
implementationIdx, emaTime, // seconds
oracleAddresses, methodNames) => {
    return await _deployStableNgPlainPool(name, symbol, coins, A, fee, offpegFeeMultiplier, assetTypes, implementationIdx, emaTime, oracleAddresses, methodNames, true);
};
exports.deployStableNgPlainPoolEstimateGas = deployStableNgPlainPoolEstimateGas;
const deployStableNgPlainPool = async (name, symbol, coins, A, fee, // %
offpegFeeMultiplier, assetTypes, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
implementationIdx, emaTime, // seconds
oracleAddresses, methodNames) => {
    return await _deployStableNgPlainPool(name, symbol, coins, A, fee, offpegFeeMultiplier, assetTypes, implementationIdx, emaTime, oracleAddresses, methodNames, false);
};
exports.deployStableNgPlainPool = deployStableNgPlainPool;
const getDeployedStablePlainPoolAddress = async (tx) => {
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    return txInfo.logs[0].address.toLowerCase();
};
exports.getDeployedStablePlainPoolAddress = getDeployedStablePlainPoolAddress;
const _setOracle = async (poolAddress, oracleAddress, methodName, estimateGas) => {
    curve_js_1.curve.setContract(poolAddress, Plain2ETHOracle_json_1.default);
    const poolContract = curve_js_1.curve.contracts[poolAddress].contract;
    const methodId = methodName === "0x00000000" ? "0x00000000" : ethers_1.ethers.id(methodName).substring(0, 10);
    const _gas = await poolContract.set_oracle.estimateGas(methodId, oracleAddress, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return Number(_gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)(_gas);
    await curve_js_1.curve.updateFeeData();
    return await poolContract.set_oracle(methodId, oracleAddress, { ...curve_js_1.curve.options, gasLimit });
};
exports._setOracle = _setOracle;
const setOracleEstimateGas = async (poolAddress, oracleAddress = curve_js_1.curve.constants.ZERO_ADDRESS, methodName = "0x00000000") => {
    return await (0, exports._setOracle)(poolAddress, oracleAddress, methodName, true);
};
exports.setOracleEstimateGas = setOracleEstimateGas;
const setOracle = async (poolAddress, oracleAddress = curve_js_1.curve.constants.ZERO_ADDRESS, methodName = "0x00000000") => {
    return await (0, exports._setOracle)(poolAddress, oracleAddress, methodName, false);
};
exports.setOracle = setOracle;
// ------- STABLE META POOLS -------
const _deployStableMetaPool = async (basePool, name, symbol, coin, A, fee, // %
implementationIdx, estimateGas) => {
    if (name.length > 32)
        throw Error("Max name length = 32");
    if (symbol.length > 10)
        throw Error("Max symbol length = 10");
    if ((0, utils_js_1.BN)(fee).lt(0.04))
        throw Error(`fee must be >= 0.04%. Passed fee = ${fee}`);
    if ((0, utils_js_1.BN)(fee).gt(1))
        throw Error(`fee must be <= 1%. Passed fee = ${fee}`);
    if (![0, 1].includes(implementationIdx))
        throw Error("Invalid implementationIdx. Must be one 0 or 1");
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _fee = (0, utils_js_1.parseUnits)(fee, 8);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.factory].contract;
    const gas = await contract.deploy_metapool.estimateGas(basePool, name, symbol, coin, _A, _fee, implementationIdx, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_metapool(basePool, name, symbol, coin, _A, _fee, implementationIdx, { ...curve_js_1.curve.options, gasLimit });
};
const deployStableMetaPoolEstimateGas = async (basePool, name, symbol, coin, A, fee, // %
implementationIdx) => {
    return await _deployStableMetaPool(basePool, name, symbol, coin, A, fee, implementationIdx, true);
};
exports.deployStableMetaPoolEstimateGas = deployStableMetaPoolEstimateGas;
const deployStableMetaPool = async (basePool, name, symbol, coin, A, fee, // %
implementationIdx) => {
    return await _deployStableMetaPool(basePool, name, symbol, coin, A, fee, implementationIdx, false);
};
exports.deployStableMetaPool = deployStableMetaPool;
const _deployStableNgMetaPool = async (basePool, name, symbol, coin, A, fee, // %
offpegFeeMultiplier, assetType, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
emaTime = 600, // seconds
implementationIdx = 0, methodName = "0x00000000", oracleAddress = curve_js_1.curve.constants.ZERO_ADDRESS, estimateGas) => {
    if (name.length > 32)
        throw Error("Max name length = 32");
    if (symbol.length > 10)
        throw Error("Max symbol length = 10");
    if ((0, utils_js_1.BN)(fee).lt(0.04))
        throw Error(`fee must be >= 0.04%. Passed fee = ${fee}`);
    if ((0, utils_js_1.BN)(fee).gt(1))
        throw Error(`fee must be <= 1%. Passed fee = ${fee}`);
    if (![0, 1].includes(implementationIdx))
        throw Error("Invalid implementationIdx. Must be one 0 or 1");
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _fee = (0, utils_js_1.parseUnits)(fee, 8);
    const methodId = methodName === "0x00000000" ? "0x00000000" : ethers_1.ethers.id(methodName).substring(0, 10);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.stable_ng_factory].contract;
    const gas = await contract.deploy_metapool.estimateGas(basePool, name, symbol, coin, _A, _fee, offpegFeeMultiplier, emaTime, implementationIdx, assetType, methodId, oracleAddress, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_metapool(basePool, name, symbol, coin, _A, _fee, offpegFeeMultiplier, emaTime, implementationIdx, assetType, methodId, oracleAddress, { ...curve_js_1.curve.options, gasLimit });
};
const deployStableNgMetaPoolEstimateGas = async (basePool, name, symbol, coin, A, fee, // %
offpegFeeMultiplier, assetType, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
emaTime, // seconds
implementationIdx, methodName, oracleAddress) => {
    return await _deployStableNgMetaPool(basePool, name, symbol, coin, A, fee, offpegFeeMultiplier, assetType, emaTime, implementationIdx, methodName, oracleAddress, true);
};
exports.deployStableNgMetaPoolEstimateGas = deployStableNgMetaPoolEstimateGas;
const deployStableNgMetaPool = async (basePool, name, symbol, coin, A, fee, // %
offpegFeeMultiplier, emaTime, // seconds
implementationIdx, assetType, // 0 = Standard, 1 = Oracle, 2 = Rebasing, 3 = ERC4626
methodName, oracleAddress) => {
    return await _deployStableNgMetaPool(basePool, name, symbol, coin, A, fee, offpegFeeMultiplier, assetType, emaTime, implementationIdx, methodName, oracleAddress, false);
};
exports.deployStableNgMetaPool = deployStableNgMetaPool;
const getDeployedStableMetaPoolAddress = async (tx) => {
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    for (let i = txInfo.logs.length - 1; i > -1; i--) {
        if ("args" in txInfo.logs[i]) {
            const basePoolId = (0, utils_js_1.getPoolIdBySwapAddress)(txInfo.logs[i].args[1]);
            const basePool = (0, index_js_1.getPool)(basePoolId);
            return txInfo.logs[basePool.underlyingCoins.length].address.toLowerCase();
        }
    }
    throw Error("Can't get deployed metapool address");
};
exports.getDeployedStableMetaPoolAddress = getDeployedStableMetaPoolAddress;
// ------- CRYPTO POOLS -------
const _deployCryptoPool = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, maHalfTime, // Seconds
initialPrice, estimateGas) => {
    if (name.length > 32)
        throw Error("Max name length = 32");
    if (symbol.length > 10)
        throw Error("Max symbol length = 10");
    if (coins.length !== 2)
        throw Error("Invalid number of coins. Must be 2");
    if (coins[0] === coins[1])
        throw Error("Coins must be different");
    if ((0, utils_js_1.BN)(A).lt(4000))
        throw Error(`A must be >= 4000. Passed A = ${A}`);
    if ((0, utils_js_1.BN)(A).gt(4 * (10 ** 9)))
        throw Error(`A must be <= 4 * 10 ** 9. Passed A = ${A}`);
    if ((0, utils_js_1.BN)(gamma).lt(1e-8))
        throw Error(`gamma must be >= 1e-8. Passed gamma = ${gamma}`);
    if ((0, utils_js_1.BN)(gamma).gt(0.02))
        throw Error(`gamma must be <= 0.02. Passed gamma = ${gamma}`);
    if ((0, utils_js_1.BN)(midFee).lt(0.005))
        throw Error(`midFee must be >= 0.005. Passed midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(midFee).gt(100))
        throw Error(`midFee must be <= 100. Passed midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(outFee).lt((0, utils_js_1.BN)(midFee)))
        throw Error(`outFee must be >= midFee. Passed outFee = ${outFee} < midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(outFee).gt(100))
        throw Error(`outFee must be <= 100. Passed outFee = ${outFee}`);
    if ((0, utils_js_1.BN)(allowedExtraProfit).lt(0))
        throw Error(`allowedExtraProfit must be >= 0. Passed allowedExtraProfit = ${allowedExtraProfit}`);
    if ((0, utils_js_1.BN)(allowedExtraProfit).gt(0.01))
        throw Error(`allowedExtraProfit must be <= 0.01. Passed allowedExtraProfit = ${allowedExtraProfit}`);
    if ((0, utils_js_1.BN)(feeGamma).lt(0))
        throw Error(`feeGamma must be >= 0. Passed feeGamma = ${feeGamma}`);
    if ((0, utils_js_1.BN)(feeGamma).gt(1))
        throw Error(`feeGamma must be <= 1. Passed feeGamma = ${feeGamma}`);
    if ((0, utils_js_1.BN)(adjustmentStep).lt(0))
        throw Error(`adjustmentStep must be >= 0. Passed adjustmentStep=${adjustmentStep}`);
    if ((0, utils_js_1.BN)(adjustmentStep).gt(1))
        throw Error(`adjustmentStep must be <= 1. Passed adjustmentStep=${adjustmentStep}`);
    if ((0, utils_js_1.BN)(maHalfTime).lt(0))
        throw Error(`maHalfTime must be >= 0. Passed maHalfTime=${maHalfTime}`);
    if ((0, utils_js_1.BN)(maHalfTime).gt(604800))
        throw Error(`maHalfTime must be <= 604800. Passed maHalfTime=${maHalfTime}`);
    if ((0, utils_js_1.BN)(initialPrice).lt(1e-12))
        throw Error(`initialPrice must be >= 1e-12. Passed initialPrice=${initialPrice}`);
    if ((0, utils_js_1.BN)(initialPrice).gt(1e12))
        throw Error(`initialPrice must be <= 1e12. Passed initialPrice=${initialPrice}`);
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _gamma = (0, utils_js_1.parseUnits)(gamma);
    const _midFee = (0, utils_js_1.parseUnits)(midFee, 8);
    const _outFee = (0, utils_js_1.parseUnits)(outFee, 8);
    const _allowedExtraProfit = (0, utils_js_1.parseUnits)(allowedExtraProfit);
    const _feeGamma = (0, utils_js_1.parseUnits)(feeGamma);
    const _adjustmentStep = (0, utils_js_1.parseUnits)(adjustmentStep);
    const _maHalfTime = (0, utils_js_1.parseUnits)(maHalfTime, 0);
    const _initialPrice = (0, utils_js_1.parseUnits)(initialPrice);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.crypto_factory].contract;
    const gas = await contract.deploy_pool.estimateGas(name, symbol, coins, _A, _gamma, _midFee, _outFee, _allowedExtraProfit, _feeGamma, _adjustmentStep, 5000000000, _maHalfTime, _initialPrice, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_pool(name, symbol, coins, _A, _gamma, _midFee, _outFee, _allowedExtraProfit, _feeGamma, _adjustmentStep, 5000000000, // 50%
    _maHalfTime, _initialPrice, { ...curve_js_1.curve.options, gasLimit });
};
const deployCryptoPoolEstimateGas = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, maHalfTime, // Seconds
initialPrice) => {
    return await _deployCryptoPool(name, symbol, coins, A, gamma, midFee, outFee, allowedExtraProfit, feeGamma, adjustmentStep, maHalfTime, initialPrice, true);
};
exports.deployCryptoPoolEstimateGas = deployCryptoPoolEstimateGas;
const deployCryptoPool = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, maHalfTime, // Seconds
initialPrice) => {
    return await _deployCryptoPool(name, symbol, coins, A, gamma, midFee, outFee, allowedExtraProfit, feeGamma, adjustmentStep, maHalfTime, initialPrice, false);
};
exports.deployCryptoPool = deployCryptoPool;
const getDeployedCryptoPoolAddress = async (tx) => {
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    const lpTokenAddress = txInfo.logs[0].address;
    const contract = new ethers_1.Contract(lpTokenAddress, curve_lp_token_v5_json_1.default, curve_js_1.curve.provider);
    return (await contract.minter(curve_js_1.curve.constantOptions)).toLowerCase();
};
exports.getDeployedCryptoPoolAddress = getDeployedCryptoPoolAddress;
// ------- TRICRYPTO POOLS -------
const _deployTricryptoPool = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, emaTime, // Seconds
initialPrices, estimateGas) => {
    if (name.length > 64)
        throw Error("Max name length = 64");
    if (symbol.length > 32)
        throw Error("Max symbol length = 32");
    if (coins.length !== 3)
        throw Error("Invalid number of coins. Must be 3");
    if (coins[0] === coins[1] || coins[1] === coins[2] || coins[0] === coins[2])
        throw Error("Coins must be different");
    if ((0, utils_js_1.BN)(A).lt(2700))
        throw Error(`A must be >= 2700. Passed A = ${A}`);
    if ((0, utils_js_1.BN)(A).gt(27 * (10 ** 7)))
        throw Error(`A must be <= 27 * 10 ** 7. Passed A = ${A}`);
    if ((0, utils_js_1.BN)(gamma).lt(1e-8))
        throw Error(`gamma must be >= 1e-8. Passed gamma = ${gamma}`);
    if ((0, utils_js_1.BN)(gamma).gt(0.05))
        throw Error(`gamma must be <= 0.05. Passed gamma = ${gamma}`);
    if ((0, utils_js_1.BN)(midFee).lt(0))
        throw Error(`midFee must be >= 0. Passed midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(midFee).gt(100))
        throw Error(`midFee must be <= 100. Passed midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(outFee).lt((0, utils_js_1.BN)(midFee)))
        throw Error(`outFee must be >= midFee. Passed outFee = ${outFee} < midFee = ${midFee}`);
    if ((0, utils_js_1.BN)(outFee).gt(100))
        throw Error(`outFee must be <= 100. Passed outFee = ${outFee}`);
    if ((0, utils_js_1.BN)(allowedExtraProfit).lt(0))
        throw Error(`allowedExtraProfit must be >= 0. Passed allowedExtraProfit = ${allowedExtraProfit}`);
    if ((0, utils_js_1.BN)(allowedExtraProfit).gt(1))
        throw Error(`allowedExtraProfit must be <= 1. Passed allowedExtraProfit = ${allowedExtraProfit}`);
    if ((0, utils_js_1.BN)(feeGamma).lt(0))
        throw Error(`feeGamma must be >= 0. Passed feeGamma = ${feeGamma}`);
    if ((0, utils_js_1.BN)(feeGamma).gt(1))
        throw Error(`feeGamma must be <= 1. Passed feeGamma = ${feeGamma}`);
    if ((0, utils_js_1.BN)(adjustmentStep).lt(0))
        throw Error(`adjustmentStep must be >= 0. Passed adjustmentStep=${adjustmentStep}`);
    if ((0, utils_js_1.BN)(adjustmentStep).gt(1))
        throw Error(`adjustmentStep must be <= 1. Passed adjustmentStep=${adjustmentStep}`);
    if ((0, utils_js_1.BN)(emaTime).lt(60))
        throw Error(`maHalfTime must be >= 60. Passed maHalfTime=${emaTime}`);
    if ((0, utils_js_1.BN)(emaTime).gt(604800))
        throw Error(`maHalfTime must be <= 604800. Passed maHalfTime=${emaTime}`);
    if (initialPrices.length !== 2)
        throw Error("Invalid number of initial prices. Must be 2");
    if ((0, utils_js_1.BN)(initialPrices[0]).lt(1e-12))
        throw Error(`initialPrices[0] must be >= 1e-12. Passed initialPrices[0]=${initialPrices[0]}`);
    if ((0, utils_js_1.BN)(initialPrices[0]).gt(1e12))
        throw Error(`initialPrices[0] must be <= 1e12. Passed initialPrices[0]=${initialPrices[0]}`);
    if ((0, utils_js_1.BN)(initialPrices[1]).lt(1e-12))
        throw Error(`initialPrices[1] must be >= 1e-12. Passed initialPrices[1]=${initialPrices[1]}`);
    if ((0, utils_js_1.BN)(initialPrices[1]).gt(1e12))
        throw Error(`initialPrices[1] must be <= 1e12. Passed initialPrices[1]=${initialPrices[1]}`);
    const _A = (0, utils_js_1.parseUnits)(A, 0);
    const _gamma = (0, utils_js_1.parseUnits)(gamma);
    const _midFee = (0, utils_js_1.parseUnits)(midFee, 8);
    const _outFee = (0, utils_js_1.parseUnits)(outFee, 8);
    const _allowedExtraProfit = (0, utils_js_1.parseUnits)(allowedExtraProfit);
    const _feeGamma = (0, utils_js_1.parseUnits)(feeGamma);
    const _adjustmentStep = (0, utils_js_1.parseUnits)(adjustmentStep);
    const _emaTime = (0, utils_js_1.parseUnits)(Math.floor(emaTime / Math.log(2)), 0);
    const _initialPrices = [(0, utils_js_1.parseUnits)(initialPrices[0]), (0, utils_js_1.parseUnits)(initialPrices[1])];
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.tricrypto_factory].contract;
    const gas = await contract.deploy_pool.estimateGas(name, symbol, coins, curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress, 0, _A, _gamma, _midFee, _outFee, _feeGamma, _allowedExtraProfit, _adjustmentStep, _emaTime, _initialPrices, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_pool(name, symbol, coins, curve_js_1.curve.constants.NATIVE_TOKEN.wrappedAddress, 0, _A, _gamma, _midFee, _outFee, _feeGamma, _allowedExtraProfit, _adjustmentStep, _emaTime, _initialPrices, { ...curve_js_1.curve.options, gasLimit });
};
const deployTricryptoPoolEstimateGas = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, emaTime, // Seconds
initialPrices) => {
    return await _deployTricryptoPool(name, symbol, coins, A, gamma, midFee, outFee, allowedExtraProfit, feeGamma, adjustmentStep, emaTime, initialPrices, true);
};
exports.deployTricryptoPoolEstimateGas = deployTricryptoPoolEstimateGas;
const deployTricryptoPool = async (name, symbol, coins, A, gamma, midFee, // %
outFee, // %
allowedExtraProfit, feeGamma, adjustmentStep, emaTime, // Seconds
initialPrices) => {
    return await _deployTricryptoPool(name, symbol, coins, A, gamma, midFee, outFee, allowedExtraProfit, feeGamma, adjustmentStep, emaTime, initialPrices, false);
};
exports.deployTricryptoPool = deployTricryptoPool;
const getDeployedTricryptoPoolAddress = async (tx) => {
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    for (let i = txInfo.logs.length - 1; i > -1; i--) {
        if ("args" in txInfo.logs[i]) {
            // @ts-ignore
            return txInfo.logs[i].args[0];
        }
    }
    throw Error("Can't get deployed tricrypto pool address");
};
exports.getDeployedTricryptoPoolAddress = getDeployedTricryptoPoolAddress;
// ------- GAUGE -------
const _deployGauge = async (pool, factory, estimateGas) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("There is no deployGauge method on sidechain network");
    const contract = curve_js_1.curve.contracts[factory].contract;
    const gas = await contract.deploy_gauge.estimateGas(pool, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_gauge(pool, { ...curve_js_1.curve.options, gasLimit });
};
const _deployGaugeSidechain = async (pool, salt, estimateGas) => {
    if (curve_js_1.curve.chainId === 1)
        throw Error("There is no deployGaugeSidechain method on ethereum network");
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_factory].contract;
    const _salt = ethers_1.ethers.encodeBytes32String(salt);
    const gas = await contract.deploy_gauge.estimateGas(pool, ethers_1.Typed.bytes32(_salt), curve_js_1.curve.signerAddress, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_gauge(pool, ethers_1.Typed.bytes32(_salt), curve_js_1.curve.signerAddress, { ...curve_js_1.curve.options, gasLimit });
};
const _deployGaugeMirror = async (chainId, salt, estimateGas) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("There is no deployGaugeMirror method on sidechain network");
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_factory].contract;
    const _salt = ethers_1.ethers.encodeBytes32String(salt);
    const gas = await contract.deploy_gauge.estimateGas(chainId, ethers_1.Typed.bytes32(_salt), curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    await curve_js_1.curve.updateFeeData();
    return await contract.deploy_gauge(chainId, ethers_1.Typed.bytes32(_salt), { ...curve_js_1.curve.options, gasLimit });
};
const deployGaugeEstimateGas = async (pool, factory) => await _deployGauge(pool, factory, true);
exports.deployGaugeEstimateGas = deployGaugeEstimateGas;
const deployGauge = async (pool, factory) => await _deployGauge(pool, factory, false);
exports.deployGauge = deployGauge;
const deployGaugeSidechainEstimateGas = async (pool, salt) => await _deployGaugeSidechain(pool, salt, true);
exports.deployGaugeSidechainEstimateGas = deployGaugeSidechainEstimateGas;
const deployGaugeSidechain = async (pool, salt) => await _deployGaugeSidechain(pool, salt, false);
exports.deployGaugeSidechain = deployGaugeSidechain;
const deployGaugeMirrorEstimateGas = async (chainId, salt) => await _deployGaugeMirror(chainId, salt, true);
exports.deployGaugeMirrorEstimateGas = deployGaugeMirrorEstimateGas;
const deployGaugeMirror = async (chainId, salt) => await _deployGaugeMirror(chainId, salt, false);
exports.deployGaugeMirror = deployGaugeMirror;
const getDeployedGaugeAddress = async (tx) => {
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    // @ts-ignore
    return txInfo.logs[0].args[txInfo.logs[0].args.length - 1].toLowerCase();
};
exports.getDeployedGaugeAddress = getDeployedGaugeAddress;
const getDeployedGaugeMirrorAddressByTx = async (tx) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("There is no getDeployedGaugeMirrorAddressByTx method on sidechain network");
    const txInfo = await tx.wait();
    if (!txInfo)
        throw Error("Can't get tx info");
    // @ts-ignore
    return txInfo.logs[1].args[txInfo.logs[1].args.length - 1].toLowerCase();
};
exports.getDeployedGaugeMirrorAddressByTx = getDeployedGaugeMirrorAddressByTx;
const getDeployedGaugeMirrorAddress = async (chainId) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("There is no getDeployedGaugeMirrorAddress method on sidechain network");
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.gauge_factory].contract;
    const gaugeCount = await contract.get_gauge_count(chainId);
    const currentIndex = Number(gaugeCount) - 1;
    return await contract.get_gauge(chainId, currentIndex);
};
exports.getDeployedGaugeMirrorAddress = getDeployedGaugeMirrorAddress;
