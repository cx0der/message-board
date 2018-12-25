'use strict';

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

module.exports = function ReplyHandler() {
  this.newReply = (req, res) => {
    if(!req.body.thread_id || !req.body.delete_password || !req.body.text) {
      return res.status(400).json({error: 'To post a reply, thread_id, text and delete_password are required.'});
    }
    if(!ObjectId.isValid(req.body.thread_id)) {
      return res.status(400).json({error: 'Thread id is invalid.'});
    }
    const client = MongoClient(process.env.DB, { useNewUrlParser: true });
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const threadId = new ObjectId(req.body.thread_id);
      const reply = {
        _id: new ObjectId(),
        text: req.body.text,
        created_on: new Date(),
        reported: false,
        delete_password: bcrypt.hashSync(req.body.delete_password, SALT_ROUNDS)
      };
      db.collection(board).findOneAndUpdate(
        {_id: threadId}, {$set: {bumped_on: new Date()}, $push: {replies: reply}}, {returnOriginal: false},
        (err, doc) => {
          if(err) {
            client.close();
            return res.status(503).json({error: 'Error creating a reply'});
          }
          if(!doc.value) {
            res.status(404).json({error: `Thread with id: ${req.body.thread_id} is not found.`});
          } else {
            res.status(201).redirect(`/b/${board}/${req.body.thread_id}`);
          }
          client.close();
        });
    });
  };

  this.replyList = (req, res) => {
    if(!req.query.thread_id) {
      return res.status(400).json({error: 'thread_id is missing.'});
    }
    if(!ObjectId.isValid(req.query.thread_id)) {
      return res.status(400).json({error: 'thread_id is invalid.'});
    }
    const client = MongoClient(process.env.DB, { useNewUrlParser: true });
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const threadId = new ObjectId(req.query.thread_id);
      const projection = {
        reported: 0,
        delete_password: 0,
        "replies.delete_password": 0,
        "replies.reported": 0
      };
      db.collection(board).findOne({_id: threadId}, {projection: projection}, (err, doc) => {
        if (err) {
          res.status(503).json({error: `Error while fetch thread details of ${req.query.thread_id}.`});
        } else if(!doc) {
          res.status(404).json({error: `Thread with id ${req.query.thread_id} not found.`});
        } else {
          res.json(doc);
        }
        client.close();
      });
    });
  };

  this.reportReply = (req, res) => {
    if(!req.body.thread_id || !req.body.reply_id) {
      return res.status(400).json({error: 'thread_id and reply_id are required.'});
    }
    if(!ObjectId.isValid(req.body.thread_id)) {
      return res.status(400).json({error: 'thread_id is invalid.'});
    }
    if(!ObjectId.isValid(req.body.reply_id)) {
      return res.status(400).json({error: 'reply_id is invalid.'});
    }
    const client = MongoClient(process.env.DB, { useNewUrlParser: true });
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      db.collection(board).findOneAndUpdate({
        _id: new ObjectId(req.body.thread_id),
        "replies._id": new ObjectId(req.body.reply_id)
      }, {$set: {"replies.$.reported": true}}, (err, r) => {
        if(err) {
          res.status(503).json({error: `Error reporting reply on thread ${req.body.thread_id}`});
        } else if (!r.value) {
          res.status(404).json({error: 'Thread or reply not found.'});
        } else {
          res.status(200).json({message: 'success'});
        }
        client.close();
      });
    });
  };

  this.deleteReply = (req, res) => {
    if(!req.body.thread_id || !req.body.reply_id || !req.body.delete_password) {
      return res.status(400).json({error: 'thread_id, reply_id and delete_password are required.'});
    }
    if(!ObjectId.isValid(req.body.thread_id)) {
      return res.status(400).json({error: 'thread_id is invalid.'});
    }
    if(!ObjectId.isValid(req.body.reply_id)) {
      return res.status(400).json({error: 'reply_id is invalid.'});
    }
    const client = MongoClient(process.env.DB, { useNewUrlParser: true });
    client.connect((err) => {
      if(err) {
        return res.status(503).json({error: 'Service Unavailable'});
      }
      const db = client.db();
      const board = req.params.board;
      const query = {
        _id: new ObjectId(req.body.thread_id),
        "replies._id": new ObjectId(req.body.reply_id)
      };
      db.collection(board).findOne(query, (err, doc) => {
        if(err) {
          client.close();
          return res.status(503).json({error: 'Error while finding thread'});
        }
        if(!doc) {
          client.close();
          return res.status(404).json({error: 'thread or reply not found.'});
        }
        if(!bcrypt.compareSync(req.body.delete_password, doc.replies[0].delete_password)) {
          client.close();
          return res.status(400).json({error: 'incorrect password'});
        }
        db.collection(board).findOneAndUpdate(query, {$set: {"replies.$.text": "[deleted]"}}, (err, r) => {
          if(err) {
            res.status(503).json({error: `Error while deleting reply ${req.body.reply_id}.`});
          } else {
            res.status(200).json({message: 'success'});
          }
          client.close();
        });
      });
    });
  };
}
