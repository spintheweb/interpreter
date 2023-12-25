/*!
 * webspinner data module for MongoDB
 * Copyright(c) 2023 Giancarlo Trevisan
 * MIT Licensed
 */
import { MongoClient as dbclient } from 'mongodb';
let db;

export const read = read;

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
