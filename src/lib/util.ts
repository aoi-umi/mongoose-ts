import * as crypto from 'crypto';
import * as fs from 'fs';

export function defer<T = any>() {
    let obj: {
        resolve: (value?: T | PromiseLike<T>) => void;
        reject: (reason?: any) => void;
        promise: Promise<T>
    } = {

    } as any;
    obj.promise = new Promise((resolve, reject) => {
        obj.resolve = resolve;
        obj.reject = reject;
    });
    return obj;
}

export let extend = function (...args) {
    let res = args[0] || {};
    for (let i = 1; i < args.length; i++) {
        let arg = args[i];
        if (typeof (arg) !== 'object') {
            continue;
        }
        for (let key in arg) {
            if (arg[key] !== undefined)
                res[key] = arg[key];
        }
    }
    return res;
};

export let md5 = function (data: string | Buffer, option?: { encoding?: string }) {
    let opt = {
        encoding: 'hex',
    };
    opt = extend(opt, option);
    let md5 = crypto.createHash('md5');
    if (typeof (data) == 'string') {
        data = Buffer.from(data, 'utf8');
    }

    let code = md5.update(data).digest(opt.encoding as any);
    return code;
};

export function md5File(path: string) {
    let def = defer();
    let md5 = crypto.createHash('md5');
    let stream = fs.createReadStream(path);
    stream.on('data', function (chunk) {
        md5.update(chunk);
    });
    stream.on('end', function () {
        let fileMd5 = md5.digest('hex');
        def.resolve(fileMd5);
    });
    stream.on('error', function (e) {
        def.reject(e);
    });
    return def.promise;
}