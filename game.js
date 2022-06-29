var games = require('./game.json');

games = games.map(g=>{
    g.live = true;
    g.team =[ Math.floor(Math.random() * 100000), Math.floor(Math.random() * 100000)];
    return g;
})

module.exports.games = games;