const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KnurFi Contract", function () {
  let knurfi;
  let owner;

  // Runs before every test
  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const knurfiFactory = await ethers.getContractFactory("KnurFi");
    knurfi = await knurfiFactory.deploy();
  });

  it("Should save and retrieve a note correctly", async function () {
    // 1. Mock Data
    const fakeTxHash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"; // 32 bytes
    const fakeIpfsCid = "QmHashOfYourEncryptedNote";

    // 2. Add the note
    console.log("📝 Adding note...");
    const tx = await knurfi.addNote(fakeTxHash, fakeIpfsCid);
    await tx.wait(); // Wait for block to be mined

    // 3. Verify it exists
    console.log("🔍 Retrieving note...");
    const storedCid = await knurfi.getNote(owner.address, fakeTxHash);
    
    expect(storedCid).to.equal(fakeIpfsCid);
    console.log("✅ Success! Retrieved CID matches:", storedCid);
  });

  it("Should emit an event when a note is added", async function () {
    const fakeTxHash = ethers.id("some transaction");
    const fakeIpfsCid = "QmAnotherHash";

    await expect(knurfi.addNote(fakeTxHash, fakeIpfsCid))
      .to.emit(knurfi, "NoteLog")
      .withArgs(owner.address, fakeTxHash, fakeIpfsCid, (val) => val > 0); // timestamp check
  });
});