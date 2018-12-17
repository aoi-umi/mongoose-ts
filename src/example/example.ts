import {
    Model, getModelForClass, prop, setSchema, arrayProp,
    SubDocType, InstanceType
} from '..';
import { Types } from 'mongoose';
import { setMethod, setStatic } from '../lib';

type ExampleInstanceType = InstanceType<Example>;
@setSchema({
    schemaOptions: {
        toJSON: {
            transform: (doc: ExampleInstanceType, ret) => {
                return ret;
            }
        }
    }
})
export class Example extends Model<Example> {
    @prop()
    name?: string;

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
export const ExampleModel = getModelForClass<Example, typeof Example>(Example);