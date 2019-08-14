
import * as mongoose from "mongoose";
import { connect, createConnection } from "mongoose";
import * as fs from 'fs';
import * as path from 'path';
import { getSchema, config, setSchema, getModelForClass, prop, GridFSFile, getGridFSModel } from "../lib";
config.toCollectionName = (modelName) => {
    return modelName;
};

import { UserModel, User } from "./usage";
import { User1Model, User2Model, TUser1Model, TUser2Model } from "./diffBetweenTypegoose";

async function exampleUsage() {
    const u = new UserModel({ name: 'mongoose-ts' } /*,true *//*just for type*/);
    await u.save();
    const user = await UserModel.findOne().sort({ _id: -1 });

    //UserDocType
    //u._doc

    console.log(user);
    user.method1();
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

async function example2() {
    console.log('TUser1');
    new TUser1Model().method1();
    console.log('User1');
    new User1Model().method1();
    console.log('---------------------');
    let tu2 = new TUser2Model({ child: { name: 'tu1' } });
    let u2 = new User2Model({ child: { name: 'u1' } }, true);
    console.log('TUser2');
    tu2.method1();
    console.log('User2');
    u2.method1();
    console.log('---------------------');
    console.log('TUser2', (tu2.child.method1 ? '' : 'no ') + 'method1');
    tu2.child.method1 && tu2.child.method1();
    console.log('User2', (u2.child.method1 ? '' : 'no ') + 'method1');
    u2.child.method1 && u2.child.method1();
    /*output
    TUser1
    method1, user1
    User1
    method1, user1
    ---------------------
    TUser2
    method1, user1
    User2
    this is method1,save
    ---------------------
    TUser2 no method1
    User2 method1
    method1, user1
    */
}


async function exampleGrifFS() {
    @setSchema()
    class MyFile extends GridFSFile {
        @prop({
            default: Date.now
        })
        myprop: Date;
    }

    let FileModel = getGridFSModel({
        schema: MyFile,
        modelOptions: { collection: 'files' }
    });
    let filename = 'index.js';
    let buffer = fs.readFileSync(path.resolve(__dirname, './' + filename))
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
    await connect('mongodb://localhost:27017/test', { useNewUrlParser: true });
    //let schema = getSchema(User);
    //console.log(new UserModel());
    await exampleGrifFS();
    //console.log(getSchema(User));
})();