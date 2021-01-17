const router = require('express').Router();
const { upload,verifyToken,wrapAsync } = require('./util');

const {
    getIndexOption,
    getNearOption,
    optimization,
    recommendation,
    savePlanning,
    verifyUser
    
} = require('./controllers/planning_controller');

router.route('/verifyUser')
    .get(verifyToken, wrapAsync(verifyUser));

router.route('/getIndexOption')
    .get(wrapAsync(getIndexOption));

router.route('/option/:location')
    .get(wrapAsync(getNearOption));

router.route('/optimization')
    .post(wrapAsync(optimization));

router.route('/recommendation/:id')
    .get(wrapAsync(recommendation));

router.route('/savePlanning')
    .post(verifyToken, wrapAsync(savePlanning));
    
const {
    signUp,
    signIn,
    getProfile,
    uploadShares,
    getHotOrders,
    
} = require('./controllers/user_controller');

router.route('/signUp')
    .post(wrapAsync(signUp));

router.route('/signIn')
    .post(wrapAsync(signIn));

router.route('/profile')
    .get(verifyToken, wrapAsync(getProfile));

router.route('/sharing')
    .post(upload.single('main_image'), wrapAsync(uploadShares));

router.route('/hot')
    .get(wrapAsync(getHotOrders));

module.exports = router;