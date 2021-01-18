require('dotenv').config();

const { queryPool } = require('../db');

const socketView = (socket) => {

    try {
        socket.on('addView', async(content)=>{
            console.log(content);
                   
            let readView = await queryPool(`SELECT view FROM orders WHERE id = ${content.id}`, null);
            await queryPool(`UPDATE orders SET ? WHERE id = ${content.id}`, {view: readView[0].view + 1});
    
            return socket.broadcast.emit('send',{ id: content.id, view: readView[0].view + 1 });
        });

    } catch(error) {
        console.log('failed with socket');
        return {error: error};
    }

};

const getNearOption = async () => {

    return await queryPool('SELECT name, lat, lng, place_id, url, photo, address, place_key FROM places WHERE place_key IS NOT NULL;',null);

};

const saveOrder = async (orderInfo) => {
    console.log('saveOrder');
    return await queryPool('INSERT INTO orders SET ?', orderInfo);
};

const checkNewPlace = async () => {
    console.log('checkNewPlace');
    return await queryPool('SELECT place_id FROM places', null);
};

const createNewPlace = async (newSiteArray) => {
    console.log('createNewPlace');
    return await queryPool('INSERT INTO places (url, place_id, lat, lng, address, name, rating) VALUES ?', [newSiteArray]);
};

const checkMatrix = async (name) => {
    console.log('checkMatrix');
    return await queryPool(`SELECT * FROM cf_index INNER JOIN places ON cf_index.second = places.place_id where first = '${name}' AND sim != 0 ;`, null);
};

const collaborativeFiltering = async() => {

    let orderHistory = await queryPool(`SELECT details FROM orders;`, null);
    let newArray = [];
    let ordersList = orderHistory.flatMap(p => JSON.parse(p.details)).map(x => x.place_id);
    
    for(let x of orderHistory){
        x = JSON.parse(x.details);
        let z = x.map(y => y.place_id);
        newArray.push(z);
    }

    console.log('total orders : '+ordersList.length);
    let index = {};

    for(let i=0; i<ordersList.length; i++){
        if(!index[ordersList[i]]){
            index[ordersList[i]] = 0;
        }
        index[ordersList[i]] += 1;
    }

    let n = Object.keys(index);
    console.log('site count : '+n.length);

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
    console.log(simArray.length);

    let clearIndex = await queryPool('DELETE FROM cf_index',null);
    let refreshIndex = await queryPool('INSERT INTO cf_index (first, second, sim) VALUES ?',[simArray]);
    console.log(refreshIndex.affectedRows);
    return;
    
}

module.exports = {
    socketView,
    getNearOption,
    checkMatrix,
    saveOrder,
    checkNewPlace,
    createNewPlace,
    collaborativeFiltering
};