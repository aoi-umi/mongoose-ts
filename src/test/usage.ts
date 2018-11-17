import { DocumentQuery, Schema, Document, connect } from 'mongoose';
import {
    Model, getModelForClass, ModelType, DocType, InstanceType, Ref,
    setSchema, prop, arrayProp, setMethod, setStatic,
    setPre, setPost, setPlugin
} from '..';

function lastModifiedPlugin(schema: Schema) {
    schema.add({ lastMod: Date });
    schema.pre('save', function (this: Document & { lastMod: Date }, next) {
        this.lastMod = new Date();
        next();
    });
}

export type UserInstanceType = InstanceType<User>;
export type UserModelType = ModelType<User, typeof User>;
export type UserDocType = DocType<UserInstanceType, { method1 }>;//omit method1

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

    @setMethod
    method1() {
        let self = this as any as UserInstanceType;
        console.log('this is method1,' + (self.save ? '' : 'no ') + 'save');
    }

    @setStatic
    static static1() {
        let self = this as UserModelType;
        console.log('this is static1,' + (self.findOne ? '' : 'no ') + 'findOne');
    }
}

export const UserModel = getModelForClass<User, typeof User>(User);

