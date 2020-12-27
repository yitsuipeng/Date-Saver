require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { db,queryPool,intoSql } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upload } = require('./util');


// clean the Bearer token
function verifyToken (req, res, next) {
    const bearerHeader = req.headers.authorization;
    if (bearerHeader) {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];

        jwt.verify(bearerToken, process.env.secretAccessKey, (err, data) => {
            if(err){
                console.log(err);
                res.status(403).send({data:'登入過期，請重新登入'});
            } else {
                console.log(data);
                req.token = data;
                next();
            }
        });
    } else {
        res.status(400).send({data:'請先登入喔'});
    }
}

router.post('/signup', async (req, res) => {

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
            console.log(insertResult);

            let payload = { id: insertResult.insertId, 
                            name: userInfo.name, 
                            email: userInfo.email, 
                            picture: userInfo.picture
                        };

            let token = jwt.sign(payload, process.env.secretAccessKey, { expiresIn: '1 day', noTimestamp:true });

            res.status(200).send( {data: { access_token: token, username: userInfo.name }});

        } else {
            res.status(500).send({ data: '系統錯誤，請稍後重試一次'});
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
                        console.log(insertResult);
            
                        let payload = { id: insertResult.insertId, 
                                        name: userInfo.name, 
                                        email: userInfo.email, 
                                        picture: userInfo.picture
                                    };
                        console.log("payload: "+payload);
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
});

// profile
router.get('/profile', verifyToken, async(req, res) => {

    let sql = `SELECT * FROM orders WHERE user_id = '${req.token.id}';`;
    let condition = null;

    let orderResult = await queryPool(sql, condition);
    console.log(orderResult);
    res.status(200).send({ data: {user:req.token, order:orderResult}});

});

// planning
router.get('/verifyUser', verifyToken, async (req, res) => {
    res.status(200).send({ data: {access_token:req.token}});
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
        name: req.body.plan.name,
        view: 0
    };

    let insertResult = await queryPool('INSERT INTO orders SET ?', orderInfo);
    let places = await queryPool('SELECT place_id FROM places', null);

    for(let x of req.body.plan.schedule){
        let same = 0;
        for(let y of places){
            if(x.place_id == y.place_id){
                same = 1;
            }
        }
        if (same==0){
            let newSiteDetails = {
                url: x.url,
                place_id: x.place_id,
                lat: x.location.lat,
                lng: x.location.lng,
                address: x.address,
                name: x.name,
                rating: x.rating,
            }

            let newSite = await queryPool('INSERT INTO places SET ?', newSiteDetails);
            console.log(newSite);
        }
    }

    await collaborativeFiltering();

    if (insertResult) {
        console.log('succeed');

        res.status(200).send( {success: '儲存成功，祝你一路順風' });

    } else {
        res.status(500).send({ error: '系統錯誤，請稍後重試一次'});
    }

});

// update order image
router.post('/uploadShares', upload.single('main_image'), async (req, res) => {

    let sql = `UPDATE orders SET ? WHERE id=${req.body.order_id}`;
    let condition = {
        photo: req.file.key.replace("date-saver/shares/",""),
        comment: req.body.story
    };

    let orderResult = await queryPool(sql, condition);

    res.redirect('/profile.html');

});

// hot
router.get('/getHotOrders', upload.single('main_image'), async (req, res) => {

    let sql = `SELECT * FROM orders WHERE comment IS NOT NULL ORDER BY view DESC;`;
    let condition = null;

    let orderResult = await queryPool(sql, condition);
    res.status(200).send({ data: orderResult});


});

// hot
router.post('/addView', async (req, res) => {

    console.log(req.body);
    let sql = `UPDATE orders SET ? WHERE id=${req.body.id}`;
    let condition = {
        view: req.body.view
    };
    
    let simQuery = await queryPool(sql, condition);

    console.log(simQuery);
    res.send({"view update":req.body});

});


async function collaborativeFiltering(){
    let sql = `SELECT details FROM orders;`;
    let orderHistory = await queryPool(sql, null);
    let newArray = [];
    let ordersList = orderHistory.flatMap(p => JSON.parse(p.details)).map(x => x.place_id);
    
    for(let x of orderHistory){
        x = JSON.parse(x.details);
        let z = x.map(y => y.place_id);
        newArray.push(z);
    }

    console.log(ordersList.length);
    let index = {};

    for(let i=0; i<ordersList.length; i++){
        if(!index[ordersList[i]]){
            index[ordersList[i]] = 0;
        }
        index[ordersList[i]] += 1;
    }

    let n = Object.keys(index);
    console.log(n.length);

    let simArray = [];
    for(let i of n) {
        for(let j of n){
            let first = [i,j];
            simArray.push(first);
        }   
    }
    console.log(simArray.length);

    for(let x of simArray){
        if(x[0]==x[1]){
            x.push(1);
        }else{
            let child = 0;
            for(let y of newArray){
                let count = 0;
                for(let z of y){
                    if(z==x[0] || z==x[1]){
                        count += 1;
                    }
                }
                if(count==2){
                    child += 1;
                }
            }
            x.push(child/(index[x[0]]+index[x[1]]-child));
        }
    }
    console.log(simArray);

    let clearIndex = await queryPool('DELETE FROM cf_index',null);
    let refreshIndex = await queryPool('INSERT INTO cf_index (first, second, sim) VALUES ?',[simArray]);
    console.log(refreshIndex.affectedRows);
    
}

module.exports = router;