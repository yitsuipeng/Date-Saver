require('dotenv').config();

const axios = require('axios');
const { queryPool } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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

        const result = await queryPool(queryStr, userInfo);
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

};

const nativeSignIn = async (email, password) => {
    try {
        const hash = crypto.createHash('sha256');
        const hashPassword = hash.update(password).digest('hex');
        const users = await queryPool('SELECT * FROM users WHERE email = ?', [email]);
        const user = users[0];

        if (users.length > 0) { // email exist
            if (user.password == hashPassword && user.provider == 'native') { // password correct

                const payload = { id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    picture: user.picture
                };

                const token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });
                const username = payload.name;

                return {token, username};

            } else if (user.provider == 'facebook'){
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
};

const uploadShares = async (orderId, photoName, comment) => {

    const condition = {
        photo: photoName.replace("date-saver/shares/",""),
        comment: comment
    };

    return await queryPool(`UPDATE orders SET ? WHERE id=${orderId}`, condition);

};

const getHotOrders = async () => {
    return queryPool(`SELECT * FROM orders WHERE comment IS NOT NULL ORDER BY view DESC;`, null);
};

module.exports = {
    signUp,
    nativeSignIn,
    getFacebookProfile,
    facebookSignIn,
    getProfile,
    uploadShares,
    getHotOrders
};