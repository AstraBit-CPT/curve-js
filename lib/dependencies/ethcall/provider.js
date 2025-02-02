"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Provider_instances, _Provider_provider, _Provider_config, _Provider_multicall, _Provider_multicall2, _Provider_multicall3, _Provider_getContract, _Provider_isAvailable, _Provider_getMulticall;
Object.defineProperty(exports, "__esModule", { value: true });
const call_js_1 = require("./call.js");
const calls_js_1 = __importDefault(require("./calls.js"));
const multicall_js_1 = require("./multicall.js");
/**
 * Represents a Multicall provider. Used to execute multiple Calls.
 */
class Provider {
    /**
     * Create a provider.
     * @param provider ethers provider
     * @param chainId Network chain
     * @param config Provider configuration
     */
    constructor(chainId, provider, config) {
        _Provider_instances.add(this);
        _Provider_provider.set(this, void 0);
        _Provider_config.set(this, void 0);
        _Provider_multicall.set(this, void 0);
        _Provider_multicall2.set(this, void 0);
        _Provider_multicall3.set(this, void 0);
        __classPrivateFieldSet(this, _Provider_provider, provider, "f");
        __classPrivateFieldSet(this, _Provider_config, config || {}, "f");
        __classPrivateFieldSet(this, _Provider_multicall, __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getMulticall).call(this, chainId, 1), "f");
        __classPrivateFieldSet(this, _Provider_multicall2, __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getMulticall).call(this, chainId, 2), "f");
        __classPrivateFieldSet(this, _Provider_multicall3, __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getMulticall).call(this, chainId, 3), "f");
    }
    /**
     * Make one call to the multicall contract to retrieve eth balance of the given address.
     * @param address Address of the account you want to look up
     * @returns Ether balance fetching call
     */
    getEthBalance(address) {
        const multicall = __classPrivateFieldGet(this, _Provider_multicall3, "f") || __classPrivateFieldGet(this, _Provider_multicall2, "f") || __classPrivateFieldGet(this, _Provider_multicall, "f");
        if (!multicall) {
            throw Error('Multicall contract is not available on this network.');
        }
        return (0, calls_js_1.default)(address, multicall.address);
    }
    /**
     * Aggregate multiple calls into one call.
     * Reverts when any of the calls fails.
     * For ignoring the success of each call, use {@link tryAll} instead.
     * @param calls Array of Call objects containing information about each read call
     * @param block Block number for this call
     * @returns List of fetched data
     */
    async all(calls, overrides) {
        if (!__classPrivateFieldGet(this, _Provider_provider, "f")) {
            throw Error('Provider should be initialized before use.');
        }
        const multicall = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getContract).call(this, 'BASIC', overrides?.blockTag);
        const provider = __classPrivateFieldGet(this, _Provider_provider, "f");
        return await (0, call_js_1.all)(provider, multicall, calls, overrides);
    }
    /**
     * Aggregate multiple calls into one call.
     * If any of the calls fail, it returns a null value in place of the failed call's return data.
     * @param calls Array of Call objects containing information about each read call
     * @param block Block number for this call
     * @returns List of fetched data. Failed calls will result in null values.
     */
    async tryAll(calls, overrides) {
        if (!__classPrivateFieldGet(this, _Provider_provider, "f")) {
            throw Error('Provider should be initialized before use.');
        }
        const multicall = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getContract).call(this, 'TRY_ALL', overrides?.blockTag);
        const provider = __classPrivateFieldGet(this, _Provider_provider, "f");
        return await (0, call_js_1.tryAll)(provider, multicall, calls, overrides);
    }
    /**
     * Aggregates multiple calls into one call.
     * If any of the calls that are allowed to fail do fail,
     * it returns a null value in place of the failed call's return data.
     * @param calls Array of Call objects containing information about each read call
     * @param canFail Array of booleans specifying whether each call can fail
     * @param block Block number for this call
     * @returns List of fetched data. Failed calls will result in null values.
     */
    async tryEach(calls, canFail, overrides) {
        if (!__classPrivateFieldGet(this, _Provider_provider, "f")) {
            throw Error('Provider should be initialized before use.');
        }
        const multicall = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_getContract).call(this, 'TRY_EACH', overrides?.blockTag);
        const provider = __classPrivateFieldGet(this, _Provider_provider, "f");
        const failableCalls = calls.map((call, index) => {
            return {
                ...call,
                canFail: canFail[index],
            };
        });
        return await (0, call_js_1.tryEach)(provider, multicall, failableCalls, overrides);
    }
}
_Provider_provider = new WeakMap(), _Provider_config = new WeakMap(), _Provider_multicall = new WeakMap(), _Provider_multicall2 = new WeakMap(), _Provider_multicall3 = new WeakMap(), _Provider_instances = new WeakSet(), _Provider_getContract = function _Provider_getContract(call, block) {
    const multicall = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_isAvailable).call(this, __classPrivateFieldGet(this, _Provider_multicall, "f"), block)
        ? __classPrivateFieldGet(this, _Provider_multicall, "f")
        : null;
    const multicall2 = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_isAvailable).call(this, __classPrivateFieldGet(this, _Provider_multicall2, "f"), block)
        ? __classPrivateFieldGet(this, _Provider_multicall2, "f")
        : null;
    const multicall3 = __classPrivateFieldGet(this, _Provider_instances, "m", _Provider_isAvailable).call(this, __classPrivateFieldGet(this, _Provider_multicall3, "f"), block)
        ? __classPrivateFieldGet(this, _Provider_multicall3, "f")
        : null;
    switch (call) {
        case 'BASIC':
            return multicall3 || multicall2 || multicall;
        case 'TRY_ALL':
            return multicall3 || multicall2;
        case 'TRY_EACH':
            return multicall3;
    }
}, _Provider_isAvailable = function _Provider_isAvailable(multicall, block) {
    if (!multicall) {
        return false;
    }
    if (!block) {
        return true;
    }
    if (block === 'latest' || block === 'pending') {
        return true;
    }
    return multicall.block < block;
}, _Provider_getMulticall = function _Provider_getMulticall(chainId, version) {
    function getRegistryMulticall(chainId, version) {
        switch (version) {
            case 1:
                return (0, multicall_js_1.getMulticall)(chainId);
            case 2:
                return (0, multicall_js_1.getMulticall2)(chainId);
            case 3:
                return (0, multicall_js_1.getMulticall3)(chainId);
        }
    }
    const customMulticall = __classPrivateFieldGet(this, _Provider_config, "f")?.multicall;
    if (!customMulticall) {
        return getRegistryMulticall(chainId, version);
    }
    const address = customMulticall.address;
    if (!address) {
        return getRegistryMulticall(chainId, version);
    }
    return {
        address,
        block: customMulticall.block || 0,
    };
};
exports.default = Provider;
