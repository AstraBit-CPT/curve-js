import { IDict } from "../interfaces";
export declare const getUserPoolListByLiquidity: (address?: string) => Promise<string[]>;
export declare const getUserLiquidityUSD: (pools: string[], address?: string) => Promise<string[]>;
export declare const getUserPoolListByClaimable: (address?: string) => Promise<string[]>;
export declare const getUserClaimable: (pools: string[], address?: string) => Promise<{
    token: string;
    symbol: string;
    amount: string;
    price: number;
}[][]>;
export declare const getUserPoolList: (address?: string, useApi?: boolean) => Promise<string[]>;
export declare const _getAmplificationCoefficientsFromApi: () => Promise<IDict<number>>;
