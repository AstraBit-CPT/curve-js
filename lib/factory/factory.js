"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFactoryPoolData = exports.getBasePoolIds = exports.BLACK_LIST = void 0;
const index_js_1 = require("../dependencies/ethcall/index.js");
const curve_js_1 = require("../curve.js");
const ERC20_json_1 = __importDefault(require("../constants/abis/ERC20.json"));
const gauge_factory_json_1 = __importDefault(require("../constants/abis/gauge_factory.json"));
const gauge_child_json_1 = __importDefault(require("../constants/abis/gauge_child.json"));
const common_js_1 = require("./common.js");
const constants_js_1 = require("./constants.js");
const utils_js_1 = require("../utils.js");
exports.BLACK_LIST = {
    1: [
        "0x066b6e1e93fa7dcd3f0eb7f8bac7d5a747ce0bf9",
        "0xc61557c5d177bd7dc889a3b621eec333e168f68a",
    ],
    137: [
        "0x666dc3b4babfd063faf965bd020024af0dc51b64",
        "0xe4199bc5c5c1f63dba47b56b6db7144c51cf0bf8",
        "0x88c4d6534165510b2e2caf0a130d4f70aa4b6d71",
    ],
    42161: [
        "0xd7bb79aee866672419999a0496d99c54741d67b5",
    ],
};
const deepFlatten = (arr) => [].concat(...arr.map((v) => (Array.isArray(v) ? deepFlatten(v) : v)));
async function getBasePoolIds(factoryAddress, rawSwapAddresses, tmpPools) {
    const factoryMulticallContract = this.contracts[factoryAddress].multicallContract;
    const calls = [];
    for (const addr of rawSwapAddresses) {
        calls.push(factoryMulticallContract.get_base_pool(addr));
    }
    const result = await this.multicallProvider.all(calls);
    const basePoolIds = [];
    result.forEach((item) => {
        if (item !== '0x0000000000000000000000000000000000000000') {
            basePoolIds.push((0, common_js_1.getPoolIdByAddress)(tmpPools, item));
        }
        else {
            basePoolIds.push('');
        }
    });
    return basePoolIds;
}
exports.getBasePoolIds = getBasePoolIds;
async function getRecentlyCreatedPoolId(swapAddress, factoryAddress) {
    const factoryContract = this.contracts[factoryAddress].contract;
    const prefix = factoryAddress === this.constants.ALIASES.factory ? 'factory-v2' : 'factory-stable-ng';
    const poolCount = Number(curve_js_1.curve.formatUnits(await factoryContract.pool_count(this.constantOptions), 0));
    for (let i = 1; i <= poolCount; i++) {
        const address = await factoryContract.pool_list(poolCount - i);
        if (address.toLowerCase() === swapAddress.toLowerCase())
            return `${prefix}-${poolCount - i}`;
    }
    throw Error("Unknown pool");
}
async function getFactoryIdsAndSwapAddresses(fromIdx = 0, factoryAddress) {
    const factoryContract = this.contracts[factoryAddress].contract;
    const factoryMulticallContract = this.contracts[factoryAddress].multicallContract;
    const poolCount = Number(curve_js_1.curve.formatUnits(await factoryContract.pool_count(this.constantOptions), 0));
    const calls = [];
    for (let i = fromIdx; i < poolCount; i++) {
        calls.push(factoryMulticallContract.pool_list(i));
    }
    if (calls.length === 0)
        return [[], []];
    const prefix = factoryAddress === this.constants.ALIASES.factory ? "factory-v2-" :
        factoryAddress === this.constants.ALIASES.crvusd_factory ? "factory-crvusd-" :
            factoryAddress === this.constants.ALIASES.stable_ng_factory ? "factory-stable-ng-" : "factory-eywa-";
    let factories = (await this.multicallProvider.all(calls)).map((addr, i) => ({ id: prefix + (fromIdx + i), address: addr.toLowerCase() }));
    const swapAddresses = Object.values(this.constants.POOLS_DATA).map((pool) => pool.swap_address.toLowerCase());
    const blacklist = exports.BLACK_LIST[this.chainId] ?? [];
    factories = factories.filter((f) => !swapAddresses.includes(f.address) && !blacklist.includes(f.address));
    return [factories.map((f) => f.id), factories.map((f) => f.address)];
}
function _handleReferenceAssets(referenceAssets) {
    return referenceAssets.map((t) => {
        return {
            0: "USD",
            1: "ETH",
            2: "BTC",
        }[curve_js_1.curve.formatUnits(t, 0)] || "OTHER";
    });
}
function _handleCoinAddresses(coinAddresses) {
    return coinAddresses.map((addresses) => addresses
        .filter((addr) => addr !== curve_js_1.curve.constants.ZERO_ADDRESS)
        .map((addr) => this.chainId === 137 && addr === "0x0000000000000000000000000000000000001010" ? this.constants.NATIVE_TOKEN.address : addr.toLowerCase()));
}
async function getPoolsData(factorySwapAddresses, factoryAddress) {
    const factoryMulticallContract = this.contracts[factoryAddress].multicallContract;
    const isFactoryGaugeNull = this.constants.ALIASES.gauge_factory === '0x0000000000000000000000000000000000000000';
    const isStableNgFactory = factoryAddress === this.constants.ALIASES['stable_ng_factory'];
    const factoryGaugeContract = this.contracts[this.constants.ALIASES.gauge_factory].multicallContract;
    const calls = [];
    for (const addr of factorySwapAddresses) {
        const tempSwapContract = new index_js_1.Contract(addr, ERC20_json_1.default);
        calls.push(factoryMulticallContract.get_implementation_address(addr));
        if (this.chainId === 1) {
            calls.push(factoryMulticallContract.get_gauge(addr));
        }
        else if (!isFactoryGaugeNull) {
            calls.push(factoryGaugeContract.get_gauge_from_lp_token(addr));
        }
        if (!isStableNgFactory) {
            calls.push(factoryMulticallContract.get_pool_asset_type(addr));
        }
        calls.push(tempSwapContract.symbol());
        calls.push(tempSwapContract.name());
        calls.push(factoryMulticallContract.is_meta(addr));
        calls.push(factoryMulticallContract.get_coins(addr));
    }
    const res = await this.multicallProvider.all(calls);
    if (isFactoryGaugeNull) {
        for (let index = 0; index < res.length; index++) {
            if (index % 7 == 1) {
                res.splice(index, 0, '0x0000000000000000000000000000000000000000');
            }
        }
    }
    if (isStableNgFactory) {
        for (let index = 0; index < res.length; index++) {
            if (index % 7 == 2) {
                res.splice(index, 0, -1);
            }
        }
    }
    const implememntationAddresses = res.filter((a, i) => i % 7 == 0).map((a) => a.toLowerCase());
    const gaugeAddresses = res.filter((a, i) => i % 7 == 1).map((a) => a.toLowerCase());
    const referenceAssets = _handleReferenceAssets(res.filter((a, i) => i % 7 == 2));
    const symbols = res.filter((a, i) => i % 7 == 3);
    const names = res.filter((a, i) => i % 7 == 4);
    const isMeta = res.filter((a, i) => i % 7 == 5);
    const coinAddresses = _handleCoinAddresses.call(this, res.filter((a, i) => i % 7 == 6));
    return [implememntationAddresses, gaugeAddresses, referenceAssets, symbols, names, isMeta, coinAddresses];
}
function setFactorySwapContracts(factorySwapAddresses, factorySwapABIs) {
    factorySwapAddresses.forEach((addr, i) => {
        this.setContract(addr, factorySwapABIs[i]);
    });
}
function setFactoryGaugeContracts(factoryGaugeAddresses) {
    factoryGaugeAddresses.filter((addr) => addr !== curve_js_1.curve.constants.ZERO_ADDRESS).forEach((addr, i) => {
        this.setContract(addr, this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default);
    });
}
function setFactoryCoinsContracts(coinAddresses) {
    const flattenedCoinAddresses = Array.from(new Set(deepFlatten(coinAddresses)));
    for (const addr of flattenedCoinAddresses) {
        if (addr in this.contracts)
            continue;
        this.setContract(addr, ERC20_json_1.default);
    }
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
async function getCoinsData(coinAddresses, existingCoinAddrNameDict, existingCoinAddrDecimalsDict) {
    const flattenedCoinAddresses = Array.from(new Set(deepFlatten(coinAddresses)));
    const newCoinAddresses = [];
    const coinAddrNamesDict = {};
    const coinAddrDecimalsDict = {};
    for (const addr of flattenedCoinAddresses) {
        if (addr in existingCoinAddrNameDict) {
            coinAddrNamesDict[addr] = existingCoinAddrNameDict[addr];
            coinAddrDecimalsDict[addr] = existingCoinAddrDecimalsDict[addr];
        }
        else {
            newCoinAddresses.push(addr);
        }
    }
    const calls = [];
    for (const addr of newCoinAddresses) {
        calls.push(this.contracts[addr].multicallContract.symbol());
        calls.push(this.contracts[addr].multicallContract.decimals());
    }
    const res = await this.multicallProvider.all(calls);
    const symbols = res.filter((a, i) => i % 2 == 0);
    const decimals = res.filter((a, i) => i % 2 == 1).map((_d) => Number(curve_js_1.curve.formatUnits(_d, 0)));
    newCoinAddresses.forEach((addr, i) => {
        coinAddrNamesDict[addr] = symbols[i];
        coinAddrDecimalsDict[addr] = decimals[i];
    });
    return [coinAddrNamesDict, coinAddrDecimalsDict];
}
async function getFactoryPoolData(fromIdx = 0, swapAddress, factoryAddress = curve_js_1.curve.constants.ALIASES.factory) {
    const [rawPoolIds, rawSwapAddresses] = swapAddress ?
        [[await getRecentlyCreatedPoolId.call(this, swapAddress, factoryAddress)], [swapAddress.toLowerCase()]]
        : await getFactoryIdsAndSwapAddresses.call(this, fromIdx, factoryAddress);
    if (rawPoolIds.length === 0)
        return {};
    const [rawImplementations, rawGauges, rawReferenceAssets, rawPoolSymbols, rawPoolNames, rawIsMeta, rawCoinAddresses] = await getPoolsData.call(this, rawSwapAddresses, factoryAddress);
    const poolIds = [];
    const swapAddresses = [];
    const implementations = [];
    const gaugeAddresses = [];
    const referenceAssets = [];
    const poolSymbols = [];
    const poolNames = [];
    const isMeta = [];
    const coinAddresses = [];
    const implementationABIDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].implementationABIDict;
    for (let i = 0; i < rawPoolIds.length; i++) {
        if (rawImplementations[i] in implementationABIDict) {
            poolIds.push(rawPoolIds[i]);
            swapAddresses.push(rawSwapAddresses[i]);
            implementations.push(rawImplementations[i]);
            gaugeAddresses.push(rawGauges[i]);
            referenceAssets.push(rawReferenceAssets[i]);
            poolSymbols.push(rawPoolSymbols[i]);
            poolNames.push(rawPoolNames[i]);
            isMeta.push(rawIsMeta[i]);
            coinAddresses.push(rawCoinAddresses[i]);
        }
    }
    const swapABIs = implementations.map((addr) => implementationABIDict[addr]);
    setFactorySwapContracts.call(this, swapAddresses, swapABIs);
    setFactoryGaugeContracts.call(this, gaugeAddresses);
    setFactoryCoinsContracts.call(this, coinAddresses);
    common_js_1.setFactoryZapContracts.call(this, false);
    const [coinAddressNameDict, coinAddressDecimalsDict] = await getCoinsData.call(this, coinAddresses, getExistingCoinAddressNameDict.call(this), this.constants.DECIMALS);
    const tmpPools = [];
    poolIds.forEach((item, index) => {
        tmpPools.push({
            id: item,
            address: swapAddresses[index],
        });
    });
    const basePoolIds = await getBasePoolIds.call(this, factoryAddress, swapAddresses, tmpPools);
    const FACTORY_POOLS_DATA = {};
    for (let i = 0; i < poolIds.length; i++) {
        if (!isMeta[i]) {
            FACTORY_POOLS_DATA[poolIds[i]] = {
                name: (0, utils_js_1.getPoolName)(poolNames[i]),
                full_name: poolNames[i],
                symbol: poolSymbols[i],
                reference_asset: referenceAssets[i],
                swap_address: swapAddresses[i],
                token_address: swapAddresses[i],
                gauge_address: gaugeAddresses[i],
                implementation_address: implementations[i],
                is_plain: true,
                is_factory: true,
                underlying_coins: [...coinAddresses[i].map((addr) => coinAddressNameDict[addr])],
                wrapped_coins: [...coinAddresses[i].map((addr) => coinAddressNameDict[addr])],
                underlying_coin_addresses: coinAddresses[i],
                wrapped_coin_addresses: coinAddresses[i],
                underlying_decimals: [...coinAddresses[i].map((addr) => coinAddressDecimalsDict[addr])],
                wrapped_decimals: [...coinAddresses[i].map((addr) => coinAddressDecimalsDict[addr])],
                swap_abi: swapABIs[i],
                gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
            };
        }
        else {
            const allPoolsData = { ...this.constants.POOLS_DATA, ...this.constants.FACTORY_POOLS_DATA, ...FACTORY_POOLS_DATA };
            // @ts-ignore
            const basePoolIdCoinsDict = Object.fromEntries(basePoolIds.map((poolId) => [poolId, allPoolsData[poolId]?.underlying_coins]));
            // @ts-ignore
            const basePoolIdCoinAddressesDict = Object.fromEntries(basePoolIds.map((poolId) => [poolId, allPoolsData[poolId]?.underlying_coin_addresses]));
            // @ts-ignore
            const basePoolIdDecimalsDict = Object.fromEntries(basePoolIds.map((poolId) => [poolId, allPoolsData[poolId]?.underlying_decimals]));
            const basePoolIdZapDict = constants_js_1.FACTORY_CONSTANTS[this.chainId].basePoolIdZapDict;
            const basePoolZap = basePoolIdZapDict[basePoolIds[i]];
            FACTORY_POOLS_DATA[poolIds[i]] = {
                name: (0, utils_js_1.getPoolName)(poolNames[i]),
                full_name: poolNames[i],
                symbol: poolSymbols[i],
                reference_asset: referenceAssets[i],
                swap_address: swapAddresses[i],
                token_address: swapAddresses[i],
                gauge_address: gaugeAddresses[i],
                deposit_address: basePoolIdZapDict[basePoolIds[i]].address,
                implementation_address: implementations[i],
                is_meta: true,
                is_factory: true,
                base_pool: basePoolIds[i],
                underlying_coins: [coinAddressNameDict[coinAddresses[i][0]], ...basePoolIdCoinsDict[basePoolIds[i]]],
                wrapped_coins: [...coinAddresses[i].map((addr) => coinAddressNameDict[addr])],
                underlying_coin_addresses: [coinAddresses[i][0], ...basePoolIdCoinAddressesDict[basePoolIds[i]]],
                wrapped_coin_addresses: coinAddresses[i],
                underlying_decimals: [coinAddressDecimalsDict[coinAddresses[i][0]], ...basePoolIdDecimalsDict[basePoolIds[i]]],
                wrapped_decimals: [...coinAddresses[i].map((addr) => coinAddressDecimalsDict[addr])],
                swap_abi: swapABIs[i],
                gauge_abi: this.chainId === 1 ? gauge_factory_json_1.default : gauge_child_json_1.default,
                deposit_abi: basePoolZap.ABI,
            };
        }
    }
    return FACTORY_POOLS_DATA;
}
exports.getFactoryPoolData = getFactoryPoolData;
