var users = require('./user.json');
users = users.map(u=>{
    u.balance = 1000;
    return u;
})

module.exports.users = users;