const express = require('express');
const bodyParser = require('body-parser');
const {socketView} = require('./server/models/planning_model');
const app = express();

const http = require('http').createServer(app);
const io = require('socket.io')(http);

io.on('connection', socketView);

//use middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

//set engine
app.set('json spaces', 2);

//connect to other js files
app.use('/api/1.0', require('./server/routers'));

// Page not found
app.use(function (req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// Error handling
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

http.listen(3001, () => {
    console.log('port: 3001');
});

module.exports = {app};