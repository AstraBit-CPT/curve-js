"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawPlainMixin = exports.withdrawLendingOrCryptoMixin = exports.withdrawZapMixin = exports.withdrawCryptoMetaFactoryMixin = exports.withdrawMetaFactoryMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawCheck(lpTokenAmount, estimateGas = false) {
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    if (estimateGas && this.zap && !(await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.zap))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    return (0, utils_js_1.parseUnits)(lpTokenAmount);
}
async function _withdrawMinAmounts(_lpTokenAmount, slippage = 0.5) {
    const expectedAmounts = await this.withdrawExpected(curve_js_1.curve.formatUnits(_lpTokenAmount));
    const _expectedAmounts = expectedAmounts.map((a, i) => curve_js_1.curve.parseUnits(a, this.underlyingDecimals[i]));
    const minRecvAmountsBN = _expectedAmounts.map((_a, i) => (0, utils_js_1.toBN)(_a, this.underlyingDecimals[i]).times(100 - slippage).div(100));
    return minRecvAmountsBN.map((a, i) => (0, utils_js_1.fromBN)(a, this.underlyingDecimals[i]));
}
// @ts-ignore
exports.withdrawMetaFactoryMixin = {
    // @ts-ignore
    async _withdraw(_lpTokenAmount, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        const _minAmounts = await _withdrawMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity.estimateGas(this.address, _lpTokenAmount, _minAmounts, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(this.address, _lpTokenAmount, _minAmounts, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount, true);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, 0.1, true);
    },
    async withdraw(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, slippage);
    },
};
// @ts-ignore
exports.withdrawCryptoMetaFactoryMixin = {
    // @ts-ignore
    async _withdraw(_lpTokenAmount, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        const _minAmounts = await _withdrawMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity.estimateGas(this.address, _lpTokenAmount, _minAmounts, true, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(this.address, _lpTokenAmount, _minAmounts, true, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount, true);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, 0.1, true);
    },
    async withdraw(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, slippage);
    },
};
// @ts-ignore
exports.withdrawZapMixin = {
    // @ts-ignore
    async _withdraw(_lpTokenAmount, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        // @ts-ignore
        const _minAmounts = await _withdrawMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const args = [_lpTokenAmount, _minAmounts];
        if (`remove_liquidity(uint256,uint256[${this.underlyingCoinAddresses.length}],bool)` in contract)
            args.push(true);
        const gas = await contract.remove_liquidity.estimateGas(...args, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(...args, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount, true);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, 0.1, true);
    },
    async withdraw(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, slippage);
    },
};
// @ts-ignore
exports.withdrawLendingOrCryptoMixin = {
    // @ts-ignore
    async _withdraw(_lpTokenAmount, slippage, estimateGas = false) {
        const _minAmounts = await _withdrawMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity.estimateGas(_lpTokenAmount, _minAmounts, true, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(_lpTokenAmount, _minAmounts, true, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount, true);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, 0.1, true);
    },
    async withdraw(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, slippage);
    },
};
// @ts-ignore
exports.withdrawPlainMixin = {
    // @ts-ignore
    async _withdraw(_lpTokenAmount, slippage, estimateGas = false) {
        // @ts-ignore
        const _minAmounts = await _withdrawMinAmounts.call(this, _lpTokenAmount, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity.estimateGas(_lpTokenAmount, _minAmounts, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity(_lpTokenAmount, _minAmounts, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawEstimateGas(lpTokenAmount) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount, true);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, 0.1, true);
    },
    async withdraw(lpTokenAmount, slippage) {
        // @ts-ignore
        const _lpTokenAmount = await _withdrawCheck.call(this, lpTokenAmount);
        // @ts-ignore
        return await this._withdraw(_lpTokenAmount, slippage);
    },
};
