process.env.NODE_ENV = 'test';

let db = require('../../api/app/models');
const Items = db.Account;
const app = require("../../api/server");
const chai = require("chai");
const chaiHttp = require("chai-http");
const { should, expect } = require('chai');
chai.use(chaiHttp);

console.log("****** Accounts Tests ******");

// Create and Save a new item

describe("create a new acount", () => {
  it("sipmle case test", done => {
   
    let account = {
      accountcode: "test 666",
      accountname: "test 666"
   }

    chai
      .request(app)
      .post("/api/accounts/create/")
      .send(account)
      .end((err, res) => {
        // console.log(expect(res.body.data))
        expect(res).have.status(200);
        expect(res.body.message).to.eql('Item saved');
        expect(res.body.data.accountcode).to.eql("test 666")
 
    done();
  });
  });
});


// Find an item with his id

describe("Fetch account with his Id", () => {
  it("we expect the account with id=99", done => {

    chai
      .request(app)
      .get("/api/accounts/find/99/")
      .end((err, res) => {
      // console.log(expect(res.body))
        expect(res).have.status(200);
        expect(res.body.account_id).to.eql(99)
 
    done();
  });
  });
});

// GET ALL Accounts of table from DB

describe("GET ALL Accounts of a table from DB", () => {
  it("we expect getting all items of accounts table", done => {

    let tablename = "accounts"

    chai
      .request(app)
      .get("/api/accounts/")
      .send(tablename)
      .end((err, res) => {
        // console.log(expect(res.body))
        expect(res).have.status(200);
        // expect(res.body.account_id).to.eql(99)
    done();
  });
  });
});

// Search Items by their accountname 

describe("Select a row from a table", () => {
  it("should get 3 accounts with this account name", done => {

    let accountname = {
      accountname : "test loger2"
    }

    chai
      .request(app)
      .get("/api/accounts/search/")
      .send(accountname)
      .end((err, res) => {
        // console.log(expect(res.body))
        expect(res).have.status(200);
        expect(res.body.length).to.eql(1)
    done();
  });
  });
});

// Update an item by ID

describe("Update an account", () => {
  it("should get the succes message : Updated", done => {

    let accountToUpdate = {
        account_id: "58",
        accountcode: "Mocha",
        accountname: "Mocha"
      }

    chai
      .request(app)
      .put("/api/accounts/update/")
      .send(accountToUpdate)
      .end((err, res) => {
        // console.log(expect(res.body))
        expect(res).have.status(200);
        expect(res.body.message).to.eql("Updated")
    done();
  });
  });
});


// Delete an item by ID

describe("Delete an account", () => {
  it("should get the succes message : deleted", done => {
    chai
      .request(app)
      .delete("/api/accounts/delete/60")
      .end((err, res) => {
        // console.log(expect(res.body))
        expect(res).have.status(200);
        expect(res.body.message).to.eql("deleted")
    done();
  });
  });
});
