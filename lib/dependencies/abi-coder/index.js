"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coder = void 0;
const ethers_1 = require("ethers");
class Coder {
    constructor(abi) {
        this.abi = abi;
    }
    getFunctionSelector(name) {
        const func = this.getFunctionByName(name);
        const jsonInputs = func?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
        const signature = Coder.getSignature(name, inputs);
        const hash = sha3(signature);
        return hash.substring(0, 10);
    }
    getEventTopic(name) {
        const event = this.getEventByName(name);
        const jsonInputs = event?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input, true));
        const signature = Coder.getSignature(name, inputs);
        return sha3(signature);
    }
    decodeConstructor(data) {
        const constructor = this.getConstructor();
        const jsonInputs = constructor?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
        const result = ethers_1.AbiCoder.defaultAbiCoder().decode(inputs, data);
        const values = toValueMap(result, inputs);
        return {
            inputs,
            values,
        };
    }
    decodeEvent(topics, data) {
        const event = this.getEventByTopic(topics[0]);
        const [, ...dataTopics] = topics;
        const jsonInputs = event?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input, true));
        // Decode topics
        const topicInputs = inputs.filter((input) => input.indexed);
        const topicResult = topicInputs.map((input, index) => {
            const topic = dataTopics[index];
            const params = ethers_1.AbiCoder.defaultAbiCoder().decode([input], topic);
            const [param] = params;
            return param;
        });
        // Decode data
        const dataInputs = inputs.filter((input) => !input.indexed);
        const dataResult = ethers_1.AbiCoder.defaultAbiCoder().decode(dataInputs, data);
        // Concat
        if (!event.name) {
            throw Error;
        }
        let topicIndex = 0;
        let dataIndex = 0;
        const result = new ethers_1.Result();
        for (const input of inputs) {
            if (input.indexed) {
                result.push(topicResult[topicIndex]);
                topicIndex++;
            }
            else {
                result.push(dataResult[dataIndex]);
                dataIndex++;
            }
        }
        const values = toValueMap(result, inputs);
        return {
            name: event.name,
            inputs,
            values,
        };
    }
    decodeFunction(data) {
        const selector = data.substring(0, 10);
        const func = this.getFunctionBySelector(selector);
        // Decode calldata using function inputs
        const jsonInputs = func?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
        const calldata = `0x${data.substring(10)}`;
        const result = ethers_1.AbiCoder.defaultAbiCoder().decode(inputs, calldata);
        const values = toValueMap(result, inputs);
        if (!func.name) {
            throw Error;
        }
        return {
            name: func.name,
            inputs,
            values,
        };
    }
    decodeFunctionOutput(name, data) {
        const func = this.getFunctionByName(name);
        const jsonOutputs = func?.outputs;
        if (!jsonOutputs) {
            throw Error;
        }
        const outputs = jsonOutputs.map((output) => ethers_1.ParamType.from(output));
        const result = ethers_1.AbiCoder.defaultAbiCoder().decode(outputs, data);
        const values = toValueMap(result, outputs);
        return {
            name,
            outputs,
            values,
        };
    }
    encodeConstructor(valueMap) {
        const constructor = this.getConstructor();
        const jsonInputs = constructor?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
        const values = toValues(valueMap, inputs);
        return ethers_1.AbiCoder.defaultAbiCoder().encode(inputs, values);
    }
    encodeEvent(name, values) {
        const event = this.getEventByName(name);
        const jsonInputs = event?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input, true));
        const eventSignature = Coder.getSignature(name, inputs);
        const eventTopic = sha3(eventSignature);
        // Group params by type
        const topicResult = new ethers_1.Result();
        const dataResult = [];
        for (let i = 0; i < inputs.length; i++) {
            const input = inputs[i];
            const value = values[input.name];
            if (input.indexed) {
                topicResult.push(value);
            }
            else {
                dataResult.push(value);
            }
        }
        // Encode topic params
        const topicInputs = inputs.filter((input) => input.indexed);
        const dataTopics = topicInputs.map((input, index) => {
            return ethers_1.AbiCoder.defaultAbiCoder().encode([input], [topicResult[index]]);
        });
        const topics = [eventTopic, ...dataTopics];
        // Encode data params
        const dataInputs = inputs.filter((input) => !input.indexed);
        const data = ethers_1.AbiCoder.defaultAbiCoder().encode(dataInputs, dataResult);
        return {
            topics,
            data,
        };
    }
    encodeFunction(name, valueMap) {
        const func = this.getFunctionByName(name);
        const jsonInputs = func?.inputs;
        if (!jsonInputs) {
            throw Error;
        }
        const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
        const signature = Coder.getSignature(name, inputs);
        const selector = sha3(signature).substring(2, 10);
        const values = toValues(valueMap, inputs);
        const argumentString = ethers_1.AbiCoder.defaultAbiCoder().encode(inputs, values);
        const argumentData = argumentString.substring(2);
        const inputData = `0x${selector}${argumentData}`;
        return inputData;
    }
    encodeFunctionOutput(name, valueMap) {
        const func = this.getFunctionByName(name);
        const jsonOutputs = func.outputs;
        if (!jsonOutputs) {
            throw Error;
        }
        const outputs = jsonOutputs.map((output) => ethers_1.ParamType.from(output));
        const values = toValues(valueMap, outputs);
        return ethers_1.AbiCoder.defaultAbiCoder().encode(outputs, values);
    }
    getConstructor() {
        const constructor = this.abi.find((item) => item.type === 'constructor');
        if (!constructor) {
            throw Error;
        }
        return constructor;
    }
    getFunctionByName(name) {
        const func = this.abi.find((item) => item.type === 'function' && item.name === name);
        if (!func) {
            throw Error;
        }
        return func;
    }
    getFunctionBySelector(selector) {
        const functions = this.abi.filter((item) => item.type === 'function' || item.type === 'error');
        const func = functions.find((func) => {
            const name = func.name;
            const jsonInputs = func.inputs;
            if (!name || !jsonInputs) {
                return false;
            }
            const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input));
            const signature = Coder.getSignature(name, inputs);
            const hash = sha3(signature);
            const funcSelector = hash.substring(0, 10);
            return funcSelector === selector;
        });
        if (!func) {
            throw Error;
        }
        return func;
    }
    getEventByName(name) {
        const event = this.abi.find((item) => item.type === 'event' && item.name === name);
        if (!event) {
            throw Error;
        }
        return event;
    }
    getEventByTopic(topic) {
        const events = this.abi.filter((item) => item.type === 'event');
        const event = events.find((event) => {
            const name = event.name;
            const jsonInputs = event.inputs;
            if (!name || !jsonInputs) {
                return false;
            }
            const inputs = jsonInputs.map((input) => ethers_1.ParamType.from(input, true));
            const signature = Coder.getSignature(name, inputs);
            const eventTopic = sha3(signature);
            return eventTopic === topic;
        });
        if (!event) {
            throw Error;
        }
        return event;
    }
    static getSignature(name, inputs) {
        const inputSignatures = [];
        for (const input of inputs) {
            const inputSignature = this.getInputSignature(input);
            inputSignatures.push(inputSignature);
        }
        const inputString = inputSignatures.join(',');
        const functionSignature = `${name}(${inputString})`;
        return functionSignature;
    }
    static getInputSignature(input) {
        if (input.baseType === 'array') {
            const arityString = input.arrayLength && input.arrayLength >= 0
                ? `[${input.arrayLength}]`
                : '[]';
            if (!input.arrayChildren) {
                throw Error;
            }
            return `${this.getInputSignature(input.arrayChildren)}${arityString}`;
        }
        if (input.baseType === 'tuple') {
            if (!input.components) {
                throw Error;
            }
            return `(${input.components
                .map((childInput) => this.getInputSignature(childInput))
                .join(',')})`;
        }
        return input.type;
    }
}
exports.Coder = Coder;
function sha3(input) {
    return (0, ethers_1.keccak256)((0, ethers_1.toUtf8Bytes)(input));
}
function toValueMap(values, inputs) {
    return Object.fromEntries(values.toArray().map((value, index) => {
        const input = inputs[index];
        return [input.name, value];
    }));
}
function toValues(valueMap, inputs) {
    return inputs.map((input) => {
        return valueMap[input.name];
    });
}
