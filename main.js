const { Blockchain, Bet } = require('./blockchain');
const { games } = require('./game');
const { users } = require('./users');

function betOddsGenerator(){
    let random1 = Math.random(0,16);
    let random2 = Math.random(0,16);
    let odds = {"bet0" : 1+Math.round(random1/random2*100)/100, "bet1" : 1+Math.round(random2/random1*100)/100};
    return odds;
}

function getUsersPL(userID){
    let pl = [];
    for (let i = 1; i < winzyBets.chain.length; i++){
        winzyBets.chain[i].betTransactions.forEach(bt => {
            if(bt.userID == userID){
                //console.log(userID);
                let g = games.filter(g=>g.gameID==bt.gameID);
                if(g[0].won){
                    let winLoss = g[0].won == bt.betTeam ? "Won" : "Lost";
                    let btt = {
                        gameName : g[0].name,
                        betAmount : bt.betAmount,
                        wl : winLoss,
                        pl : winLoss == "Won"? Math.round(bt.betAmount*(bt.betTeam===0?bt.bet0:bt.bet1)) - bt.betAmount: -1*bt.betAmount
                    }
                    pl.push(btt);
                }else{
                    let btt = {
                        gameName : g[0].name,
                        betAmount : bt.betAmount,
                        wl : "-",
                        pl : "-"
                    }
                    pl.push(btt);
                }
                

            }
            
        });
    }
    return pl;
}


let winzyBets = new Blockchain();
console.log("1st Block!!!", winzyBets);


function power(x, y, p)
{
    // Initialize result
    let res = 1;
 
    // Update x if it is more
    // than or equal to p
    x = x % p;
 
    if (x == 0)
        return 0;
 
    while (y > 0)
    {
        // If y is odd, multiply
        // x with result
        if (y & 1)
            res = (res * x) % p;
 
        // y must be even now
         
        // y = $y/2
        y = y >> 1;
        x = (x * x) % p;
    }
    return res;
}

function interaction(c, y, p, c1){
    let c2 = (c*y)%p;
    if(c2==c1)
        return true;
    return false;
}

function verifyTransaction(gameid){
    p = 13;
    g = 31;
    y = power(g, gameid, p);
    for(let i=0;i<10;i++){
        let r = (Math.random(1,9));
        let c = power(g, r, p);
        let c1 = power(g, ((gameid+r)%(p-1)), p);
        if(!interaction(c,y,p,c1))
            return false;
    }
    
    return true;
}

function user_zkp(userID){
    let u = users.filter(g=>g.userID==userID);
    let ans = verifyTransaction(parseInt(userID));
    console.log("user-zkp ---",ans)
    return ans
}

function bet_zkp(gameID,betTeam){
    let g = games.filter(g=>g.gameID==gameID);
    let ans = verifyTransaction(g[0].team[betTeam]);
    console.log("bet-zkp ----- ",ans);
    return ans;
}

function placeBet(userID, gameID, bet, betAmount, bet0, bet1){
    
    let bt = new Bet(userID,gameID,betAmount,bet,bet0,bet1,0);
    if(!user_zkp(userID) || !bet_zkp(gameID,bet) ){
        return "Error while verifying user/bet";
    }
    let err = winzyBets.addBet(bt);
    console.log(err.msg);
    // if(err.success==true){
    //     console.log("Bet Placed!!")
    // }
}



let odds1 = betOddsGenerator(); 
let odds2 = betOddsGenerator();
let odds3 = betOddsGenerator();



placeBet("1ad6668eedd","1",0,100,2,2);
placeBet("1ad6668eede","1",0,50,2,2);
winzyBets.minePendingBets("1ad6668eedd");
// console.log(users,winzyBets);
placeBet("1ad6668eedd","2",1,10,odds2.bet0,odds2.bet1);
placeBet("1ad6668eede","2",0,150,odds2.bet0,odds2.bet1);
placeBet("1ad6668eedd","1",1,100,odds3.bet0,odds3.bet1);
placeBet("1ad6668eede","1",0,50,odds3.bet0,odds3.bet1);
winzyBets.minePendingBets("1ad6668eedd");

// console.log(users,winzyBets,"Game 1 is over");

winzyBets.completeGame("1",1);

// console.log(users,winzyBets);

console.log("Is Chain valid --- ",winzyBets.isChainValid());

console.log("User's P&L statement for user -- 1ad6668eedd", getUsersPL("1ad6668eedd"));
console.log("User's P&L statement for user -- 1ad6668eede", getUsersPL("1ad6668eede"));
console.log("User's P&L statement for user -- 1ad6668eedf", getUsersPL("1ad6668eedf"));