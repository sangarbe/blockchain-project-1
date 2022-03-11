const {Block} = require("./block");


describe("Block", () => {
  it("should calculate hash", () => {
    const block = new Block("dummy");
    expect(block.hash).toBeNull()

    block.calculateHash();
    expect(block.hash).not.toBeNull()
  })

  it("should not recalculate previous hash", () => {
    const block = new Block("dummy");
    block.calculateHash();
    expect(block.hash).not.toBeNull()

    const expected = block.hash;
    block.calculateHash();
    expect(block.hash).toEqual(expected);
  })

  it("should validate", async () => {
    const block = new Block("dummy");

    expect(await block.validate()).toBe(false);

    block.calculateHash();
    expect(await block.validate()).toBe(true);

    block.height = block.height + 1;
    expect(await block.validate()).toBe(false);
  })
})