const {Blockchain, MAX_ELAPSED_TIME} = require("./blockchain");

describe("Blockchain", () => {
  const btcAddress = "mgzVFHzy8myTdLExhdC87Ld9zuLwPnY3d9";
  const star = {
    dec: "68° 52' 56.9",
    ra: "16h 29m 1.0s",
    story: "Testing star"
  };

  it("should initialize a genesis block", async () => {
    const blockchain = new Blockchain();
    await blockchain.initialized;

    expect(blockchain.height).toBe(0);
    expect(blockchain.chain.length).toBe(1);

    const genBlock = await blockchain.getBlockByHeight(0);
    expect(genBlock.previousBlockHash).toBeNull();
  })

  it("should return ownership verification message", async () => {
    const originalNow = Date.now;
    const now = Date.now();
    Date.now = () => now;

    const blockchain = new Blockchain();
    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);

    expect(message).toBe(`${btcAddress}:${now.toString().slice(0, -3)}:starRegistry`);

    Date.now = originalNow;
  })

  it("should submit a star", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);
    const block = await blockchain.submitStar(btcAddress, message, signature, star);

    expect(await block.getBData()).toEqual({star, owner: btcAddress});

    Date.now = originalNow;
  })

  it("should return error if submitting a star with invalid message ", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = "invalid:message";

    await expect(blockchain.submitStar(btcAddress, message, signature, star))
      .rejects
      .toThrowError("invalid identity message");

    Date.now = originalNow;
  })

  it("should return error if submitting a star with expired message ", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = [1647104846891, 1647104846891, 1647104846891 + (MAX_ELAPSED_TIME * 1000) + 1000];
    Date.now = () => {
      return now.shift();
    }

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);

    await expect(blockchain.submitStar(btcAddress, message, signature, star))
      .rejects
      .toThrowError("message has expired");

    Date.now = originalNow;
  })

  it("should return error if submitting a star with invalid signature ", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFa=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);

    await expect(blockchain.submitStar(btcAddress, message, signature, star))
      .rejects
      .toThrowError("invalid signature");

    Date.now = originalNow;
  })

  it("should return a block by hash", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);
    const block = await blockchain.submitStar(btcAddress, message, signature, star);

    const blockByHash = await blockchain.getBlockByHash(block.hash);
    expect(blockByHash).toEqual(block);

    const blockNotFound = await blockchain.getBlockByHash("notexists");
    expect(blockNotFound).toBeNull();

    Date.now = originalNow;
  })

  it("should return the stars of a wallet", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);
    await blockchain.submitStar(btcAddress, message, signature, star);

    const stars = await blockchain.getStarsByWalletAddress(btcAddress);
    expect(stars).toEqual([star]);

    Date.now = originalNow;
  })

  it("should validate the chain", async () => {
    const signature = "INmVXTHWctLjQElqLVNT06B/7BU8vaynpXXcyvwM4/bmclTdniY5j6CwmEdl3qdYZKKFz6KYPTs8KASfAsBSvFw=";
    const originalNow = Date.now;
    const now = 1647104846891;
    Date.now = () => now;

    const blockchain = new Blockchain();
    await blockchain.initialized;

    const message = await blockchain.requestMessageOwnershipVerification(btcAddress);
    await blockchain.submitStar(btcAddress, message, signature, star);
    await blockchain.submitStar(btcAddress, message, signature, star);
    await blockchain.submitStar(btcAddress, message, signature, star);

    let errors = await blockchain.validateChain();
    expect(errors).toEqual([]);

    blockchain.chain[2].time = now + 1;
    errors = await blockchain.validateChain();
    expect(errors).toEqual(["block 2 is invalid", "block 3 is invalid"]);

    Date.now = originalNow;
  })
})