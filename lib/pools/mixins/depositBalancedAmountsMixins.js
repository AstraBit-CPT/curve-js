"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.depositWrappedBalancedAmountsCryptoMixin = exports.depositWrappedBalancedAmountsMixin = exports.depositBalancedAmountsCryptoMixin = exports.depositBalancedAmountsMixin = void 0;
const bignumber_js_1 = __importDefault(require("bignumber.js"));
const utils_js_1 = require("../../utils.js");
function _depositBalancedAmounts(poolBalances, walletBalances, decimals) {
    const poolBalancesBN = poolBalances.map(utils_js_1.BN);
    const walletBalancesBN = walletBalances.map(utils_js_1.BN);
    const poolTotalLiquidityBN = poolBalancesBN.reduce((a, b) => a.plus(b));
    const poolBalancesRatiosBN = poolBalancesBN.map((b) => b.div(poolTotalLiquidityBN));
    // Cross factors for each wallet balance used as reference to see the
    // max that can be used according to the lowest relative wallet balance
    const balancedAmountsForEachScenarioBN = walletBalancesBN.map((_, i) => (walletBalancesBN.map((_, j) => (poolBalancesRatiosBN[j].times(walletBalancesBN[i]).div(poolBalancesRatiosBN[i])))));
    const firstCoinBalanceForEachScenarioBN = balancedAmountsForEachScenarioBN.map(([a]) => a);
    const scenarioWithLowestBalancesBN = firstCoinBalanceForEachScenarioBN.map(String).indexOf(bignumber_js_1.default.min(...firstCoinBalanceForEachScenarioBN).toString());
    return balancedAmountsForEachScenarioBN[scenarioWithLowestBalancesBN].map((a, i) => a.toFixed(decimals[i]));
}
// @ts-ignore
exports.depositBalancedAmountsMixin = {
    async depositBalancedAmounts() {
        // @ts-ignore
        const poolBalances = await this.stats.underlyingBalances();
        // @ts-ignore
        const walletBalances = Object.values(await this.walletUnderlyingCoinBalances());
        const balancedAmountsBN = (_depositBalancedAmounts(poolBalances, walletBalances, this.underlyingDecimals));
        return balancedAmountsBN.map((b, i) => bignumber_js_1.default.min((0, utils_js_1.BN)(b), (0, utils_js_1.BN)(walletBalances[i])).toString());
    },
};
// @ts-ignore
exports.depositBalancedAmountsCryptoMixin = {
    async depositBalancedAmounts() {
        // @ts-ignore
        const poolBalances = await this.stats.underlyingBalances();
        // @ts-ignore
        const walletBalances = Object.values(await this.walletUnderlyingCoinBalances());
        // @ts-ignore
        const prices = await this._underlyingPrices();
        const poolBalancesUSD = poolBalances.map((b, i) => (0, utils_js_1.BN)(b).times(prices[i]).toString());
        const walletBalancesUSD = walletBalances.map((b, i) => (0, utils_js_1.BN)(b).times(prices[i]).toString());
        const balancedAmountsUSD = _depositBalancedAmounts(poolBalancesUSD, walletBalancesUSD, this.underlyingDecimals);
        return balancedAmountsUSD.map((b, i) => bignumber_js_1.default.min((0, utils_js_1.BN)((0, utils_js_1.BN)(b).div(prices[i]).toFixed(this.underlyingDecimals[i])), (0, utils_js_1.BN)(walletBalances[i])).toString());
    },
};
// @ts-ignore
exports.depositWrappedBalancedAmountsMixin = {
    async depositWrappedBalancedAmounts() {
        // @ts-ignore
        const poolBalances = await this.stats.wrappedBalances();
        // @ts-ignore
        const walletBalances = Object.values(await this.walletWrappedCoinBalances());
        const balancedAmountsBN = (_depositBalancedAmounts(poolBalances, walletBalances, this.underlyingDecimals));
        return balancedAmountsBN.map((b, i) => bignumber_js_1.default.min((0, utils_js_1.BN)(b), (0, utils_js_1.BN)(walletBalances[i])).toString());
    },
};
// @ts-ignore
exports.depositWrappedBalancedAmountsCryptoMixin = {
    async depositWrappedBalancedAmounts() {
        // @ts-ignore
        const poolBalances = (await this.stats.wrappedBalances()).map(Number);
        // @ts-ignore
        const walletBalances = Object.values(await this.walletWrappedCoinBalances()).map(Number);
        // @ts-ignore
        const prices = await this._wrappedPrices();
        const poolBalancesUSD = poolBalances.map((b, i) => (0, utils_js_1.BN)(b).times(prices[i]).toString());
        const walletBalancesUSD = walletBalances.map((b, i) => (0, utils_js_1.BN)(b).times(prices[i]).toString());
        const balancedAmountsUSD = _depositBalancedAmounts(poolBalancesUSD, walletBalancesUSD, this.wrappedDecimals);
        return balancedAmountsUSD.map((b, i) => bignumber_js_1.default.min((0, utils_js_1.BN)((0, utils_js_1.BN)(b).div(prices[i]).toFixed(this.wrappedDecimals[i])), (0, utils_js_1.BN)(walletBalances[i])).toString());
    },
};
