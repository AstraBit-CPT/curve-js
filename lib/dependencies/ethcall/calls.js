"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const multicall_json_1 = __importDefault(require("./abi/multicall.json"));
const contract_js_1 = __importDefault(require("./contract.js"));
function getEthBalance(address, multicallAddress) {
    const multicall = new contract_js_1.default(multicallAddress, multicall_json_1.default);
    return multicall.getEthBalance(address);
}
exports.default = getEthBalance;
