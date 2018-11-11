import 'reflect-metadata';
import * as mongoose from 'mongoose';
import { Types, Mongoose, ConnectionOptions, SchemaTypeOpts, Schema, SchemaType, SchemaOptions } from 'mongoose';
import * as _ from 'lodash';
import { Omit, RecursivePartial } from './types';

import * as hooks from './hooks';

//#region schema

export interface PropOptions<T> extends SchemaTypeOpts<T> {
    ref?: any;
}

export interface ArrayPropOptions extends PropOptions<any> {
}

export const SchemaKey = {
    schema: 'schema:schema',
    prop: 'schema:prop',
    virtual: 'schema:virtual',
    method: 'schema:method',
    static: 'schema:static',
    hook: 'schema:hook',
};
export function defineSchemaMetadata(fn: (obj) => any, metadataKey: any, target: Object, propertyKey: string | symbol) {
    let dict = Reflect.getMetadata(metadataKey, target) || {};
    dict = {
        ...dict,
        [propertyKey]: 1,
    }
    Reflect.defineMetadata(metadataKey, dict, target);
    let obj = Reflect.getMetadata(metadataKey, target, propertyKey);
    obj = fn(obj);
    Reflect.defineMetadata(metadataKey, obj, target, propertyKey);
}

function getSchemaMetadata<T=any>(metadataKey: any, target: Object) {
    let dict = Reflect.getMetadata(metadataKey, target) || {};
    let returnObj: {
        [key: string]: T
    } = {};
    for (let key in dict) {
        returnObj[key] = Reflect.getMetadata(metadataKey, target, key);
    }
    return returnObj;
}

const baseProp = (rawOptions, Type, target, key, isArray = false) => {
    rawOptions = {
        ...rawOptions,
    }
    const isGetterSetter = Object.getOwnPropertyDescriptor(target, key);
    if (isGetterSetter && (isGetterSetter.get || isGetterSetter.set)) {
        defineSchemaMetadata((obj) => {
            if (isGetterSetter.get) {
                obj = {
                    ...obj,
                    get: isGetterSetter.get
                }
            }

            if (isGetterSetter.set) {
                obj = {
                    ...obj,
                    get: isGetterSetter.set
                }
            }
            return obj;
        }, SchemaKey.virtual, target, key);
        return;
    }


    const options = {
        ...rawOptions
    };
    defineSchemaMetadata((obj) => {
        if (isArray && Array.isArray(obj))
            obj = obj[0];
        if (rawOptions.ref) {
            options.ref = typeof rawOptions.ref === 'string' ? rawOptions.ref : rawOptions.ref.name;
            options.Type = Schema.Types.ObjectId;
        }

        obj = {
            type: Type,
            ...options
        }

        if (isArray) {
            obj = [obj];
        }
        return obj;
    }, SchemaKey.prop, target, key);
};

export const prop = (options?: PropOptions<any>): PropertyDecorator => (target, key: string) => {
    const Type = (Reflect as any).getMetadata('design:type', target, key);

    if (!Type) {
        throw new Error(`key [${key}]no metadata`);
    }

    baseProp(options, Type, target, key);
};

export const arrayProp = (options: ArrayPropOptions): PropertyDecorator => (target, key) => {
    const Type = options.items;
    baseProp(options, Type, target, key, true);
};

const baseMethod = (target: Object, key: string | symbol, descriptor: TypedPropertyDescriptor<any>, metadataKey: string) => {
    if (descriptor === undefined) {
        descriptor = Object.getOwnPropertyDescriptor(target, key);
    }
    defineSchemaMetadata((obj) => {
        return descriptor.value;
    }, metadataKey, target, key);

};
export const setStatic: MethodDecorator = (target, key, descriptor) => {
    baseMethod(target, key, descriptor, SchemaKey.static);

};
export const setMethod: MethodDecorator = (target, key, descriptor) => {
    baseMethod(target, key, descriptor, SchemaKey.method);
};

export const setPre = hooks.setPre;
export const setPost = hooks.setPost;
export const setPlugin = hooks.setPlugin;

