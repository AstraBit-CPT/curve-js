"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawWrapped3argsMixin = exports.withdrawWrapped2argsMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawWrappedCheck(lpTokenAmount) {
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    await curve_js_1.curve.updateFeeData();
    return (0, utils_js_1.parseUnits)(lpTokenAmount);
}
async function _withdrawWrappedMinAmounts(_lpTokenAmount, slippage = 0.5) {
    const expectedAmounts = await this.withdrawWrappedExpected(curve_js_1.curve.formatUnits(_lpTokenAmount));
    const _expectedAmounts = expectedAmounts.map((a, i) => curve_js_1.curve.parseUnits(a, this.wrappedDecimals[i]));
    const minRecvAmountsBN = _expectedAmounts.map((_a, i) => (0, utils_js_1.toBN)(_a, this.wrappedDecimals[i]).times(100 - slippage).div(100));
    return minRecvAmountsBN.map((a, i) => (0, utils_js_1.fromBN)(a, this.wrappedDecimals[i]));
}
// @ts-ignore
exports.withdrawWrapped2argsMixin = {
    // @ts-ignore
    async _withdrawWrapped(_lpTokenAmount, slippage, estimateGas = false) {
        const _minAmounts = await _withdrawWrappedMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity.estimateGas(_lpTokenAmount, _minAmounts, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(_lpTokenAmount, _minAmounts, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawWrappedEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawWrappedCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdrawWrapped(_lpTokenAmount, 0.1, true);
    },
    async withdrawWrapped(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawWrappedCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdrawWrapped(_lpTokenAmount, slippage);
    },
};
// @ts-ignore
exports.withdrawWrapped3argsMixin = {
    // @ts-ignore
    async _withdrawWrapped(_lpTokenAmount, slippage, estimateGas = false) {
        const _minAmounts = await _withdrawWrappedMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity.estimateGas(_lpTokenAmount, _minAmounts, false, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(_lpTokenAmount, _minAmounts, false, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawWrappedEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawWrappedCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdrawWrapped(_lpTokenAmount, 0.1, true);
    },
    async withdrawWrapped(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawWrappedCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdrawWrapped(_lpTokenAmount, slippage);
    },
};
