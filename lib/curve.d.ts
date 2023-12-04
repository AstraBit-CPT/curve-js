import { ethers, Contract, Networkish, BigNumberish, Numeric } from "ethers";
import { Provider as MulticallProvider, Contract as MulticallContract } from './dependencies/ethcall/index.js';
import { IPoolData, IDict, ICurve, INetworkName, IChainId, IFactoryPoolType } from "./interfaces";
export declare const NATIVE_TOKENS: {
    [index: number]: {
        symbol: string;
        wrappedSymbol: string;
        address: string;
        wrappedAddress: string;
    };
};
export declare const NETWORK_CONSTANTS: {
    [index: number]: any;
};
declare class Curve implements ICurve {
    provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
    multicallProvider: MulticallProvider;
    signer: ethers.Signer | null;
    signerAddress: string;
    chainId: IChainId;
    contracts: {
        [index: string]: {
            contract: Contract;
            multicallContract: MulticallContract;
        };
    };
    feeData: {
        gasPrice?: number;
        maxFeePerGas?: number;
        maxPriorityFeePerGas?: number;
    };
    constantOptions: {
        gasLimit: number;
    };
    options: {
        gasPrice?: number | bigint;
        maxFeePerGas?: number | bigint;
        maxPriorityFeePerGas?: number | bigint;
    };
    constants: {
        NATIVE_TOKEN: {
            symbol: string;
            wrappedSymbol: string;
            address: string;
            wrappedAddress: string;
        };
        NETWORK_NAME: INetworkName;
        ALIASES: IDict<string>;
        POOLS_DATA: IDict<IPoolData>;
        FACTORY_POOLS_DATA: IDict<IPoolData>;
        CRVUSD_FACTORY_POOLS_DATA: IDict<IPoolData>;
        EYWA_FACTORY_POOLS_DATA: IDict<IPoolData>;
        CRYPTO_FACTORY_POOLS_DATA: IDict<IPoolData>;
        TRICRYPTO_FACTORY_POOLS_DATA: IDict<IPoolData>;
        STABLE_NG_FACTORY_POOLS_DATA: IDict<IPoolData>;
        LLAMMAS_DATA: IDict<IPoolData>;
        COINS: IDict<string>;
        DECIMALS: IDict<number>;
        GAUGES: string[];
        FACTORY_GAUGE_IMPLEMENTATIONS: IDict<IFactoryPoolType>;
        ZERO_ADDRESS: string;
    };
    constructor();
    init(providerType: 'JsonRpc' | 'Web3' | 'Infura' | 'Alchemy', providerSettings: {
        url?: string;
        privateKey?: string;
        batchMaxCount?: number;
    } | {
        externalProvider: ethers.Eip1193Provider;
    } | {
        network?: Networkish;
        apiKey?: string;
    }, options?: {
        gasPrice?: number;
        maxFeePerGas?: number;
        maxPriorityFeePerGas?: number;
        chainId?: number;
    }): Promise<void>;
    setContract(address: string, abi: any): void;
    _filterHiddenPools(pools: IDict<IPoolData>): Promise<IDict<IPoolData>>;
    _updateDecimalsAndGauges(pools: IDict<IPoolData>): void;
    fetchFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchCrvusdFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchEywaFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchCryptoFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchTricryptoFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchStableNgFactoryPools: (useApi?: boolean) => Promise<void>;
    fetchNewFactoryPools: () => Promise<string[]>;
    fetchNewStableNgFactoryPools: () => Promise<string[]>;
    fetchNewCryptoFactoryPools: () => Promise<string[]>;
    fetchNewTricryptoFactoryPools: () => Promise<string[]>;
    fetchRecentlyDeployedFactoryPool: (poolAddress: string) => Promise<string>;
    fetchRecentlyDeployedStableNgFactoryPool: (poolAddress: string) => Promise<string>;
    fetchRecentlyDeployedCryptoFactoryPool: (poolAddress: string) => Promise<string>;
    fetchRecentlyDeployedTricryptoFactoryPool: (poolAddress: string) => Promise<string>;
    getMainPoolList: () => string[];
    getFactoryPoolList: () => string[];
    getCrvusdFactoryPoolList: () => string[];
    getEywaFactoryPoolList: () => string[];
    getCryptoFactoryPoolList: () => string[];
    getTricryptoFactoryPoolList: () => string[];
    getStableNgFactoryPoolList: () => string[];
    getPoolList: () => string[];
    getPoolsData: () => IDict<IPoolData>;
    getGaugeImplementation: (factoryType: IFactoryPoolType) => string;
    setCustomFeeData(customFeeData: {
        gasPrice?: number;
        maxFeePerGas?: number;
        maxPriorityFeePerGas?: number;
    }): void;
    formatUnits(value: BigNumberish, unit?: string | Numeric): string;
    parseUnits(value: string, unit?: string | Numeric): bigint;
    updateFeeData(): Promise<void>;
}
export declare const curve: Curve;
export {};
