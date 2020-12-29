require('dotenv').config();

const express = require('express');
const router = express.Router();
const axios = require('axios');
const _ = require('lodash');
const { db,queryPool,intoSql } = require('./db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { upload,verifyToken } = require('./util');


// index
const getIndexOption = async (req, res) => {

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


};

// planning
const getNearOption = async (req, res) => {

    let show = JSON.parse(req.params.location);
    let lat = show.lat;
    let lng = show.lng;
    let final = { name:"", nlat: 1, elong: 1, distance:10000000000 };
    
    let near = `SELECT name, lat, lng, place_id, url, photo, address, place_key FROM places WHERE place_key IS NOT NULL;`;
    let nearResult = await queryPool(near,null);

    await nearResult.sort((a, b) => {
        return (getDistance(a.lat, a.lng, lat, lng) - getDistance(b.lat, b.lng, lat, lng));
    });

    let suggest = {
        center:final,
        nearSite: nearResult.slice(0,30),
    
    };

    console.log(suggest);
    res.send(suggest);


};

const optimization = async (req, res) => {

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

};

const recommendation = async (req, res) => {

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
    
};

const savePlanning = async (req, res) => {

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

};

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

// module.exports = router;
module.exports = {
    getIndexOption,
    getNearOption,
    optimization,
    recommendation,
    savePlanning
};
