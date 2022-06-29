const crypto = require('crypto');

const { users } = require('./users');
const { games } = require('./game');


// The bet class consists of a constructor and a calcHash() function.
// The constructor initializes the bet data and has the following fields: user ID, game ID, bet amount, bet team, the odds of the bet in the form of numerator bet0 and a denominator bet1, the data and the status of the bet.
// calcHash() uses the sha256 function to calculate a hash value based on the data initialized in the constructor function.
class Bet {
    constructor (userID, gameID, betAmount, betTeam, bet0, bet1, status){
        this.userID = userID;
        this.gameID = gameID;
        this.betAmount = betAmount;
        this.betTeam = betTeam;
        this.bet0 = bet0;
        this.bet1 = bet1;
        this.ts = Date.now();
        this.status = status;
    }
    calcHash(){
        return crypto.createHash('sha256').update(this.userID + this.gameID + this.betAmount + this.betTeam + this.bet0 + this.bet1 + this.ts + this.state)
    }
}

// The block class consists of a constructor, calcHash() function and a mineBlock() function.
// The constructor initializes the following fields: previous hash, timestamp, betTransactions, a dummy variable rands and hash of the current block.
// calcHash() uses sha256 to calculate the hash of the current block based on the current data values of the block.
// mineBlock() is the proof of work function. It keeps incrementing the value of the dummy variable rands till the hash value of the block starts with a required number of ‘a’s based on difficulty of the blockchain. 
class Block {
    constructor(ts, betTransactions, previousHash = '') {
        this.previousHash = previousHash;
        this.ts = ts;
        this.betTransactions = betTransactions;
        this.rands = 0;
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return crypto.createHash('sha256').update(this.previousHash + this.ts + JSON.stringify(this.betTransactions) + this.rands).digest('hex');
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('a')) {
            this.rands++;
            this.hash = this.calculateHash();
        }
    }
}

class Blockchain {
    constructor() {
      this.chain = [this.createGenesisBlock()];
      this.difficulty = 2;
      this.pendingBets = [];
      this.miningReward = 2;
    }

    createGenesisBlock() {
      return new Block(Date.now(), [], '-');
    }

    getLatestBlock() {
      return this.chain[this.chain.length - 1];
    }

    minePendingBets(userID) {
      //console.log(this.pendingBets);
      let user = users.filter(u=>u.userID===userID);
      user.balance+=this.pendingBets.length*this.miningReward;
  
      const block = new Block(Date.now(), this.pendingBets, this.getLatestBlock().hash);
      block.mineBlock(this.difficulty);
  
      console.log('Block successfully mined!', block);
      this.chain.push(block);
      
      this.pendingBets = [];
    }

    addBet(bt) {
      
      if (bt.betAmount <= 0) {
        return {success:false,msg:'Transaction amount should be higher than 0'};
      }
      
      // Making sure that the amount sent is not greater than existing balance
      const userBalance = this.getBalanceOfUser(bt.userID);
      if (userBalance < bt.betAmount) {
        return {success:false,msg:'Not enough balance'};
      }

      for(const u of users){
          if(u.userID === bt.userID){
              u.balance -= bt.betAmount;
          }
      }
  
      this.pendingBets.push(bt);
      //console.log(this.pendingBets);
      return {success:true,msg:`Bet Placed for user ${bt.userID} for game ${bt.gameID} --- amount ${bt.betAmount}`,bt:bt,u:this.getBalanceOfUser(bt.userID)};
    }

    getBalanceOfUser(userID) {
      let user = users.filter(u=>u.userID === userID); 
      //console.log(user['0']); 
      return user['0'].balance;
  
    }

    completeGame(gameID, betTeam){
        //Game isnt live anymore.
        for(let game of games){
            if(gameID === game.gameID){
                game.live = false;
                game.won = betTeam;
            }
        }
        
        //Calculate and add amount gained from the bets for each  user
        let amount = 0;
        for (let i = 1; i < this.chain.length; i++){
            this.chain[i].betTransactions.forEach(bt => {
                if(bt.gameID === gameID && bt.betTeam == betTeam){
                    for(const u of users){
                        if(u.userID === bt.userID){
                            u.balance += bt.betAmount*(betTeam===0?bt.bet0:bt.bet1);
                            // console.log(u.name, u.balance, bt.betAmount, bt.bet0, bt.bet1, bt.betTeam);
                        }
                    }
                }
            });
        }
        
        console.log(`Game ${gameID} is over and team ${betTeam} has won and user balances updated.`);
    }

    isChainValid() {
      
      // Check the remaining blocks on the chain to see if there hashes and
      // signatures are correct
      for (let i = 1; i < this.chain.length; i++) {
        const currentBlock = this.chain[i];
        const previousBlock = this.chain[i - 1];
  
        if (previousBlock.hash !== currentBlock.previousHash) {
          return false;
        }
  
        if (currentBlock.hash !== currentBlock.calculateHash()) {
          return false;
        }
      }
  
      return true;
    }
}



module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Bet = Bet;
module.exports.users = users;