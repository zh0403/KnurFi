const hre = require("hardhat");

async function main() {
  const usdcAddress = process.env.ARC_USDC_ADDRESS || "0x3600000000000000000000000000000000000000";
  console.log("🚀 Deploying ArcBatchPayout to Arc Testnet...");
  console.log("USDC:", usdcAddress);

  const factory = await hre.ethers.getContractFactory("ArcBatchPayout");
  const batch = await factory.deploy(usdcAddress);

  await batch.waitForDeployment();

  const address = await batch.getAddress();
  console.log(`✅ ArcBatchPayout deployed to: ${address}`);
  console.log("👉 Save this address for chain-config.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
