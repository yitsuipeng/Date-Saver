const { dbStatus } = require('../server/db');
const { app } = require('../app');
const chai = require('chai');
const chaiHttp = require('chai-http');
const {
    createFakeUser,
    truncateFakeData,
    users
} = require('./fake_data');
const { optimization } = require('../server/controllers/planning_controller');


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

describe('planning', function() {

    it('optimization', async () => {
     
        const input = [
            {
              url: 'https://maps.google.com/?cid=13710718655141926794',
              name: '國立國父紀念館',
              rating: 4.4,
              location: { lat: 25.0400306, lng: 121.5602452 },
              address: '110台灣台北市信義區仁愛路四段505號',
              place_id: 'ChIJwyJxyO6pQjQRilcOb_lBRr4' 
            },
            {
              url: 'https://maps.google.com/?cid=4666121925590788471',
              name: 'Lady M 旗艦店',
              rating: 3.9,
              location: { lat: 25.0408647, lng: 121.5562978 },
              address: '106台灣台北市大安區光復南路240巷26號',
              place_id: 'ChIJe2UCUMarQjQRdymATStlwUA' 
            },
            {
              name: '湳山戲院',
              location: { lat: 25.031574, lng: 121.553818 },
              place_id: 'ChIJMf2bf8yrQjQR6mxaFuzD9WE',    photo: '150.jpg',
              url: 'https://maps.google.com/?cid=7058763409727843562',
              place_key: 'movie',
              address: '106台灣台北市大安區通化街24巷1號'
            },
            {
              name: '台北探索館',
              location: { lat: 25.0375241, lng: 121.5638158 },
              place_id: 'ChIJXVRz3LmrQjQR1rQIrWs8Q8s',    photo: '102.JPG',
              url: 'https://maps.google.com/?cid=14646616846301181142',
              place_key: 'art',
              address: '110台灣台北市信義區市府路1號' 
            }
          ];
            
        const result = await requester
            .post('/api/1.0/optimization')
            .send(input);
        
        const output = [
            {
              url: 'https://maps.google.com/?cid=13710718655141926794',
              name: '國立國父紀念館',
              rating: 4.4,
              location: { lat: 25.0400306, lng: 121.5602452 },
              address: '110台灣台北市信義區仁愛路四段505號',
              place_id: 'ChIJwyJxyO6pQjQRilcOb_lBRr4' 
            },
            {
              name: '台北探索館',
              location: { lat: 25.0375241, lng: 121.5638158 },
              place_id: 'ChIJXVRz3LmrQjQR1rQIrWs8Q8s',    photo: '102.JPG',
              url: 'https://maps.google.com/?cid=14646616846301181142',
              place_key: 'art',
              address: '110台灣台北市信義區市府路1號' 
            },
            {
              url: 'https://maps.google.com/?cid=4666121925590788471',
              name: 'Lady M 旗艦店',
              rating: 3.9,
              location: { lat: 25.0408647, lng: 121.5562978 },
              address: '106台灣台北市大安區光復南路240巷26號',
              place_id: 'ChIJe2UCUMarQjQRdymATStlwUA' 
            },
            {
              name: '湳山戲院',
              location: { lat: 25.031574, lng: 121.553818 },
              place_id: 'ChIJMf2bf8yrQjQR6mxaFuzD9WE',    photo: '150.jpg',
              url: 'https://maps.google.com/?cid=7058763409727843562',
              place_key: 'movie',
              address: '106台灣台北市大安區通化街24巷1號'
            }
          ];

        assert.equal(result.status, 200);
        assert.equal(JSON.stringify(result.body), JSON.stringify(output));

    });

});

