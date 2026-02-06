const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying mt_note to Ethereum Sepolia...");

  const mt_noteFactory = await hre.ethers.getContractFactory("mt_note");
  const mt_note = await mt_noteFactory.deploy();

  await mt_note.waitForDeployment();

  const address = await mt_note.getAddress();
  console.log(`✅ mt_note deployed to: ${address}`);
  console.log(`👉 SAVE THIS ADDRESS! You need it for the Chrome Extension.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});