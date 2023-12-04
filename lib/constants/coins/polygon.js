"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aTokensPolygon = exports.ycTokensPolygon = exports.yTokensPolygon = exports.cTokensPolygon = exports.COINS_POLYGON = void 0;
const utils_js_1 = require("../utils.js");
exports.COINS_POLYGON = (0, utils_js_1.lowerCaseValues)({
    crv: "0x172370d5cd63279efa6d502dab29171933a610af",
    // -- USD ---
    dai: "0x8f3cf7ad23cd3cadbd9735aff958023239c6a063",
    usdc: "0x2791bca1f2de4661ed88a30c99a7a9449aa84174",
    usdt: "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    amdai: "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
    amusdc: "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
    amusdt: "0x60D55F02A771d515e077c9C2403a1ef324885CeC",
    am3crv: "0xE7a24EF0C5e95Ffb0f6684b813A78F2a3AD7D171",
    // --- ETH ---
    weth: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
    amweth: "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390",
    // --- BTC ---
    wbtc: "0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6",
    renbtc: "0xDBf31dF14B66535aF65AaC99C32e9eA844e14501",
    amwbtc: "0x5c2ed810328349100A66B82b78a1791B101C9D61",
    // --- MATIC ---
    matic: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    wmatic: "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    // --- EUR ---
    eurt: "0x7BDF330f423Ea880FF95fC41A280fD5eCFD3D09f", // EURT
});
exports.cTokensPolygon = []; //.map((a) => a.toLowerCase());
exports.yTokensPolygon = []; //.map((a) => a.toLowerCase());
exports.ycTokensPolygon = []; //.map((a) => a.toLowerCase());
exports.aTokensPolygon = [
    "0x27F8D03b3a2196956ED754baDc28D73be8830A6e",
    "0x1a13F4Ca1d028320A707D99520AbFefca3998b7F",
    "0x60D55F02A771d515e077c9C2403a1ef324885CeC",
    "0x5c2ed810328349100A66B82b78a1791B101C9D61",
    "0x28424507fefb6f7f8E9D3860F56504E4e5f5f390", // amWETH
].map((a) => a.toLowerCase());
