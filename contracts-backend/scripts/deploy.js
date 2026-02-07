const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying KnurFi to Ethereum Sepolia...");

  const knurfiFactory = await hre.ethers.getContractFactory("KnurFi");
  const knurfi = await knurfiFactory.deploy();

  await knurfi.waitForDeployment();

  const address = await knurfi.getAddress();
  console.log(`✅ KnurFi deployed to: ${address}`);
  console.log(`👉 SAVE THIS ADDRESS! You need it for the Chrome Extension.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});