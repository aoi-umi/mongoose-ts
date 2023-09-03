import { Schema, Document, connect } from 'mongoose';

export type LastModifiedType = { lastMod: Date };
export function lastModifiedPlugin(schema: Schema) {
    schema.add({ lastMod: Date });
    schema.pre('save', function (this: Document & LastModifiedType, next) {
        this.lastMod = new Date();
        next();
    });
}