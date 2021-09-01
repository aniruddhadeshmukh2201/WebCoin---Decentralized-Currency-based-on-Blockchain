const Wallet = require('./index');
const TransactionPool = require('./transaction-pool');
const Blockchain = require('../blockchain');
const ChainUtil = require('../util/chain-util');
const { INITIAL_BALANCE } = require('../config');
const Transaction = require('./transaction');

describe('Wallet', () =>{
    let wallet, tp;
    beforeEach(() => {
        wallet = new Wallet();
        tp = new TransactionPool();
    });
    it('has a `balance`', () => {
        expect(wallet).toHaveProperty('balance');
    });
    it('has a `publicKey`', () => {
        expect(wallet).toHaveProperty('publicKey');
    });
    describe('Signing Data', () => {
        const data = 'foobar';

        it('verifies a signature',() => {
            
            expect(ChainUtil.verifySignature(wallet.publicKey, wallet.sign(data), data))
            .toBe(true);
        });
        it('does not verify an invalid signature',() => {
            expect(ChainUtil.verifySignature(wallet.publicKey, new Wallet().sign(data), data))
            .toBe(false);
        });
    });
    describe('creating a transaction', () =>{
        describe('and the amount exceeds the balance', () =>{
            it('throws an error', () => {
                expect(() => wallet.createTransaction({recipinet: 'rand-address', amount: 999999}))
                .toThrow('Amount exceeds balance');
            });
        });
        describe('and the amount is valid', () =>{
            let transaction, sendAmount, recipient;
            beforeEach(() => {
                sendAmount = 50;
                recipient = 'rand-address';
                transaction = wallet.createTransaction({recipient, amount: sendAmount});
            });

            it('creates an instance of `Transaction`', () => {
                expect(transaction instanceof Transaction).toBe(true);
            });
            it('matches the transaction input address with the wallet publicKey', () => {
                expect(transaction.input.address).toEqual(wallet.publicKey);
            });
            it('outputs the amount to the recipient', () => {
                expect(transaction.outputMap[recipient]).toEqual(sendAmount);
            });
        });
        describe('and a chain is passed',() => {
            it('calls wallet.calculateBalance', () => {
                const calculateBalanceMock = jest.fn();
                const originalCalculateBalance = Wallet.calculateBalance;
                Wallet.calculateBalance = calculateBalanceMock;
                wallet.createTransaction({
                    recipient: 'foo',
                    amount : 10,
                    chain: new Blockchain().chain
                });
                expect(calculateBalanceMock).toHaveBeenCalled();
                Wallet.calculateBalance = originalCalculateBalance;
            })
        });
    });
    describe('calculateBalance()', () => {
        let blockchain;
        beforeEach(() => {
            blockchain = new Blockchain();
        });
        describe('and there are no output for the wallet', () => {
            it('returns the `INITIAL_BALANCE`', () => {
                expect(
                    Wallet.calculateBalance({
                        chain: blockchain.chain,
                        address: wallet.publicKey 
                    })
                ).toEqual(INITIAL_BALANCE);
            });
        });
        describe('and there are outputs for the wallet', () => {
            let transactionOne, transactionTwo;
            beforeEach(() => {
                transactionOne = new Wallet().createTransaction({
                  recipient: wallet.publicKey,
                  amount: 50
                });
        
                transactionTwo = new Wallet().createTransaction({
                  recipient: wallet.publicKey,
                  amount: 60
                });
        
                blockchain.addBlock({ data: [transactionOne, transactionTwo] });
            });
        
            it('adds the sum of all outputs to the wallet balance', () => {
                let temp = Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                  });
                console.log(temp);
                expect(
                  Wallet.calculateBalance({
                    chain: blockchain.chain,
                    address: wallet.publicKey
                  })
                ).toEqual(
                  INITIAL_BALANCE +
                  transactionOne.outputMap[wallet.publicKey] +
                  transactionTwo.outputMap[wallet.publicKey]
                );
            });
            describe('and the wallet has made a transaction', () => {
                let recentTransaction;
                beforeEach(() => {
                    recentTransaction = wallet.createTransaction({
                        recipient: 'foo-address',
                        amount: 30
                    });
                    blockchain.addBlock({ data : [ recentTransaction ]})
                });
                it('returns the output amount of the recent transaction', () => {
                    expect(
                        Wallet.calculateBalance({
                            chain: blockchain.chain,
                            address: wallet.publicKey
                        })
                    ).toEqual(recentTransaction.outputMap[wallet.publicKey]);
                }); 
                describe('and there are output next to and after the recent transaction', () => {
                    let sameBlockTransaction, nextBlockTransaction;
                    beforeEach(() => {
                        recentTransaction = wallet.createTransaction({
                            recipient: 'later-foo-address',
                            amount: 60
                        });
                        sameBlockTransaction = Transaction.rewardTransaction({ minerWallet: wallet});
                        blockchain.addBlock({ data: [recentTransaction, sameBlockTransaction]  });
                        
                        nextBlockTransaction = new Wallet().createTransaction({
                            recipient: wallet.publicKey, amount: 75
                        });
                        blockchain.addBlock({ data: [nextBlockTransaction]  });
                    });
                    it('includes the output in the returned balance', () => {
                        expect(
                            Wallet.calculateBalance({
                                chain: blockchain.chain,
                                address: wallet.publicKey
                            })
                        ).toEqual(
                            recentTransaction.outputMap[wallet.publicKey] +
                            sameBlockTransaction.outputMap[wallet.publicKey] +
                            nextBlockTransaction.outputMap[wallet.publicKey] 
                        );
                    });
                });
            });
        });
    });
});