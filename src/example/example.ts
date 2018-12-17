import {
    Model, getModelForClass, prop, setSchema, arrayProp,
    SubDocType
} from '..';
import { Types } from 'mongoose';

@setSchema()
export class Example extends Model<Example> {
    @prop()
    name?: string;

    @arrayProp({
        type: String
    })
    list?: Types.DocumentArray<SubDocType<string>>;//or string[]
}
export const ExampleModel = getModelForClass<Example, typeof Example>(Example);