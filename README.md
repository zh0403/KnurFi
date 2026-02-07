# 📘 KnurFi: The Context Layer for On-Chain Finance

**KnurFi** is a multi-chain treasury dashboard that lets teams attach encrypted, permanent notes to on-chain transactions and payouts.

![Dashboard Screenshot](docs/dashboard.png)

## 🚀 The Problem
Blockchain transactions are cryptic. Months after a transaction, users forget why they sent 0.05 ETH to `0x7a...9b`. Existing solutions are centralized (data loss risk) or public (privacy risk).

## 💡 The Solution
KnurFi injects a "Context Layer" directly into the block explorer and dashboard workflows.
* **Write:** Add notes to any tx on Sepolia Etherscan (extension).
* **Encrypt:** Notes are AES-encrypted with your wallet signature (client-side).
* **Store:** Encrypted data is stored on-chain (Ethereum Sepolia).
* **Manage:** Dashboard tabs for ledger, batch payouts, ENS metadata, and bridge notes.

## ✨ Key Features
* **Profile + ENS (Sepolia):** Resolve ENS, read/write `com.knurfi.metadata`.
* **Ledger (Sepolia):** Encrypted note history with CSV export.
* **Payouts (Arc Testnet):** Batch USDC payouts with memo hash logging.
* **Bridge (LI.FI):** Embedded widget + cross-chain memo capture.
* **Chrome Extension:** Write notes directly on Sepolia tx pages.

## 🛠️ Tech Stack
* **Frontend:** HTML/JS, Tailwind (CDN), Chrome Extension Manifest V3
* **Blockchain:** Ethereum Sepolia (ledger + ENS), Arc Testnet (payouts)
* **Smart Contracts:** Solidity (Hardhat)
* **Libraries:** Ethers.js, Crypto-JS

## ⚙️ How to Run Locally

### 1. The Smart Contracts
```bash
cd contracts-backend
npm install
npx hardhat run scripts/deploy.js --network sepolia
```

Optional: deploy Arc batch payouts
```bash
npx hardhat run scripts/deploy_arc_batch.js --network arcTestnet
```

### 2. The Extension
Open Chrome and go to `chrome://extensions`.

Enable "Developer Mode" (top right).

Click "Load Unpacked" and select the `extension` folder.

Supported explorers:
* Sepolia Etherscan: `https://sepolia.etherscan.io/tx/*`
* ArcScan: `https://testnet.arcscan.app/tx/*` (notes disabled, read-only)

### 3. The Dashboard
Open `docs/dashboard.html` in your browser (via Live Server) or visit the live link below.

## ✅ Smoke Tests
```bash
node tests/smoke.test.js
```

🔗 Links
Live Demo: https://zh0403.github.io/KnurFi/dashboard.html

Demo Video:

Sepolia Contract: 0x3489864DC6ea7440FA54472662A50Bb26BBDD13F