require('dotenv').config();

const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = new aws.S3();

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

module.exports = {
    upload
};