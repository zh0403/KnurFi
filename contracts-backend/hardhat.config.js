require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const sepoliaKey = process.env.PRIVATE_KEY;
const arcKey = process.env.PRIVATE_KEY_ARC;

module.exports = {
  solidity: "0.8.28", // Matches your compiler version
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org",
      accounts: sepoliaKey ? [sepoliaKey] : [], // Loads from .env
      chainId: 11155111
    },
    arcTestnet: {
      url: process.env.ARC_TESTNET_RPC_URL || "https://rpc.testnet.arc.network",
      accounts: arcKey ? [arcKey] : [], // Loads from .env
      chainId: 5042002
    }
  }
};