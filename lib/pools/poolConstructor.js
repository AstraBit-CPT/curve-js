"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = void 0;
const curve_js_1 = require("../curve.js");
const PoolTemplate_js_1 = require("./PoolTemplate.js");
const poolBalancesMixin_js_1 = require("./mixins/poolBalancesMixin.js");
const depositBalancedAmountsMixins_js_1 = require("./mixins/depositBalancedAmountsMixins.js");
const depositMixins_js_1 = require("./mixins/depositMixins.js");
const depositWrappedMixins_js_1 = require("./mixins/depositWrappedMixins.js");
const withdrawExpectedMixins_js_1 = require("./mixins/withdrawExpectedMixins.js");
const withdrawMixins_js_1 = require("./mixins/withdrawMixins.js");
const withdrawWrappedMixins_js_1 = require("./mixins/withdrawWrappedMixins.js");
const withdrawImbalanceMixins_js_1 = require("./mixins/withdrawImbalanceMixins.js");
const withdrawImbalanceWrappedMixins_js_1 = require("./mixins/withdrawImbalanceWrappedMixins.js");
const withdrawOneCoinExpectedMixins_js_1 = require("./mixins/withdrawOneCoinExpectedMixins.js");
const withdrawOneCoinMixins_js_1 = require("./mixins/withdrawOneCoinMixins.js");
const withdrawOneCoinWrappedExpectedMixins_js_1 = require("./mixins/withdrawOneCoinWrappedExpectedMixins.js");
const withdrawOneCoinWrappedMixins_js_1 = require("./mixins/withdrawOneCoinWrappedMixins.js");
const swapMixins_js_1 = require("./mixins/swapMixins.js");
const swapWrappedMixins_js_1 = require("./mixins/swapWrappedMixins.js");
const utils_js_1 = require("../utils.js");
const getPool = (poolId) => {
    const poolDummy = new PoolTemplate_js_1.PoolTemplate(poolId);
    class Pool extends PoolTemplate_js_1.PoolTemplate {
    }
    // statsBalances
    if (poolDummy.isMeta) {
        Object.assign(Pool.prototype, poolBalancesMixin_js_1.poolBalancesMetaMixin);
    }
    else if (poolDummy.useLending.reduce((x, y) => x || y)) {
        Object.assign(Pool.prototype, poolBalancesMixin_js_1.poolBalancesLendingMixin);
    }
    // depositBalancedAmounts
    if (poolDummy.isCrypto) {
        Object.assign(Pool.prototype, depositBalancedAmountsMixins_js_1.depositBalancedAmountsCryptoMixin);
    }
    else {
        Object.assign(Pool.prototype, depositBalancedAmountsMixins_js_1.depositBalancedAmountsMixin);
    }
    // depositWrappedBalancedAmounts
    if (!poolDummy.isPlain && !poolDummy.isFake) {
        if (poolDummy.isCrypto) {
            Object.assign(Pool.prototype, depositBalancedAmountsMixins_js_1.depositWrappedBalancedAmountsCryptoMixin);
        }
        else {
            Object.assign(Pool.prototype, depositBalancedAmountsMixins_js_1.depositWrappedBalancedAmountsMixin);
        }
    }
    // deposit and depositEstimateGas
    if (poolDummy.isMetaFactory) {
        if (poolDummy.isCrypto) {
            Object.assign(Pool.prototype, depositMixins_js_1.depositCryptoMetaFactoryMixin);
        }
        else {
            Object.assign(Pool.prototype, depositMixins_js_1.depositMetaFactoryMixin);
        }
    }
    else if (poolDummy.zap && poolId !== 'susd') {
        Object.assign(Pool.prototype, depositMixins_js_1.depositZapMixin);
    }
    else if ((0, utils_js_1.getCountArgsOfMethodByContract)(curve_js_1.curve.contracts[poolDummy.address].contract, 'add_liquidity') > 2) {
        Object.assign(Pool.prototype, depositMixins_js_1.depositLendingOrCryptoMixin);
    }
    else {
        Object.assign(Pool.prototype, depositMixins_js_1.depositPlainMixin);
    }
    // depositWrapped and depositWrappedEstimateGas
    if (!poolDummy.isPlain && !poolDummy.isFake) {
        if (((poolDummy.isLending || poolDummy.isCrypto) && !poolDummy.zap) || (poolDummy.isCrypto && poolDummy.isMetaFactory)) {
            Object.assign(Pool.prototype, depositWrappedMixins_js_1.depositWrapped3argsMixin);
        }
        else {
            Object.assign(Pool.prototype, depositWrappedMixins_js_1.depositWrapped2argsMixin);
        }
    }
    // withdrawExpected
    if (poolDummy.isMeta) {
        Object.assign(Pool.prototype, withdrawExpectedMixins_js_1.withdrawExpectedMetaMixin);
    }
    else if (poolDummy.isLending || (poolDummy.isCrypto && !poolDummy.isPlain)) {
        Object.assign(Pool.prototype, withdrawExpectedMixins_js_1.withdrawExpectedLendingOrCryptoMixin);
    }
    else {
        Object.assign(Pool.prototype, withdrawExpectedMixins_js_1.withdrawExpectedMixin);
    }
    // withdraw and withdrawEstimateGas
    if (poolDummy.isMetaFactory) {
        if (poolDummy.isCrypto) {
            Object.assign(Pool.prototype, withdrawMixins_js_1.withdrawCryptoMetaFactoryMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawMixins_js_1.withdrawMetaFactoryMixin);
        }
    }
    else if (poolDummy.zap && poolId !== 'susd') {
        Object.assign(Pool.prototype, withdrawMixins_js_1.withdrawZapMixin);
    }
    else if ((0, utils_js_1.getCountArgsOfMethodByContract)(curve_js_1.curve.contracts[poolDummy.address].contract, 'remove_liquidity') > 2) {
        Object.assign(Pool.prototype, withdrawMixins_js_1.withdrawLendingOrCryptoMixin);
    }
    else {
        Object.assign(Pool.prototype, withdrawMixins_js_1.withdrawPlainMixin);
    }
    // withdrawWrapped and withdrawWrappedEstimateGas
    if (!poolDummy.isPlain && !poolDummy.isFake) {
        if (((poolDummy.isLending || poolDummy.isCrypto) && !poolDummy.zap) || (poolDummy.isCrypto && poolDummy.isMetaFactory)) {
            Object.assign(Pool.prototype, withdrawWrappedMixins_js_1.withdrawWrapped3argsMixin);
            Object.assign(Pool.prototype, withdrawExpectedMixins_js_1.withdrawWrappedExpectedMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawWrappedMixins_js_1.withdrawWrapped2argsMixin);
            Object.assign(Pool.prototype, withdrawExpectedMixins_js_1.withdrawWrappedExpectedMixin);
        }
    }
    // withdrawImbalance and withdrawImbalanceEstimateGas
    if (!poolDummy.isCrypto) {
        if (poolDummy.isMetaFactory) {
            Object.assign(Pool.prototype, withdrawImbalanceMixins_js_1.withdrawImbalanceMetaFactoryMixin);
        }
        else if (poolDummy.zap && poolId !== 'susd') {
            Object.assign(Pool.prototype, withdrawImbalanceMixins_js_1.withdrawImbalanceZapMixin);
        }
        else if (poolDummy.isLending) {
            Object.assign(Pool.prototype, withdrawImbalanceMixins_js_1.withdrawImbalanceLendingMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawImbalanceMixins_js_1.withdrawImbalancePlainMixin);
        }
    }
    // withdrawImbalanceWrapped and withdrawImbalanceWrappedEstimateGas
    if (!poolDummy.isCrypto) {
        if (poolDummy.isLending && !poolDummy.zap) {
            Object.assign(Pool.prototype, withdrawImbalanceWrappedMixins_js_1.withdrawImbalanceWrapped3argsMixin);
        }
        else if (!poolDummy.isPlain && !poolDummy.isFake) {
            Object.assign(Pool.prototype, withdrawImbalanceWrappedMixins_js_1.withdrawImbalanceWrapped2argsMixin);
        }
    }
    // withdrawOneCoinExpected
    if (poolDummy.isMetaFactory) {
        Object.assign(Pool.prototype, withdrawOneCoinExpectedMixins_js_1.withdrawOneCoinExpectedMetaFactoryMixin);
    }
    else if ((!poolDummy.isCrypto && poolDummy.zap) || poolDummy.isMeta) { // including susd
        Object.assign(Pool.prototype, withdrawOneCoinExpectedMixins_js_1.withdrawOneCoinExpectedZapMixin);
    }
    else if (poolId === 'ib') {
        Object.assign(Pool.prototype, withdrawOneCoinExpectedMixins_js_1.withdrawOneCoinExpected3argsMixin);
    }
    else {
        Object.assign(Pool.prototype, withdrawOneCoinExpectedMixins_js_1.withdrawOneCoinExpected2argsMixin);
    }
    // withdrawOneCoin and withdrawOneCoinEstimateGas
    if (poolDummy.isMetaFactory) {
        if (poolDummy.isCrypto) {
            Object.assign(Pool.prototype, withdrawOneCoinMixins_js_1.withdrawOneCoinCryptoMetaFactoryMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawOneCoinMixins_js_1.withdrawOneCoinMetaFactoryMixin);
        }
    }
    else if (poolDummy.zap) { // including susd
        Object.assign(Pool.prototype, withdrawOneCoinMixins_js_1.withdrawOneCoinZapMixin);
    }
    else if ((0, utils_js_1.getCountArgsOfMethodByContract)(curve_js_1.curve.contracts[poolDummy.address].contract, 'remove_liquidity_one_coin') > 3) {
        Object.assign(Pool.prototype, withdrawOneCoinMixins_js_1.withdrawOneCoinLendingOrCryptoMixin);
    }
    else {
        Object.assign(Pool.prototype, withdrawOneCoinMixins_js_1.withdrawOneCoinPlainMixin);
    }
    // withdrawOneCoinWrappedExpected
    if (!poolDummy.isPlain && !poolDummy.isFake && !(poolDummy.isLending && poolDummy.zap)) {
        if (poolId === "ib") {
            Object.assign(Pool.prototype, withdrawOneCoinWrappedExpectedMixins_js_1.withdrawOneCoinWrappedExpected3argsMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawOneCoinWrappedExpectedMixins_js_1.withdrawOneCoinWrappedExpected2argsMixin);
        }
    }
    // withdrawOneCoinWrapped and withdrawOneCoinWrappedEstimateGas
    if (!poolDummy.isPlain && !poolDummy.isFake && !(poolDummy.isLending && poolDummy.zap)) {
        if (((poolDummy.isLending || poolDummy.isCrypto) && !poolDummy.zap) || (poolDummy.isCrypto && poolDummy.isMetaFactory)) {
            Object.assign(Pool.prototype, withdrawOneCoinWrappedMixins_js_1.withdrawOneCoinWrappedLendingOrCryptoMixin);
        }
        else {
            Object.assign(Pool.prototype, withdrawOneCoinWrappedMixins_js_1.withdrawOneCoinWrappedMixin);
        }
    }
    // swap and swapEstimateGas
    if ('exchange(uint256,uint256,uint256,uint256,bool)' in curve_js_1.curve.contracts[poolDummy.address].contract &&
        !(curve_js_1.curve.chainId === 100 && poolDummy.id === "tricrypto")) { // tricrypto2 (eth), tricrypto (arbitrum), avaxcrypto (avalanche); 100 is xDAI
        Object.assign(Pool.prototype, swapMixins_js_1.swapTricrypto2Mixin);
    }
    else if (poolDummy.isMetaFactory && ((0, exports.getPool)(poolDummy.basePool).isLending || (0, exports.getPool)(poolDummy.basePool).isFake || poolDummy.isCrypto)) {
        if (poolDummy.isCrypto) {
            Object.assign(Pool.prototype, swapMixins_js_1.swapCryptoMetaFactoryMixin);
        }
        else {
            Object.assign(Pool.prototype, swapMixins_js_1.swapMetaFactoryMixin);
        }
    }
    else {
        Object.assign(Pool.prototype, swapMixins_js_1.swapMixin);
    }
    // swapWrapped and swapWrappedEstimateGas
    if (!poolDummy.isPlain && !poolDummy.isFake) {
        Object.assign(Pool.prototype, swapWrappedMixins_js_1.swapWrappedExpectedAndApproveMixin);
        Object.assign(Pool.prototype, swapWrappedMixins_js_1.swapWrappedRequiredMixin);
        if ('exchange(uint256,uint256,uint256,uint256,bool)' in curve_js_1.curve.contracts[poolDummy.address].contract) { // tricrypto2 (eth), tricrypto (arbitrum)
            Object.assign(Pool.prototype, swapWrappedMixins_js_1.swapWrappedTricrypto2Mixin);
        }
        else {
            Object.assign(Pool.prototype, swapWrappedMixins_js_1.swapWrappedMixin);
        }
    }
    return new Pool(poolId);
};
exports.getPool = getPool;
