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
var _Contract_instances, _Contract_address, _Contract_functions, _Contract_makeCallFunction;
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Represents a deployed contract. Generates a Call per each request.
 * Call generation has a syntax similar to ethers.
 * @example
 * const daiContract = new Contract(daiAddress, erc20Abi);
 * daiContract.balanceOf(address); // returns a Call object
 */
class Contract {
    /**
     * Create a contract.
     * @param address Address of the contract
     * @param abi ABI of the contract
     */
    constructor(address, abi) {
        _Contract_instances.add(this);
        _Contract_address.set(this, void 0);
        _Contract_functions.set(this, void 0);
        __classPrivateFieldSet(this, _Contract_address, address, "f");
        __classPrivateFieldSet(this, _Contract_functions, abi.filter((x) => x.type === 'function'), "f");
        const callFunctions = __classPrivateFieldGet(this, _Contract_functions, "f").filter((x) => x.stateMutability === 'pure' || x.stateMutability === 'view');
        for (const callFunction of callFunctions) {
            const name = callFunction.name;
            if (!name) {
                continue;
            }
            const getCall = __classPrivateFieldGet(this, _Contract_instances, "m", _Contract_makeCallFunction).call(this, name);
            if (!this[name]) {
                Object.defineProperty(this, name, {
                    enumerable: true,
                    value: getCall,
                    writable: false,
                });
            }
        }
    }
}
_Contract_address = new WeakMap(), _Contract_functions = new WeakMap(), _Contract_instances = new WeakSet(), _Contract_makeCallFunction = function _Contract_makeCallFunction(name) {
    return (...params) => {
        const address = __classPrivateFieldGet(this, _Contract_address, "f");
        const func = __classPrivateFieldGet(this, _Contract_functions, "f").find((f) => f.name === name);
        const inputs = func?.inputs || [];
        const outputs = func?.outputs || [];
        return {
            contract: {
                address,
            },
            name,
            inputs,
            outputs,
            params,
        };
    };
};
exports.default = Contract;
