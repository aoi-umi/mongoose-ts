import { DocumentQuery, Schema, Document, connect } from 'mongoose';
import {
    Model, getModelForClass, ModelType, DocType, InstanceType, Ref,
    setSchema, prop, arrayProp, setMethod, setStatic,
    setPre, setPost, setPlugin
} from '../lib';

function lastModifiedPlugin(schema: Schema) {
    schema.add({ lastMod: Date });
    schema.pre('save', function (this: Document & { lastMod: Date }, next) {
        this.lastMod = new Date();
        next();
    });
}

export type UserInstanceType = InstanceType<User>;
export type UserModelType = ModelType<User, typeof User>;
export type UserDocType = DocType<User, { method1 }>;//omit method1

@setSchema({
    schemaOptions: {
        timestamps: true,
        toObject: {
            virtuals: true
        }
    }
})
@setPre<UserInstanceType>('save', function (this, next) {
    this.name += '_pre';
    next();
})
@setPost<UserInstanceType>('save', function (this, next) {
    console.log('save, _id: ', this._id);
})
@setPlugin(lastModifiedPlugin)
export class User extends Model<User> {
    @prop()
    name?: string;

    @prop()
    get virtualName() {
        return 'virtual-' + this.name;
    }
    set virtualName(v) {

    }

    @setMethod
    method1() {
        console.log('this is method1,' + (this.save ? '' : 'no ') + 'save');
    }

    @setStatic
    static async static1() {
        console.log('this is static1,' + (this.findOne ? '' : 'no ') + 'findOne');
    }
}

export const UserModel = getModelForClass<User, typeof User>(User);