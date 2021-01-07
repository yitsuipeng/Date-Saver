const { queryPool } = require('./db');
const Main = require('./planning_model');

// index (not used then)
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

    try {
        const show = JSON.parse(req.params.location);
        const lat = show.lat;
        const lng = show.lng;
        let final = { name:"", nlat: 1, elong: 1, distance:10000000000 };
        
        let nearResult = await Main.getNearOption();

        await nearResult.sort((a, b) => {
            return (getDistance(a.lat, a.lng, lat, lng) - getDistance(b.lat, b.lng, lat, lng));
        });

        let suggest = {
            center:final,
            nearSite: nearResult.slice(0,20),
        };

        res.status(200).send(suggest);

    } catch (error) {
        res.status(400).send({error: '請稍後再試'});
        return;
    }

};

const optimization = async (req, res) => {

    let matrixDistance = [];
    for (let x of req.body) {
        let eachDis = [];
        for (let y of req.body){
            eachDis.push(getDistance(x.location.lat, x.location.lng, y.location.lat, y.location.lng));
        }
        matrixDistance.push(eachDis);
    }

    let index = []; // [0,1,2,3,4]
    for (let x in req.body) {
        index.push(parseInt(x));
    }

    let matrixIndex = permutateWithoutRepetitions(index).filter(x => x[0] == 0 );

    console.log(matrixIndex.length);

    let optimal = {
        permutation: "",
        totalDistance: 1000};

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
    
    res.status(200).send(output);

};

const recommendation = async (req, res) => {

    const name = req.params.id;
    console.log(name);

    let simQuery = await Main.checkMatrix(name);

    if (simQuery.length==0){
        res.status(200).send({sorry:"no recommend"});
    } else {
        simQuery.sort((a, b) => {
            return (b.sim - a.sim);
        });
        let simResult = simQuery.filter(x => x.first != x.second ).slice(0, 3);
        console.log(simResult);
        
        res.status(200).send({ data: simResult });
    } 
    
};

const savePlanning = async (req, res) => {

    const token = req.token;
    const planDetails = req.body.plan;
    console.log(token);

    try{

        const orderInfo = {
            user_id: token.id,
            details: JSON.stringify(planDetails.schedule),
            total_duration: planDetails.totalTime,
            total_distance: planDetails.totalDistance,
            date: planDetails.startDate,
            name: planDetails.name,
            view: 0
        };
    
        await Main.saveOrder(orderInfo);
        const places = await Main.checkNewPlace();
        let newSiteArray = [];
    
        for(let x of planDetails.schedule){
            let same = 0;
            for(let y of places){
                if(x.place_id == y.place_id){
                    same = 1;
                }
            }
            if (same==0){
                let newSiteDetails = [x.url, x.place_id, x.location.lat, x.location.lng, x.address, x.name, x.rating];
                newSiteArray.push(newSiteDetails);
    
            }
        }

        await Main.createNewPlace(newSiteArray);
        await Main.collaborativeFiltering();
        console.log('succeed');

        res.status(200).send( {success: '儲存成功，祝你一路順風' });

    }catch (error){
        console.log(error);
        res.status(500).send({ error: '系統錯誤，請稍後重試一次'});
    }

};

const getDistance = (lat1, lng1, lat2, lng2) => {
    var radLat1 = lat1 * Math.PI / 180.0;
    var radLat2 = lat2 * Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    return s  // km
};

const permutateWithoutRepetitions = (permutationOptions) => {
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
};

// planning
const verifyUser = async (req, res) => {
    res.status(200).send({ data: {access_token:req.token}});
};

module.exports = {
    getIndexOption,
    getNearOption,
    optimization,
    recommendation,
    savePlanning,
    verifyUser
};
