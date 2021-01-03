require('dotenv').config();

const { queryPool } = require('./db');
const validator = require('validator');
const User = require('./user_model');

const signUp = async (req, res) => {
    let {name} = req.body;
    const {email, password} = req.body;

    if(!name || !email || !password) {
        res.status(400).send({error:'請完成所有欄位'});
        return;
    }

    if (!validator.isEmail(email)) {
        res.status(400).send({error:'email 格式錯誤'});
        return;
    }

    name = validator.escape(name);

    const result = await User.signUp(name, email, password);
    if (result.error) {
        console.log(result.error);
        res.status(403).send({error: result.error});
        return;
    }

    const {token} = result;
    if (!token) {
        res.status(500).send({error: '系統錯誤，請稍後再試'});
        return;
    }

    res.status(200).send( {data: { access_token: token, username: name }});

};

const nativeSignIn = async (email, password) => {
    if(!email || !password){
        return {error: '請完成所有欄位', status: 400};
    }

    try {
        return await User.nativeSignIn(email, password);
    } catch (error) {
        return {error};
    }
};

const facebookSignIn = async (accessToken) => {
    if (!accessToken) {
        return {error: '登入錯誤', status: 400};
    }

    try {
        const profile = await User.getFacebookProfile(accessToken);
        const {id, name, email} = profile;

        if(!id || !name || !email){
            return {error: '授權失敗'};
        }

        return await User.facebookSignIn(id, name, email);
    } catch (error) {
        return {error: error};
    }
};

const signIn = async (req, res) => {
    const data = req.body;

    let result;
    switch (data.provider) {
    case 'native':
        result = await nativeSignIn(data.email, data.password);
        break;
    case 'facebook':
        result = await facebookSignIn(data.access_token);
        break;
    default:
        result = {error: '輸入錯誤'};
    }

    if (result.error) {
        const status_code = result.status ? result.status : 403;
        res.status(status_code).send({error: result.error});
        return;
    }

    const {token,username} = result;
    if (!username) {
        res.status(500).send({error: '系統錯誤，請稍後再試'});
        return;
    }

    res.status(200).send( {data: { access_token: token, username: username }});
};

// profile
const getProfile = async(req, res) => {

    try {
        const {id} = req.token;
        let orderResult = await User.getProfile(id);

        res.status(200).send({ data: {user:req.token, order:orderResult}});

    } catch (error) {
        return {error: error};
    }

};

// profile
const uploadShares = async (req, res) => {

    try {
        const orderId = req.body.order_id;
        const photoName = req.file.key;
        const comment = req.body.story;

        await User.uploadShares(orderId, photoName, comment);
        return res.redirect('/profile.html');

    } catch (error) {
        return {error:error};
    }  

};

// hot
const getHotOrders = async (req, res) => {

    try {
        let orderResult = await User.getHotOrders();
        res.status(200).send({ data: orderResult});
    } catch (error) {
        return {error:error};
    } 

};

module.exports = {
    signUp,
    signIn,
    getProfile,
    uploadShares,
    getHotOrders
};