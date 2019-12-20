import { setSchema, prop, GridFSFile, } from "../../lib";

@setSchema()
export class MyFile extends GridFSFile {
    @prop({
        default: Date.now
    })
    myprop: Date;
}