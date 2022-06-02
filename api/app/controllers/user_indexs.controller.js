const userDataIndexDao = require('../bo/userIndexsDao');
let userDataIndexDaoINst = new userDataIndexDao;

module.exports = {
    update : function (req, res, next) {
        userDataIndexDaoINst.update(req, res, next)
    },
    find: function (req, res, next) {
        userDataIndexDaoINst.find(req, res, next);
    },
    findById: function (req, res, next) {
        userDataIndexDaoINst.findById(req, res, next);
    },
    save: function (req, res, next) {
        userDataIndexDaoINst.save(req, res, next);
    },
    delete: function (req, res, next) {
        userDataIndexDaoINst.delete(req, res, next);
    }
}
