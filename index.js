const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('./blockchain');
const Wallet = require('./wallet');
const TransactionPool = require('./wallet/transaction-pool');
const PubSub = require('./app/pubsub');
const request = require('request');
const TransactionMiner = require('./app/transaction-miner');
const path = require('path');

const app = express();
const bc = new Blockchain();
const wallet = new Wallet();
const tp = new TransactionPool();
const pubsub = new PubSub(bc, tp);
const transactionMiner = new TransactionMiner({bc, tp, wallet, pubsub});
app.use(express.static(path.join(__dirname, 'client/dist')));
const DEFAULT_PORT = 3001;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;
// setTimeout(() => pubsub.broadcastChain(), 1000);

app.use(express.json());

app.get('/api/blocks', (req, res) => {
    res.json(bc.chain);
});

app.post('/api/mine', (req, res) =>{
    const block = bc.addBlock(req.body.data);
    // console.log(`New Block Added: ${block.toString()}`);
    pubsub.broadcastChain();
    res.redirect('/blocks');
});

app.get('/api/transactions', (req, res) =>{
    res.json(tp.transactionMap);
});

app.post('/api/transact', (req, res) =>{
    const {recipient, amount} = req.body;
    let transaction = tp.existingTransaction(wallet.publicKey);
    try{
        if(transaction) {
            transaction.update( wallet, recipient, amount);
            console.log('here');
        } else {
            transaction = wallet.createTransaction({recipient,amount, chain: Blockchain.chain});
        }
    } catch(error) {
        return res.status(400).json({type: 'error', message: error.message});
    }
    tp.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    res.json({type: 'success',  transaction});
});
app.get('/api/public-key', (req, res) => {
    res.json({publicKey: wallet.publicKey});
});

app.get('/api/balance', (req, res) => {
    const address = wallet.publicKey;
    res.json({
        address,
        balance: Wallet.calculateBalance({
            chain: bc.chain, 
            address
        })
    });
});

app.get('/api/mine-transactions', (req, res) => {
    transactionMiner.mineTransactions();
    res.redirect('/api/blocks');
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const syncWithRootState = () => {
    request({url: `${ROOT_NODE_ADDRESS}/api/blocks`}, (error, res, body) => {
        if(!error && res.statusCode === 200) {
            const rootChain = JSON.parse(body);
            console.log('tried replacing chain on a sync with ', rootChain);
            bc.replaceChain(rootChain);
        }
    });
    request({ url : `${ROOT_NODE_ADDRESS}/api/transactions`}, (error, response, body) => {
        if(!error && response.statusCode == 200) {
            const rootTransactionPoolMap = JSON.parse(body);
            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
            tp.setMap(rootTransactionPoolMap);
        }
    });
};

const walletFoo = new Wallet();
const walletBar = new Wallet();

const generateWalletTransaction = ({wallet, recipient, amount}) => {
    const transaction = wallet.createTransaction({
        recipient, amount,  chain: Blockchain.chain
    });

    tp.setTransaction(transaction);
};
const walletAction = () => generateWalletTransaction({
    wallet, recipient: walletFoo.publicKey, amount: 5
});

const walletFooAction = () => generateWalletTransaction({
    wallet: walletFoo, recipient: walletBar.publicKey, amount: 10
});

const walletBarAction = () => generateWalletTransaction({
    wallet: walletBar, recipient: wallet.publicKey, amount: 15
});

for (let i=0; i<20; i++) {
    if (i%3 === 0) {
      walletAction();
      walletFooAction();
    } else if (i%3 === 1) {
      walletAction();
      walletBarAction();
    } else {
      walletFooAction();
      walletBarAction();
    }

    transactionMiner.mineTransactions();
}



let PEER_PORT;
if(process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random()* 1000);
}
const PORT = PEER_PORT || DEFAULT_PORT;
app.listen(PORT, () => {
    console.log(`listening on Port ${PORT}`) 
    if(PORT !== DEFAULT_PORT) {
        syncWithRootState();
    }
});
