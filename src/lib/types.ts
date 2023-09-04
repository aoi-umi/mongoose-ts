import mongoose, { Document } from "mongoose";
import { Types, SchemaTypeOptions, Schema, SchemaOptions } from 'mongoose';

declare module "mongoose" {
    interface Document {
        _doc?: DocType<this, any>;
    }
}

export interface _Model<T> extends mongoose.Model<T> {
}

export type DefaultInstance = mongoose.Document;
export declare type InstanceType<T> = T & mongoose.Document;
export declare type ModelType<T, typeofT> = mongoose.Model<{}, {}, {}, {}, InstanceType<T>> & typeofT;
export declare type DocType<T extends DefaultInstance, U = {}> = FilteredModelAttributes<T & U, U>;
export declare type SubDocType<T> = Types.Subdocument & T;
export declare type Ref<T> = T | Types.ObjectId;
export declare type ModelArgsType<T extends DefaultInstance, U = {}> = FilteredModelAttributesArgs<T & U, U>;

type BaseDoc = {
    _id?: Types.ObjectId;
    id?: string;
}
export type FilteredModelAttributes<T extends DefaultInstance & U, U> =
    Partial<Omit<T, keyof (DefaultInstance & U)>> & BaseDoc;

export type FilteredModelAttributesArgs<T extends DefaultInstance & U, U> =
    RecursivePartial<Omit<T, keyof (DefaultInstance & U)>> & BaseDoc;


export declare type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
export declare type NonAbstract<T> = {
    [P in keyof T]: T[P];
};
