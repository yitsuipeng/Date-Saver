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
app.use('/', require('./routes/site'));
app.use('/api/1.0', require('./routes/controller'));
app.use('/user', require('./routes/user'));


// 交通部資料
const getAuthorizationHeader = function() {
	var AppID = 'b86014c8de0d44f6bc05960242a4fdb2';
	var AppKey = 'kmWezvq5Md_lt9q9F-ywykEhx-c';

	var GMTString = new Date().toGMTString();
	var ShaObj = new jsSHA('SHA-1', 'TEXT');
	ShaObj.setHMACKey(AppKey, 'TEXT');
	ShaObj.update('x-date: ' + GMTString);
	var HMAC = ShaObj.getHMAC('B64');
	var Authorization = 'hmac username=\"' + AppID + '\", algorithm=\"hmac-sha1\", headers=\"x-date\", signature=\"' + HMAC + '\"';

	return { 'Authorization': Authorization, 'X-Date': GMTString};
}

app.get('/transportAPI', (req, res) => {
    axios.get('https://ptx.transportdata.tw/MOTC/v2/Bus/Route/City/Taipei?$top=10&$format=JSON', { 
	headers: getAuthorizationHeader(),
	})
	.then(function(response){
        console.log(response.data.length);
        res.send(response.data);
	});

});



// error handling
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    res.locals.error = err;
    res.status(err.status);
    res.render('error');
});

app.listen(3000, () => {
    console.log('port: 3000');
});