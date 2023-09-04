
import * as mongoose from "mongoose";
import { connect, createConnection } from "mongoose";
import * as fs from 'fs';
import * as path from 'path';
import { getSchema, config, setSchema, getModelForClass, prop, GridFSFile, getGridFSModel } from "../lib";
config.toCollectionName = (modelName) => {
    return modelName;
};

import { UserModel, User } from "./usage";
import { MyFile } from "./model/my-file";

async function exampleUsage() {
    const u = new UserModel({ name: 'mongoose-ts' } /*,true *//*just for type*/);
    await u.save();
    const user = await UserModel.findOne().sort({ _id: -1 });

    //UserDocType
    // check type
    if (false) {
        u._doc
        u.name
        u.method1
    }

    console.log(user);
    if (false) {
        user._doc;
        user.name;
        user.method1;
    }
    UserModel.static1();
    /* output
    save, _id:  5bc55f27190f2129d80d26ab
    { _id: 5bc55f27190f2129d80d26ab,
      name: 'mongoose-ts_pre',
      createdAt: 2018-10-16T03:46:47.842Z,
      updatedAt: 2018-10-16T03:46:47.842Z,
      lastMod: 2018-10-16T03:46:47.842Z,
      __v: 0,
      virtualName: 'virtual-mongoose-ts_pre',
      id: '5bc55f27190f2129d80d26ab' }
    this is method1,save
    this is static1,findOne
    */
}

async function exampleGrifFS() {

    const FileModel = getGridFSModel({
        schema: MyFile,
        modelOptions: { collection: 'files' }
    });

    let filename = 'readme.md';
    let buffer = fs.readFileSync(path.resolve(__dirname, '../../' + filename))
    let rs = new FileModel({
        filename
    });
    /** 
     * it will calculate the md5 before upload,
     * if exists, will use that file's _id
     */
    let upload = await rs.upload({
        buffer
    });

    console.log(upload);

    let detail = await FileModel.findById(upload._id);
    let download = await detail.download({ returnStream: false });
    console.log(download);

    //find from fs.files
    let fileByMd5 = await FileModel.rawFindOne({ md5: download.raw.md5 });
    console.log(fileByMd5);
}

(async () => {
    await connect('mongodb://127.0.0.1:27017/test', {});
    //let schema = getSchema(User);
    //console.log(new UserModel());
    await exampleGrifFS();
    //console.log(getSchema(User));
})();