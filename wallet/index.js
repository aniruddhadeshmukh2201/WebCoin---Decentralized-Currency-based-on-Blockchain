const { INITIAL_BALANCE } = require('../config');
const ChainUtil = require('../util/chain-util');
const Transaction = require('./transaction');

class Wallet {
    constructor() {
        this.balance = INITIAL_BALANCE;
        this.keyPair = ChainUtil.genKeyPair();
        this.publicKey =  this.keyPair.getPublic().encode('hex');
    }
    toString() {
        return `Wallet - 
            publicKey: ${this.publicKey.toString()}
            balance: ${this.balance}`
    }

    sign(data) {
        let dataHash = ChainUtil.hash(data);
        return this.keyPair.sign(dataHash);
    }

    createTransaction({recipient, amount, chain}) {
        // this.balance = this.calculateBalance(blockchain);
        if(chain) {
            this.balance = Wallet.calculateBalance({
                chain,
                address: this.publicKey
            });
        }
        if(amount > this.balance) {
            throw new Error('Amount exceeds balance');
        }
        let transaction = new Transaction({senderWallet: this, recipient, amount});
        return transaction;
    }

    static calculateBalance({chain, address}) {
        let hasConductedTransaction = false;
        let outputsTotal = 0;
        for(let i=chain.length-1; i>0; i--) {
            const block = chain[i];
            for(let transaction of block.data ) {
                if (transaction.input.address === address) {
                    hasConductedTransaction = true;
                }
                const addressOutput = transaction.outputMap[address];
                if(addressOutput) {
                    outputsTotal = outputsTotal + addressOutput;
                }
            }
            if (hasConductedTransaction) {
                break;
            }
        }
        return hasConductedTransaction ? outputsTotal : INITIAL_BALANCE + outputsTotal;
    }
}


module.exports = Wallet;




// static blockchainWallet() {
//     const blockchainWallet = new this();
//     blockchainWallet.address = 'blockchain-wallet';
//     return blockchainWallet;
// }