require('dotenv').config();

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new aws.S3();
const jwt = require('jsonwebtoken');

aws.config.update({
    secretAccessKey: process.env.secretAccessKey,
    accessKeyId: process.env.accessKeyId,
    region: process.env.region
});

// multer
const upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: 'stylisherin.site',
        contentType: multerS3.AUTO_CONTENT_TYPE,
        acl: 'public-read',
        metadata: function (req, file, cb) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req, file, cb) {
            let path = `date-saver/shares/${Date.now()}-${file.originalname}`;
            cb(null, path);
        }
    })
});

// clean the Bearer token
const verifyToken = (req, res, next) => {
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

// reference: https://thecodebarbarian.com/80-20-guide-to-express-error-handling
const wrapAsync = (fn) => {
    return function(req, res, next) {
        fn(req, res, next).catch(next);
    };
};

module.exports = {
    upload,
    verifyToken,
    wrapAsync
};