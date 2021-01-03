require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db,queryPool,intoSql } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upload,verifyToken } = require('./util');
const validator = require('validator');

const signUp = async (name, email, password) => {

    try {

        const emails = await queryPool('SELECT email FROM users WHERE email = ?', [email]);
        if (emails.length > 0){
            return {error: '此email已註冊，請登入或使用其他email'};
        }

        const hash = crypto.createHash('sha256');
        const userInfo = {
            name: name,
            email: email,
            password: hash.update(password).digest('hex'),
            picture: 'https://d2cw5pt7i47jz6.cloudfront.net/date-saver/users/unnamed.jpg',
            provider: 'native',
        };
        const queryStr = 'INSERT INTO users SET ?';

        const result = await query(queryStr, userInfo);
        userInfo.id = result.insertId;

        let payload = { id: userInfo.id, 
                        name: userInfo.name, 
                        email: userInfo.email, 
                        picture: userInfo.picture
                    };
        
        let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });

        return {token};
    } catch (error) {

        return {error};
    }

}

const signIn = async (req, res) => { //dump if everything is okay

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
                console.log(payload);

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
            
                        const payload = { id: insertResult.insertId, 
                                        name: userInfo.name, 
                                        email: userInfo.email, 
                                        picture: userInfo.picture
                                    };
                        console.log(payload);

                        const token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
                        
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

const nativeSignIn = async (email, password) => {
    try {
        const hash = crypto.createHash('sha256');
        const hashPassword = hash.update(password).digest('hex');
        const users = await queryPool('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (users.length > 0) { // email exist
            if (user.password == hashPassword && user.provider == "native") { // password correct

                const payload = { id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    picture: user.picture
                };

                const token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
                const username = payload.name;

                return {token, username};

            } else if (user.provider == "facebook"){
                return { error: '帳號已使用，請改為facebook登入'};

            } else { // password wrong
                return { error: '密碼錯誤'};
            }
            
        } else { // email not exist
            return { error: '帳號不存在，請註冊'};
        }

    } catch (error) {
        return {error};
    }
};

const getFacebookProfile = async function(accessToken){
    try {
        const res = await axios.get(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
        return res.data;
    } catch (e) {
        console.log(e);
        throw('Permissions Error: facebook access token is wrong');
    }
};

const facebookSignIn = async (id, name, email) => {
    try {

        let userInfo = {
            provider: 'facebook',
            email: email,
            name: name,
            picture:'https://graph.facebook.com/' + id + '/picture?type=large',
        };

        const users = await queryPool(`SELECT id FROM users WHERE email = ? AND provider = 'facebook'`, [email]);

        let userId;
        if (users.length === 0) { // Insert new user
            const queryStr = 'INSERT INTO users SET ?';
            const result = await queryPool(queryStr, userInfo);
            userId = result.insertId;
        } else { // Update existed user
            userId = users[0].id;

        }

        const payload = { 
            id: userId, 
            name: userInfo.name, 
            email: userInfo.email, 
            picture: userInfo.picture
        };

        const token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
        const username = userInfo.name;

        return {token,username};
    } catch (error) {

        return {error};
    }
};

const getProfile = async (id) => {
    return queryPool('SELECT * FROM orders WHERE user_id = ?', [id]);
}

const uploadShares = async (orderId, photoName, comment) => {

    try {
        const sql = `UPDATE orders SET ? WHERE id=${orderId}`;
        const condition = {
            photo: photoName.replace("date-saver/shares/",""),
            comment: comment
        };

        return await queryPool(sql, condition);
    } catch (error) {
        return {error: error};
    }

};

module.exports = {
    signUp,
    signIn,
    nativeSignIn,
    getFacebookProfile,
    facebookSignIn,
    getProfile,
    uploadShares
};