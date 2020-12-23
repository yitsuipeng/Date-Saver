require('dotenv').config();

const { db,queryPool,intoSql } = require('./db');


const socketView = (socket) =>{
    socket.on('chat message', (msg)=>{
        console.log(msg);
        socket.emit('chat message',msg);
    });
    socket.on

}

module.exports = socketView;