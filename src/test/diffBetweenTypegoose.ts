import { DocumentQuery, Schema, Document, connect } from 'mongoose';
import { Typegoose, prop as tProp, instanceMethod } from 'typegoose';
import {
    Model, getModelForClass, ModelType, DocType, InstanceType, Ref,
    setSchema, prop, arrayProp, setMethod, setStatic,
    setPre, setPost, setPlugin
} from '..';
import { User, UserModel } from "./usage";


@setSchema()
class User1 extends User {
    @prop()
    name?: string;

    @setMethod
    method1() {
        console.log('method1, user1');
    }
}

@setSchema()
class User2 extends User {
    @prop({ required: true })
    name?: string;

    @prop()
    child: User1;
}

export const User1Model = getModelForClass<User1, typeof User1>(User1);
export const User2Model = getModelForClass<User2, typeof User2>(User2);

class TUser extends Typegoose {
    @tProp()
    name?: string;

    @instanceMethod
    method1() {
        let self = this as any;
        console.log('this is method1,' + (self.save ? '' : 'no ') + 'save');
    }
}

class TUser1 extends TUser {
    @tProp()
    name?: string;

    @instanceMethod
    method1() {
        console.log('method1, user1');
    }
}
class TUser2 extends TUser {
    @tProp({ required: true })
    name: string;

    @tProp()
    child: TUser1;
}

export const TUserModel = new TUser().getModelForClass(User);
export const TUser1Model = new TUser1().getModelForClass(TUser1);
export const TUser2Model = new TUser2().getModelForClass(TUser2);
