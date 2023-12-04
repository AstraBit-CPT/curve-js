"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawImbalanceWrapped3argsMixin = exports.withdrawImbalanceWrapped2argsMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawImbalanceWrappedCheck(amounts) {
    const lpTokenAmount = await this.withdrawImbalanceWrappedExpected(amounts);
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    await curve_js_1.curve.updateFeeData();
    return amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[i]));
}
async function _withdrawImbalanceWrappedMaxBurnAmount(_amounts, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._calcLpTokenAmount(_amounts, false, false);
    const maxBurnAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 + slippage).div(100);
    return (0, utils_js_1.fromBN)(maxBurnAmountBN);
}
// @ts-ignore
exports.withdrawImbalanceWrapped2argsMixin = {
    // @ts-ignore
    async _withdrawImbalanceWrapped(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceWrappedMaxBurnAmount.call(this, _amounts, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(_amounts, _maxBurnAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceWrappedEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalanceWrapped(_amounts, 0.1, true);
    },
    async withdrawImbalanceWrapped(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalanceWrapped(_amounts, slippage);
    },
};
// @ts-ignore
exports.withdrawImbalanceWrapped3argsMixin = {
    // @ts-ignore
    async _withdrawImbalanceWrapped(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceWrappedMaxBurnAmount.call(this, _amounts, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(_amounts, _maxBurnAmount, false, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("140", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, false, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceWrappedEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalanceWrapped(_amounts, 0.1, true);
    },
    async withdrawImbalanceWrapped(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalanceWrapped(_amounts, slippage);
    },
};
