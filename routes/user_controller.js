require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db,queryPool,intoSql } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upload,verifyToken } = require('./util');
const validator = require('validator');

const signup = async (req, res) => {
    let {name} = req.body;
    const {email, password} = req.body;

    if(!name || !email || !password) {
        res.status(400).send({error:'Request Error: name, email and password are required.'});
        return;
    }

    if (!validator.isEmail(email)) {
        res.status(400).send({error:'Request Error: Invalid email format'});
        return;
    }

    name = validator.escape(name);

    const hash = crypto.createHash('sha256');
    const userInfo = {
        name: req.body.name,
        email: req.body.email,
        password: hash.update(req.body.password).digest('hex'),
        picture: 'https://d2cw5pt7i47jz6.cloudfront.net/date-saver/users/unnamed.jpg',
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
            
            let payload = { id: insertResult.insertId, 
                            name: userInfo.name, 
                            email: userInfo.email, 
                            picture: userInfo.picture
                        };

            console.log(payload);

            let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });

            res.status(200).send( {data: { access_token: token, username: userInfo.name }});

        } else {
            res.status(500).send({ data: '系統錯誤，請稍後重試一次'});
        }
    }

};

const signin = async (req, res) => {
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
                    return res.status(400).send({data: '授權失敗'});
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
                        return res.status(403).send({ data: '帳號已使用，請改為站內登入'});
                    }

                } else { // email not exist
                    let insertResult = queryPool('INSERT INTO users SET ?', userInfo);
                    if (insertResult) {
            
                        let payload = { id: insertResult.insertId, 
                                        name: userInfo.name, 
                                        email: userInfo.email, 
                                        picture: userInfo.picture
                                    };
                        console.log(payload);

                        let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
                        
                        console.log('facebook sign up');
                        res.status(200).send( { data: { access_token: token, username: userInfo.name }});
            
                    } else {
                        res.status(500).send({ data: '系統錯誤，請稍後重試一次'});
                    }
                }
            })
            .catch(function (error) {
                res.send('querying wrong');
                console.error('Error:', error);
            });
    }
};

// profile
const profile = async(req, res) => {

    let sql = `SELECT * FROM orders WHERE user_id = '${req.token.id}';`;
    let condition = null;

    let orderResult = await queryPool(sql, condition);
    console.log(orderResult);
    res.status(200).send({ data: {user:req.token, order:orderResult}});

};

// planning
const verifyUser = async (req, res) => {
    res.status(200).send({ data: {access_token:req.token}});
};

// update order image
const uploadShares = async (req, res) => {

    let sql = `UPDATE orders SET ? WHERE id=${req.body.order_id}`;
    let condition = {
        photo: req.file.key.replace("date-saver/shares/",""),
        comment: req.body.story
    };

    let orderResult = await queryPool(sql, condition);

    res.redirect('/profile.html');

};

// hot
const getHotOrders = async (req, res) => {

    let sql = `SELECT * FROM orders WHERE comment IS NOT NULL ORDER BY view DESC;`;
    let condition = null;

    let orderResult = await queryPool(sql, condition);
    res.status(200).send({ data: orderResult});


};

module.exports = {
    signup,
    signin,
    profile,
    verifyUser,
    uploadShares,
    getHotOrders
};