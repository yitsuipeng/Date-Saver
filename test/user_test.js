const { dbStatus } = require('../server/db');
const { app } = require('../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
    createFakeUser,
    truncateFakeData,
    users
} = require('./fake_data');


chai.use(chaiHttp);
const assert = chai.assert;
const requester = chai.request(app).keepOpen();

before(async () => {
    if (dbStatus !== 'project_test') {
        throw 'Not in test db';
    } else {
        console.log('it is test mode');
        await truncateFakeData();
        await createFakeUser();
    }

});

describe('signin API', function() {

    // sign in
    it('native sign in with correct password', async () => {
        const user1 = users[0];
        const user = {
            provider: user1.provider,
            email: user1.email,
            password: user1.password
        };

        const res = await requester
            .post('/api/1.0/signIn')
            .send(user);

        const data = res.body.data;

        assert.isString(data.access_token);
        assert.equal(data.username, user1.name);
        assert.equal(res.status, 200);

    });

    it('native sign in without provider', async () => {
        const user = {
            email: 'test',
            password: 'test'
        };

        const res = await requester
            .post('/api/1.0/signIn')
            .send(user);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, '輸入錯誤');
    });

    it('native sign in without email or password', async () => {

        const userNoEmail = {
            provider: 'native',
            password: 'test'
        };

        const res1 = await requester
            .post('/api/1.0/signIn')
            .send(userNoEmail);

        assert.equal(res1.status, 400);
        assert.equal(res1.body.error, '請完成所有欄位');

        const userNoPassword = {
            provider: 'native',
            email: 'test',
        };

        const res2 = await requester
            .post('/api/1.0/signIn')
            .send(userNoPassword);

        assert.equal(res2.status, 400);
        assert.equal(res2.body.error, '請完成所有欄位');
    });

    it('native sign in with wrong password', async () => {

        const user1 = users[0];
        const user = {
            provider: user1.provider,
            email: user1.email,
            password: 'wrong password'
        };

        const res = await requester
            .post('/api/1.0/signIn')
            .send(user);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, '密碼錯誤');
    });

    it('native sign in with malicious password', async () => {
        const user = {
            provider: 'native',
            email: 'test',
            password: '" OR 1=1; -- '
        };

        const res = await requester
            .post('/api/1.0/signIn')
            .send(user);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, '帳號不存在，請註冊');
    });

});

describe('signUp API', function() {

    it('sign up', async () => {
        const user = {
            provider: 'native',
            name: 'arthur',
            email: 'arthur@gmail.com',
            password: 'password'
        };

        const res = await requester
            .post('/api/1.0/signUp')
            .send(user);

        const data = res.body.data;

        assert.isString(data.access_token);
        assert.equal(data.username, user.name);
        assert.equal(res.status, 200);

    });

    it('sign up without name or email or password', async () => {
        const user1 = {
            email: 'arthur@gmail.com',
            password: 'password'
        };

        const res1 = await requester
            .post('/api/1.0/signUp')
            .send(user1);

        assert.equal(res1.statusCode, 400);

        const user2 = {
            name: 'arthur',
            password: 'password'
        };

        const res2 = await requester
            .post('/api/1.0/signUp')
            .send(user2);

        assert.equal(res2.statusCode, 400);

        const user3 = {
            name: 'arthur',
            email: 'arthur@gmail.com',
        };

        const res3 = await requester
            .post('/api/1.0/signUp')
            .send(user3);

        assert.equal(res3.statusCode, 400);
    });

    it('sign up with existed email', async () => {
        const user = {
            name: users[0].name,
            email: users[0].email,
            password: 'password'
        };

        const res = await requester
            .post('/api/1.0/signUp')
            .send(user);

        assert.equal(res.status, 403);
        assert.equal(res.body.error, '此email已註冊，請登入或使用其他email');
    });

    it('sign up with malicious email', async () => {
        const user = {
            name: users[0].name,
            email: '<script>alert(1)</script>',
            password: 'password'
        };

        const res = await requester
            .post('/api/1.0/signUp')
            .send(user);

        assert.equal(res.status, 400);
        assert.equal(res.body.error, 'email 格式錯誤');
    });

});

