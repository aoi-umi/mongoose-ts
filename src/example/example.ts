import { Types } from 'mongoose';
import {
    Model, getModelForClass, prop, setSchema, arrayProp, setMethod, setStatic,
    SubDocType, InstanceType, setPre
} from '../lib'
import { setPost, setPlugin } from '../lib/hooks';
import { lastModifiedPlugin, LastModifiedType } from './model/hooks';

type ExampleInstanceType = InstanceType<Example>;
@setSchema({
    schemaOptions: {
        toJSON: {
            transform: (doc, ret, options) => {
                return ret;
            }
        }
    }
})
@setPre<ExampleInstanceType>('save', function (this, next) {
    this.name += '_pre';
    next();
})
@setPost<ExampleInstanceType>('save', function (this, err, doc, next) {
    console.log('after save');
    next();
})
@setPlugin(lastModifiedPlugin)
export class Example extends Model<Example> {
    @prop()
    name?: string;

    @prop()
    number?: number;

    @prop()
    get num() {
        return this.number;
    };

    set num(val) {
        this.number = val;
    };

    @arrayProp({
        type: String
    })
    list?: Types.DocumentArray<SubDocType<string>>;//or string[]

    @setMethod
    saveTest() {
        return this.save();
    }

    @setStatic
    static findOneTest() {
        return this.findOne();
    }
}
export const ExampleModel = getModelForClass<Example, typeof Example, LastModifiedType>(Example);