"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawImbalancePlainMixin = exports.withdrawImbalanceLendingMixin = exports.withdrawImbalanceZapMixin = exports.withdrawImbalanceMetaFactoryMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawImbalanceCheck(amounts, estimateGas = false) {
    const lpTokenAmount = await this.withdrawImbalanceExpected(amounts);
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    if (estimateGas && this.zap && !(await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.zap))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    return amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
}
async function _withdrawImbalanceMaxBurnAmount(_amounts, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._calcLpTokenAmount(_amounts, false);
    const maxBurnAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 + slippage).div(100);
    return (0, utils_js_1.fromBN)(maxBurnAmountBN);
}
// @ts-ignore
exports.withdrawImbalanceMetaFactoryMixin = {
    // @ts-ignore
    async _withdrawImbalance(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceMaxBurnAmount.call(this, _amounts, slippage);
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_maxBurnAmount], this.zap);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(this.address, _amounts, _maxBurnAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(this.address, _amounts, _maxBurnAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, 0.1, true);
    },
    async withdrawImbalance(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, slippage);
    },
};
// @ts-ignore
exports.withdrawImbalanceZapMixin = {
    // @ts-ignore
    async _withdrawImbalance(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceMaxBurnAmount.call(this, _amounts, slippage);
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_maxBurnAmount], this.zap);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(_amounts, _maxBurnAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, 0.1, true);
    },
    async withdrawImbalance(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, slippage);
    },
};
// @ts-ignore
exports.withdrawImbalanceLendingMixin = {
    // @ts-ignore
    async _withdrawImbalance(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceMaxBurnAmount.call(this, _amounts, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(_amounts, _maxBurnAmount, true, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? gas * curve_js_1.curve.parseUnits("140", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, true, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, 0.1, true);
    },
    async withdrawImbalance(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, slippage);
    },
};
// @ts-ignore
exports.withdrawImbalancePlainMixin = {
    // @ts-ignore
    async _withdrawImbalance(_amounts, slippage, estimateGas = false) {
        const _maxBurnAmount = await _withdrawImbalanceMaxBurnAmount.call(this, _amounts, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_imbalance.estimateGas(_amounts, _maxBurnAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_imbalance(_amounts, _maxBurnAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawImbalanceEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, 0.1, true);
    },
    async withdrawImbalance(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _withdrawImbalanceCheck.call(this, amounts);
        // @ts-ignore
        return await this._withdrawImbalance(_amounts, slippage);
    },
};
