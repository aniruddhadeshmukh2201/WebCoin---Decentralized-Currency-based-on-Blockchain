const ChainUtil = require('../util/chain-util');
const {DIFFICULTY, MINE_RATE} = require('../config');
const hexToBinary = require('hex-to-binary'); 

class Block {
    constructor(timestamp, lasthash, hash, data, nonce, difficulty) {
        this.timestamp = timestamp
        this.lastHash = lasthash
        this.hash = hash
        this.data = data
        this.nonce = nonce
        this.difficulty = difficulty || DIFFICULTY;
    }
    toString() {
        return `Block -
        Timestamp : ${this.timestamp}
        lastHash  : ${this.lastHash.substring(0, 10)}
        hash      : ${this.hash.substring(0, 10)}
        nonce     : ${this.nonce}
        Difficulty: ${this.difficulty}
        Data      : ${this.data}`;
    }

    static genesis() {
        return new this('Genesis time', '-----', 'first-hash', [], 0, DIFFICULTY)
    }
    static hash(timestamp, lastHash, data, nonce, difficulty) {
        return ChainUtil.hash(`${timestamp}${lastHash}${data}${nonce}${difficulty}`).toString();
    }
    static mineBlock(lastBlock, data) {
        let hash, timestamp;
        const lastHash = lastBlock.hash;
        let {difficulty} = lastBlock;
        let nonce = 0;
       do {
            nonce++;
            timestamp = Date.now();
            difficulty = Block.adjustDifficulty(lastBlock, timestamp);
            hash = Block.hash(timestamp, lastHash, data, nonce, difficulty);
       } while(hexToBinary(hash).substring(0, difficulty) !== '0'.repeat(difficulty));
        return new this(timestamp, lastHash, hash, data, nonce, difficulty);
    }
    static blockHash(block) {
        const {timestamp, lastHash, data, nonce, difficulty} = block;
        return Block.hash(timestamp, lastHash, data, nonce, difficulty);
    }
    static adjustDifficulty(lastBlock, timestamp) {
        let { difficulty } = lastBlock;
        if(difficulty < 1) {
            console.log("difficulty should be atleast 1");
            return 1;
        }
        difficulty = lastBlock.timestamp + MINE_RATE > timestamp  ? difficulty + 1 : difficulty - 1;
        return difficulty;
    }
}


module.exports = Block;












