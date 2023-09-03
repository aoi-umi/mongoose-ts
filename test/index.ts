import * as mongoose from "mongoose";
import { connect, createConnection } from "mongoose";
import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';

import { getGridFSModel, setSchema, GridFSFile, prop, InstanceType } from "../src/lib";
import * as util from "../src/lib/util";
import { ExampleModel } from '../src/example/example';
import { MyFile } from '../src/example/model/my-file';

async function connectDb() {
    await connect('mongodb://127.0.0.1:27017/test', {});
}

async function disconnect() {
    await mongoose.disconnect();
}

async function upload(FileModel, filename) {
    let buffer = fs.readFileSync(filename);
    let rs = new FileModel({
        filename
    });
    let upload = await rs.upload({
        buffer
    });
    // @ts-ignore
    return rs as InstanceType<MyFile>;
}

describe('mongoose-ts', function () {
    before(() => connectDb());
    after(() => disconnect());
    it('属性类型相等', function () {
        let m = new ExampleModel({ number: '1' });
        expect(m.number).to.be.equal(1);
    });
    it('hook', async function () {
        let name = 'name';
        let m = new ExampleModel({ name });
        await m.save();
        expect(m.name).to.be.equal(name + '_pre');
    });
    it('gridfs', async function () {

        const FileModel = getGridFSModel({
            schema: MyFile,
            modelOptions: { collection: 'files' }
        });
        let filename = path.resolve(__dirname, './index.ts');
        let md5 = await util.md5File(filename);

        let rs1 = await upload(FileModel, filename);
        let rs2 = await upload(FileModel, filename);

        expect(rs1._id?.toString()).to.not.equal(rs2._id?.toString());
        expect(rs1.fileId.toString()).to.be.equal(rs2.fileId.toString());

        await FileModel.rawUpdateOne({ _id: rs1.fileId }, { $set: { test: 'test' } });
        let rawFile = await FileModel.rawFindOne({ _id: rs1.fileId });
        expect(rawFile.md5).to.be.equal(md5);
        expect(rawFile['test']).to.be.equal('test');

        let dl1 = await rs1.download(util.extend({ returnStream: true }, null, undefined, { test: null }));
        let dl2 = await rs2.download();
        let dl3 = await rs2.download({ ifModifiedSince: dl1?.raw.uploadDate });

        expect(dl3?.noModified).to.be.equal(true);

        await FileModel.gridfs.delete(rs1.fileId);
    });
});