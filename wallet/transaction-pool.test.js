const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Wallet = require('./index');
const Blockchain = require('../blockchain'); 

describe('TransactionPool', () => {
    let tp, transaction, senderWallet;
    beforeEach(() => {
        tp = new TransactionPool();
        senderWallet = new Wallet();
        transaction = new Transaction({senderWallet, recipient: 'fake-recipient', amount: 50});
    });
    describe('setTransaction()', () => {
        it('adds a tansaction', ()=>{
            tp.setTransaction(transaction);
            expect(tp.transactionMap[transaction.id])
            .toEqual(transaction);
        });
    });
    describe('existingTransaction()()', () => {
        it('returns an exixting transaction given an input address', ()=>{
            tp.setTransaction(transaction);
            expect(tp.existingTransaction(senderWallet.publicKey))
            .toBe(transaction);
        });
    });
    describe('validTransactions()', () => {
        let validTs;
        beforeEach(() => {
            validTs = [];
            errorMock = jest.fn();
            global.console.error = errorMock;

            for(let i = 0; i< 10; i++) {
                transaction = new Transaction({senderWallet,recipient: 'any-recipient', amount: 30});
                if(i%3 === 0) {
                    transaction.input.amount = 9999999;
                } else if(i%3 === 1){
                    transaction.input.signature = new Wallet().sign('foo');
                } else {
                    validTs.push(transaction);
                }
                tp.setTransaction(transaction);
                
            }
            console.log(validTs.length);
        });

        it('returns valid transaction', () => {
            expect(tp.validTransactions())
            .toEqual(validTs);
        });
        it('logs errors for the invalid transactions', () => {
            tp.validTransactions();
            expect(errorMock).toHaveBeenCalled();
        });
    });
    describe('clear()', () => {
        it('clears the transactions', () => {
            tp.clear();
            expect(tp.transactionMap).toEqual({});
        });
    });
    describe('clearBlockchainTransactions()', () => {
        it('clears the pool of any existing blockchain transactions', () => {
            let blockchain = new Blockchain();
            const expectedTransactionMap = {};
            for(let i =0 ; i< 6; i++) {
                const transaction = new Wallet().createTransaction({
                    recipient: 'foo', amount: 20
                });
                tp.setTransaction(transaction);
                if (i%2===0) {
                    blockchain.addBlock({data: [transaction]})
                } else {
                    expectedTransactionMap[transaction.id] = transaction;
                }
            }
            tp.clearBlockChainTransactions({chain: blockchain.chain});
            expect(tp.transactionMap).toEqual(expectedTransactionMap);
        });
    });
});
