/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

const ThreadHandler = require('../controllers/threadHandler');
const ReplyHandler  = require('../controllers/replyHandler');

const threadHandler = new ThreadHandler();
const replyHandler = new ReplyHandler();

module.exports = (app) => {

  app.route('/api/threads/:board')
    .post(threadHandler.newThread)
    .get(threadHandler.threadList)
    .put(threadHandler.reportThread)
    .delete(threadHandler.deleteThread);

  app.route('/api/replies/:board')
    .post(replyHandler.newReply)
    .get(replyHandler.replyList)
    .put(replyHandler.reportReply)
    .delete(replyHandler.deleteReply);
};
