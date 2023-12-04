"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.curve = exports.NETWORK_CONSTANTS = exports.NATIVE_TOKENS = void 0;
const ethers_1 = require("ethers");
const index_js_1 = require("./dependencies/ethcall/index.js");
const factory_js_1 = require("./factory/factory.js");
const factory_api_js_1 = require("./factory/factory-api.js");
const factory_crypto_js_1 = require("./factory/factory-crypto.js");
const factory_tricrypto_js_1 = require("./factory/factory-tricrypto.js");
const ERC20_json_1 = __importDefault(require("./constants/abis/ERC20.json"));
const cERC20_json_1 = __importDefault(require("./constants/abis/cERC20.json"));
const yERC20_json_1 = __importDefault(require("./constants/abis/yERC20.json"));
const gauge_factory_mainnet_json_1 = __importDefault(require("./constants/abis/gauge_factory_mainnet.json"));
const gauge_factory_sidechain_json_1 = __importDefault(require("./constants/abis/gauge_factory_sidechain.json"));
const minter_mainnet_json_1 = __importDefault(require("./constants/abis/minter_mainnet.json"));
const votingescrow_json_1 = __importDefault(require("./constants/abis/votingescrow.json"));
const anycall_json_1 = __importDefault(require("./constants/abis/anycall.json"));
const voting_escrow_oracle_json_1 = __importDefault(require("./constants/abis/voting_escrow_oracle.json"));
const voting_escrow_oracle_eth_json_1 = __importDefault(require("./constants/abis/voting_escrow_oracle_eth.json"));
const fee_distributor_json_1 = __importDefault(require("./constants/abis/fee_distributor.json"));
const gaugecontroller_json_1 = __importDefault(require("./constants/abis/gaugecontroller.json"));
const deposit_and_stake_json_1 = __importDefault(require("./constants/abis/deposit_and_stake.json"));
const crypto_calc_json_1 = __importDefault(require("./constants/abis/crypto_calc.json"));
const deposit_and_stake_6coins_json_1 = __importDefault(require("./constants/abis/deposit_and_stake_6coins.json"));
const stable_calc_json_1 = __importDefault(require("./constants/abis/stable_calc.json"));
const router_json_1 = __importDefault(require("./constants/abis/router.json"));
const routerPolygon_json_1 = __importDefault(require("./constants/abis/routerPolygon.json"));
const streamer_json_1 = __importDefault(require("./constants/abis/streamer.json"));
const factory_json_1 = __importDefault(require("./constants/abis/factory.json"));
const factory_eywa_json_1 = __importDefault(require("./constants/abis/factory-eywa.json"));
const factory_admin_json_1 = __importDefault(require("./constants/abis/factory-admin.json"));
const factory_crypto_json_1 = __importDefault(require("./constants/abis/factory-crypto.json"));
const factory_tricrypto_json_1 = __importDefault(require("./constants/abis/factory-tricrypto.json"));
const factory_stable_ng_json_1 = __importDefault(require("./constants/abis/factory-stable-ng.json"));
const gas_oracle_optimism_json_1 = __importDefault(require("./constants/abis/gas_oracle_optimism.json"));
const index_js_2 = require("./constants/pools/index.js");
const aliases_js_1 = require("./constants/aliases.js");
const ethereum_js_1 = require("./constants/coins/ethereum.js");
const optimism_js_1 = require("./constants/coins/optimism.js");
const polygon_js_1 = require("./constants/coins/polygon.js");
const fantom_js_1 = require("./constants/coins/fantom.js");
const avalanche_js_1 = require("./constants/coins/avalanche.js");
const arbitrum_js_1 = require("./constants/coins/arbitrum.js");
const xdai_js_1 = require("./constants/coins/xdai.js");
const moonbeam_js_1 = require("./constants/coins/moonbeam.js");
const aurora_js_1 = require("./constants/coins/aurora.js");
const kava_js_1 = require("./constants/coins/kava.js");
const celo_js_1 = require("./constants/coins/celo.js");
const zksync_js_1 = require("./constants/coins/zksync.js");
const base_js_1 = require("./constants/coins/base.js");
const bsc_js_1 = require("./constants/coins/bsc.js");
const utils_js_1 = require("./constants/utils.js");
const external_api_js_1 = require("./external-api.js");
const L2Networks_js_1 = require("./constants/L2Networks.js");
const _killGauges = async (poolsData) => {
    const gaugeData = await (0, external_api_js_1._getAllGauges)();
    const isKilled = {};
    const gaugeStatuses = {};
    Object.values(gaugeData).forEach((d) => {
        isKilled[d.gauge.toLowerCase()] = d.is_killed ?? false;
        gaugeStatuses[d.gauge.toLowerCase()] = d.gaugeStatus ?? null;
    });
    for (const poolId in poolsData) {
        if (isKilled[poolsData[poolId].gauge_address]) {
            poolsData[poolId].is_gauge_killed = true;
        }
        if (gaugeStatuses[poolsData[poolId].gauge_address]) {
            poolsData[poolId].gauge_status = gaugeStatuses[poolsData[poolId].gauge_address];
        }
    }
};
exports.NATIVE_TOKENS = {
    1: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'.toLowerCase(),
    },
    10: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x4200000000000000000000000000000000000006'.toLowerCase(),
    },
    56: {
        symbol: 'BNB',
        wrappedSymbol: 'WBNB',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'.toLowerCase(),
    },
    100: {
        symbol: 'XDAi',
        wrappedSymbol: 'WXDAI',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d'.toLowerCase(),
    },
    137: {
        symbol: 'MATIC',
        wrappedSymbol: 'WMATIC',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270'.toLowerCase(),
    },
    250: {
        symbol: 'FTM',
        wrappedSymbol: 'WFTM',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83'.toLowerCase(),
    },
    324: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91'.toLowerCase(),
    },
    1284: {
        symbol: 'GLMR',
        wrappedSymbol: 'WGLMR',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xAcc15dC74880C9944775448304B263D191c6077F'.toLowerCase(),
    },
    2222: {
        symbol: 'KAVA',
        wrappedSymbol: 'WKAVA',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xc86c7C0eFbd6A49B35E8714C5f59D99De09A225b'.toLowerCase(),
    },
    8453: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x4200000000000000000000000000000000000006'.toLowerCase(),
    },
    42161: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x82af49447d8a07e3bd95bd0d56f35241523fbab1'.toLowerCase(),
    },
    42220: {
        symbol: 'CELO',
        wrappedSymbol: 'WCELO',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0x3Ad443d769A07f287806874F8E5405cE3Ac902b9'.toLowerCase(),
    },
    43114: {
        symbol: 'AVAX',
        wrappedSymbol: 'WAVAX',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7'.toLowerCase(),
    },
    1313161554: {
        symbol: 'ETH',
        wrappedSymbol: 'WETH',
        address: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
        wrappedAddress: '0xC9BdeEd33CD01541e1eeD10f90519d2C06Fe3feB'.toLowerCase(),
    },
};
exports.NETWORK_CONSTANTS = {
    1: {
        NAME: 'ethereum',
        ALIASES: aliases_js_1.ALIASES_ETHEREUM,
        POOLS_DATA: index_js_2.POOLS_DATA_ETHEREUM,
        LLAMMAS_DATA: index_js_2.LLAMMAS_DATA_ETHEREUM,
        COINS: ethereum_js_1.COINS_ETHEREUM,
        cTokens: ethereum_js_1.cTokensEthereum,
        yTokens: ethereum_js_1.yTokensEthereum,
        ycTokens: ethereum_js_1.ycTokensEthereum,
        aTokens: ethereum_js_1.aTokensEthereum,
    },
    10: {
        NAME: 'optimism',
        ALIASES: aliases_js_1.ALIASES_OPTIMISM,
        POOLS_DATA: index_js_2.POOLS_DATA_OPTIMISM,
        COINS: optimism_js_1.COINS_OPTIMISM,
        cTokens: optimism_js_1.cTokensOptimism,
        yTokens: optimism_js_1.yTokensOptimism,
        ycTokens: optimism_js_1.ycTokensOptimism,
        aTokens: optimism_js_1.aTokensOptimism,
    },
    56: {
        NAME: 'bsc',
        ALIASES: aliases_js_1.ALIASES_BSC,
        POOLS_DATA: index_js_2.POOLS_DATA_BSC,
        COINS: bsc_js_1.COINS_BSC,
        cTokens: bsc_js_1.cTokensBsc,
        yTokens: bsc_js_1.yTokensBsc,
        ycTokens: bsc_js_1.ycTokensBsc,
        aTokens: bsc_js_1.aTokensBsc,
    },
    100: {
        NAME: 'xdai',
        ALIASES: aliases_js_1.ALIASES_XDAI,
        POOLS_DATA: index_js_2.POOLS_DATA_XDAI,
        COINS: xdai_js_1.COINS_XDAI,
        cTokens: xdai_js_1.cTokensXDai,
        yTokens: xdai_js_1.yTokensXDai,
        ycTokens: xdai_js_1.ycTokensXDai,
        aTokens: xdai_js_1.aTokensXDai,
    },
    137: {
        NAME: 'polygon',
        ALIASES: aliases_js_1.ALIASES_POLYGON,
        POOLS_DATA: index_js_2.POOLS_DATA_POLYGON,
        COINS: polygon_js_1.COINS_POLYGON,
        cTokens: polygon_js_1.cTokensPolygon,
        yTokens: polygon_js_1.yTokensPolygon,
        ycTokens: polygon_js_1.ycTokensPolygon,
        aTokens: polygon_js_1.aTokensPolygon,
    },
    250: {
        NAME: 'fantom',
        ALIASES: aliases_js_1.ALIASES_FANTOM,
        POOLS_DATA: index_js_2.POOLS_DATA_FANTOM,
        COINS: fantom_js_1.COINS_FANTOM,
        cTokens: fantom_js_1.cTokensFantom,
        yTokens: fantom_js_1.yTokensFantom,
        ycTokens: fantom_js_1.ycTokensFantom,
        aTokens: fantom_js_1.aTokensFantom,
    },
    324: {
        NAME: 'zksync',
        ALIASES: aliases_js_1.ALIASES_ZKSYNC,
        POOLS_DATA: index_js_2.POOLS_DATA_ZKSYNC,
        COINS: zksync_js_1.COINS_ZKSYNC,
        cTokens: zksync_js_1.cTokensZkSync,
        yTokens: zksync_js_1.yTokensZkSync,
        ycTokens: zksync_js_1.ycTokensZkSync,
        aTokens: zksync_js_1.aTokensZkSync,
    },
    1284: {
        NAME: 'moonbeam',
        ALIASES: aliases_js_1.ALIASES_MOONBEAM,
        POOLS_DATA: index_js_2.POOLS_DATA_MOONBEAM,
        COINS: moonbeam_js_1.COINS_MOONBEAM,
        cTokens: moonbeam_js_1.cTokensMoonbeam,
        yTokens: moonbeam_js_1.yTokensMoonbeam,
        ycTokens: moonbeam_js_1.ycTokensMoonbeam,
        aTokens: moonbeam_js_1.aTokensMoonbeam,
    },
    2222: {
        NAME: 'kava',
        ALIASES: aliases_js_1.ALIASES_KAVA,
        POOLS_DATA: index_js_2.POOLS_DATA_KAVA,
        COINS: kava_js_1.COINS_KAVA,
        cTokens: kava_js_1.cTokensKava,
        yTokens: kava_js_1.yTokensKava,
        ycTokens: kava_js_1.ycTokensKava,
        aTokens: kava_js_1.aTokensKava,
    },
    8453: {
        NAME: 'base',
        ALIASES: aliases_js_1.ALIASES_BASE,
        POOLS_DATA: index_js_2.POOLS_DATA_BASE,
        COINS: base_js_1.COINS_BASE,
        cTokens: base_js_1.cTokensBase,
        yTokens: base_js_1.yTokensBase,
        ycTokens: base_js_1.ycTokensBase,
        aTokens: base_js_1.aTokensBase,
    },
    42161: {
        NAME: 'arbitrum',
        ALIASES: aliases_js_1.ALIASES_ARBITRUM,
        POOLS_DATA: index_js_2.POOLS_DATA_ARBITRUM,
        COINS: arbitrum_js_1.COINS_ARBITRUM,
        cTokens: arbitrum_js_1.cTokensArbitrum,
        yTokens: arbitrum_js_1.yTokensArbitrum,
        ycTokens: arbitrum_js_1.ycTokensArbitrum,
        aTokens: arbitrum_js_1.aTokensArbitrum,
    },
    42220: {
        NAME: 'celo',
        ALIASES: aliases_js_1.ALIASES_CELO,
        POOLS_DATA: index_js_2.POOLS_DATA_CELO,
        COINS: celo_js_1.COINS_CELO,
        cTokens: celo_js_1.cTokensCelo,
        yTokens: celo_js_1.yTokensCelo,
        ycTokens: celo_js_1.ycTokensCelo,
        aTokens: celo_js_1.aTokensCelo,
    },
    43114: {
        NAME: 'avalanche',
        ALIASES: aliases_js_1.ALIASES_AVALANCHE,
        POOLS_DATA: index_js_2.POOLS_DATA_AVALANCHE,
        COINS: avalanche_js_1.COINS_AVALANCHE,
        cTokens: avalanche_js_1.cTokensAvalanche,
        yTokens: avalanche_js_1.yTokensAvalanche,
        ycTokens: avalanche_js_1.ycTokensAvalanche,
        aTokens: avalanche_js_1.aTokensAvalanche,
    },
    1313161554: {
        NAME: 'aurora',
        ALIASES: aliases_js_1.ALIASES_AURORA,
        POOLS_DATA: index_js_2.POOLS_DATA_AURORA,
        COINS: aurora_js_1.COINS_AURORA,
        cTokens: aurora_js_1.cTokensAurora,
        yTokens: aurora_js_1.yTokensAurora,
        ycTokens: aurora_js_1.ycTokensAurora,
        aTokens: aurora_js_1.aTokensAurora,
    },
};
class Curve {
    constructor() {
        this.fetchFactoryPools = async (useApi = true) => {
            if (this.chainId === 1313161554)
                return;
            if (useApi) {
                this.constants.FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory"));
            }
            else {
                this.constants.FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this));
            }
            this.constants.FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.FACTORY_POOLS_DATA);
            await _killGauges(this.constants.FACTORY_POOLS_DATA);
            this.constants.FACTORY_GAUGE_IMPLEMENTATIONS["factory"] = await this.contracts[this.constants.ALIASES.factory].contract.gauge_implementation(this.constantOptions);
        };
        this.fetchCrvusdFactoryPools = async (useApi = true) => {
            if (this.chainId != 1)
                return;
            if (useApi) {
                this.constants.CRVUSD_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory-crvusd"));
            }
            else {
                this.constants.CRVUSD_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, 0, undefined, this.constants.ALIASES.crvusd_factory));
            }
            this.constants.CRVUSD_FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.CRVUSD_FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.CRVUSD_FACTORY_POOLS_DATA);
            await _killGauges(this.constants.CRVUSD_FACTORY_POOLS_DATA);
        };
        this.fetchEywaFactoryPools = async (useApi = true) => {
            if (this.chainId != 250)
                return;
            if (useApi) {
                this.constants.EYWA_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory-eywa"));
            }
            else {
                this.constants.EYWA_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, 0, undefined, this.constants.ALIASES.eywa_factory));
            }
            this.constants.EYWA_FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.EYWA_FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.EYWA_FACTORY_POOLS_DATA);
            await _killGauges(this.constants.EYWA_FACTORY_POOLS_DATA);
        };
        this.fetchCryptoFactoryPools = async (useApi = true) => {
            if (![1, 56, 137, 250, 8453].includes(this.chainId))
                return;
            if (useApi) {
                this.constants.CRYPTO_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory-crypto"));
            }
            else {
                this.constants.CRYPTO_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_crypto_js_1.getCryptoFactoryPoolData.call(this));
            }
            this.constants.CRYPTO_FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            await _killGauges(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            this.constants.FACTORY_GAUGE_IMPLEMENTATIONS["factory-crypto"] = await this.contracts[this.constants.ALIASES.crypto_factory].contract.gauge_implementation(this.constantOptions);
        };
        this.fetchTricryptoFactoryPools = async (useApi = true) => {
            if (![1, 56, 8453, 42161].includes(this.chainId))
                return; // Ethereum, Arbitrum
            if (useApi) {
                this.constants.TRICRYPTO_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory-tricrypto"));
            }
            else {
                this.constants.TRICRYPTO_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_tricrypto_js_1.getTricryptoFactoryPoolData.call(this));
            }
            this.constants.TRICRYPTO_FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            await _killGauges(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            if (this.chainId === 1) {
                this.constants.FACTORY_GAUGE_IMPLEMENTATIONS["factory-tricrypto"] =
                    await this.contracts[this.constants.ALIASES.tricrypto_factory].contract.gauge_implementation(this.constantOptions);
            }
            else {
                this.constants.FACTORY_GAUGE_IMPLEMENTATIONS["factory-tricrypto"] =
                    await this.contracts[this.constants.ALIASES.gauge_factory].contract.get_implementation(this.constantOptions);
            }
        };
        this.fetchStableNgFactoryPools = async (useApi = true) => {
            if (![1, 56, 8453, 42161].includes(this.chainId))
                return;
            if (useApi) {
                this.constants.STABLE_NG_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_api_js_1.getFactoryPoolsDataFromApi.call(this, "factory-stable-ng"));
            }
            else {
                this.constants.STABLE_NG_FACTORY_POOLS_DATA = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, 0, undefined, this.constants.ALIASES.stable_ng_factory));
            }
            this.constants.STABLE_NG_FACTORY_POOLS_DATA = await this._filterHiddenPools(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
            this._updateDecimalsAndGauges(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
            await _killGauges(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
        };
        this.fetchNewFactoryPools = async () => {
            if (this.chainId === 1313161554)
                return [];
            const currentPoolIds = Object.keys(this.constants.FACTORY_POOLS_DATA);
            const lastPoolIdx = currentPoolIds.length === 0 ? -1 : Number(currentPoolIds[currentPoolIds.length - 1].split("-")[2]);
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, lastPoolIdx + 1));
            this.constants.FACTORY_POOLS_DATA = { ...this.constants.FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.FACTORY_POOLS_DATA);
            return Object.keys(poolData);
        };
        this.fetchNewStableNgFactoryPools = async () => {
            const currentPoolIds = Object.keys(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
            const lastPoolIdx = currentPoolIds.length === 0 ? -1 : Number(currentPoolIds[currentPoolIds.length - 1].split("-")[2]);
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, lastPoolIdx + 1));
            this.constants.STABLE_NG_FACTORY_POOLS_DATA = { ...this.constants.FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
            return Object.keys(poolData);
        };
        this.fetchNewCryptoFactoryPools = async () => {
            if (![1, 56, 137, 250, 8453].includes(this.chainId))
                return [];
            const currentPoolIds = Object.keys(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            const lastPoolIdx = currentPoolIds.length === 0 ? -1 : Number(currentPoolIds[currentPoolIds.length - 1].split("-")[2]);
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_crypto_js_1.getCryptoFactoryPoolData.call(this, lastPoolIdx + 1));
            this.constants.CRYPTO_FACTORY_POOLS_DATA = { ...this.constants.CRYPTO_FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            return Object.keys(poolData);
        };
        this.fetchNewTricryptoFactoryPools = async () => {
            if (![1, 56, 8453, 42161].includes(this.chainId))
                return []; // Ethereum, Arbitrum
            const currentPoolIds = Object.keys(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            const lastPoolIdx = currentPoolIds.length === 0 ? -1 : Number(currentPoolIds[currentPoolIds.length - 1].split("-")[2]);
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_tricrypto_js_1.getTricryptoFactoryPoolData.call(this, lastPoolIdx + 1));
            this.constants.TRICRYPTO_FACTORY_POOLS_DATA = { ...this.constants.TRICRYPTO_FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            return Object.keys(poolData);
        };
        this.fetchRecentlyDeployedFactoryPool = async (poolAddress) => {
            if (this.chainId === 1313161554)
                return '';
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, 0, poolAddress));
            this.constants.FACTORY_POOLS_DATA = { ...this.constants.FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.FACTORY_POOLS_DATA);
            return Object.keys(poolData)[0]; // id
        };
        this.fetchRecentlyDeployedStableNgFactoryPool = async (poolAddress) => {
            if (this.chainId === 1313161554)
                return '';
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_js_1.getFactoryPoolData.call(this, 0, poolAddress, this.constants.ALIASES.stable_ng_factory));
            this.constants.STABLE_NG_FACTORY_POOLS_DATA = { ...this.constants.STABLE_NG_FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
            return Object.keys(poolData)[0]; // id
        };
        this.fetchRecentlyDeployedCryptoFactoryPool = async (poolAddress) => {
            if (![1, 56, 137, 250, 8453].includes(this.chainId))
                return '';
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_crypto_js_1.getCryptoFactoryPoolData.call(this, 0, poolAddress));
            this.constants.CRYPTO_FACTORY_POOLS_DATA = { ...this.constants.CRYPTO_FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.CRYPTO_FACTORY_POOLS_DATA);
            return Object.keys(poolData)[0]; // id
        };
        this.fetchRecentlyDeployedTricryptoFactoryPool = async (poolAddress) => {
            if (![1, 56, 8453, 42161].includes(this.chainId))
                return ''; // Ethereum, Arbitrum
            const poolData = (0, utils_js_1.lowerCasePoolDataAddresses)(await factory_tricrypto_js_1.getTricryptoFactoryPoolData.call(this, 0, poolAddress));
            this.constants.TRICRYPTO_FACTORY_POOLS_DATA = { ...this.constants.TRICRYPTO_FACTORY_POOLS_DATA, ...poolData };
            this._updateDecimalsAndGauges(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
            return Object.keys(poolData)[0]; // id
        };
        this.getMainPoolList = () => Object.keys(this.constants.POOLS_DATA);
        this.getFactoryPoolList = () => Object.keys(this.constants.FACTORY_POOLS_DATA);
        this.getCrvusdFactoryPoolList = () => Object.keys(this.constants.CRVUSD_FACTORY_POOLS_DATA);
        this.getEywaFactoryPoolList = () => Object.keys(this.constants.EYWA_FACTORY_POOLS_DATA);
        this.getCryptoFactoryPoolList = () => Object.keys(this.constants.CRYPTO_FACTORY_POOLS_DATA);
        this.getTricryptoFactoryPoolList = () => Object.keys(this.constants.TRICRYPTO_FACTORY_POOLS_DATA);
        this.getStableNgFactoryPoolList = () => Object.keys(this.constants.STABLE_NG_FACTORY_POOLS_DATA);
        this.getPoolList = () => {
            return [
                ...this.getMainPoolList(),
                ...this.getFactoryPoolList(),
                ...this.getCrvusdFactoryPoolList(),
                ...this.getEywaFactoryPoolList(),
                ...this.getCryptoFactoryPoolList(),
                ...this.getTricryptoFactoryPoolList(),
                ...this.getStableNgFactoryPoolList(),
            ];
        };
        this.getPoolsData = () => ({
            ...this.constants.POOLS_DATA,
            ...this.constants.FACTORY_POOLS_DATA,
            ...this.constants.CRVUSD_FACTORY_POOLS_DATA,
            ...this.constants.EYWA_FACTORY_POOLS_DATA,
            ...this.constants.CRYPTO_FACTORY_POOLS_DATA,
            ...this.constants.TRICRYPTO_FACTORY_POOLS_DATA,
            ...this.constants.STABLE_NG_FACTORY_POOLS_DATA,
            ...this.constants.LLAMMAS_DATA,
        });
        this.getGaugeImplementation = (factoryType) => this.constants.FACTORY_GAUGE_IMPLEMENTATIONS[factoryType] || this.constants.ZERO_ADDRESS;
        // @ts-ignore
        this.provider = null;
        // @ts-ignore
        this.signer = null;
        this.signerAddress = '';
        this.chainId = 1;
        // @ts-ignore
        this.multicallProvider = null;
        this.contracts = {};
        this.feeData = {};
        this.constantOptions = { gasLimit: 12000000 };
        this.options = {};
        this.constants = {
            NATIVE_TOKEN: exports.NATIVE_TOKENS[1],
            NETWORK_NAME: 'ethereum',
            ALIASES: {},
            POOLS_DATA: {},
            FACTORY_POOLS_DATA: {},
            CRVUSD_FACTORY_POOLS_DATA: {},
            EYWA_FACTORY_POOLS_DATA: {},
            CRYPTO_FACTORY_POOLS_DATA: {},
            TRICRYPTO_FACTORY_POOLS_DATA: {},
            STABLE_NG_FACTORY_POOLS_DATA: {},
            LLAMMAS_DATA: {},
            COINS: {},
            DECIMALS: {},
            GAUGES: [],
            FACTORY_GAUGE_IMPLEMENTATIONS: {},
            ZERO_ADDRESS: ethers_1.ethers.ZeroAddress,
        };
    }
    async init(providerType, providerSettings, options = {} // gasPrice in Gwei
    ) {
        // @ts-ignore
        this.provider = null;
        // @ts-ignore
        this.signer = null;
        this.signerAddress = '';
        this.chainId = 1;
        // @ts-ignore
        this.multicallProvider = null;
        this.contracts = {};
        this.feeData = {};
        this.constantOptions = { gasLimit: 12000000 };
        this.options = {};
        this.constants = {
            NATIVE_TOKEN: exports.NATIVE_TOKENS[1],
            NETWORK_NAME: 'ethereum',
            ALIASES: {},
            POOLS_DATA: {},
            FACTORY_POOLS_DATA: {},
            CRVUSD_FACTORY_POOLS_DATA: {},
            EYWA_FACTORY_POOLS_DATA: {},
            CRYPTO_FACTORY_POOLS_DATA: {},
            TRICRYPTO_FACTORY_POOLS_DATA: {},
            STABLE_NG_FACTORY_POOLS_DATA: {},
            LLAMMAS_DATA: {},
            COINS: {},
            DECIMALS: {},
            GAUGES: [],
            FACTORY_GAUGE_IMPLEMENTATIONS: {},
            ZERO_ADDRESS: ethers_1.ethers.ZeroAddress,
        };
        // JsonRpc provider
        if (providerType.toLowerCase() === 'JsonRpc'.toLowerCase()) {
            providerSettings = providerSettings;
            let jsonRpcApiProviderOptions;
            if (providerSettings.batchMaxCount) {
                jsonRpcApiProviderOptions = {
                    batchMaxCount: providerSettings.batchMaxCount,
                };
            }
            if (providerSettings.url) {
                this.provider = new ethers_1.ethers.JsonRpcProvider(providerSettings.url, undefined, jsonRpcApiProviderOptions);
            }
            else {
                this.provider = new ethers_1.ethers.JsonRpcProvider('http://localhost:8545/', undefined, jsonRpcApiProviderOptions);
            }
            if (providerSettings.privateKey) {
                this.signer = new ethers_1.ethers.Wallet(providerSettings.privateKey, this.provider);
            }
            else if (!providerSettings.url?.startsWith("https://rpc.gnosischain.com")) {
                try {
                    this.signer = await this.provider.getSigner();
                }
                catch (e) {
                    this.signer = null;
                }
            }
            // Web3 provider
        }
        else if (providerType.toLowerCase() === 'Web3'.toLowerCase()) {
            providerSettings = providerSettings;
            this.provider = new ethers_1.ethers.BrowserProvider(providerSettings.externalProvider);
            this.signer = await this.provider.getSigner();
            // Infura provider
        }
        else if (providerType.toLowerCase() === 'Infura'.toLowerCase()) {
            providerSettings = providerSettings;
            this.provider = new ethers_1.ethers.InfuraProvider(providerSettings.network, providerSettings.apiKey);
            this.signer = null;
            // Alchemy provider
        }
        else if (providerType.toLowerCase() === 'Alchemy'.toLowerCase()) {
            providerSettings = providerSettings;
            this.provider = new ethers_1.ethers.AlchemyProvider(providerSettings.network, providerSettings.apiKey);
            this.signer = null;
        }
        else {
            throw Error('Wrong providerType');
        }
        const network = await this.provider.getNetwork();
        console.log("CURVE-JS IS CONNECTED TO NETWORK:", { name: network.name.toUpperCase(), chainId: Number(network.chainId) });
        this.chainId = Number(network.chainId) === 133 || Number(network.chainId) === 31337 ? 1 : Number(network.chainId);
        this.constants.NATIVE_TOKEN = exports.NATIVE_TOKENS[this.chainId];
        this.constants.NETWORK_NAME = exports.NETWORK_CONSTANTS[this.chainId].NAME;
        this.constants.ALIASES = exports.NETWORK_CONSTANTS[this.chainId].ALIASES;
        this.constants.ALIASES.anycall = "0x37414a8662bc1d25be3ee51fb27c2686e2490a89";
        this.constants.ALIASES.voting_escrow_oracle = "0x12F407340697Ae0b177546E535b91A5be021fBF9";
        this.constants.POOLS_DATA = exports.NETWORK_CONSTANTS[this.chainId].POOLS_DATA;
        if (this.chainId === 1)
            this.constants.LLAMMAS_DATA = exports.NETWORK_CONSTANTS[this.chainId].LLAMMAS_DATA;
        for (const poolId in this.constants.POOLS_DATA)
            this.constants.POOLS_DATA[poolId].in_api = true;
        this.constants.COINS = exports.NETWORK_CONSTANTS[this.chainId].COINS;
        this.constants.DECIMALS = (0, utils_js_1.extractDecimals)({ ...this.constants.POOLS_DATA, ...this.constants.LLAMMAS_DATA });
        this.constants.DECIMALS[this.constants.NATIVE_TOKEN.address] = 18;
        this.constants.DECIMALS[this.constants.NATIVE_TOKEN.wrappedAddress] = 18;
        this.constants.GAUGES = (0, utils_js_1.extractGauges)(this.constants.POOLS_DATA);
        const [cTokens, yTokens, ycTokens, aTokens] = [
            exports.NETWORK_CONSTANTS[this.chainId].cTokens,
            exports.NETWORK_CONSTANTS[this.chainId].yTokens,
            exports.NETWORK_CONSTANTS[this.chainId].ycTokens,
            exports.NETWORK_CONSTANTS[this.chainId].aTokens,
        ];
        const customAbiTokens = [...cTokens, ...yTokens, ...ycTokens, ...aTokens];
        await _killGauges(this.constants.POOLS_DATA);
        this.multicallProvider = new index_js_1.Provider(this.chainId, this.provider);
        if (this.signer) {
            try {
                this.signerAddress = await this.signer.getAddress();
            }
            catch (err) {
                this.signer = null;
            }
        }
        else {
            this.signerAddress = '';
        }
        this.feeData = { gasPrice: options.gasPrice, maxFeePerGas: options.maxFeePerGas, maxPriorityFeePerGas: options.maxPriorityFeePerGas };
        await this.updateFeeData();
        for (const pool of Object.values({ ...this.constants.POOLS_DATA, ...this.constants.LLAMMAS_DATA })) {
            this.setContract(pool.swap_address, pool.swap_abi);
            if (pool.token_address !== pool.swap_address) {
                this.setContract(pool.token_address, ERC20_json_1.default);
            }
            if (pool.gauge_address !== this.constants.ZERO_ADDRESS) {
                this.setContract(pool.gauge_address, pool.gauge_abi);
            }
            if (pool.deposit_address && !this.contracts[pool.deposit_address]) {
                this.setContract(pool.deposit_address, pool.deposit_abi);
            }
            for (const coinAddr of pool.underlying_coin_addresses) {
                this.setContract(coinAddr, ERC20_json_1.default);
            }
            for (const coinAddr of pool.wrapped_coin_addresses) {
                if (customAbiTokens.includes(coinAddr))
                    continue;
                if (coinAddr in this.contracts)
                    continue;
                this.setContract(coinAddr, ERC20_json_1.default);
            }
            // TODO add all coins
            for (const coinAddr of pool.wrapped_coin_addresses) {
                if (cTokens.includes(coinAddr)) {
                    this.setContract(coinAddr, cERC20_json_1.default);
                }
                if (aTokens.includes(coinAddr)) {
                    this.setContract(coinAddr, ERC20_json_1.default);
                }
                if (yTokens.includes(coinAddr) || ycTokens.includes(coinAddr)) {
                    this.setContract(coinAddr, yERC20_json_1.default);
                }
            }
            if (pool.reward_contract) {
                this.setContract(pool.reward_contract, streamer_json_1.default);
            }
            if (pool.sCurveRewards_address) {
                this.setContract(pool.sCurveRewards_address, pool.sCurveRewards_abi);
            }
        }
        this.setContract(this.constants.NATIVE_TOKEN.wrappedAddress, ERC20_json_1.default);
        this.setContract(this.constants.ALIASES.crv, ERC20_json_1.default);
        this.constants.DECIMALS[this.constants.ALIASES.crv] = 18;
        const _gaugeFactoryABI = this.chainId === 1 ? gauge_factory_mainnet_json_1.default : gauge_factory_sidechain_json_1.default;
        this.setContract(this.constants.ALIASES.gauge_factory, _gaugeFactoryABI);
        if (this.chainId === 1) {
            this.setContract(this.constants.ALIASES.minter, minter_mainnet_json_1.default);
        }
        this.setContract(this.constants.ALIASES.voting_escrow, votingescrow_json_1.default);
        this.setContract(this.constants.ALIASES.fee_distributor, fee_distributor_json_1.default);
        this.setContract(this.constants.ALIASES.gauge_controller, gaugecontroller_json_1.default);
        if (this.chainId == 137) {
            this.setContract(this.constants.ALIASES.router, routerPolygon_json_1.default);
        }
        else {
            this.setContract(this.constants.ALIASES.router, router_json_1.default);
        }
        if (this.chainId === 137) {
            this.setContract(this.constants.ALIASES.deposit_and_stake, deposit_and_stake_6coins_json_1.default);
        }
        else {
            this.setContract(this.constants.ALIASES.deposit_and_stake, deposit_and_stake_json_1.default);
        }
        this.setContract(this.constants.ALIASES.crypto_calc, crypto_calc_json_1.default);
        this.setContract(this.constants.ALIASES.stable_calc, stable_calc_json_1.default);
        this.setContract(this.constants.ALIASES.factory, factory_json_1.default);
        if (this.chainId !== 1313161554) {
            const factoryContract = this.contracts[this.constants.ALIASES.factory].contract;
            this.constants.ALIASES.factory_admin = (await factoryContract.admin(this.constantOptions)).toLowerCase();
            this.setContract(this.constants.ALIASES.factory_admin, factory_admin_json_1.default);
        }
        this.setContract(this.constants.ALIASES.crvusd_factory, factory_json_1.default);
        this.setContract(this.constants.ALIASES.eywa_factory, factory_eywa_json_1.default);
        this.setContract(this.constants.ALIASES.crypto_factory, factory_crypto_json_1.default);
        this.setContract(this.constants.ALIASES.tricrypto_factory, factory_tricrypto_json_1.default);
        this.setContract(this.constants.ALIASES.stable_ng_factory, factory_stable_ng_json_1.default);
        this.setContract(this.constants.ALIASES.anycall, anycall_json_1.default);
        this.setContract(this.constants.ALIASES.voting_escrow_oracle, this.chainId === 1 ? voting_escrow_oracle_eth_json_1.default : voting_escrow_oracle_json_1.default);
        if (L2Networks_js_1.L2Networks.includes(this.chainId)) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const curveInstance = this;
            curveInstance.setContract(curveInstance.constants.ALIASES.gas_oracle, gas_oracle_optimism_json_1.default);
            // @ts-ignore
            if (ethers_1.AbstractProvider.prototype.originalEstimate) {
                // @ts-ignore
                ethers_1.AbstractProvider.prototype.estimateGas = ethers_1.AbstractProvider.prototype.originalEstimate;
            }
            const originalEstimate = ethers_1.AbstractProvider.prototype.estimateGas;
            const oldEstimate = async function (arg) {
                // @ts-ignore
                const originalEstimateFunc = originalEstimate.bind(this);
                const gas = await originalEstimateFunc(arg);
                return gas;
            };
            //Override
            const newEstimate = async function (arg) {
                // @ts-ignore
                const L2EstimateGas = originalEstimate.bind(this);
                const L1GasUsed = await curveInstance.contracts[curveInstance.constants.ALIASES.gas_oracle].contract.getL1GasUsed(arg.data);
                const L2GasUsed = await L2EstimateGas(arg);
                return [L2GasUsed, L1GasUsed];
            };
            // @ts-ignore
            ethers_1.AbstractProvider.prototype.estimateGas = newEstimate;
            // @ts-ignore
            ethers_1.AbstractProvider.prototype.originalEstimate = oldEstimate;
        }
        else {
            // @ts-ignore
            if (ethers_1.AbstractProvider.prototype.originalEstimate) {
                // @ts-ignore
                ethers_1.AbstractProvider.prototype.estimateGas = ethers_1.AbstractProvider.prototype.originalEstimate;
            }
        }
    }
    setContract(address, abi) {
        this.contracts[address] = {
            contract: new ethers_1.Contract(address, abi, this.signer || this.provider),
            multicallContract: new index_js_1.Contract(address, abi),
        };
    }
    async _filterHiddenPools(pools) {
        const hiddenPools = (await (0, external_api_js_1._getHiddenPools)())[this.constants.NETWORK_NAME] || [];
        // @ts-ignore
        return Object.fromEntries(Object.entries(pools).filter(([id]) => !hiddenPools.includes(id)));
    }
    _updateDecimalsAndGauges(pools) {
        this.constants.DECIMALS = { ...this.constants.DECIMALS, ...(0, utils_js_1.extractDecimals)(pools) };
        this.constants.GAUGES = [...this.constants.GAUGES, ...(0, utils_js_1.extractGauges)(pools)];
    }
    setCustomFeeData(customFeeData) {
        this.feeData = { ...this.feeData, ...customFeeData };
    }
    formatUnits(value, unit) {
        return ethers_1.ethers.formatUnits(value, unit);
    }
    parseUnits(value, unit) {
        return ethers_1.ethers.parseUnits(value, unit);
    }
    async updateFeeData() {
        const feeData = await this.provider.getFeeData();
        if (feeData.maxFeePerGas === null || feeData.maxPriorityFeePerGas === null) {
            delete this.options.maxFeePerGas;
            delete this.options.maxPriorityFeePerGas;
            this.options.gasPrice = this.feeData.gasPrice !== undefined ?
                this.parseUnits(this.feeData.gasPrice.toString(), "gwei") :
                (feeData.gasPrice || this.parseUnits("20", "gwei"));
        }
        else {
            delete this.options.gasPrice;
            this.options.maxFeePerGas = this.feeData.maxFeePerGas !== undefined ?
                this.parseUnits(this.feeData.maxFeePerGas.toString(), "gwei") :
                feeData.maxFeePerGas;
            this.options.maxPriorityFeePerGas = this.feeData.maxPriorityFeePerGas !== undefined ?
                this.parseUnits(this.feeData.maxPriorityFeePerGas.toString(), "gwei") :
                feeData.maxPriorityFeePerGas;
        }
    }
}
exports.curve = new Curve();
