# 📘 KnurFi: The Context Layer for On-Chain Finance

**KnurFi** is a multi-chain treasury dashboard that lets teams attach encrypted, permanent notes to on-chain transactions.

![Dashboard Screenshot](docs/dashboard.png)

## 🚀 The Problem
Blockchain transactions are cryptic. Months after a transaction, users forget why they sent 500 MNT to `0x7a...9b`. Existing solutions are centralized (data loss risk) or public (privacy risk).

## 💡 The Solution
KnurFi injects a "Context Layer" directly into the block explorer and dashboard workflows.
* **Write:** Add notes to any tx on MantleScan.
* **Encrypt:** Notes are AES-encrypted with your wallet signature (Client-Side).
* **Store:** Encrypted data is stored on-chain (Mantle Sepolia).
* **Manage:** A dedicated Dashboard to view, search, and export your treasury history.

## 🛠️ Tech Stack
* **Frontend:** HTML/JS, Chrome Extension Manifest V3
* **Blockchain:** Mantle Sepolia Testnet
* **Smart Contract:** Solidity (Ownable, Monetizable)
* **Libraries:** Ethers.js, Crypto-JS

## 💰 Business Model
1.  **Micro-Fees:** Protocol charges a small fee (e.g., 0.05 MNT) per note (Currently 0 for Hackathon).
2.  **Freemium Dashboard:** Advanced analytics and CSV export for "Pro" users.

## ⚙️ How to Run Locally

### 1. The Smart Contract
```bash
cd contracts-backend
npm install
npx hardhat run scripts/deploy.js --network mantle-sepolia
```

### 2. The Extension
Open Chrome and go to `chrome://extensions`.

Enable "Developer Mode" (top right).

Click "Load Unpacked" and select the `extension` folder.

Go to `Mantle Sepolia Explorer`.

### 3. The Dashboard
Open `docs/dashboard.html` in your browser (via Live Server) or visit the live link below.

🔗 Links
Live Demo: https://zh0403.github.io/KnurFi/dashboard.html

Demo Video: 

Contract: 0xb04D5E5234D5556b5B46600414763ff3829199fd