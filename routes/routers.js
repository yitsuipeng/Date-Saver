const router = require('express').Router();
const {wrapAsync} = require('./util');

const {
    getIndexOption,
    getNearOption,
    optimization,
    recommendation
    
} = require('./controllers');

router.route('/getIndexOption')
    .get(wrapAsync(getIndexOption));

router.route('/getNearOption/:location')
    .get(wrapAsync(getNearOption));

router.route('/optimization')
    .post(wrapAsync(optimization));

router.route('/recommendation/:id')
    .get(wrapAsync(recommendation));

module.exports = router;