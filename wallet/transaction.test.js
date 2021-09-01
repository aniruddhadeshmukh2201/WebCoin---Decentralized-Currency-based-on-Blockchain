const Transaction = require('./transaction');
const { INITIAL_BALANCE, REWARD_INPUT, MINING_REWARD } = require('../config');
const Wallet = require('./index');
const ChainUtil = require('../util/chain-util');


describe('Transaction', () => {
    let transaction, senderWallet, recipient, amount;
    beforeEach(()=>{
        senderWallet = new Wallet();
        amount = 50;
        recipient = 'recipient';
        transaction = new Transaction({senderWallet, recipient, amount});
    });
    it('has an `id`', () =>{
        expect(transaction).toHaveProperty('id');
    });
    describe('OutputMap', ()=>{
        it('has an outputMap', () =>{
            expect(transaction).toHaveProperty('outputMap');
        });
        it('outputs the amount to the recipient', () =>{
            expect(transaction.outputMap[recipient])
            .toEqual(amount);
        });
        it('outputs the remaining balance for the senderWallet', () => {
            expect(transaction.outputMap[senderWallet.publicKey])
            .toEqual(senderWallet.balance - amount);
        });
    });
    describe('Input', ()=>{
        it('has an `input`', () => {
            expect(transaction).toHaveProperty('input');
        });
        it('has a `timestamp` in the input', () => {
            expect(transaction.input).toHaveProperty('timestamp');
        });
        it('sets the `amount` to the `senderWallet` balance', () => {
            expect(transaction.input.amount).toEqual(senderWallet.balance);
        });
        it('sets the `address` to the `senderWallet` publicKey', () => {
            expect(transaction.input.address).toEqual(senderWallet.publicKey);
        });
        it('signs the input', () => {
            expect(
                ChainUtil.verifySignature(senderWallet.publicKey, transaction.input.signature, transaction.outputMap)
                ).toBe(true);
        });
    });
    describe('ValidTransaction()', () => {
        let errorMock;
        beforeEach(() => {
            errorMock = jest.fn();
            global.console.error = errorMock;
        });
        describe('when transaction is valid', () => {
            it('returns true', () =>{
                expect(Transaction.validTransaction(transaction)).toBe(true);
            });
        });
        describe('when transaction is invalid', () => {
            describe('and the transaction outputMap value is invalid', () => {
                it('returns false and logs an error', () =>{
                    transaction.outputMap[senderWallet.publicKey] = 5000000;
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
            describe('and the transaction input signature is invalid', () => {
                it('returns false and logs an error', () =>{
                    transaction.input.signature = new Wallet().sign('foo-data');
                    expect(Transaction.validTransaction(transaction)).toBe(false);
                    expect(errorMock).toHaveBeenCalled();
                });
            });
        });
    });
    describe('update()', ()=>{
        let nextAmount, nextRecipient, originalSignature, originalSenderOutput;
        
        describe('and the amount is invalid', () => {
            it('throws an error', () => {
                expect(() => {
                    transaction.update(senderWallet, 'foo', 5000000)
                }).toThrow('Amount exceeds balance');
            });
        });

        describe('and the amount is valid', () => {
            beforeEach(()=>{
                nextAmount = 20;
                nextRecipient = 'next-address';
                originalSignature = transaction.input.signature;
                originalSenderOutput = transaction.outputMap[senderWallet.publicKey];
                transaction.update(senderWallet, nextRecipient, nextAmount);
            });
            it(`outputs an amount for the next recipient` , () =>{
                expect(transaction.outputMap[nextRecipient]).toEqual(nextAmount);
            });
            it(`substracts the next amount from the sender's output ` , () =>{
                expect(transaction.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
            });
            it(`maintains a total output that matches the input amount` , () =>{
                expect(
                    Object.values(transaction.outputMap)
                    .reduce((total, outputAmount) => total + outputAmount)
                    ).toEqual(transaction.input.amount);
            });
            it(`re-signs the transaction` , () => {
                expect(transaction.input.signature)
                .not.toEqual(originalSignature);
            });
            describe('and another update for the same recipient', () => {
                let addedAmount;
                beforeEach(() => {
                    addedAmount = 80;
                    transaction.update(senderWallet,nextRecipient, addedAmount );
                });
                it('adds to the recipient amount', () => {
                    expect(transaction.outputMap[nextRecipient])
                    .toEqual(nextAmount + addedAmount);
                });
                it('subs the amount from the original sender output amount', () => {
                    expect(transaction.outputMap[senderWallet.publicKey])
                    .toEqual( originalSenderOutput - nextAmount - addedAmount);
                });
            });
        });
    });
    describe('Reward Transaction', ()=>{
        let rewardTransaction, minerWallet;
        beforeEach(()=>{
            minerWallet = new Wallet();
            rewardTransaction = Transaction.rewardTransaction({minerWallet});
        });
        it(`creates a transaction with reward input ` , () =>{
            expect(rewardTransaction.input)
            .toEqual(REWARD_INPUT);
        });
        it(`creates one transaction for the miner with the 'MINING_REWARD' ` , () =>{
            expect(rewardTransaction.outputMap[minerWallet.publicKey])
            .toEqual(MINING_REWARD);
        });
    });
});

