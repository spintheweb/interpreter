/*!
 * util
 * Copyright(c) 2020 Giancarlo Trevisan
 * MIT Licensed
 */
'use strict';

const dbclient = require('mongodb').MongoClient;
let db;

module.exports = {
    read: read
}

dbclient.connect('mongodb://localhost:27017/webebo', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(client => {
        db = client.db();
    })
    .catch(err => {
        console.log(err);
    });

function read(collection) {
    return db.collection(collection)
        .find({})
        .then(data => data)
        .catch(err => err);
}
