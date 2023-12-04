import { IDict, IFactoryPoolType, IPoolData, ICurve, IPoolDataFromApi } from "../interfaces";
export declare const lowerCasePoolDataAddresses: (poolsData: IPoolDataFromApi[]) => IPoolDataFromApi[];
export declare function getFactoryPoolsDataFromApi(this: ICurve, factoryType: IFactoryPoolType): Promise<IDict<IPoolData>>;
