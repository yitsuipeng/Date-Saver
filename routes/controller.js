require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const _ = require('lodash');
const { db,queryPool,intoSql } = require('./db');
const { encodeXText } = require('nodemailer/lib/shared');


// index
router.get('/getIndexOption', async (req, res) => {

    let tagSql = `SELECT id,name,photo FROM tags ORDER BY id ASC;`;
    let siteSql = `SELECT name,tag,lat,lng,place_id,open_time,address FROM sites_chosen WHERE tag !='';`;
    let container = {};

    // Math.floor(Math.random()*5)+1

    let containerWithTag = await queryPool(tagSql,null)
    .then(result => {

        for(let x of result) {
            let eachTag = {tagId: x.id, tagSites:[], tagPhoto: x.photo};
            container[x.name] = eachTag;
        }

        return container;
    });

    await queryPool(siteSql,null)
    .then(result => {

        for(let x of result) {
            let eachObject = {name:x.name, location: {lat:x.lat, lng:x.lng}, openTime:x.open_time, placeId:x.place_id, assign:1, address:x.address};

            containerWithTag[x.tag].tagSites.push(eachObject);
        }

        console.log('init option sent');
        res.send(containerWithTag);
    });


});

// planning
router.get('/getNearOption/:location', async (req, res) => {

    let show = JSON.parse(req.params.location);
    let lat = show.lat;
    let lng = show.lng;
    let final = { name:"", nlat: 1, elong: 1, distance:10000000000 };
    
    // let center = `SELECT * FROM centers;`;
    // let centerResult = await queryPool(center,null);

    // await centerResult.forEach(element => {
    //    if ( Math.pow(element.lat*10000-lat, 2) + Math.pow(element.lng*10000-lng, 2) < final.distance ){
    //        final.name = element.name;
    //        final.nlat = element.lat;
    //        final.elong = element.lng;
    //        final.distance = Math.pow(element.lat*10000-lat, 2) + Math.pow(element.lng*10000-lng, 2);
    //    }
    // });

    let near = `SELECT name, lat, lng, place_id, url, photo, address, place_key FROM places WHERE place_key IS NOT NULL;`;
    let nearResult = await queryPool(near,null);
    // await nearResult.sort((a, b) => {
    //     return (Math.pow(a.lat*10000-lat, 2) + Math.pow(a.lng*10000-lng, 2)) - (Math.pow(b.lat*10000-lat, 2) + Math.pow(b.lng*10000-lng, 2));
    // });
    await nearResult.sort((a, b) => {
        return (getDistance(a.lat, a.lng, lat, lng) - getDistance(b.lat, b.lng, lat, lng));
    });

    let suggest = {
        center:final,
        nearSite: nearResult.slice(0,18),
    
    };

    console.log(suggest);
    res.send(suggest);


});

// planning
router.post('/optimization', async (req, res) => {

    console.log(req.body);

    let matrixDistance = [];
    for (let x of req.body) {
        let eachDis = [];
        for (let y of req.body){
            eachDis.push(getDistance(x.location.lat, x.location.lng, y.location.lat, y.location.lng));
        }
        matrixDistance.push(eachDis);
    }
    console.log(matrixDistance);

    let index = []; // [0,1,2,3,4]
    for (let x in req.body) {
        index.push(parseInt(x));
    }

    let matrixIndex = permutateWithoutRepetitions(index).filter(x => x[0] == 0 );

    console.log(index);
    console.log(matrixIndex.length);

    let optimal = {
        permutation: "",
        totalDistance: 1000}

    for (var i=0; i<matrixIndex.length; i++) {
        let x = 0;
        for (var j=0; j<index.length-1; j++) {
            x += matrixDistance[matrixIndex[i][j]][matrixIndex[i][j+1]];
        }
        if (x < optimal.totalDistance){
            optimal.totalDistance = x;
            optimal.permutation = matrixIndex[i];
        }
    }
    console.log(optimal);

    let output = [];
    for (let x of optimal.permutation) {
        output.push(req.body[x]);
    }
    
    res.send(output);

});

// 頁數迴圈的寫法, 暫時無法使用
router.get('/googleApiTest', async (req, res) => {

    let results = [];
    let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?location=25.0399316,121.5624083&radius=2000&type=restaurant&language=zh-TW&key=AIzaSyBnr8RhoIjlRKQ7iTT8yM7IfQJpv64znyg`;
    let nextPage = "";
    let count = 0;


    do{
        let addition = nextPage? ('&pagetoken='+nextPage) : "";
        await axios.get(url+addition)
        .then(async response => {
            
            // let restaurant = [];
            for(let x of response.data.results){
                // if(x.price_level==2 && x.rating > 4){

                // }
                // let obj = {}
                // obj.name = x.name;
                // obj.location = x.geometry.location;
                results.push(x);
            }
            nextPage = response.data.next_page_token;
            count+=1

            console.log(count);
            console.log(nextPage);
        });

    } while(nextPage)
    
    console.log('length'+results.length);
    res.send(results);


});


router.post('/googleApiGetId', async (req, res) => {
    console.log(req.body);

    let input = req.body;

    const value = {
        place_id : input.id,
        name : input.name,
        lat : input.location.lat,
        lng : input.location.lng,
        rating : input.rating,
        address : input.addr,
        photo : input.photo,
        url : input.url,
        icon : input.icon,
        types : input.types,
        place_key : 0,
    };

    const insert = 'INSERT INTO places SET ?';

    await queryPool(insert,value);
    console.log('finish');

});


router.get('/recommendation/:id', async (req, res) => {

    let name = req.params.id;
    console.log(name);
    
    let sql = `SELECT * FROM cf_index INNER JOIN places ON cf_index.second = places.place_id where first = '${req.params.id}' AND sim != 0 ;`;
    let simQuery = await queryPool(sql, null);


    if(simQuery.length==0){
        res.status(200).send({sorry:"no recommend"});
    }else{
        simQuery.sort((a, b) => {
            return (b.sim - a.sim);
        });
        let simResult = simQuery.filter(x => x.first != x.second ).slice(0, 3);
        console.log(simResult);
        
        res.status(200).send({ data: simResult });
    } 
    
});


function getDistance(lat1, lng1, lat2, lng2) {
    var radLat1 = lat1 * Math.PI / 180.0;
    var radLat2 = lat2 * Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    return s  // km
}

function permutateWithoutRepetitions(permutationOptions) {
    if (permutationOptions.length === 1) {
      return [permutationOptions];
    }
  
    const permutations = [];
  
    // Get all permutations for permutationOptions excluding the first element.
    const smallerPermutations = permutateWithoutRepetitions(permutationOptions.slice(1));
  
    // Insert first option into every possible position of every smaller permutation.
    const firstOption = permutationOptions[0];
  
    for (let permIndex = 0; permIndex < smallerPermutations.length; permIndex += 1) {
      const smallerPermutation = smallerPermutations[permIndex];
  
      // Insert first option into every possible position of smallerPermutation.
        for (let positionIndex = 0; positionIndex <= smallerPermutation.length; positionIndex += 1) {
            const permutationPrefix = smallerPermutation.slice(0, positionIndex);
            const permutationSuffix = smallerPermutation.slice(positionIndex);
            permutations.push(permutationPrefix.concat([firstOption], permutationSuffix));
        }
    }
  
    return permutations;
}

module.exports = router;
