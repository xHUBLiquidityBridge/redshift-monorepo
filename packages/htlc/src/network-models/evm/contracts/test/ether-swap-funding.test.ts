import { init } from 'truffle-test-utils';
import { EtherSwapInstance } from '../types/truffle-contracts';
import { config, etherToWei } from './lib';

// tslint:disable:variable-name
const Swap = artifacts.require('EtherSwap');

contract('EtherSwap - Funding', accounts => {
  const [{ lninvoiceHash, hash, refundDelay }] = config.valid;
  let swapInstance: EtherSwapInstance;
  before(async () => {
    init();
    swapInstance = await Swap.deployed();
  });

  it('should change the order state when a valid funding payment is received', async () => {
    const res = await swapInstance.fund(lninvoiceHash, hash, {
      from: accounts[1],
      value: etherToWei(0.01),
    });
    assert.web3Event(
      res,
      {
        event: 'OrderFundingReceived',
        args: {
          lninvoiceHash,
          onchainAmount: etherToWei(0.01),
          paymentHash: hash,
          refundBlockHeight: res.receipt.blockNumber + refundDelay,
        },
      },
      'OrderFundingReceived was emitted with the correct args',
    );
  });

  it('should increment the on chain amount when a second valid funding payment is received', async () => {
    const res = await swapInstance.fund(lninvoiceHash, hash, {
      from: accounts[1],
      value: etherToWei(0.01),
    });
    assert.web3Event(
      res,
      {
        event: 'OrderFundingReceived',
        args: {
          lninvoiceHash,
          onchainAmount: etherToWei(0.01 * 2),
          paymentHash: hash,
          refundBlockHeight: res.receipt.blockNumber + refundDelay - 1, // because 1 function call: fund
        },
      },
      'OrderFundingReceived was emitted with the incremented amount',
    );
  });
});