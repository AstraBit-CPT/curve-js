"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitProof = exports.submitProofEstimateGas = exports.sendBlockhash = exports.sendBlockhashEstimateGas = exports.blockToSend = exports.lastBlockSent = exports.topUpAnycall = exports.topUpAnycallEstimateGas = exports.getAnycallBalance = exports.lastEthBlock = exports.claimFees = exports.claimFeesEstimateGas = exports.claimableFees = exports.withdrawLockedCrv = exports.withdrawLockedCrvEstimateGas = exports.increaseUnlockTime = exports.increaseUnlockTimeEstimateGas = exports.increaseAmount = exports.increaseAmountEstimateGas = exports.createLock = exports.calcUnlockTime = exports.createLockEstimateGas = exports.approve = exports.approveEstimateGas = exports.isApproved = exports.getVeCrvPct = exports.getVeCrv = exports.getLockedAmountAndUnlockTime = exports.getCrv = void 0;
const ethers_1 = require("ethers");
const curve_js_1 = require("./curve.js");
const fee_distributor_view_json_1 = __importDefault(require("./constants/abis/fee_distributor_view.json"));
const utils_js_1 = require("./utils.js");
const utils_js_2 = require("./utils.js");
const external_api_js_1 = require("./external-api.js");
const getCrv = async (...addresses) => {
    addresses = (0, utils_js_1._prepareAddresses)(addresses);
    const rawBalances = (await (0, utils_js_1._getBalances)([curve_js_1.curve.constants.ALIASES.crv], addresses));
    const balances = {};
    for (const address of addresses) {
        balances[address] = rawBalances[address].shift();
    }
    return addresses.length === 1 ? balances[addresses[0]] : balances;
};
exports.getCrv = getCrv;
const getLockedAmountAndUnlockTime = async (...addresses) => {
    addresses = (0, utils_js_1._prepareAddresses)(addresses);
    const veContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].multicallContract;
    const contractCalls = addresses.map((address) => veContract.locked(address));
    const response = (await curve_js_1.curve.multicallProvider.all(contractCalls)).map((value) => [curve_js_1.curve.formatUnits(value[0]), Number(curve_js_1.curve.formatUnits(value[1], 0)) * 1000]);
    const result = {};
    addresses.forEach((addr, i) => {
        result[addr] = { lockedAmount: response[i][0], unlockTime: response[i][1] };
    });
    return addresses.length === 1 ? result[addresses[0]] : result;
};
exports.getLockedAmountAndUnlockTime = getLockedAmountAndUnlockTime;
const getVeCrv = async (...addresses) => {
    addresses = (0, utils_js_1._prepareAddresses)(addresses);
    const veContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].multicallContract;
    const contractCalls = addresses.map((address) => veContract.balanceOf(address));
    const response = (await curve_js_1.curve.multicallProvider.all(contractCalls)).map((value) => curve_js_1.curve.formatUnits(value));
    const result = {};
    addresses.forEach((addr, i) => {
        result[addr] = response[i];
    });
    return addresses.length === 1 ? result[addresses[0]] : result;
};
exports.getVeCrv = getVeCrv;
const getVeCrvPct = async (...addresses) => {
    addresses = (0, utils_js_1._prepareAddresses)(addresses);
    const veContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].multicallContract;
    const contractCalls = [veContract.totalSupply()];
    addresses.forEach((address) => {
        contractCalls.push(veContract.balanceOf(address));
    });
    const response = (await curve_js_1.curve.multicallProvider.all(contractCalls)).map((value) => (0, utils_js_2.toBN)(value));
    const [veTotalSupply] = response.splice(0, 1);
    const resultBN = {};
    addresses.forEach((acct, i) => {
        resultBN[acct] = response[i].div(veTotalSupply).times(100);
    });
    const result = {};
    for (const entry of Object.entries(resultBN)) {
        result[entry[0]] = (0, utils_js_2.toStringFromBN)(entry[1]);
    }
    return addresses.length === 1 ? result[addresses[0]] : result;
};
exports.getVeCrvPct = getVeCrvPct;
const isApproved = async (amount) => {
    return await (0, utils_js_1.hasAllowance)([curve_js_1.curve.constants.ALIASES.crv], [amount], curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.voting_escrow);
};
exports.isApproved = isApproved;
const approveEstimateGas = async (amount) => {
    return await (0, utils_js_1.ensureAllowanceEstimateGas)([curve_js_1.curve.constants.ALIASES.crv], [amount], curve_js_1.curve.constants.ALIASES.voting_escrow, false);
};
exports.approveEstimateGas = approveEstimateGas;
const approve = async (amount) => {
    return await (0, utils_js_1.ensureAllowance)([curve_js_1.curve.constants.ALIASES.crv], [amount], curve_js_1.curve.constants.ALIASES.voting_escrow, false);
};
exports.approve = approve;
const createLockEstimateGas = async (amount, days) => {
    const crvBalance = await (0, exports.getCrv)();
    if (Number(crvBalance) < Number(amount)) {
        throw Error(`Not enough . Actual: ${crvBalance}, required: ${amount}`);
    }
    if (!(await (0, utils_js_1.hasAllowance)([curve_js_1.curve.constants.ALIASES.crv], [amount], curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.voting_escrow))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    const _amount = (0, utils_js_2.parseUnits)(amount);
    const unlockTime = Math.floor(Date.now() / 1000) + (days * 86400);
    return Number(await curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract.create_lock.estimateGas(_amount, unlockTime, curve_js_1.curve.constantOptions));
};
exports.createLockEstimateGas = createLockEstimateGas;
const calcUnlockTime = (days, start = Date.now()) => {
    const week = 86400 * 7;
    const now = start / 1000;
    const unlockTime = now + (86400 * days);
    return Math.floor(unlockTime / week) * week * 1000;
};
exports.calcUnlockTime = calcUnlockTime;
const createLock = async (amount, days) => {
    const _amount = (0, utils_js_2.parseUnits)(amount);
    const unlockTime = Math.floor(Date.now() / 1000) + (86400 * days);
    await (0, utils_js_2._ensureAllowance)([curve_js_1.curve.constants.ALIASES.crv], [_amount], curve_js_1.curve.constants.ALIASES.voting_escrow, false);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.create_lock.estimateGas(_amount, unlockTime, curve_js_1.curve.constantOptions)));
    return (await contract.create_lock(_amount, unlockTime, { ...curve_js_1.curve.options, gasLimit })).hash;
};
exports.createLock = createLock;
const increaseAmountEstimateGas = async (amount) => {
    const crvBalance = await (0, exports.getCrv)();
    if (Number(crvBalance) < Number(amount)) {
        throw Error(`Not enough. Actual: ${crvBalance}, required: ${amount}`);
    }
    if (!(await (0, utils_js_1.hasAllowance)([curve_js_1.curve.constants.ALIASES.crv], [amount], curve_js_1.curve.signerAddress, curve_js_1.curve.constants.ALIASES.voting_escrow))) {
        throw Error("Token allowance is needed to estimate gas");
    }
    const _amount = (0, utils_js_2.parseUnits)(amount);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    return Number(await contract.increase_amount.estimateGas(_amount, curve_js_1.curve.constantOptions));
};
exports.increaseAmountEstimateGas = increaseAmountEstimateGas;
const increaseAmount = async (amount) => {
    const _amount = (0, utils_js_2.parseUnits)(amount);
    await (0, utils_js_2._ensureAllowance)([curve_js_1.curve.constants.ALIASES.crv], [_amount], curve_js_1.curve.constants.ALIASES.voting_escrow, false);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.increase_amount.estimateGas(_amount, curve_js_1.curve.constantOptions)));
    return (await contract.increase_amount(_amount, { ...curve_js_1.curve.options, gasLimit })).hash;
};
exports.increaseAmount = increaseAmount;
const increaseUnlockTimeEstimateGas = async (days) => {
    const { unlockTime } = await (0, exports.getLockedAmountAndUnlockTime)();
    const newUnlockTime = Math.floor(unlockTime / 1000) + (days * 86400);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    return Number((0, utils_js_1.DIGas)(await contract.increase_unlock_time.estimateGas(newUnlockTime, curve_js_1.curve.constantOptions)));
};
exports.increaseUnlockTimeEstimateGas = increaseUnlockTimeEstimateGas;
const increaseUnlockTime = async (days) => {
    const { unlockTime } = await (0, exports.getLockedAmountAndUnlockTime)();
    const newUnlockTime = Math.floor(unlockTime / 1000) + (days * 86400);
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.increase_unlock_time.estimateGas(newUnlockTime, curve_js_1.curve.constantOptions)));
    return (await contract.increase_unlock_time(newUnlockTime, { ...curve_js_1.curve.options, gasLimit })).hash;
};
exports.increaseUnlockTime = increaseUnlockTime;
const withdrawLockedCrvEstimateGas = async () => {
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    return Number((0, utils_js_1.DIGas)(await contract.withdraw.estimateGas(curve_js_1.curve.constantOptions)));
};
exports.withdrawLockedCrvEstimateGas = withdrawLockedCrvEstimateGas;
const withdrawLockedCrv = async () => {
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow].contract;
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.withdraw.estimateGas(curve_js_1.curve.constantOptions)));
    return (await contract.withdraw({ ...curve_js_1.curve.options, gasLimit })).hash;
};
exports.withdrawLockedCrv = withdrawLockedCrv;
const claimableFees = async (address = "") => {
    address = address || curve_js_1.curve.signerAddress;
    const contract = new ethers_1.Contract(curve_js_1.curve.constants.ALIASES.fee_distributor, fee_distributor_view_json_1.default, curve_js_1.curve.provider);
    return curve_js_1.curve.formatUnits(await contract.claim(address, curve_js_1.curve.constantOptions));
};
exports.claimableFees = claimableFees;
const claimFeesEstimateGas = async (address = "") => {
    address = address || curve_js_1.curve.signerAddress;
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.fee_distributor].contract;
    return Number((0, utils_js_1.DIGas)(await contract.claim.estimateGas(address, curve_js_1.curve.constantOptions)));
};
exports.claimFeesEstimateGas = claimFeesEstimateGas;
const claimFees = async (address = "") => {
    address = address || curve_js_1.curve.signerAddress;
    const contract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.fee_distributor].contract;
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(await contract.claim.estimateGas(address, curve_js_1.curve.constantOptions)));
    return (await contract.claim(address, { ...curve_js_1.curve.options, gasLimit })).hash;
};
exports.claimFees = claimFees;
//  ------------ SIDECHAIN ------------
const lastEthBlock = async () => {
    if (curve_js_1.curve.chainId === 1)
        throw Error("There is no lastBlock method on ethereum network");
    const veOracleContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow_oracle].contract;
    return Number(await veOracleContract.last_eth_block_number(curve_js_1.curve.constantOptions));
};
exports.lastEthBlock = lastEthBlock;
const getAnycallBalance = async () => {
    if (curve_js_1.curve.chainId === 1)
        throw Error("There is no getAnycallBalance method on ethereum network");
    const anycallContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.anycall].contract;
    const _balance = await anycallContract.executionBudget(curve_js_1.curve.constants.ALIASES.voting_escrow_oracle, curve_js_1.curve.constantOptions);
    return curve_js_1.curve.formatUnits(_balance);
};
exports.getAnycallBalance = getAnycallBalance;
const DEFAULT_AMOUNT = (curve_js_1.curve.chainId === 42161 || curve_js_1.curve.chainId === 10) ? 0.00001 : 0.1;
const _topUpAnycall = async (amount, estimateGas) => {
    if (curve_js_1.curve.chainId === 1)
        throw Error("There is no topUpAnycall method on ethereum network");
    const anycallContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.anycall].contract;
    const value = curve_js_1.curve.parseUnits(String(amount));
    const gas = await anycallContract.deposit.estimateGas(curve_js_1.curve.constants.ALIASES.voting_escrow_oracle, { ...curve_js_1.curve.constantOptions, value });
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    return (await anycallContract.deposit(curve_js_1.curve.constants.ALIASES.voting_escrow_oracle, { ...curve_js_1.curve.options, gasLimit, value })).hash;
};
const topUpAnycallEstimateGas = async (amount = DEFAULT_AMOUNT) => {
    return await _topUpAnycall(amount, true);
};
exports.topUpAnycallEstimateGas = topUpAnycallEstimateGas;
const topUpAnycall = async (amount = DEFAULT_AMOUNT) => {
    return await _topUpAnycall(amount, false);
};
exports.topUpAnycall = topUpAnycall;
const lastBlockSent = async (chainId) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("lastBlockNumberSent method is on ethereum network only");
    const veOracleContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow_oracle].contract;
    return Number(await veOracleContract.get_last_block_number_sent(chainId, curve_js_1.curve.constantOptions));
};
exports.lastBlockSent = lastBlockSent;
const blockToSend = async () => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("blockToSend method is on ethereum network only");
    return (await curve_js_1.curve.provider.getBlockNumber()) - 128;
};
exports.blockToSend = blockToSend;
const _sendBlockhash = async (block, chainId, estimateGas) => {
    if (curve_js_1.curve.chainId !== 1)
        throw Error("sendBlockhash method is on ethereum network only");
    const veOracleContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow_oracle].contract;
    const gas = await veOracleContract.send_blockhash.estimateGas(block, chainId, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    return (await veOracleContract.send_blockhash(block, chainId, { ...curve_js_1.curve.options, gasLimit })).hash;
};
const sendBlockhashEstimateGas = async (block, chainId) => {
    return await _sendBlockhash(block, chainId, true);
};
exports.sendBlockhashEstimateGas = sendBlockhashEstimateGas;
const sendBlockhash = async (block, chainId) => {
    return await _sendBlockhash(block, chainId, false);
};
exports.sendBlockhash = sendBlockhash;
const _submitProof = async (block, address = curve_js_1.curve.signerAddress, estimateGas) => {
    if (curve_js_1.curve.chainId === 1)
        throw Error("submitProof method is on ethereum network only");
    if (address === "")
        throw Error("Pass address you want to submit proof for");
    const proof = await (0, external_api_js_1._generateBoostingProof)(block, address);
    const veOracleContract = curve_js_1.curve.contracts[curve_js_1.curve.constants.ALIASES.voting_escrow_oracle].contract;
    const gas = await veOracleContract.submit_state.estimateGas(address, "0x" + proof.block_header_rlp, "0x" + proof.proof_rlp, curve_js_1.curve.constantOptions);
    if (estimateGas)
        return (0, utils_js_1.smartNumber)(gas);
    await curve_js_1.curve.updateFeeData();
    const gasLimit = (0, utils_js_1.mulBy1_3)((0, utils_js_1.DIGas)(gas));
    return (await veOracleContract.submit_state(address, "0x" + proof.block_header_rlp, "0x" + proof.proof_rlp, { ...curve_js_1.curve.options, gasLimit })).hash;
};
const submitProofEstimateGas = async (block, address = curve_js_1.curve.signerAddress) => {
    return await _submitProof(block, address, true);
};
exports.submitProofEstimateGas = submitProofEstimateGas;
const submitProof = async (block, address = curve_js_1.curve.signerAddress) => {
    return await _submitProof(block, address, false);
};
exports.submitProof = submitProof;
