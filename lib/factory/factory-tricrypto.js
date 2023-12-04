"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTricryptoFactoryPoolData = void 0;
const curve_js_1 = require("../curve.js");
const ERC20_json_1 = __importDefault(require("../constants/abis/ERC20.json"));
const factory_tricrypto_pool_json_1 = __importDefault(require("../constants/abis/factory-tricrypto/factory-tricrypto-pool.json"));
const gauge_factory_json_1 = __importDefault(require("../constants/abis/gauge_factory.json"));
const gauge_child_json_1 = __importDefault(require("../constants/abis/gauge_child.json"));
const deepFlatten = (arr) => [].concat(...arr.map((v) => (Array.isArray(v) ? deepFlatten(v) : v)));
async function getRecentlyCreatedCryptoPoolId(swapAddress) {
    const factoryContract = this.contracts[this.constants.ALIASES.tricrypto_factory].contract;
    const poolCount = Number(curve_js_1.curve.formatUnits(await factoryContract.pool_count(this.constantOptions), 0));
    for (let i = 1; i <= poolCount; i++) {
        const address = await factoryContract.pool_list(poolCount - i);
        if (address.toLowerCase() === swapAddress.toLowerCase())
            return `factory-tricrypto-${poolCount - i}`;
    }
    throw Error("Unknown pool");
}
async function getCryptoFactoryIdsAndSwapAddresses(fromIdx = 0) {
    const factoryContract = this.contracts[this.constants.ALIASES.tricrypto_factory].contract;
    const factoryMulticallContract = this.contracts[this.constants.ALIASES.tricrypto_factory].multicallContract;
    const poolCount = Number(curve_js_1.curve.formatUnits(await factoryContract.pool_count(this.constantOptions), 0));
    const calls = [];
    for (let i = fromIdx; i < poolCount; i++) {
        calls.push(factoryMulticallContract.pool_list(i));
    }
    if (calls.length === 0)
        return [[], []];
    let factories = (await this.multicallProvider.all(calls)).map((addr, i) => ({ id: `factory-tricrypto-${fromIdx + i}`, address: addr.toLowerCase() }));
    const swapAddresses = Object.values(this.constants.POOLS_DATA).map((pool) => pool.swap_address.toLowerCase());
    factories = factories.filter((f) => !swapAddresses.includes(f.address));
    return [factories.map((f) => f.id), factories.map((f) => f.address)];
}
function _handleCoinAddresses(coinAddresses) {
    return coinAddresses.map((addresses) => addresses.map((addr) => this.chainId === 137 && addr === "0x0000000000000000000000000000000000001010" ? this.constants.NATIVE_TOKEN.wrappedAddress : addr.toLowerCase()));
}
async function getPoolsData(factorySwapAddresses) {
    if (this.chainId === 1) {
        const factoryMulticallContract = this.contracts[this.constants.ALIASES.tricrypto_factory].multicallContract;
        const calls = [];
        for (const addr of factorySwapAddresses) {
            calls.push(factoryMulticallContract.get_gauge(addr));
            calls.push(factoryMulticallContract.get_coins(addr));
        }
        const res = await this.multicallProvider.all(calls);
        const gaugeAddresses = res.filter((a, i) => i % 2 == 0).map((a) => a.toLowerCase());
        const coinAddresses = _handleCoinAddresses.call(this, res.filter((a, i) => i % 2 == 1));
        return [gaugeAddresses, coinAddresses];
    }
    else {
        const factoryMulticallContract = this.contracts[this.constants.ALIASES.tricrypto_factory].multicallContract;
        const isFactoryGaugeNull = this.constants.ALIASES.gauge_factory === '0x0000000000000000000000000000000000000000';
        const factoryMulticallGaugeContract = this.contracts[this.constants.ALIASES.gauge_factory].multicallContract;
        const calls = [];
        for (const addr of factorySwapAddresses) {
            if (!isFactoryGaugeNull) {
                calls.push(factoryMulticallGaugeContract.get_gauge_from_lp_token(addr));
            }
            calls.push(factoryMulticallContract.get_coins(addr));
        }
        const res = await this.multicallProvider.all(calls);
        if (!isFactoryGaugeNull) {
            const gaugeAddresses = res.filter((a, i) => i % 2 == 0).map((a) => a.toLowerCase());
            const coinAddresses = _handleCoinAddresses.call(this, res.filter((a, i) => i % 2 == 1));
            return [gaugeAddresses, coinAddresses];
        }
        else {
            const coinAddresses = _handleCoinAddresses.call(this, res.filter((a, i) => i % 2 == 0));
            const gaugeAddresses = Array.from(Array(factorySwapAddresses.length)).map(() => '0x0000000000000000000000000000000000000000');
            return [gaugeAddresses, coinAddresses];
        }
    }
}
function setCryptoFactorySwapContracts(factorySwapAddresses) {
    factorySwapAddresses.forEach((addr) => {
        this.setContract(addr, factory_tricrypto_pool_json_1.default);
    });
}
function setCryptoFactoryTokenContracts(factoryTokenAddresses) {
    factoryTokenAddresses.forEach((addr) => {
        this.setContract(addr, ERC20_json_1.default);
    });
}
function setCryptoFactoryGaugeContracts(factoryGaugeAddresses) {
    factoryGaugeAddresses.filter((addr) => addr !== curve_js_1.curve.constants.ZERO_ADDRESS).forEach((addr, i) => {
        this.setContract(addr, this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default);
    });
}
function setCryptoFactoryCoinsContracts(coinAddresses) {
    const flattenedCoinAddresses = Array.from(new Set(deepFlatten(coinAddresses)));
    for (const addr of flattenedCoinAddresses) {
        if (addr in this.contracts)
            continue;
        this.setContract(addr, ERC20_json_1.default);
    }
}
function getCryptoFactoryUnderlyingCoinAddresses(coinAddresses) {
    return [...coinAddresses.map((coins) => coins.map((c) => c === this.constants.NATIVE_TOKEN.wrappedAddress ? this.constants.NATIVE_TOKEN.address : c))];
}
function getExistingCoinAddressNameDict() {
    const dict = {};
    for (const poolData of Object.values(this.constants.POOLS_DATA)) {
        poolData.wrapped_coin_addresses.forEach((addr, i) => {
            if (!(addr.toLowerCase() in dict)) {
                dict[addr.toLowerCase()] = poolData.wrapped_coins[i];
            }
        });
        poolData.underlying_coin_addresses.forEach((addr, i) => {
            if (!(addr.toLowerCase() in dict)) {
                dict[addr.toLowerCase()] = poolData.underlying_coins[i];
            }
        });
    }
    dict[this.constants.NATIVE_TOKEN.address] = this.constants.NATIVE_TOKEN.symbol;
    return dict;
}
async function getCoinsData(tokenAddresses, coinAddresses, existingCoinAddrNameDict, existingCoinAddrDecimalsDict) {
    const flattenedCoinAddresses = Array.from(new Set(deepFlatten(coinAddresses)));
    const newCoinAddresses = [];
    const coinAddrNamesDict = {};
    const coinAddrDecimalsDict = {};
    for (const addr of flattenedCoinAddresses) {
        if (addr in existingCoinAddrNameDict) {
            coinAddrNamesDict[addr] = existingCoinAddrNameDict[addr];
            coinAddrDecimalsDict[addr] = existingCoinAddrDecimalsDict[addr];
        }
        else if (addr === "0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2") {
            coinAddrNamesDict[addr] = "MKR";
        }
        else {
            newCoinAddresses.push(addr);
        }
    }
    const calls = [];
    for (const addr of tokenAddresses) {
        calls.push(this.contracts[addr].multicallContract.symbol());
        calls.push(this.contracts[addr].multicallContract.name());
    }
    for (const addr of newCoinAddresses) {
        calls.push(this.contracts[addr].multicallContract.symbol());
        calls.push(this.contracts[addr].multicallContract.decimals());
    }
    const res = await this.multicallProvider.all(calls);
    const res1 = res.slice(0, tokenAddresses.length * 2);
    const tokenSymbols = res1.filter((a, i) => i % 2 == 0);
    const tokenNames = res1.filter((a, i) => i % 2 == 1);
    const res2 = res.slice(tokenAddresses.length * 2);
    const symbols = res2.filter((a, i) => i % 2 == 0);
    const decimals = res2.filter((a, i) => i % 2 == 1).map((_d) => Number(curve_js_1.curve.formatUnits(_d, 0)));
    newCoinAddresses.forEach((addr, i) => {
        coinAddrNamesDict[addr] = symbols[i];
        coinAddrDecimalsDict[addr] = decimals[i];
    });
    coinAddrNamesDict[this.constants.NATIVE_TOKEN.address] = this.constants.NATIVE_TOKEN.symbol;
    coinAddrDecimalsDict[this.constants.NATIVE_TOKEN.address] = 18;
    return [tokenSymbols, tokenNames, coinAddrNamesDict, coinAddrDecimalsDict];
}
async function getTricryptoFactoryPoolData(fromIdx = 0, swapAddress) {
    const [poolIds, swapAddresses] = swapAddress ?
        [[await getRecentlyCreatedCryptoPoolId.call(this, swapAddress)], [swapAddress.toLowerCase()]]
        : await getCryptoFactoryIdsAndSwapAddresses.call(this, fromIdx);
    if (poolIds.length === 0)
        return {};
    const [gaugeAddresses, coinAddresses] = await getPoolsData.call(this, swapAddresses);
    setCryptoFactorySwapContracts.call(this, swapAddresses);
    setCryptoFactoryGaugeContracts.call(this, gaugeAddresses);
    setCryptoFactoryCoinsContracts.call(this, coinAddresses);
    const underlyingCoinAddresses = getCryptoFactoryUnderlyingCoinAddresses.call(this, coinAddresses);
    const existingCoinAddressNameDict = getExistingCoinAddressNameDict.call(this);
    const [poolSymbols, poolNames, coinAddressNameDict, coinAddressDecimalsDict] = await getCoinsData.call(this, swapAddresses, coinAddresses, existingCoinAddressNameDict, this.constants.DECIMALS);
    const TRICRYPTO_FACTORY_POOLS_DATA = {};
    for (let i = 0; i < poolIds.length; i++) {
        TRICRYPTO_FACTORY_POOLS_DATA[poolIds[i]] = {
            name: poolNames[i],
            full_name: poolNames[i],
            symbol: poolSymbols[i],
            reference_asset: "CRYPTO",
            swap_address: swapAddresses[i],
            token_address: swapAddresses[i],
            gauge_address: gaugeAddresses[i],
            is_crypto: true,
            is_plain: underlyingCoinAddresses[i].toString() === coinAddresses[i].toString(),
            is_factory: true,
            underlying_coins: [...underlyingCoinAddresses[i].map((addr) => coinAddressNameDict[addr])],
            wrapped_coins: [...coinAddresses[i].map((addr) => coinAddressNameDict[addr])],
            underlying_coin_addresses: underlyingCoinAddresses[i],
            wrapped_coin_addresses: coinAddresses[i],
            underlying_decimals: [...underlyingCoinAddresses[i].map((addr) => coinAddressDecimalsDict[addr])],
            wrapped_decimals: [...coinAddresses[i].map((addr) => coinAddressDecimalsDict[addr])],
            swap_abi: factory_tricrypto_pool_json_1.default,
            gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
        };
    }
    return TRICRYPTO_FACTORY_POOLS_DATA;
}
exports.getTricryptoFactoryPoolData = getTricryptoFactoryPoolData;
