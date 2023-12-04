"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositWrapped3argsMixin = exports.depositWrapped2argsMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
async function _depositWrappedCheck(amounts, estimateGas = false) {
    if (this.isFake) {
        throw Error(`depositWrappedExpected method doesn't exist for pool ${this.name} (id: ${this.name})`);
    }
    if (amounts.length !== this.wrappedCoinAddresses.length) {
        throw Error(`${this.name} pool has ${this.wrappedCoinAddresses.length} coins (amounts provided for ${amounts.length})`);
    }
    const balances = Object.values(await this.wallet.wrappedCoinBalances());
    for (let i = 0; i < balances.length; i++) {
        if (Number(balances[i]) < Number(amounts[i])) {
            throw Error(`Not enough ${this.wrappedCoins[i]}. Actual: ${balances[i]}, required: ${amounts[i]}`);
        }
    }
    if (estimateGas && !(await (0, utils_js_1.hasAllowance)(this.wrappedCoinAddresses, amounts, curve_js_1.curve.signerAddress, this.address))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    return amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.wrappedDecimals[i]));
}
async function _depositWrappedMinAmount(_amounts, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._calcLpTokenAmount(_amounts, true, false);
    const minAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN);
}
// @ts-ignore
exports.depositWrapped2argsMixin = {
    // @ts-ignore
    async _depositWrapped(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.wrappedCoinAddresses, _amounts, this.address);
        // @ts-ignore
        const _minMintAmount = await _depositWrappedMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.wrappedCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.add_liquidity.estimateGas(_amounts, _minMintAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(_amounts, _minMintAmount, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositWrappedEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositWrappedCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._depositWrapped(_amounts, 0.1, true);
    },
    async depositWrapped(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._depositWrapped(_amounts, slippage);
    },
};
// @ts-ignore
exports.depositWrapped3argsMixin = {
    // @ts-ignore
    async _depositWrapped(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.wrappedCoinAddresses, _amounts, this.address);
        // @ts-ignore
        const _minMintAmount = await _depositWrappedMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.wrappedCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.add_liquidity.estimateGas(_amounts, _minMintAmount, false, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(_amounts, _minMintAmount, false, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositWrappedEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositWrappedCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._depositWrapped(_amounts, 0.1, true);
    },
    async depositWrapped(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositWrappedCheck.call(this, amounts);
        // @ts-ignore
        return await this._depositWrapped(_amounts, slippage);
    },
};
