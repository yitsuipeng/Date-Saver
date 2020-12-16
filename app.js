const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const jsSHA = require('jssha');
const app = express();



//use middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));


//set engine
app.set('json spaces', 2);


//connect to other js files
app.use('/api/1.0', require('./routes/controller'));
app.use('/user', require('./routes/user'));
app.use('/order', require('./routes/order'));

// Page not found
app.use(function (req, res, next) {
    res.status(404).sendFile(__dirname + '/public/404.html');
});

// Error handling
app.use(function (err, req, res, next) {
    console.log(err);
    res.status(500).send('Internal Server Error');
});

app.listen(3000, () => {
    console.log('port: 3000');
});