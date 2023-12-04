"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapMixin = exports.swapCryptoMetaFactoryMixin = exports.swapMetaFactoryMixin = exports.swapTricrypto2Mixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _swapCheck(inputCoin, outputCoin, amount, estimateGas = false) {
    // @ts-ignore
    const contractAddress = this._swapContractAddress();
    // @ts-ignore
    const i = this._getCoinIdx(inputCoin);
    // @ts-ignore
    const j = this._getCoinIdx(outputCoin);
    const inputCoinBalance = Object.values(await this.wallet.underlyingCoinBalances())[i];
    if (Number(inputCoinBalance) < Number(amount)) {
        throw Error(`Not enough ${this.underlyingCoins[i]}. Actual: ${inputCoinBalance}, required: ${amount}`);
    }
    if (estimateGas && !(await (0, utils_js_1.hasAllowance)([this.underlyingCoinAddresses[i]], [amount], curve_js_1.curve.signerAddress, contractAddress))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    const _amount = (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]);
    return [i, j, _amount];
}
async function _swapMinAmount(i, j, _amount, slippage = 0.5) {
    // @ts-ignore
    const _expected = await this._swapExpected(i, j, _amount);
    const [outputCoinDecimals] = (0, utils_js_1._getCoinDecimals)(this.underlyingCoinAddresses[j]);
    const minAmountBN = (0, utils_js_1.toBN)(_expected, outputCoinDecimals).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN, outputCoinDecimals);
}
// @ts-ignore
exports.swapTricrypto2Mixin = {
    // @ts-ignore
    async _swap(i, j, _amount, slippage, estimateGas = false) {
        // @ts-ignore
        const contractAddress = this._swapContractAddress();
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.underlyingCoinAddresses[i]], [_amount], contractAddress);
        const _minRecvAmount = await _swapMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[contractAddress].contract;
        const exchangeMethod = 'exchange_underlying' in contract ? 'exchange_underlying' : 'exchange';
        const value = (0, utils_js_1.isEth)(this.underlyingCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract[exchangeMethod].estimateGas(i, j, _amount, _minRecvAmount, true, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract[exchangeMethod](i, j, _amount, _minRecvAmount, true, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swap(i, j, _amount, 0.1, true);
    },
    async swap(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swap(i, j, _amount, slippage);
    },
};
// @ts-ignore
exports.swapMetaFactoryMixin = {
    // @ts-ignore
    async _swap(i, j, _amount, slippage, estimateGas = false) {
        // @ts-ignore
        const contractAddress = this._swapContractAddress();
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.underlyingCoinAddresses[i]], [_amount], contractAddress);
        const _minRecvAmount = await _swapMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[contractAddress].contract;
        const exchangeMethod = 'exchange_underlying' in contract ? 'exchange_underlying' : 'exchange';
        const value = (0, utils_js_1.isEth)(this.underlyingCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract[exchangeMethod].estimateGas(this.address, i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("140", 0) / curve_js_1.curve.parseUnits("100", 0);
        return (await contract[exchangeMethod](this.address, i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swap(i, j, _amount, 0.1, true);
    },
    async swap(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swap(i, j, _amount, slippage);
    },
};
// @ts-ignore
exports.swapCryptoMetaFactoryMixin = {
    // @ts-ignore
    async _swap(i, j, _amount, slippage, estimateGas = false) {
        // @ts-ignore
        const contractAddress = this._swapContractAddress();
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.underlyingCoinAddresses[i]], [_amount], contractAddress);
        const _minRecvAmount = await _swapMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[contractAddress].contract;
        const exchangeMethod = 'exchange_underlying' in contract ? 'exchange_underlying' : 'exchange';
        const value = (0, utils_js_1.isEth)(this.underlyingCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract[exchangeMethod].estimateGas(this.address, i, j, _amount, _minRecvAmount, true, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("140", 0) / curve_js_1.curve.parseUnits("100", 0);
        return (await contract[exchangeMethod](this.address, i, j, _amount, _minRecvAmount, true, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swap(i, j, _amount, 0.1, true);
    },
    async swap(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swap(i, j, _amount, slippage);
    },
};
// @ts-ignore
exports.swapMixin = {
    // @ts-ignore
    async _swap(i, j, _amount, slippage, estimateGas = false) {
        // @ts-ignore
        const contractAddress = this._swapContractAddress();
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)([this.underlyingCoinAddresses[i]], [_amount], contractAddress);
        const _minRecvAmount = await _swapMinAmount.call(this, i, j, _amount, slippage);
        const contract = curve_js_1.curve.contracts[contractAddress].contract;
        const exchangeMethod = 'exchange_underlying' in contract ? 'exchange_underlying' : 'exchange';
        const value = (0, utils_js_1.isEth)(this.underlyingCoinAddresses[i]) ? _amount : curve_js_1.curve.parseUnits("0");
        const gas = await contract[exchangeMethod].estimateGas(i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        await curve_js_1.curve.updateFeeData();
        const gasLimit = curve_js_1.curve.chainId === 137 && this.id === 'ren' ? (0, utils_js_1.DIGas)(gas) * curve_js_1.curve.parseUnits("160", 0) / curve_js_1.curve.parseUnits("100", 0) : (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract[exchangeMethod](i, j, _amount, _minRecvAmount, { ...curve_js_1.curve.options, value, gasLimit })).hash;
    },
    async swapEstimateGas(inputCoin, outputCoin, amount) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount, true);
        // @ts-ignore
        return await this._swap(i, j, _amount, 0.1, true);
    },
    async swap(inputCoin, outputCoin, amount, slippage) {
        // @ts-ignore
        const [i, j, _amount] = await _swapCheck.call(this, inputCoin, outputCoin, amount);
        // @ts-ignore
        return await this._swap(i, j, _amount, slippage);
    },
};
