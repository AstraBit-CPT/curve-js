"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aTokensBsc = exports.ycTokensBsc = exports.yTokensBsc = exports.cTokensBsc = exports.COINS_BSC = void 0;
const utils_js_1 = require("../utils.js");
exports.COINS_BSC = (0, utils_js_1.lowerCaseValues)({
    //crv: '0x8Ee73c484A26e0A5df2Ee2a4960B789967dd0415', // <--- TODO ADD
    // --- BSC ---
    bnb: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
});
exports.cTokensBsc = []; //.map((a) => a.toLowerCase());
exports.yTokensBsc = []; //.map((a) => a.toLowerCase());
exports.ycTokensBsc = []; //.map((a) => a.toLowerCase());
exports.aTokensBsc = []; //.map((a) => a.toLowerCase());
