const {Block} = require("./block");
const SHA256 = require("crypto-js/sha256");


describe("Block", () => {
  it("should calculate hash without update", () => {
    const block = new Block("dummy");
    const hash = block.calculateHash();

    expect(hash).toBe(SHA256(JSON.stringify(block)).toString());
    expect(block.hash).toBeNull();
  })

  it("should calculate hash and update", () => {
    const block = new Block("dummy");
    const hash = block.calculateHash(true);

    expect(block.hash).toBe(hash);
  })

  it("should validate", async () => {
    const block = new Block("dummy");

    expect(await block.validate()).toBe(false);

    block.hash = block.calculateHash();
    expect(await block.validate()).toBe(true);

    block.height = block.height + 1;
    expect(await block.validate()).toBe(false);
  })

  it("should get decoded block data", async () => {
    const star = {
      dec: "68° 52' 56.9",
      ra: "16h 29m 1.0s",
      story: "Testing star"
    };
    const block = new Block(star);
    block.height = 1;

    expect(await block.getBData()).toEqual(star);

    block.height = 0;
    await expect(block.getBData()).rejects.toThrowError("can't get genesis block data");
  })
})