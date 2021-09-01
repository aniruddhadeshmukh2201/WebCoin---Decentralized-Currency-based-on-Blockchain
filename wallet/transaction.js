const ChainUtil = require('../util/chain-util');
const { REWARD_INPUT, MINING_REWARD } = require('../config'); 


class Transaction {
    constructor({senderWallet, recipient, amount, outputMap, input}) {
        this.id = ChainUtil.id();
        this.outputMap = outputMap || this.createOutputMap({senderWallet,  recipient, amount});
        this.input = input || this.createInput({senderWallet, outputMap: this.outputMap});   // info about the sender
    }
    createOutputMap({senderWallet, recipient, amount}) {
        const outputMap = {};
        outputMap[recipient] = parseInt(amount);
        outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
        return outputMap;
    }
    createInput({senderWallet, outputMap}) {  
        return {
            timestamp: Date.now(),
            amount   : senderWallet.balance,
            address  : senderWallet.publicKey,
            signature: senderWallet.sign(outputMap)
        };
    }

    static validTransaction(transaction) {
        const { input: { address, amount, signature }, outputMap } = transaction;
        const outputTotal = Object.values(outputMap)
        .reduce((total, outputAmount) => total + outputAmount);
        if (amount !== outputTotal) {
            console.error(`Invalid transaction from ${address}`);
            return false;
        }
        if (!ChainUtil.verifySignature( address, signature, outputMap )) {
            console.error(`Invalid signature from ${address}`);
            return false;
        }
        return true;
    }
    update(senderWallet, recipient, amount){
        if(amount > this.outputMap[senderWallet.publicKey]) {
            throw new Error(`Amount exceeds balance.`);
        }
        if(!this.outputMap[recipient]) {
            this.outputMap[recipient] = parseInt(amount);
        } else {
            this.outputMap[recipient] = this.outputMap[recipient] +  parseInt(amount);
        }
        this.outputMap[senderWallet.publicKey] = 
        this.outputMap[senderWallet.publicKey] - amount;
        this.input = this.createInput({senderWallet, outputMap: this.outputMap});
    }

    static rewardTransaction({minerWallet}){
        return new this({
            input: REWARD_INPUT,
            outputMap: { [minerWallet.publicKey]: MINING_REWARD }
          });
    }


    // static transactionWithOutputs(senderWallet, outputs) {
    //     let transaction = new this();
    //     transaction.outputs.push(...outputs);
    //     Transaction.signTransaction(transaction, senderWallet);
    //     return transaction;
    // }

    
}


module.exports = Transaction;