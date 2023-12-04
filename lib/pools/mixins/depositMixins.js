"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositPlainMixin = exports.depositLendingOrCryptoMixin = exports.depositZapMixin = exports.depositCryptoMetaFactoryMixin = exports.depositMetaFactoryMixin = void 0;
const curve_js_1 = require("../../curve.js");
const utils_js_1 = require("../../utils.js");
// @ts-ignore
async function _depositCheck(amounts, estimateGas = false) {
    if (amounts.length !== this.underlyingCoinAddresses.length) {
        throw Error(`${this.name} pool has ${this.underlyingCoinAddresses.length} coins (amounts provided for ${amounts.length})`);
    }
    const balances = Object.values(await this.wallet.underlyingCoinBalances());
    for (let i = 0; i < balances.length; i++) {
        if (Number(balances[i]) < Number(amounts[i])) {
            throw Error(`Not enough ${this.underlyingCoins[i]}. Actual: ${balances[i]}, required: ${amounts[i]}`);
        }
    }
    if (estimateGas && !(await (0, utils_js_1.hasAllowance)(this.underlyingCoinAddresses, amounts, curve_js_1.curve.signerAddress, this.zap || this.address))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    if (!estimateGas)
        await curve_js_1.curve.updateFeeData();
    return amounts.map((amount, i) => (0, utils_js_1.parseUnits)(amount, this.underlyingDecimals[i]));
}
async function _depositMinAmount(_amounts, slippage = 0.5) {
    // @ts-ignore
    const _expectedLpTokenAmount = await this._calcLpTokenAmount(_amounts);
    const minAmountBN = (0, utils_js_1.toBN)(_expectedLpTokenAmount).times(100 - slippage).div(100);
    return (0, utils_js_1.fromBN)(minAmountBN);
}
// @ts-ignore
exports.depositMetaFactoryMixin = {
    // @ts-ignore
    async _deposit(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.underlyingCoinAddresses, _amounts, this.zap);
        // @ts-ignore
        const _minMintAmount = await _depositMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.underlyingCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.add_liquidity.estimateGas(this.address, _amounts, _minMintAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(this.address, _amounts, _minMintAmount, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._deposit(_amounts, 0.1, true);
    },
    async deposit(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts);
        // @ts-ignore
        return await this._deposit(_amounts, slippage);
    },
};
// @ts-ignore
exports.depositCryptoMetaFactoryMixin = {
    // @ts-ignore
    async _deposit(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.underlyingCoinAddresses, _amounts, this.zap);
        // @ts-ignore
        const _minMintAmount = await _depositMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.underlyingCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const gas = await contract.add_liquidity.estimateGas(this.address, _amounts, _minMintAmount, true, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(this.address, _amounts, _minMintAmount, true, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._deposit(_amounts, 0.1, true);
    },
    async deposit(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts);
        // @ts-ignore
        return await this._deposit(_amounts, slippage);
    },
};
// @ts-ignore
exports.depositZapMixin = {
    // @ts-ignore
    async _deposit(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.underlyingCoinAddresses, _amounts, this.zap);
        // @ts-ignore
        const _minMintAmount = await _depositMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.underlyingCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.zap].contract;
        const args = [_amounts, _minMintAmount];
        if (`add_liquidity(uint256[${this.underlyingCoinAddresses.length}],uint256,bool)` in contract)
            args.push(true);
        const gas = await contract.add_liquidity.estimateGas(...args, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(...args, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._deposit(_amounts, 0.1, true);
    },
    async deposit(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts);
        // @ts-ignore
        return await this._deposit(_amounts, slippage);
    },
};
// @ts-ignore
exports.depositLendingOrCryptoMixin = {
    // @ts-ignore
    async _deposit(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.underlyingCoinAddresses, _amounts, this.address);
        // @ts-ignore
        const _minMintAmount = await _depositMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.underlyingCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.add_liquidity.estimateGas(_amounts, _minMintAmount, true, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(_amounts, _minMintAmount, true, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._deposit(_amounts, 0.1, true);
    },
    async deposit(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts);
        // @ts-ignore
        return await this._deposit(_amounts, slippage);
    },
};
// @ts-ignore
exports.depositPlainMixin = {
    // @ts-ignore
    async _deposit(_amounts, slippage, estimateGas = false) {
        if (!estimateGas)
            await (0, utils_js_1._ensureAllowance)(this.wrappedCoinAddresses, _amounts, this.address);
        // @ts-ignore
        const _minMintAmount = await _depositMinAmount.call(this, _amounts, slippage);
        const ethIndex = (0, utils_js_1.getEthIndex)(this.wrappedCoinAddresses);
        const value = _amounts[ethIndex] || curve_js_1.curve.parseUnits("0");
        const contract = curve_js_1.curve.contracts[this.address].contract;
        const gas = await contract.add_liquidity.estimateGas(_amounts, _minMintAmount, { ...curve_js_1.curve.constantOptions, value });
        if (estimateGas)
            return (0, utils_js_1.smartNumber)(gas);
        const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
        return (await contract.add_liquidity(_amounts, _minMintAmount, { ...curve_js_1.curve.options, gasLimit, value })).hash;
    },
    async depositEstimateGas(amounts) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts, true);
        // @ts-ignore
        return await this._deposit(_amounts, 0.1, true);
    },
    async deposit(amounts, slippage) {
        // @ts-ignore
        const _amounts = await _depositCheck.call(this, amounts);
        // @ts-ignore
        return await this._deposit(_amounts, slippage);
    },
};
