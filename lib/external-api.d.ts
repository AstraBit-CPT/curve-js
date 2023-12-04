import memoize from "memoizee";
import { IExtendedPoolDataFromApi, ISubgraphPoolData, IDict, INetworkName, IPoolType } from "./interfaces";
export declare const _getPoolsFromApi: ((network: INetworkName, poolType: IPoolType) => Promise<IExtendedPoolDataFromApi>) & memoize.Memoized<(network: INetworkName, poolType: IPoolType) => Promise<IExtendedPoolDataFromApi>>;
export declare const _getAllPoolsFromApi: (network: INetworkName) => Promise<IExtendedPoolDataFromApi[]>;
export declare const _getSubgraphData: ((network: INetworkName) => Promise<{
    poolsData: ISubgraphPoolData[];
    totalVolume: number;
    cryptoVolume: number;
    cryptoShare: number;
}>) & memoize.Memoized<(network: INetworkName) => Promise<{
    poolsData: ISubgraphPoolData[];
    totalVolume: number;
    cryptoVolume: number;
    cryptoShare: number;
}>>;
export declare const _getLegacyAPYsAndVolumes: ((network: string) => Promise<IDict<{
    apy: {
        day: number;
        week: number;
    };
    volume: number;
}>>) & memoize.Memoized<(network: string) => Promise<IDict<{
    apy: {
        day: number;
        week: number;
    };
    volume: number;
}>>>;
export declare const _getFactoryAPYsAndVolumes: ((network: string) => Promise<{
    poolAddress: string;
    apy: number;
    volume: number;
}[]>) & memoize.Memoized<(network: string) => Promise<{
    poolAddress: string;
    apy: number;
    volume: number;
}[]>>;
export declare const _getAllGauges: (() => Promise<IDict<{
    gauge: string;
    is_killed?: boolean;
    gaugeStatus?: Record<string, boolean> | null;
}>>) & memoize.Memoized<() => Promise<IDict<{
    gauge: string;
    is_killed?: boolean;
    gaugeStatus?: Record<string, boolean> | null;
}>>>;
export declare const _getHiddenPools: (() => Promise<IDict<string[]>>) & memoize.Memoized<() => Promise<IDict<string[]>>>;
export declare const _generateBoostingProof: ((block: number, address: string) => Promise<{
    block_header_rlp: string;
    proof_rlp: string;
}>) & memoize.Memoized<(block: number, address: string) => Promise<{
    block_header_rlp: string;
    proof_rlp: string;
}>>;
