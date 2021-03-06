/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const {Block} = require('./block.js');
const bitcoinMessage = require('bitcoinjs-message');

const MAX_ELAPSED_TIME = 5 * 60;  //5 minutes

class Blockchain {

  /**
   * Constructor of the class, you will need to setup your chain array and the height
   * of your chain (the length of your chain array).
   * Also everytime you create a Blockchain class you will need to initialized the chain creating
   * the Genesis Block.
   * The methods in this class will always return a Promise to allow client applications or
   * other backends to call asynchronous functions.
   */
  constructor() {
    this.chain = [];
    this.height = -1;
    this.initialized = this.initializeChain();
  }

  /**
   * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
   * You should use the `addBlock(block)` to create the Genesis Block
   * Passing as a data `{data: 'Genesis Block'}`
   */
  async initializeChain() {
    if (this.height === -1) {
      let block = new Block({data: 'Genesis Block'});
      await this._addBlock(block);
    }
  }

  /**
   * Utility method that return a Promise that will resolve with the height of the chain
   */
  async getChainHeight() {
    return this.height;
  }

  /**
   * _addBlock(block) will store a block in the chain
   * @param {*} block
   * The method will return a Promise that will resolve with the block added
   * or reject if an error happen during the execution.
   * You will need to check for the height to assign the `previousBlockHash`,
   * assign the `timestamp` and the correct `height`...At the end you need to
   * create the `block hash` and push the block into the chain array. Don't for get
   * to update the `this.height`
   * Note: the symbol `_` in the method name indicates in the javascript convention
   * that this method is a private method.
   */
  async _addBlock(block) {
    const chainErrors = await this.validateChain();
    if (chainErrors.length > 0) {
      throw new Error(`chain invalid: ${chainErrors[0]}`);
    }

    block.height = this.height + 1;
    block.time = Date.now().toString().slice(0, -3);
    if (this.height >= 0) {
      block.previousBlockHash = this.chain[this.height].hash;
    }

    block.calculateHash(true);

    this.chain.push(block);
    this.height++;

    return block;
  }

  /**
   * The requestMessageOwnershipVerification(address) method
   * will allow you  to request a message that you will use to
   * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
   * This is the first step before submit your Block.
   * The method return a Promise that will resolve with the message to be signed
   * @param {*} address
   */
  async requestMessageOwnershipVerification(address) {
    return `${address}:${Date.now().toString().slice(0, -3)}:starRegistry`;
  }

  /**
   * The submitStar(address, message, signature, star) method
   * will allow users to register a new Block with the star object
   * into the chain. This method will resolve with the Block added or
   * reject with an error.
   * Algorithm steps:
   * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
   * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
   * 3. Check if the time elapsed is less than 5 minutes
   * 4. Veify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
   * 5. Create the block and add it to the chain
   * 6. Resolve with the block added.
   * @param {*} address
   * @param {*} message
   * @param {*} signature
   * @param {*} star
   */
  async submitStar(address, message, signature, star) {
    let msgChunks = message.split(':');
    const messageTime = parseInt(msgChunks[1]);
    if (
      isNaN(messageTime)
      || msgChunks[0] !== address
      || msgChunks[2] !== "starRegistry"
    ) {
      throw new Error("invalid identity message");
    }

    const currentTime = parseInt(Date.now().toString().slice(0, -3));
    if (currentTime - messageTime > MAX_ELAPSED_TIME) {
      throw new Error("message has expired");
    }

    if (!bitcoinMessage.verify(message, address, signature)) {
      throw new Error("invalid signature");
    }

    const block = new Block({
      owner: address,
      star,
    });
    return this._addBlock(block);
  }

  /**
   * This method will return a Promise that will resolve with the Block
   *  with the hash passed as a parameter.
   * Search on the chain array for the block that has the hash.
   * @param {*} hash
   */
  async getBlockByHash(hash) {
    return this.chain.find(b => b.hash === hash) || null;
  }

  /**
   * This method will return a Promise that will resolve with the Block object
   * with the height equal to the parameter `height`
   * @param {*} height
   */
  async getBlockByHeight(height) {
      return this.chain.find(p => p.height === height) || null;
  }

  /**
   * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
   * and are belongs to the owner with the wallet address passed as parameter.
   * Remember the star should be returned decoded.
   * @param {*} address
   */
  async getStarsByWalletAddress(address) {
    const stars = [];
    for (const block of this.chain) {
      if (block.height === 0) {
        continue;
      }

      const data = await block.getBData();
      if (data.owner === address) {
        stars.push(data.star);
      }
    }

    return stars;
  }

  /**
   * This method will return a Promise that will resolve with the list of errors when validating the chain.
   * Steps to validate:
   * 1. You should validate each block using `validateBlock`
   * 2. Each Block should check the with the previousBlockHash
   */
  async validateChain() {
    const errorLog = [];
    for (let i = 0; i < this.chain.length; i++) {
      const valid = await this.chain[i].validate();
      if (!valid) {
        errorLog.push(`block ${i} is invalid`);
        continue;
      }

      if (i === 0) {
        continue;
      }

      if (this.chain[i].previousBlockHash !== this.chain[i - 1].calculateHash()) {
        errorLog.push(`block ${i} is invalid`);
      }
    }

    return errorLog
  }

}

module.exports.Blockchain = Blockchain;
module.exports.MAX_ELAPSED_TIME = MAX_ELAPSED_TIME;