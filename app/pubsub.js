const redis = require('redis');
// const Blockchain = require('../blockchain/index.js');


const CHANNELS = {
    TEST:'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor(blockchain , tp) {
        this.blockchain = blockchain;
        this.tp = tp;
        this.publisher = redis.createClient();
        this.subscriber = redis.createClient();
        this.subscribeToChannels();
        this.subscriber.on(
            'message', 
            (channel, message) => this.handleMessage(channel, message)
        );
    }
    handleMessage(channel, message) {
        console.log(`Message recieved. Channel: ${channel}, Message: ${message}.`);
        const parsedMessage = JSON.parse(message);
        switch(channel) {
            case CHANNELS.BLOCKCHAIN:
              this.blockchain.replaceChain(parsedMessage, () => {
                  this.tp.clearBlockChainTransactions({
                      chain: parsedMessage
                  });
              });
              break;
            case CHANNELS.TRANSACTION:
              this.tp.setTransaction(parsedMessage);
              break;
            default:
              return;
          }
    }

    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => {
            this.subscriber.subscribe(channel);
        });
    }

    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, () =>{
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        }) ;
    }
    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        });
    }
}

// const bc = new Blockchain();
// const testPubSub = new PubSub(bc);
// setTimeout(() => testPubSub.broadcastChain(), 1000);
// setTimeout(() => testPubSub.publish({
//     channel: CHANNELS.TEST,
//     message: '{"fruit": "mango"}'
// }), 1000);


module.exports = PubSub;






// Alternative implementation
// const PubNub = require('pubnub');
// const credentials = {
//     publishKey: 'pub-c-df2fae44-56e0-4c16-b430-1939dfdfdfc5',
//     subscribeKey: 'sub-c-d0d794c2-fe78-11eb-a3fa-22908b043f7e',
//     secretKey: 'sec-c-YmY5NTQ2ZTktZjc3My00ODllLTgzMmEtNDAxMTFmZGE3ZjY3'

// };
// class PubSub {
//     constructor() {
//         this.pubnub = new PubNub(credentials);
//         this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
//         this.pubnub
//         this.pubnub.addListener(this.listener());
//     }
//     listener() {
//         return {
//             message: messageObject => {
//                 const {channel, message} = messageObject;
//                 console.log(`Message recieved. Channel: ${channel}, Message: ${message}.`);
//             }
//         };
//     }
//     publish({channel, message}) {
//         this.pubnub.publish({channel, message});
//     }
// }