export let setSchema = function (options: { schemaOptions?: SchemaOptions } = {}): ClassDecorator {
    return function (target) {
        //#region props 
        let props = getSchemaMetadata(SchemaKey.prop, target.prototype);
        for (let key in props) {
            let isArray = Array.isArray(props[key]);
            let type = (isArray ? props[key][0] : props[key]).type;
            let sch = Reflect.getMetadata(SchemaKey.schema, type);
            if (sch) {
                props[key] = isArray ? [sch] : sch;
            }
        }
        options = {
            ...options
        };
        let { schemaOptions } = options;
        //#endregion

        let schema = new Schema(props, schemaOptions);

        //#region virtuals 
        let virtuals = getSchemaMetadata<{ get?, set?}>(SchemaKey.virtual, target.prototype);
        for (let key in virtuals) {
            if (virtuals[key].get)
                schema.virtual(key).get(virtuals[key].get);
            if (virtuals[key].set)
                schema.virtual(key).set(virtuals[key].set);
        }
        //#endregion

        //#region methods 
        let methods = getSchemaMetadata(SchemaKey.method, target.prototype);
        if (methods) {
            schema.methods = {
                ...schema.methods,
                ...methods
            }
        }
        //#endregion

        //#region statics
        let statics = getSchemaMetadata(SchemaKey.static, target);
        if (statics) {
            schema.statics = {
                ...schema.statics,
                ...statics
            }
        }
        //#endregion

        //#region hook 
        let hooks = getSchemaMetadata(SchemaKey.hook, target);
        if (hooks) {
            for (let key in hooks) {
                if (hooks[key]) {
                    hooks[key].forEach(ele => {
                        schema[key](...ele);
                    });
                }
            }
        }
        //#endregion        
        Reflect.defineMetadata(SchemaKey.schema, schema, target);
    }
}
//#endregion

type DefaultInstance = mongoose.Document;
export declare type InstanceType<T> = T & mongoose.Document;
export declare type ModelType<T, typeofT> = mongoose.Model<InstanceType<T>> & typeofT;
export declare type DocType<T extends DefaultInstance, U = {}> = FilteredModelAttributes<T & U, U>;
export declare type Ref<T> = T | Types.ObjectId;

export type FilteredModelAttributes<T extends DefaultInstance & U, U> =
    RecursivePartial<Omit<T, keyof (DefaultInstance & U)>> & {
        _id: Types.ObjectId;
    };

declare module "mongoose" {
    interface Document {
        _doc: DocType<this>;
    }
}
export class Model<T>  {
    createdAt?: Date;
    updatedAt?: Date;
}

export let config: {
    existingMongoose?: mongoose.Mongoose;
    existingConnection?: mongoose.Connection;
} = {};

//#region getModelForClass 
export interface GetModelForClassOptions {
    existingMongoose?: mongoose.Mongoose;
    modelOptions?: {
        name?: string;
        collection?: string;
        skipInit?: boolean;
    };
    existingConnection?: mongoose.Connection;
}
export function getModelForClass<T extends Model<T>, typeofT>(t: { new(): T }
    , {
        existingMongoose,
        existingConnection,
        modelOptions
    }: GetModelForClassOptions = {}) {
    let schema = Reflect.getMetadata(SchemaKey.schema, t);
    let model: typeof mongoose.model = mongoose.model.bind(mongoose);
    existingConnection = existingConnection || config.existingConnection;
    existingMongoose = existingMongoose || config.existingMongoose;
    if (existingConnection) {
        model = existingConnection.model.bind(existingConnection);
    } else if (existingMongoose) {
        model = existingMongoose.model.bind(existingMongoose);
    }
    modelOptions = {
        ...modelOptions
    }
    let name = modelOptions.name || t.name;
    return model(name, schema, modelOptions.collection, modelOptions.skipInit) as
        & mongoose.Model<InstanceType<T>>
        & typeofT
        & {
            //doc with type
            new(doc?: RecursivePartial<T>, type?: Boolean): InstanceType<T>
        };
}
//#endregion