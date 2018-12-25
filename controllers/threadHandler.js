'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

module.exports = function ThreadHandler() {
  this.newThread = (req, res) => {
    if (!req.body.text || !req.body.delete_password) {
      return res.status(400).json({error: 'To create a thread text and delete_password is required.'});
    }
    const client = MongoClient(process.env.DB, { useNewUrlParser: true });
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const thread = {
        text: req.body.text,
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        delete_password: bcrypt.hashSync(req.body.delete_password, SALT_ROUNDS),
        replies: []
      };
      db.collection(board).insertOne(thread, (err, r) => {
        if(err) {
          res.status(503).json({error: `Error crearing thread ${req.body.text}`});
        } else {
          res.status(200).redirect(`/b/${board}`);
        }
        client.close();
      });
    });
  };

  this.threadList = (req, res) => {
    const board = req.params.board;
    const client = MongoClient(process.env.DB, {useNewUrlParser: true});
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      db.collection(board).find({}, {projection: {
        reported: 0,
        delete_password: 0,
        "replies.delete_password": 0,
        "replies.reported": 0
      }}).sort({bumped_on: -1}).limit(10).toArray((err, docs) => {
        if(err) {
          res.status(503).json({error: `Error fetching threads from board ${board}`});
        } else {
          docs.forEach(doc => {
            doc.replycount = doc.replies.length;
            if(doc.replies.length > 3) {
              doc.replies = doc.replies.splice(-3);
            }
          });
          res.json(docs);
        }
        client.close();
      });
    });
  };

  this.reportThread = (req, res) => {
    if(!req.body.thread_id) {
      return res.status(400).json({error: 'A valid thread_id is required to report it.'});
    }
    if(!ObjectId.isValid(req.body.thread_id)) {
      return res.status(400).json({error: `Thread id: ${req.body.thread_id} is invalid.`});
    }
    const client = MongoClient(process.env.DB, {useNewUrlParser: true});
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const threadId = new ObjectId(req.body.thread_id);
      db.collection(board).findOneAndUpdate({_id: threadId}, {$set: {reported: true}}, {returnOriginal: false}, (err, r) => {
        if (err) {
          client.close();
          return res.status(503).json({error: `Error reporting thread with id: ${req.body.thread_id}.`});
        }
        if (!r.value) {
          res.status(404).json({error: `Thread with id: ${req.body.thread_id} is not found.`});
        } else {
          res.status(201).json({message: 'success'});
        }
        client.close();
      });
    });
  };

  this.deleteThread = (req, res) => {
    if(!req.body.thread_id || !req.body.delete_password) {
      return res.status(400).json({error: 'To delete a thread delete_password and thread_id should be present.'});
    }
    if(!ObjectId.isValid(req.body.thread_id)) {
      return res.status(400).json({error: 'Thread id is invalid.'});
    }
    const client = MongoClient(process.env.DB, {useNewUrlParser: true});
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const threadId = new ObjectId(req.body.thread_id);
      db.collection(board).findOne({_id: threadId}, (err, doc) => {
        if (err) {
          return res.status(503).json({error: 'Service Unavailable'});
        }
        if (!doc) {
          return res.status(404).json({error: `No thread with id: ${req.body.thread_id} found`});
        }
        if (!bcrypt.compareSync(req.body.delete_password, doc.delete_password)) {
          client.close();
          return res.status(400).json({error: 'incorrect password'});
        }
        db.collection(board).deleteOne({_id: threadId}, (err, r) => {
          if (err) {
            res.status(503).json({error: `Error deleting thread with id: ${req.body.thread_id}.`});
          } else {
            res.json({message: 'success'});
          }
          client.close();
        });
      });
    });
  };
}
