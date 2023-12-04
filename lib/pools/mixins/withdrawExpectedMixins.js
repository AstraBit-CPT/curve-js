"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawWrappedExpectedMixin = exports.withdrawExpectedMetaMixin = exports.withdrawExpectedLendingOrCryptoMixin = exports.withdrawExpectedMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
const common_js_1 = require("./common.js");
// @ts-ignore
exports.withdrawExpectedMixin = {
    async withdrawExpected(lpTokenAmount) {
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expected = await common_js_1._calcExpectedAmounts.call(this, _lpTokenAmount);
        return _expected.map((amount, i) => curve_js_1.curve.formatUnits(amount, this.underlyingDecimals[i]));
    },
};
// @ts-ignore
exports.withdrawExpectedLendingOrCryptoMixin = {
    async withdrawExpected(lpTokenAmount) {
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expectedAmounts = await common_js_1._calcExpectedAmounts.call(this, _lpTokenAmount);
        // @ts-ignore
        const _rates = await this._getRates();
        const _expected = _expectedAmounts.map((_amount, i) => _amount * _rates[i] / curve_js_1.curve.parseUnits(String(10 ** 18), 0));
        return _expected.map((amount, i) => curve_js_1.curve.formatUnits(amount, this.underlyingDecimals[i]));
    },
};
// @ts-ignore
exports.withdrawExpectedMetaMixin = {
    async withdrawExpected(lpTokenAmount) {
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expected = await common_js_1._calcExpectedUnderlyingAmountsMeta.call(this, _lpTokenAmount);
        return _expected.map((amount, i) => curve_js_1.curve.formatUnits(amount, this.underlyingDecimals[i]));
    },
};
// @ts-ignore
exports.withdrawWrappedExpectedMixin = {
    async withdrawWrappedExpected(lpTokenAmount) {
        const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
        const _expected = await common_js_1._calcExpectedAmounts.call(this, _lpTokenAmount);
        return _expected.map((amount, i) => curve_js_1.curve.formatUnits(amount, this.wrappedDecimals[i]));
    },
};
