"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.poolBalancesLendingMixin = exports.poolBalancesMetaMixin = void 0;
const curve_js_1 = require("../../curve.js");
const PoolTemplate_js_1 = require("../PoolTemplate.js");
const common_js_1 = require("./common.js");
// @ts-ignore
exports.poolBalancesMetaMixin = {
    async statsUnderlyingBalances() {
        const swapContract = curve_js_1.curve.contracts[this.address].multicallContract;
        const contractCalls = this.wrappedCoins.map((_, i) => swapContract.balances(i));
        const _poolWrappedBalances = await curve_js_1.curve.multicallProvider.all(contractCalls);
        const [_poolMetaCoinBalance] = _poolWrappedBalances.splice(this.metaCoinIdx, 1);
        const _poolUnderlyingBalances = _poolWrappedBalances;
        const basePool = new PoolTemplate_js_1.PoolTemplate(this.basePool);
        const _basePoolExpectedAmounts = basePool.isMeta ?
            await common_js_1._calcExpectedUnderlyingAmountsMeta.call(basePool, _poolMetaCoinBalance) :
            await common_js_1._calcExpectedAmounts.call(basePool, _poolMetaCoinBalance);
        _poolUnderlyingBalances.splice(this.metaCoinIdx, 0, ..._basePoolExpectedAmounts);
        return _poolUnderlyingBalances.map((_b, i) => curve_js_1.curve.formatUnits(_b, this.underlyingDecimals[i]));
    },
};
// @ts-ignore
exports.poolBalancesLendingMixin = {
    async statsUnderlyingBalances() {
        const swapContract = curve_js_1.curve.contracts[this.address].multicallContract;
        const contractCalls = this.wrappedCoins.map((_, i) => swapContract.balances(i));
        const _poolWrappedBalances = await curve_js_1.curve.multicallProvider.all(contractCalls);
        // @ts-ignore
        const _rates = await this._getRates();
        const _poolUnderlyingBalances = _poolWrappedBalances.map((_b, i) => _b * _rates[i] / curve_js_1.curve.parseUnits(String(10 ** 18), 0));
        return _poolUnderlyingBalances.map((_b, i) => curve_js_1.curve.formatUnits(_b, this.underlyingDecimals[i]));
    },
};
