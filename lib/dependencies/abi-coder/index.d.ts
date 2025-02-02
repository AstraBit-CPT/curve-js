import { JsonFragment, ParamType } from 'ethers';
interface FunctionData {
    name: string;
    inputs: ParamType[];
    values: ValueMap;
}
interface FunctionOutputData {
    name: string;
    outputs: ParamType[];
    values: ValueMap;
}
interface Constructor {
    inputs: ParamType[];
    values: ValueMap;
}
interface Event {
    name: string;
    inputs: ParamType[];
    values: ValueMap;
}
interface EventEncoding {
    topics: string[];
    data: string;
}
type ValueMap = Record<string, unknown>;
declare class Coder {
    private abi;
    constructor(abi: JsonFragment[]);
    getFunctionSelector(name: string): string;
    getEventTopic(name: string): string;
    decodeConstructor(data: string): Constructor;
    decodeEvent(topics: string[], data: string): Event;
    decodeFunction(data: string): FunctionData;
    decodeFunctionOutput(name: string, data: string): FunctionOutputData;
    encodeConstructor(valueMap: ValueMap): string;
    encodeEvent(name: string, values: ValueMap): EventEncoding;
    encodeFunction(name: string, valueMap: ValueMap): string;
    encodeFunctionOutput(name: string, valueMap: ValueMap): string;
    private getConstructor;
    private getFunctionByName;
    private getFunctionBySelector;
    private getEventByName;
    private getEventByTopic;
    private static getSignature;
    private static getInputSignature;
}
export { Coder, Constructor, Event, EventEncoding, FunctionData, FunctionOutputData, ValueMap, };
