const Transaction = require('./transaction');
const { INITIAL_BALANCE, MINING_REWARD } = require('../config');
const Wallet = require('./index');


describe('Transaction', () => {
    let transaction, wallet, recipient, amount;
    beforeEach(()=>{
        wallet = new Wallet();
        amount = 50;
        recipient = 'recipient';
        transaction = Transaction.newTransaction(wallet, recipient, amount);
    });
    it('outputs the amount substracted from the wallet balance', () =>{
        expect(transaction.outputs.find(output => output.address === wallet.publicKey).amount)
        .toEqual(wallet.balance - amount);
    });
    it('outputs the amount added to the recipient', () =>{
        expect(transaction.outputs.find(output => output.address === recipient).amount)
        .toEqual(amount);
    });
    it('it inputs the balance of the wallet', () =>{
        expect(transaction.input.amount).toEqual(wallet.balance);
    });
    it('validates a valid transaction', () =>{
        expect(Transaction.verifyTransaction(transaction)).toBe(true);
    });
    it('invalidates a corrupt transaction', () =>{
        transaction.outputs[0].amount = 500000;
        expect(Transaction.verifyTransaction(transaction)).toBe(false);
    });

    describe('transacting with amount that exceeds the balance', ()=>{
        beforeEach(()=>{
            amount = 50000;
            transaction = Transaction.newTransaction(wallet, recipient, amount)
        });
        it('does not create the transaction ', () =>{
            expect(transaction).toEqual(undefined);
        });
    });
    describe('update a transaction', ()=>{
        let nextAmount, nextRecipient;
        beforeEach(()=>{
            nextAmount = 20;
            nextRecipient = 'next-address';
            transaction = transaction.update(wallet, nextRecipient, nextAmount);
        });
        it(`substracts the next amount from the sender's output ` , () =>{
            expect(transaction.outputs.find(output => output.address === wallet.publicKey).amount).toEqual(wallet.balance  -amount - nextAmount);
        });
        it(`outputs an amount for the next recipient` , () =>{
            expect(transaction.outputs.find(output => output.address === nextRecipient).amount).toEqual(nextAmount);
        });
    });
    describe('Reward Transaction', ()=>{
        
        beforeEach(()=>{
            transaction = Transaction.rewardTransaction(wallet, Wallet.blockchainWallet());
        });
        it(`reward the miner's wallet ` , () =>{
            expect(transaction.outputs.find(output => output.address === wallet.publicKey).amount)
            .toEqual(MINING_REWARD);
        });
    });
});