import * as mongodb from 'mongodb';
import { GridFSBucket } from 'mongodb';
import * as mongoose from 'mongoose';
import { Types, SchemaTypes } from 'mongoose';
import * as stream from 'stream';

import * as util from './util';
import { InstanceType, setSchema, prop, getModelForClass, Model, GetModelForClassOptions, setMethod, setStatic } from '.';

export class GridFS {
    gridFSBucket: GridFSBucket;
    constructor(db: mongodb.Db, options?: mongodb.GridFSBucketOptions) {
        this.gridFSBucket = new GridFSBucket(db, options);
    }

    async find<T = any>(filter?: object, options?: mongodb.GridFSBucketFindOptions) {
        let rs = await this.gridFSBucket.find(filter, options).toArray();
        return rs as GridFSInstance<T>[];
    }

    async findOne<T = any>(filter?: object) {
        let rs = await this.find<T>(filter, { limit: 1 });
        return rs[0];
    }

    async download(opt: { _id: Types.ObjectId }) {
        let defer = util.defer();
        let stream = this.gridFSBucket.openDownloadStream(opt._id);
        let buffer = [];
        stream.on('data', (buf) => {
            buffer.push(buf);
        }).on('end', () => {
            defer.resolve(Buffer.concat(buffer))
        }).on('error', (err) => {
            defer.reject(err);
        });
        return defer.promise;
    }

    async upload(opt: { _id?: Types.ObjectId; buffer: Buffer, filename?: string; metadata?: any; contentType?: string }) {
        let defer = util.defer<{ _id: Types.ObjectId }>();
        let readstream = new stream.PassThrough();
        let _id = opt._id;
        readstream.end(opt.buffer);

        let writeStream: mongodb.GridFSBucketWriteStream;
        let options = {
            metadata: opt.metadata,
            contentType: opt.contentType
        };
        if (_id) {
            writeStream = this.gridFSBucket.openUploadStreamWithId(_id, opt.filename, options);
        } else {
            writeStream = this.gridFSBucket.openUploadStream(opt.filename, options);
            _id = Types.ObjectId(writeStream.id as any);
        }
        writeStream.on('finish', function () {
            defer.resolve({
                _id
            });
        }).on('error', function (err) {
            defer.reject(err);
        });
        readstream.pipe(writeStream);
        return defer.promise;
    }
}

export class GridFSModel<T>{
    _id: Types.ObjectId;
    filename: string;
    contentType: string;
    length: number;
    chunkSize: number;
    uploadDate: Date
    aliases: string;
    md5: string;
    metadata: T;
}

export type GridFSInstance<T = any> = GridFSModel<T>;

@setSchema({
    schemaOptions: {
        collection: 'files'
    }
})
export class GridFSFile extends Model<GridFSFile>{
    @prop()
    filename: string;

    @prop({
        type: SchemaTypes.ObjectId,
        required: true,
    })
    fileId: Types.ObjectId;

    @prop({
        default: Date.now,
    })
    uploadDate: Date;

    static gridfs: GridFS;
    gridfs: GridFS;

    @setStatic
    static async rawFind(cond: any) {
        let file = await this.gridfs.find(cond);
        return file;
    }

    @setStatic
    static async rawFindOne(cond: any) {
        let file = await this.gridfs.findOne(cond);
        return file;
    }

    @setMethod
    async download(opt?: {
        ifModifiedSince?: string | Date,
        returnStream?: boolean,
        streamOpt?: { start: number, end: number }
    }) {
        opt = {
            ...opt,
        };
        let { ifModifiedSince } = opt;
        let buf: Buffer, noModified = false;

        function isNoModified(uploadDate: Date) {
            return ifModifiedSince
                && parseInt(new Date(ifModifiedSince).getTime() / 1000 as any) == parseInt(uploadDate.getTime() / 1000 as any)
        }
        let stream: mongodb.GridFSBucketReadStream;
        let dbFile = await this.gridfs.findOne({ _id: this.fileId });

        if (!dbFile)
            return null;
        noModified = isNoModified(dbFile.uploadDate);
        if (opt.returnStream)
            stream = this.gridfs.gridFSBucket.openDownloadStream(dbFile._id, opt.streamOpt);
        else {
            if (!noModified)
                buf = await this.gridfs.download({ _id: dbFile._id });
        }

        let file = {
            raw: dbFile,
            buffer: buf,
            fileId: dbFile._id,
            noModified,
            stream
        };
        return file;
    }

    @setMethod
    async upload(opt: { buffer: Buffer, contentType?: string }) {
        let md5 = util.md5(opt.buffer);
        let matchFile = await this.gridfs.findOne({ md5 });
        if (matchFile) {
            this.fileId = matchFile._id;
        } else {
            let dbfile = await this.gridfs.upload({ buffer: opt.buffer, contentType: opt.contentType });
            this.fileId = dbfile._id;
        }
        let rs = await this.save();
        return rs.toObject();
    }
}

export function getGridFSModel<T extends Model<T> = GridFSFile, typeofT extends typeof GridFSFile = typeof GridFSFile>(opt?: GetModelForClassOptions & { schema?: { new(): T } }) {
    opt = {
        ...opt
    };
    let { schema, ...restOpt } = opt;

    let GridFSModel = getModelForClass<T, typeofT>((schema || GridFSFile) as any, restOpt);
    GridFSModel.gridfs = GridFSModel.prototype.gridfs = new GridFS(GridFSModel.db.db);
    return GridFSModel;
}
