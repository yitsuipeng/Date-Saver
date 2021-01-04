const { queryPool } = require('../routes/db');
const crypto = require('crypto');

const users = [
    {
        provider: 'native',
        email: 'test1@gmail.com',
        password: 'test1password',
        name: 'test1',
        picture: 'https://d2cw5pt7i47jz6.cloudfront.net/date-saver/users/unnamed.jpg',
    },
    {
        provider: 'facebook',
        email: 'test2@gmail.com',
        password: null,
        name: 'test2',
        picture: 'https://graph.facebook.com/1/picture?type=large',
    },
    {
        provider: 'native',
        email: 'test3@gmail.com',
        password: 'test3passwod',
        name: 'test3',
        picture: 'https://d2cw5pt7i47jz6.cloudfront.net/date-saver/users/unnamed.jpg',
    },
];

function createFakeUser() {
    
    const encryped_users = users.map(user => {
        let hash = crypto.createHash('sha256');
        const encryped_user = {
            provider: user.provider,
            email: user.email,
            password: user.password ? hash.update(user.password).digest('hex') : null,
            name: user.name,
            picture: user.picture,
        };
        return encryped_user;
    });
    return queryPool('INSERT INTO users (provider, email, password, name, picture) VALUES ?', [encryped_users.map(x => Object.values(x))]);
}

function truncateFakeData() {

    return queryPool(`TRUNCATE TABLE users`);

};

module.exports = {
    createFakeUser,
    truncateFakeData,
    users
};