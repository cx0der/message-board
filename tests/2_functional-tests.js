/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', () => {
  
  const nonExistentId = '5c220da6b51f9c17a22a53ab';
  let threadText = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  let reportThreadId;
  let deleteThreadId;
  let reportReplyId;
  let deleteReplyId;

  suite('API ROUTING FOR /api/threads/:board', () => {

    suite('POST', () => {
      test('create thread without required fields should fail', (done) => {
        chai.request(server)
        .post('/api/threads/test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          done();
        });
      });
      test('create thread without some required fields should fail', (done) => {
        chai.request(server)
        .post('/api/threads/test')
        .send({text: 'first thread'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          done();
        });
      });
      test('creating a thread with all required fields should succeed', (done) => {
        chai.request(server)
        .post('/api/threads/test')
        .send({text: threadText, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      });
      test('creating second thread with all required fields should succeed', (done) => {
        chai.request(server)
        .post('/api/threads/test')
        .send({text: threadText, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      });
    });

    suite('GET', () => {
      test('should return the 10 most recent threads from this board', (done) => {
        chai.request(server)
        .get('/api/threads/test')
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isBelow(res.body.length, 11);
          assert.property(res.body[0], '_id');
          assert.property(res.body[0], 'text');
          assert.property(res.body[0], 'created_on');
          assert.property(res.body[0], 'bumped_on');
          assert.property(res.body[0], 'replies');
          assert.isArray(res.body[0].replies);
          assert.isBelow(res.body[0].replies.length, 4);
          reportThreadId = res.body[0]._id;
          deleteThreadId = res.body[1]._id;
          done();
        });
      });
    });

    suite('DELETE', () => {
      test('delete should fail when required fields are empty', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'To delete a thread delete_password and thread_id should be present.');
          done();
        });
      });
      test('delete should fail when some required fields are empty', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({delete_password: 'somepass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'To delete a thread delete_password and thread_id should be present.');
          done();
        });
      });
      test('delete should fail when given invalid id', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({thread_id: '1', delete_password: 'someOtherPassword'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'Thread id is invalid.');
          done();
        });
      });
      test('delete should fail when given wrong password', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({thread_id: deleteThreadId, delete_password: 'someOtherPassword'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'incorrect password');
          done();
        });
      });
      test('delete should fail when given non existent thread id', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({thread_id: nonExistentId, delete_password: 'someOtherPassword'})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, `No thread with id: ${nonExistentId} found`);
          done();
        });
      });
      test('delete should succeed when correct details are provided', (done) => {
        chai.request(server)
        .delete('/api/threads/test')
        .send({thread_id: deleteThreadId, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'message');
          assert.equal(res.body.message, 'success');
          done();
        });
      });
    });

    suite('PUT', () => {
      test('reporting a thread should fail when thread id is empty', (done) => {
        chai.request(server)
        .put('/api/threads/test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'A valid thread_id is required to report it.');
          done();
        });
      });
      test('reporting a thread should fail when thread id is invalid', (done) => {
        chai.request(server)
        .put('/api/threads/test')
        .send({thread_id: '1'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'Thread id: 1 is invalid.');
          done();
        });
      });
      test('reporting a thread should fail when thread id is non existent', (done) => {
        chai.request(server)
        .put('/api/threads/test')
        .send({thread_id: nonExistentId})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, `Thread with id: ${nonExistentId} is not found.`);
          done();
        });
      });
      test('reporting a thread should succeed when correct thread id is provided', (done) => {
        chai.request(server)
        .put('/api/threads/test')
        .send({thread_id: reportThreadId})
        .end((err, res) => {
          assert.equal(res.status, 201);
          assert.property(res.body, 'message');
          assert.equal(res.body.message, 'success');
          done();
        });
      });
    });
  });
  
  suite('API ROUTING FOR /api/replies/:board', () => {

    suite('POST', () => {
      test('posting a reply should fail when none of the required fields are provided', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'To post a reply, thread_id, text and delete_password are required.');
          done();
        });
      });
      test('posting a reply should fail when some of the required fields are not provided', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({text: 'reply test ' + threadText, delete_password: 'replypass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'To post a reply, thread_id, text and delete_password are required.');
          done();
        });
      });
      test('posting a reply should fail when thread id is invalid', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({text: 'reply test ' + threadText, delete_password: 'replypass', thread_id: '1'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'Thread id is invalid.');
          done();
        });
      });
      test('posting a reply should fail when thread id is not found', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({text: 'reply test ' + threadText, delete_password: 'replypass', thread_id: nonExistentId})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, `Thread with id: ${nonExistentId} is not found.`);
          done();
        });
      });
      test('posting a reply should succeed when all the required fields are provided', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({text: 'reply test ' + threadText, delete_password: 'replypass', thread_id: reportThreadId})
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      });
      test('posting second reply should succeed when all the required fields are provided', (done) => {
        chai.request(server)
        .post('/api/replies/test')
        .send({text: 'reply test ' + threadText, delete_password: 'replypass', thread_id: reportThreadId})
        .end((err, res) => {
          assert.equal(res.status, 200);
          done();
        });
      });
    });

    suite('GET', () => {
      test('should return all the replies on a thread', (done) => {
        chai.request(server)
        .get('/api/replies/test')
        .query({thread_id: reportThreadId})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'text');
          assert.property(res.body, 'replies');
          assert.notProperty(res.body, 'delete_password');
          assert.notProperty(res.body, 'reported');
          assert.isArray(res.body.replies);
          assert.notProperty(res.body.replies[0], 'delete_password');
          assert.notProperty(res.body.replies[0], 'reported');
          reportReplyId = res.body.replies[0]._id;
          deleteReplyId = res.body.replies[1]._id;
          done();
        });
      });
      test('should fail when thread id is not provided', (done) => {
        chai.request(server)
        .get('/api/replies/test')
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id is missing.');
          done();
        });
      });
      test('should fail when thread id is invalid', (done) => {
        chai.request(server)
        .get('/api/replies/test')
        .query({thread_id: '1'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id is invalid.');
          done();
        });
      });
      test('should fail when thread id is not found', (done) => {
        chai.request(server)
        .get('/api/replies/test')
        .query({thread_id: nonExistentId})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, `Thread with id ${nonExistentId} not found.`);
          done();
        });
      });
    });

    suite('PUT', () => {
      test('should fail when required fields are not provided', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id and reply_id are required.');
          done();
        });
      });
      test('should fail when some of the required fields are not provided', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: nonExistentId})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id and reply_id are required.');
          done();
        });
      });
      test('should fail when thread id is invalid', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: '1', reply_id: '2'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id is invalid.');
          done();
        });
      });
      test('should fail when reply id is invalid', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: nonExistentId, reply_id: '2'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'reply_id is invalid.');
          done();
        });
      });
      test('should fail when thread is not found', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: nonExistentId, reply_id: reportReplyId})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'Thread or reply not found.');
          done();
        });
      });
      test('should fail when reply is not found', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: reportThreadId, reply_id: nonExistentId})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'Thread or reply not found.');
          done();
        });
      });
      test('should succeed when all the requied fields are provided', (done) => {
        chai.request(server)
        .put('/api/replies/test')
        .send({thread_id: reportThreadId, reply_id: reportReplyId})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'message');
          assert.equal(res.body.message, 'success');
          done();
        });
      });
    });

    suite('DELETE', () => {
      test('should fail when required fields are not provided', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id, reply_id and delete_password are required.');
          done();
        });
      });
      test('should fail when some of the required fields are not provided', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id, reply_id and delete_password are required.');
          done();
        });
      });
      test('should fail when thread id is invalid', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: '1', reply_id: '1', delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread_id is invalid.');
          done();
        });
      });
      test('should fail when reply id is invalid', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: nonExistentId, reply_id: '1', delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'reply_id is invalid.');
          done();
        });
      });
      test('should fail when thread is not found', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: nonExistentId, reply_id: deleteReplyId, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread or reply not found.');
          done();
        });
      });
      test('should fail when reply is not found', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: reportThreadId, reply_id: nonExistentId, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 404);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'thread or reply not found.');
          done();
        });
      });
      test('should fail when delete password is wrong', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: reportThreadId, reply_id: deleteReplyId, delete_password: 'pass'})
        .end((err, res) => {
          assert.equal(res.status, 400);
          assert.property(res.body, 'error');
          assert.equal(res.body.error, 'incorrect password');
          done();
        });
      });
      test('should succeed when all the requied fields are provided', (done) => {
        chai.request(server)
        .delete('/api/replies/test')
        .send({thread_id: reportThreadId, reply_id: deleteReplyId, delete_password: 'replypass'})
        .end((err, res) => {
          assert.equal(res.status, 200);
          assert.property(res.body, 'message');
          assert.equal(res.body.message, 'success');
          done();
        });
      });
    });
  });
});
