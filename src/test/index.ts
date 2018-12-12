
import * as mongoose from "mongoose";
import { connect, createConnection } from "mongoose";
import { UserModel, User } from "./usage";
import { User1Model, User2Model, TUser1Model, TUser2Model } from "./diffBetweenTypegoose";
import { getSchema } from "../lib";


async function example1() {
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
    console.log('User2', (u2.child.method1 ? '' : 'no ') + 'method1');
    console.log('---------------------');
    console.log('TUser2');
    tu2.child.method1 && tu2.child.method1();
    console.log('User2');
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
    ---------------------
    TUser2
    User2
    method1, user1
    */
}

(async () => {
    connect('mongodb://localhost:27017/test', { useNewUrlParser: true });
    //let schema = getSchema(User);
    //console.log(new UserModel());
    await example2();
    //console.log(getSchema(User));
})();