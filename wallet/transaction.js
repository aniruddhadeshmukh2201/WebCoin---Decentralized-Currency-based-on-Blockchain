const ChainUtil = require('../chain-util');
const { MINING_REWARD } = require('../config'); 


class Transaction {
    constructor() {
        this.id = ChainUtil.id();
        this.input = null;   // info about the sender
        this.outputs = [];   // states of sender and recipient after the transaction
    }

    update(senderWallet, recipient, amount){
        const senderOutput = this.outputs.find(output => output.address === senderWallet.publicKey);

        if(amount > senderWallet.balance) {
            console.log(`Amount: ${amount} exceeds balance.`);
            return;
        }
        senderOutput.amount = senderOutput.amount - amount;
        this.outputs.push({amount, address: recipient});
        Transaction.signTransaction(this, senderWallet);
        return this;
    }

    static newTransaction(senderWallet, recipient, amount) { // constructs a new transaction and returns it
        if(amount > senderWallet.balance) {
            console.log(`Amount: ${amount} is exceeding the current balance`);
            return;
        }
        return Transaction.transactionWithOutputs(senderWallet, [
            { amount: senderWallet.balance-amount, address: senderWallet.publicKey },
            { amount, address: recipient }
        ]);
    }


    static rewardTransaction(minerWallet, blockchainWallet){
        return Transaction.transactionWithOutputs(blockchainWallet, [{
            address: minerWallet.publicKey, amount: MINING_REWARD
        }]);
    }


    static transactionWithOutputs(senderWallet, outputs) {
        let transaction = new this();
        transaction.outputs.push(...outputs);
        Transaction.signTransaction(transaction, senderWallet);
        return transaction;
    }

    static signTransaction(transaction, senderWallet) {  // adds input to the transaction.
        transaction.input = {
            timestamp: Date.now(),
            amount   : senderWallet.balance,
            address  :senderWallet.publicKey,
            signature: senderWallet.sign(ChainUtil.hash(transaction.outputs))
        }
    }

    static verifyTransaction(transaction) {
        return ChainUtil.verifySignature(
            transaction.input.address, 
            transaction.input.signature,
            ChainUtil.hash(transaction.outputs)
        );
    }
}


module.exports = Transaction;