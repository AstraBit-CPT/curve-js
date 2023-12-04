import { IDict, IPoolData, ICurve } from "../interfaces";
export declare function getTricryptoFactoryPoolData(this: ICurve, fromIdx?: number, swapAddress?: string): Promise<IDict<IPoolData>>;
