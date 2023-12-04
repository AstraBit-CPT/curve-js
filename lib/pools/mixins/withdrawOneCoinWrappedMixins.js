"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawOneCoinWrappedMixin = exports.withdrawOneCoinWrappedLendingOrCryptoMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawOneCoinWrappedCheck(lpTokenAmount, coin) {
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    await curve_js_1.curve.updateFeeData();
    // @ts-ignore
    const i = this._getCoinIdx(coin, false);
    const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
    return [_lpTokenAmount, i];
}
async function _withdrawOneCoinWrappedMinAmount(_lpTokenAmount, i, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._withdrawOneCoinWrappedExpected(_lpTokenAmount, i);
    const minAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN);
}
// @ts-ignore
exports.withdrawOneCoinWrappedLendingOrCryptoMixin = {
    // @ts-ignore
    async _withdrawOneCoinWrapped(_lpTokenAmount, i, slippage, estimateGas = false) {
        const _minAmount = await _withdrawOneCoinWrappedMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(_lpTokenAmount, i, _minAmount, false, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("160", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, false, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinWrappedEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinWrappedCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoinWrapped(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoinWrapped(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinWrappedCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoinWrapped(_lpTokenAmount, i, slippage);
    },
};
// @ts-ignore
exports.withdrawOneCoinWrappedMixin = {
    // @ts-ignore
    async _withdrawOneCoinWrapped(_lpTokenAmount, i, slippage, estimateGas = false) {
        const _minAmount = await _withdrawOneCoinWrappedMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(_lpTokenAmount, i, _minAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinWrappedEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinWrappedCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoinWrapped(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoinWrapped(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinWrappedCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoinWrapped(_lpTokenAmount, i, slippage);
    },
};
