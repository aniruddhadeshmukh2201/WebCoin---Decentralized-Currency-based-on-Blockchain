const Block = require('./block');
const { DIFFICULTY } = require('../config');
const hexToBinary = require('hex-to-binary');  

describe('Block', () => {
    let data, lastBlock, block;
    beforeEach(() => {
        data = 'bar';
        lastBlock = Block.genesis();
        block = Block.mineBlock(lastBlock, data);
    }); 

    it('sets the `data` to match the input', () => {
        expect(block.data).toEqual(data);
    });
    it('sets the `lastHash` to match the hash of the last block', () =>{
        expect(block.lastHash).toEqual(lastBlock.hash)
    });
    it('Generates a hash that matches our difficulty', () =>{
        expect(hexToBinary(block.hash).substring(0, block.difficulty)).toEqual('0'.repeat(block.difficulty));
        console.log(block.toString());
    });
    it('lowers the difficulty for slowly mined block', () =>{
        expect(Block.adjustDifficulty(block, block.timestamp+360000)).toEqual(block.difficulty-1);
        // console.log(block.toString());
    });
    it('raises the difficulty for quickly mined block', () =>{
        expect(Block.adjustDifficulty(block, block.timestamp+36)).toEqual(block.difficulty+1);
        // console.log(block.toString());
    });
    it(`has a lower limit of 1`, () => {
        block.difficulty = -1;
        expect(Block.adjustDifficulty(block, block.timestamp)).toEqual(1);
    });

});