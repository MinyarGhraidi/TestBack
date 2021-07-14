process.env.NODE_ENV = 'test';

let db = require('../../api/app/models');
const Items = db.Account;
const app = require("../../api/server");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { should, expect } = require('chai');


chai.use(chaiHttp);
// const should = require('should');

console.log("start test2");

describe("create new acount2", () => {
  it("sipmle case2", done => {
   
    let account = {
      accountcode: "test 666",
      accountname: "test 666"
   }
    chai
      .request(app)
      .post("/api/accounts/create/")
      .send(account)
      .end((err, res) => {
        console.log('**********'+res.body)
        expect(res).have.status(200);
        expect(res.body.message).to.eql('Item saved');
 
    done();
  });
  });
});

