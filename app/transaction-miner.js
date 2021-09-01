const Wallet = require('../wallet/index');
const Transaction = require('../wallet/transaction');

class TransactionMiner {
    constructor({bc, tp, wallet, pubsub}) {
        this.blockchain = bc;
        this.transactionPool = tp;
        this.wallet = wallet;
        this.pubsub = pubsub;
    }

    mineTransactions() {
        const validTs = this.transactionPool.validTransactions();
        //generate the miner's reward
        validTs.push(
            Transaction.rewardTransaction({minerWallet: this.wallet})
        );
        //add a block consisting of these transactions to the blockchain
        this.blockchain.addBlock({ data: validTs });
        // broadcast the updated blockchain
        this.pubsub.broadcastChain();
        //clear the pool
        this.transactionPool.clear();
    }
}

module.exports = TransactionMiner;
