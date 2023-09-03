import * as mongodb from 'mongodb';
import {
    Document, Query, Aggregate, Schema,
    PreMiddlewareFunction,
} from 'mongoose';
import { defineSchemaMetadata, SchemaKey, Model } from '.';

interface Hooks {
    /**
     * Registers a plugin for this schema.
     * @param plugin callback
     */
    plugin(plugin: (schema: Schema) => void): ClassDecorator;
    plugin<T>(plugin: (schema: Schema, options: T) => void, opts: T): ClassDecorator;

    /**
    * Defines a post hook for the document
    * Post hooks fire on the event emitted from document instances of Models compiled
    *   from this schema.
    * @param method name of the method to hook
    * @param fn callback
    */
    post<T extends Document>(method: string, fn: (
        error: mongodb.MongoError, doc: T, next: (err?: NativeError) => void
    ) => void): ClassDecorator;

    post<T extends Document>(method: string, fn: (
        doc: T, next: (err?: NativeError) => void
    ) => void): ClassDecorator;

    /**
     * Defines a pre hook for the document.
     */
    pre<T extends Document = Document>(
        method: "init" | "validate" | "save" | "remove",
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Query<any, any> = Query<any, any>>(
        method:
            | "count"
            | "find"
            | "findOne"
            | "findOneAndRemove"
            | "findOneAndUpdate"
            | "update"
            | "updateOne"
            | "updateMany",
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Aggregate<any> = Aggregate<any>>(
        method: "aggregate",
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Model<Document> = Model<Document>>(
        method: "insertMany",
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Document | Model<Document> | Query<any, any> | Aggregate<any>>(
        method: string,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;

    pre<T extends Document = Document>(
        method: "init" | "validate" | "save" | "remove",
        parallel: boolean,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Query<any, any> = Query<any, any>>(
        method:
            | "count"
            | "find"
            | "findOne"
            | "findOneAndRemove"
            | "findOneAndUpdate"
            | "update"
            | "updateOne"
            | "updateMany",
        parallel: boolean,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Aggregate<any> = Aggregate<any>>(
        method: "aggregate",
        parallel: boolean,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Model<Document> = Model<Document>>(
        method: "insertMany",
        parallel: boolean,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
    pre<T extends Document | Model<Document> | Query<any, any> | Aggregate<any>>(
        method: string,
        parallel: boolean,
        fn: PreMiddlewareFunction<T>
    ): ClassDecorator;
}

const hooks: Hooks = {
    pre(...args): ClassDecorator {
        return (target) => {
            addToHooks(target, 'pre', args);
        };
    },
    post(...args): ClassDecorator {
        return (target: any) => {
            addToHooks(target, 'post', args);
        };
    },
    plugin(...args) {
        return (target: any) => {
            addToHooks(target, 'plugin', args);
        };
    }
};

const addToHooks = (target, hookType: 'pre' | 'post' | 'plugin', args) => {
    defineSchemaMetadata((obj) => {
        if (!obj)
            obj = [];
        obj = [...obj, args];
        return obj;
    }, SchemaKey.hook, target, hookType);
};

export const setPre = hooks.pre;
export const setPost = hooks.post;
export const setPlugin = hooks.plugin;
