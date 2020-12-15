require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db,queryPool,intoSql } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// clean the Bearer token
function verifyToken (req, res, next) {
    const bearerHeader = req.headers.authorization;
    console.log(bearerHeader);
    if (bearerHeader) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        jwt.verify(bearerToken, process.env.secretAccessKey, (err, data) => {
            if(err){
                console.log(err);
                res.status(403).send({ error: 'Forbidden'});
            } else {
                console.log(data);
                req.token = data;
                next();
            }
        });
    } else {
        res.status(400).send({ error: 'No access token'});
    }
}

router.post('/signup', async (req, res) => {

    const hash = crypto.createHash('sha256');
    const userInfo = {
        name: req.body.name,
        email: req.body.email,
        password: hash.update(req.body.password).digest('hex'),
        picture: 'https://d2cw5pt7i47jz6.cloudfront.net/date-saver/users/pug.jpg',
        provider: 'native',
    };

    const sql = `SELECT email FROM users WHERE email = '${req.body.email}';`;
    const condition = null;

    let checkDuplicate = await queryPool(sql, condition);

    if (checkDuplicate.length > 0) { // duplicate email
        console.log('duplicate');
        res.status(403).send({ data: '此email已註冊，請登入或使用其他email'});

    } else { // insert user info
        let insertResult = await queryPool('INSERT INTO users SET ?', userInfo);
        if (insertResult) {
            console.log('succeed');

            let payload = { id: insertResult.insertId, 
                            name: userInfo.name, 
                            email: userInfo.email, 
                            picture: userInfo.picture
                        };

            let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });

            res.status(200).send( {data: { access_token: token }});

        } else {
            res.status(500).send({ error: '系統錯誤，請稍後重試一次'});
        }
    }

});

router.post('/signin', async (req, res) => {
    console.log(req.body);
    if (req.body.provider == 'native') {
        let hash = crypto.createHash('sha256');
        let hashPassword = hash.update(req.body.password).digest('hex');
        let sql = `SELECT * FROM users WHERE email = '${req.body.email}';`;
        let condition = null;

        let checkExist = await queryPool(sql, condition);

        if (checkExist.length > 0) { // email exist
            if (checkExist[0].password == hashPassword && checkExist[0].provider == "native") { // password correct
                console.log(checkExist);

                let payload = { id: checkExist[0].id, 
                    name: checkExist[0].name, 
                    email: checkExist[0].email, 
                    picture: checkExist[0].picture
                };

                let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });

                res.status(200).send( { data: { access_token: token , username: checkExist[0].name}});

            } else if (checkExist[0].provider == "facebook"){
                console.log('password wrong');
                res.status(403).send({ data: '帳號已使用，請改為facebook登入'});
            } else { // password wrong
                console.log('password wrong');
                res.status(403).send({ data: '密碼錯誤'});
            }
            
        } else { // email not exist
            console.log('email not exist');
            res.status(403).send({ data: '帳號不存在，請註冊'});
        }

    } else if (req.body.provider == 'facebook') {
        let url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${req.body.access_token}`;

        let userInfo = {};

        axios.get(url)
            .then(result => {

                if (result.data.email) { // access_token valid
                    sql = `SELECT * FROM users WHERE email = '${result.data.email}';`;
                    condition = null;

                    userInfo.name = result.data.name;
                    userInfo.email = result.data.email;
                    userInfo.picture = 'https://graph.facebook.com/' + result.data.id + '/picture?type=large';
                    userInfo.provider = 'facebook';

                    return queryPool(sql, condition);
                } else { // not authorized
                    console.log(result);
                    return res.status(400).send({error: '授權失敗'});
                }
            })
            .then(result => {
                if (result.length !== 0) { // email exist
                    if (result[0].provider == 'facebook'){
                        let payload = {
                            id: result[0].id, 
                            name: result[0].name, 
                            email: result[0].email, 
                            picture: result[0].picture
                        };
        
                        let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
        
                        console.log('facebook sign in');
                        res.status(200).send( { data: { access_token: token, username: result[0].name}});
                    } else {
                        console.log('email is native');
                        return res.status(403).send({ error: '帳號已使用，請改為站內登入'});
                    }

                } else { // email not exist
                    let insertResult = queryPool('INSERT INTO users SET ?', userInfo);
                    if (insertResult) {
            
                        let payload = { id: insertResult.insertId, 
                                        name: userInfo.name, 
                                        email: userInfo.email, 
                                        picture: userInfo.picture
                                    };
            
                        let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
                        
                        console.log('facebook sign up');
                        res.status(200).send( { data: { access_token: token }});
            
                    } else {
                        res.status(500).send({ error: '系統錯誤，請稍後重試一次'});
                    }
                }
            })
            .catch(function (error) {
                res.send('querying wrong');
                console.error('Error:', error);
            });
    }
});

router.get('/profile', verifyToken, (req, res) => {

    res.status(200).send({ data: req.token});

    const sql = `SELECT * FROM user WHERE access_token = '${req.token}';`;
    const condition = null;

    // // query in sql
    // queryPool(sql, condition)
    //     .then(result => {
    //         if (result.length > 0) { // token match
    //             console.log(result[0]);
    //             res.json(
    //                 {
    //                     data: {
    //                         id: result[0].id,
    //                         provider: result[0].provider,
    //                         name: result[0].name,
    //                         email: result[0].email,
    //                         picture: result[0].picture
    //                     }
    //                 });
    //         } else { // no match token
    //             console.log('no match token');
    //             res.status(403).send('Invalid Access Token');
    //         }
    //     });
});

// planning
router.get('/verifyUser', verifyToken, async (req, res) => {
    res.status(200).send({ data: req.token});
});

router.post('/savePlanning', verifyToken, async (req, res) => {

    console.log(req.body);
    console.log(req.token);

    const orderInfo = {
        user_id: req.token.id,
        details: JSON.stringify(req.body.plan.schedule),
        total_duration: req.body.plan.totalTime,
        total_distance: req.body.plan.totalDistance,
        date: req.body.plan.startDate,
    };

    let insertResult = await queryPool('INSERT INTO orders SET ?', orderInfo);

    if (insertResult) {
        console.log('succeed');

        res.status(200).send( {data: '儲存成功，祝你一路順風' });

    } else {
        res.status(500).send({ error: '系統錯誤，請稍後重試一次'});
    }

});

module.exports = router;