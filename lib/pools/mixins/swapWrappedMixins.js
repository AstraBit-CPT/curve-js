"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapWrappedRequiredMixin = exports.swapWrappedExpectedAndApproveMixin = exports.swapWrappedMixin = exports.swapWrappedTricrypto2Mixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _swapWrappedCheck(inputCoin, outputCoin, amount, estimateGas = false) {
    // @ts-ignore
    const i = this._getCoinIdx(inputCoin, false);
    // @ts-ignore
    const j = this._getCoinIdx(outputCoin, false);
    const inputCoinBalance = Object.values(await this.wallet.wrappedCoinBalances())[i];
    if (Number(inputCoinBalance) < Number(amount)) {
        throw Error(`Not enough ${this.wrappedCoins[i]}. Actual: ${inputCoinBalance}, required: ${amount}`);
    }
    if (estimateGas && !(await (0, utils_js_1.hasAllowance)([this.wrappedCoinAddresses[i]], [amount], curve_js_1.curve.signerAddress, this.address))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    const _amount = (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[i]);
    return [i, j, _amount];
}
async function _swapWrappedMinAmount(i, j, _amount, slippage = 0.5) {
    // @ts-ignore
    const _expected = await this._swapWrappedExpected(i, j, _amount);
    const [outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(this.wrappedCoinAddresses[j]);
    const minAmountBN = (0, utils_js_1.toBN)(_expected, outputCoinDecimals).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN, outputCoinDecimals);
}
// @ts-ignore
exports.swapWrappedTricrypto2Mixin = {
    // @ts-ignore
    async _swapWrapped(i, j, _amount, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.wrappedCoinAddresses[i]], [_amount], this.address);
        const _minRecvAmount = await _swapWrappedMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const value = (0, utils_js_1.isEth)(this.wrappedCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract.exchange.estimateGas(i, j, _amount, _minRecvAmount, false, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.exchange(i, j, _amount, _minRecvAmount, false, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapWrappedEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapWrappedCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swapWrapped(i, j, _amount, 0.1, true);
    },
    async swapWrapped(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapWrappedCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swapWrapped(i, j, _amount, slippage);
    },
};
// @ts-ignore
exports.swapWrappedMixin = {
    // @ts-ignore
    async _swapWrapped(i, j, _amount, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.wrappedCoinAddresses[i]], [_amount], this.address);
        const _minRecvAmount = await _swapWrappedMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const value = (0, utils_js_1.isEth)(this.wrappedCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract.exchange.estimateGas(i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("140", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.exchange(i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapWrappedEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapWrappedCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swapWrapped(i, j, _amount, 0.1, true);
    },
    async swapWrapped(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapWrappedCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swapWrapped(i, j, _amount, slippage);
    },
};
// @ts-ignore
exports.swapWrappedExpectedAndApproveMixin = {
    async swapWrappedExpected(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const i = this._getCoinIdx(inputCoin, false);
        // @ts-ignore
        const j = this._getCoinIdx(outputCoin, false);
        const _amount = (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[i]);
        // @ts-ignore
        const _expected = await this._swapWrappedExpected(i, j, _amount);
        return curve_js_1.curve.formatUnits(_expected, this.wrappedDecimals[j]);
    },
    async swapWrappedIsApproved(inputCoin, amount) {
        // @ts-ignore
        const i = this._getCoinIdx(inputCoin, false);
        return await (0, utils_js_1.hasAllowance)([this.wrappedCoinAddresses[i]], [amount], curve_js_1.curve.signerAddress, this.address);
    },
    async swapWrappedApproveEstimateGas(inputCoin, amount) {
        // @ts-ignore
        const i = this._getCoinIdx(inputCoin, false);
        return await (0, utils_js_1.ensureAllowanceEstimateGas)([this.wrappedCoinAddresses[i]], [amount], this.address);
    },
    async swapWrappedApprove(inputCoin, amount) {
        // @ts-ignore
        const i = this._getCoinIdx(inputCoin, false);
        return await (0, utils_js_1.ensureAllowance)([this.wrappedCoinAddresses[i]], [amount], this.address);
    },
};
// @ts-ignore
exports.swapWrappedRequiredMixin = {
    async swapWrappedRequired(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const i = this._getCoinIdx(inputCoin, false);
        // @ts-ignore
        const j = this._getCoinIdx(outputCoin, false);
        const _amount = (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[j]);
        // @ts-ignore
        const _required = await this._swapRequired(i, j, _amount, false);
        return curve_js_1.curve.formatUnits(_required, this.wrappedDecimals[i]);
    },
};
