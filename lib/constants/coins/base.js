"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aTokensBase = exports.ycTokensBase = exports.yTokensBase = exports.cTokensBase = exports.COINS_BASE = void 0;
const utils_js_1 = require("../utils.js");
exports.COINS_BASE = (0, utils_js_1.lowerCaseValues)({
    crv: '0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415',
    // --- ETH ---
    eth: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    weth: '0x4200000000000000000000000000000000000006',
});
exports.cTokensBase = []; //.map((a) => a.toLowerCase());
exports.yTokensBase = []; //.map((a) => a.toLowerCase());
exports.ycTokensBase = []; //.map((a) => a.toLowerCase());
exports.aTokensBase = []; //.map((a) => a.toLowerCase());
