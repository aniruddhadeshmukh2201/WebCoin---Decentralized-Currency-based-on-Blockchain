const ChainUtil = require('./chain-util');

describe('cryptoHash()', () => {
    it('produces a unique hash when the properties have changed on an input' ,()=> {
        const foo = {};
        const originalHash = ChainUtil.hash(foo);
        foo['a'] = 'a';

        expect(ChainUtil.hash(foo)).not.toEqual(originalHash);
    });
});