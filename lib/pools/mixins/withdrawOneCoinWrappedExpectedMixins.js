"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawOneCoinWrappedExpected3argsMixin = exports.withdrawOneCoinWrappedExpected2argsMixin = void 0;
const curve_js_1 = require("../../curve.js");
// @ts-ignore
exports.withdrawOneCoinWrappedExpected2argsMixin = {
    async _withdrawOneCoinWrappedExpected(_lpTokenAmount, i) {
        const contract = curve_js_1.curve.contracts[this.address].contract;
        return await contract.calc_withdraw_one_coin(_lpTokenAmount, i, curve_js_1.curve.constantOptions);
    },
};
// @ts-ignore
exports.withdrawOneCoinWrappedExpected3argsMixin = {
    async _withdrawOneCoinWrappedExpected(_lpTokenAmount, i) {
        const contract = curve_js_1.curve.contracts[this.address].contract;
        return await contract.calc_withdraw_one_coin(_lpTokenAmount, i, false, curve_js_1.curve.constantOptions);
    },
};
