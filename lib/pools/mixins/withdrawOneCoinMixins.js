"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withdrawOneCoinPlainMixin = exports.withdrawOneCoinLendingOrCryptoMixin = exports.withdrawOneCoinZapMixin = exports.withdrawOneCoinCryptoMetaFactoryMixin = exports.withdrawOneCoinMetaFactoryMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _withdrawOneCoinCheck(lpTokenAmount, coin, estimateGas = false) {
    const lpTokenBalance = (await this.wallet.lpTokenBalances())['lpToken'];
    if (Number(lpTokenBalance) < Number(lpTokenAmount)) {
        throw Error(`Not enough LP tokens. Actual: ${lpTokenBalance}, required: ${lpTokenAmount}`);
    }
    if (estimateGas && this.zap && !(await (0, utils_js_1.hasAllowance)([this.lpToken], [lpTokenAmount], curve_js_1.curve.signerAddress, this.zap))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    // @ts-ignore
    const i = this._getCoinIdx(coin);
    const _lpTokenAmount = (0, utils_js_1.parseUnits)(lpTokenAmount);
    return [_lpTokenAmount, i];
}
async function _withdrawOneCoinMinAmount(_lpTokenAmount, i, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._withdrawOneCoinExpected(_lpTokenAmount, i);
    const minAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN);
}
// @ts-ignore
exports.withdrawOneCoinMetaFactoryMixin = {
    // @ts-ignore
    async _withdrawOneCoin(_lpTokenAmount, i, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        const _minAmount = await _withdrawOneCoinMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(this.address, _lpTokenAmount, i, _minAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(this.address, _lpTokenAmount, i, _minAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin, true);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoin(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, slippage);
    },
};
// @ts-ignore
exports.withdrawOneCoinCryptoMetaFactoryMixin = {
    // @ts-ignore
    async _withdrawOneCoin(_lpTokenAmount, i, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        const _minAmount = await _withdrawOneCoinMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(this.address, _lpTokenAmount, i, _minAmount, true, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(this.address, _lpTokenAmount, i, _minAmount, true, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin, true);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoin(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, slippage);
    },
};
// @ts-ignore
exports.withdrawOneCoinZapMixin = {
    // @ts-ignore
    async _withdrawOneCoin(_lpTokenAmount, i, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.lpToken], [_lpTokenAmount], this.zap);
        const _minAmount = await _withdrawOneCoinMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const args = [_lpTokenAmount, i, _minAmount];
        if (`remove_liquidity_one_coin(uint256,uint256,uint256,bool)` in contract)
            args.push(true);
        const gas = await contract.remove_liquidity_one_coin.estimateGas(...args, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(...args, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin, true);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoin(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, slippage);
    },
};
// @ts-ignore
exports.withdrawOneCoinLendingOrCryptoMixin = {
    // @ts-ignore
    async _withdrawOneCoin(_lpTokenAmount, i, slippage, estimateGas = false) {
        const _minAmount = await _withdrawOneCoinMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(_lpTokenAmount, i, _minAmount, true, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("160", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, true, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin, true);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoin(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, slippage);
    },
};
// @ts-ignore
exports.withdrawOneCoinPlainMixin = {
    // @ts-ignore
    async _withdrawOneCoin(_lpTokenAmount, i, slippage, estimateGas = false) {
        const _minAmount = await _withdrawOneCoinMinAmount.call(this, _lpTokenAmount, i, slippage);
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.remove_liquidity_one_coin.estimateGas(_lpTokenAmount, i, _minAmount, curve_js_1.curve.constantOptions);
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.remove_liquidity_one_coin(_lpTokenAmount, i, _minAmount, { ...curve_js_1.curve.options, gasLimit })).hash;
    },
    async withdrawOneCoinEstimateGas(lpTokenAmount, coin) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin, true);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, 0.1, true);
    },
    async withdrawOneCoin(lpTokenAmount, coin, slippage) {
        // @ts-ignore
        const [_lpTokenAmount, i] = await _withdrawOneCoinCheck.call(this, lpTokenAmount, coin);
        // @ts-ignore
        return await this._withdrawOneCoin(_lpTokenAmount, i, slippage);
    },
};
