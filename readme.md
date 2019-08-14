# mongoose-ts

> npm i mongoose-ts-ua

## usage

```ts
import {
  Model,
  getModelForClass,
  prop,
  setSchema,
  arrayProp,
  SubDocType,
  config,
  gridfs
} from "mongoose-ts-ua";
import { Types } from "mongoose";

/**
 * custom toCollectionName
 * When no collection argument is passed, mongoose will pluralizes the name, you can config this to declared it
 */
config.toCollectionName = modelName => {
  return modelName;
};

@setSchema()
export class Example extends Model<Example> {
  @prop()
  name?: string;

  @arrayProp({
    type: String
  })
  list?: Types.DocumentArray<SubDocType<string>>; //or string[]
}
export const ExampleModel = getModelForClass<Example, typeof Example>(Example);
```

![InstanceType](https://raw.githubusercontent.com/aoi-umi/note/master/git%E6%96%87%E6%A1%A3/mongoose-ts/example1.png)

> method

![method](https://raw.githubusercontent.com/aoi-umi/note/master/git%E6%96%87%E6%A1%A3/mongoose-ts/example2.png)

> static

![static](https://raw.githubusercontent.com/aoi-umi/note/master/git%E6%96%87%E6%A1%A3/mongoose-ts/example3.png)

### you can get schema by getSchema

> getSchema(Example);

### use getGridFSModel for file

> gridfs.getGridFSModel

## example

> [example](https://github.com/aoi-umi/mongoose-ts/blob/master/src/example/index.ts) exampleUsage  
> [model](https://github.com/aoi-umi/mongoose-ts/blob/master/src/example/usage.ts)

```ts
const u = new UserModel({ name: "mongoose-ts" } /*,true */ /*just for type*/);
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
```

> [example](https://github.com/aoi-umi/mongoose-ts/blob/master/src/example/index.ts) exampleGrifFS

```ts gridfs
@setSchema()
class MyFile extends GridFSFile {
  @prop({
    default: Date.now
  })
  myprop: Date;
}

let FileModel = getGridFSModel({
  // schema: MyFile,
  // modelOptions: { collection: 'files' }
});
let filename = "index.js";
let buffer = fs.readFileSync(path.resolve(__dirname, "./" + filename));
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
```
