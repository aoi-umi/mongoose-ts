import 'reflect-metadata';
import * as mongoose from 'mongoose';
import { Types, Mongoose, ConnectionOptions, SchemaTypeOpts, Schema, SchemaType, SchemaOptions } from 'mongoose';
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

function getSchemaMetadata<T = any>(metadataKey: any, target: Object) {
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
                    set: isGetterSetter.set
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
        if (config.schemaOptions) {
            schemaOptions = {
                ...config.schemaOptions,
                ...schemaOptions,
            }
        }
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

export let getSchema = function <TFunction extends Function>(model: TFunction) {
    let schema: Schema = Reflect.getMetadata(SchemaKey.schema, model);
    return schema;
}
//#endregion

type DefaultInstance = mongoose.Document;
export declare type InstanceType<T> = T & mongoose.Document;
export declare type ModelType<T, typeofT> = mongoose.Model<InstanceType<T>> & typeofT;
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

declare module "mongoose" {
    interface Document {
        _doc: DocType<this, any>;
    }
}
interface _Model<T> extends mongoose.Model<InstanceType<T>> {
}
declare var _Model1: <T>(t?: T) => _Model<T>;
exports.Model = class { };
export declare class Model<T, DocOmit = {}> extends _Model1() {
    createdAt?: Date;
    updatedAt?: Date;
    _doc: DocType<InstanceType<T>, DocOmit>;
}

export let config: {
    existingMongoose?: mongoose.Mongoose;
    existingConnection?: mongoose.Connection;
    schemaOptions?: SchemaOptions;
    toCollectionName?: (modelName: string) => string;
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
export function getModelForClass<T extends Model<T>, typeofT, PluginType = {}>(t: { new(): T }
    , {
        existingMongoose,
        existingConnection,
        modelOptions
    }: GetModelForClassOptions = {}) {
    let schema: Schema = Reflect.getMetadata(SchemaKey.schema, t);
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
    let collection = modelOptions.collection;
    if (!collection) {
        let schColl = schema.get('collection');
        if (schColl)
            collection = schColl;
    }

    if (!collection && config.toCollectionName) {
        let newColl = config.toCollectionName(name);
        if (newColl)
            collection = newColl;
    }
    type PropType = T & PluginType;
    return model(name, schema, collection, modelOptions.skipInit) as
        & mongoose.Model<InstanceType<PropType>>
        & typeofT
        & {
            //doc with type
            new(doc?: ModelArgsType<PropType>, type?: Boolean): InstanceType<PropType>
        };
}
//#endregion

export * from './gridfs';