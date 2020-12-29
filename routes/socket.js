require('dotenv').config();

const { db,queryPool,intoSql } = require('./db');


const socketView = (socket) =>{
    socket.on('addView', async(content)=>{
        console.log(content);

        let readSql = `SELECT view FROM orders WHERE id = ${content.id}`;

        let updateSql = `UPDATE orders SET ? WHERE id = ${content.id}`;
        
        let readView = await queryPool(readSql, null);
        let updateView = await queryPool(updateSql, {view: readView[0].view + 1});

        console.log(updateView);

        socket.broadcast.emit('send',{ id: content.id, view: readView[0].view + 1 });
    });

}

module.exports = socketView;