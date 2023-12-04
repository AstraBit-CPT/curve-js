"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_js_1 = require("./pools/index.js");
const utils_js_1 = require("./pools/utils.js");
const router_js_1 = require("./router.js");
const curve_js_1 = require("./curve.js");
const boosting_js_1 = require("./boosting.js");
const utils_js_2 = require("./utils.js");
const deploy_js_1 = require("./factory/deploy.js");
async function init(providerType, providerSettings, options = {}) {
    await curve_js_1.curve.init(providerType, providerSettings, options);
    // @ts-ignore
    this.signerAddress = curve_js_1.curve.signerAddress;
    // @ts-ignore
    this.chainId = curve_js_1.curve.chainId;
}
function setCustomFeeData(customFeeData) {
    curve_js_1.curve.setCustomFeeData(customFeeData);
}
const curve = {
    init,
    chainId: 0,
    signerAddress: '',
    setCustomFeeData,
    getPoolList: curve_js_1.curve.getPoolList,
    getMainPoolList: curve_js_1.curve.getMainPoolList,
    getUserPoolListByLiquidity: utils_js_1.getUserPoolListByLiquidity,
    getUserPoolListByClaimable: utils_js_1.getUserPoolListByClaimable,
    getUserPoolList: utils_js_1.getUserPoolList,
    getUserLiquidityUSD: utils_js_1.getUserLiquidityUSD,
    getUserClaimable: utils_js_1.getUserClaimable,
    PoolTemplate: index_js_1.PoolTemplate,
    getPool: index_js_1.getPool,
    getUsdRate: utils_js_2.getUsdRate,
    getGasPriceFromL1: utils_js_2.getGasPriceFromL1,
    getGasPriceFromL2: utils_js_2.getGasPriceFromL2,
    getTVL: utils_js_2.getTVL,
    getBalances: utils_js_2.getBalances,
    getAllowance: utils_js_2.getAllowance,
    hasAllowance: utils_js_2.hasAllowance,
    ensureAllowance: utils_js_2.ensureAllowance,
    getCoinsData: utils_js_2.getCoinsData,
    getVolume: utils_js_2.getVolume,
    hasDepositAndStake: utils_js_2.hasDepositAndStake,
    hasRouter: utils_js_2.hasRouter,
    factory: {
        fetchPools: curve_js_1.curve.fetchFactoryPools,
        fetchNewPools: curve_js_1.curve.fetchNewFactoryPools,
        getPoolList: curve_js_1.curve.getFactoryPoolList,
        deployPlainPool: deploy_js_1.deployStablePlainPool,
        setOracle: deploy_js_1.setOracle,
        deployMetaPool: deploy_js_1.deployStableMetaPool,
        deployGauge: async (poolAddress) => (0, deploy_js_1.deployGauge)(poolAddress, curve_js_1.curve.constants.ALIASES.factory),
        deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechain)(poolAddress, salt),
        deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirror)(chainId, salt),
        getDeployedPlainPoolAddress: deploy_js_1.getDeployedStablePlainPoolAddress,
        getDeployedMetaPoolAddress: deploy_js_1.getDeployedStableMetaPoolAddress,
        getDeployedGaugeAddress: deploy_js_1.getDeployedGaugeAddress,
        getDeployedGaugeMirrorAddress: deploy_js_1.getDeployedGaugeMirrorAddress,
        getDeployedGaugeMirrorAddressByTx: deploy_js_1.getDeployedGaugeMirrorAddressByTx,
        fetchRecentlyDeployedPool: curve_js_1.curve.fetchRecentlyDeployedFactoryPool,
        gaugeImplementation: () => curve_js_1.curve.getGaugeImplementation("factory"),
        estimateGas: {
            deployPlainPool: deploy_js_1.deployStablePlainPoolEstimateGas,
            setOracle: deploy_js_1.setOracleEstimateGas,
            deployMetaPool: deploy_js_1.deployStableMetaPoolEstimateGas,
            deployGauge: async (poolAddress) => (0, deploy_js_1.deployGaugeEstimateGas)(poolAddress, curve_js_1.curve.constants.ALIASES.factory),
            deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechainEstimateGas)(poolAddress, salt),
            deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirrorEstimateGas)(chainId, salt),
        },
    },
    crvUSDFactory: {
        fetchPools: curve_js_1.curve.fetchCrvusdFactoryPools,
        getPoolList: curve_js_1.curve.getCrvusdFactoryPoolList,
    },
    EYWAFactory: {
        fetchPools: curve_js_1.curve.fetchEywaFactoryPools,
        getPoolList: curve_js_1.curve.getEywaFactoryPoolList,
    },
    stableNgFactory: {
        fetchPools: curve_js_1.curve.fetchStableNgFactoryPools,
        fetchNewPools: curve_js_1.curve.fetchNewStableNgFactoryPools,
        getPoolList: curve_js_1.curve.getStableNgFactoryPoolList,
        deployPlainPool: deploy_js_1.deployStableNgPlainPool,
        deployMetaPool: deploy_js_1.deployStableNgMetaPool,
        getDeployedPlainPoolAddress: deploy_js_1.getDeployedStablePlainPoolAddress,
        getDeployedMetaPoolAddress: deploy_js_1.getDeployedStableMetaPoolAddress,
        fetchRecentlyDeployedPool: curve_js_1.curve.fetchRecentlyDeployedStableNgFactoryPool,
        estimateGas: {
            deployPlainPool: deploy_js_1.deployStableNgPlainPoolEstimateGas,
            deployMetaPool: deploy_js_1.deployStableNgMetaPoolEstimateGas,
        },
    },
    cryptoFactory: {
        fetchPools: curve_js_1.curve.fetchCryptoFactoryPools,
        fetchNewPools: curve_js_1.curve.fetchNewCryptoFactoryPools,
        getPoolList: curve_js_1.curve.getCryptoFactoryPoolList,
        deployPool: deploy_js_1.deployCryptoPool,
        deployGauge: async (poolAddress) => (0, deploy_js_1.deployGauge)(poolAddress, curve_js_1.curve.constants.ALIASES.crypto_factory),
        deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechain)(poolAddress, salt),
        deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirror)(chainId, salt),
        getDeployedPoolAddress: deploy_js_1.getDeployedCryptoPoolAddress,
        getDeployedGaugeAddress: deploy_js_1.getDeployedGaugeAddress,
        getDeployedGaugeMirrorAddress: deploy_js_1.getDeployedGaugeMirrorAddress,
        getDeployedGaugeMirrorAddressByTx: deploy_js_1.getDeployedGaugeMirrorAddressByTx,
        fetchRecentlyDeployedPool: curve_js_1.curve.fetchRecentlyDeployedCryptoFactoryPool,
        gaugeImplementation: () => curve_js_1.curve.getGaugeImplementation("factory-crypto"),
        estimateGas: {
            deployPool: deploy_js_1.deployCryptoPoolEstimateGas,
            deployGauge: async (poolAddress) => (0, deploy_js_1.deployGaugeEstimateGas)(poolAddress, curve_js_1.curve.constants.ALIASES.crypto_factory),
            deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechainEstimateGas)(poolAddress, salt),
            deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirrorEstimateGas)(chainId, salt),
        },
    },
    tricryptoFactory: {
        fetchPools: curve_js_1.curve.fetchTricryptoFactoryPools,
        fetchNewPools: curve_js_1.curve.fetchNewTricryptoFactoryPools,
        getPoolList: curve_js_1.curve.getTricryptoFactoryPoolList,
        deployPool: deploy_js_1.deployTricryptoPool,
        deployGauge: async (poolAddress) => (0, deploy_js_1.deployGauge)(poolAddress, curve_js_1.curve.constants.ALIASES.tricrypto_factory),
        deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechain)(poolAddress, salt),
        deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirror)(chainId, salt),
        getDeployedPoolAddress: deploy_js_1.getDeployedTricryptoPoolAddress,
        getDeployedGaugeAddress: deploy_js_1.getDeployedGaugeAddress,
        getDeployedGaugeMirrorAddress: deploy_js_1.getDeployedGaugeMirrorAddress,
        getDeployedGaugeMirrorAddressByTx: deploy_js_1.getDeployedGaugeMirrorAddressByTx,
        fetchRecentlyDeployedPool: curve_js_1.curve.fetchRecentlyDeployedTricryptoFactoryPool,
        gaugeImplementation: () => curve_js_1.curve.getGaugeImplementation("factory-tricrypto"),
        estimateGas: {
            deployPool: deploy_js_1.deployTricryptoPoolEstimateGas,
            deployGauge: async (poolAddress) => (0, deploy_js_1.deployGaugeEstimateGas)(poolAddress, curve_js_1.curve.constants.ALIASES.tricrypto_factory),
            deployGaugeSidechain: async (poolAddress, salt) => (0, deploy_js_1.deployGaugeSidechainEstimateGas)(poolAddress, salt),
            deployGaugeMirror: async (chainId, salt) => (0, deploy_js_1.deployGaugeMirrorEstimateGas)(chainId, salt),
        },
    },
    estimateGas: {
        ensureAllowance: utils_js_2.ensureAllowanceEstimateGas,
    },
    boosting: {
        getCrv: boosting_js_1.getCrv,
        getLockedAmountAndUnlockTime: boosting_js_1.getLockedAmountAndUnlockTime,
        getVeCrv: boosting_js_1.getVeCrv,
        getVeCrvPct: boosting_js_1.getVeCrvPct,
        calcUnlockTime: boosting_js_1.calcUnlockTime,
        isApproved: boosting_js_1.isApproved,
        approve: boosting_js_1.approve,
        createLock: boosting_js_1.createLock,
        increaseAmount: boosting_js_1.increaseAmount,
        increaseUnlockTime: boosting_js_1.increaseUnlockTime,
        withdrawLockedCrv: boosting_js_1.withdrawLockedCrv,
        claimableFees: boosting_js_1.claimableFees,
        claimFees: boosting_js_1.claimFees,
        estimateGas: {
            approve: boosting_js_1.approveEstimateGas,
            createLock: boosting_js_1.createLockEstimateGas,
            increaseAmount: boosting_js_1.increaseAmountEstimateGas,
            increaseUnlockTime: boosting_js_1.increaseUnlockTimeEstimateGas,
            withdrawLockedCrv: boosting_js_1.withdrawLockedCrvEstimateGas,
            claimFees: boosting_js_1.claimFeesEstimateGas,
        },
        sidechain: {
            lastEthBlock: boosting_js_1.lastEthBlock,
            getAnycallBalance: boosting_js_1.getAnycallBalance,
            topUpAnycall: boosting_js_1.topUpAnycall,
            lastBlockSent: boosting_js_1.lastBlockSent,
            blockToSend: boosting_js_1.blockToSend,
            sendBlockhash: boosting_js_1.sendBlockhash,
            submitProof: boosting_js_1.submitProof,
            estimateGas: {
                topUpAnycall: boosting_js_1.topUpAnycallEstimateGas,
                sendBlockhash: boosting_js_1.sendBlockhashEstimateGas,
                submitProof: boosting_js_1.submitProofEstimateGas,
            },
        },
    },
    router: {
        getBestRouteAndOutput: router_js_1.getBestRouteAndOutput,
        getArgs: router_js_1.getArgs,
        expected: router_js_1.swapExpected,
        required: router_js_1.swapRequired,
        priceImpact: router_js_1.swapPriceImpact,
        isApproved: router_js_1.swapIsApproved,
        approve: router_js_1.swapApprove,
        swap: router_js_1.swap,
        getSwappedAmount: router_js_1.getSwappedAmount,
        estimateGas: {
            approve: router_js_1.swapApproveEstimateGas,
            swap: router_js_1.swapEstimateGas,
        },
    },
};
exports.default = curve;
