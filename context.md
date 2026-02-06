# KnurFi (Know Your Finance) - Project Context

## 1. Project Overview
**KnurFi** is a multi-chain Treasury Dashboard designed to add a compliance and context layer to on-chain finance. It allows treasury managers to attach encrypted notes, invoices, and reason codes to transactions across different blockchains and protocols.

**Tagline:** The Context Layer for On-Chain Finance.
**Hackathon:** ETHGlobal HackMoney 2026.

## 2. Core Value Proposition
DeFi transactions are currently raw data points lacking context. KnurFi solves the "Why did we do this transaction?" problem for DAOs and corporate treasuries by creating a unified interface for managing transaction metadata, identity, and cross-chain flows.

## 3. Hackathon Strategy (The Quadruple Target)
We are engineering one cohesive product to compete for four specific prize tracks.

### 🎯 Track 1: Arc L1 (Circle)
* **Goal:** Build a "Global Payouts System" using USDC on Arc.
* **Implementation:** Deploy our core logging smart contract to Arc Testnet. Create a dashboard section for batch-paying recipients in USDC on Arc, attaching a single compliance note to the entire batch.

### 🎯 Track 2: ENS (Ethereum Name Service)
* **Goal:** Creative use of ENS for DeFi identity/metadata.
* **Implementation:** Use ENS Text Records as a storage mechanism for "Pinned Notes" or "Account Metadata" (e.g., Tax Residency Hash). The dashboard should read/write to these records, making the ENS profile a portable compliance passport.

### 🎯 Track 3: LI.FI (Cross-Chain)
* **Goal:** Best use of LI.FI for cross-chain DeFi workflows.
* **Implementation:** Embed the LI.FI widget into the dashboard for bridging/swapping. Intercept the transaction flow to attach a "Cross-Chain Memo" that links the source chain transaction and destination chain transaction in our local database/indexed view.

### 🎯 Track 4: Uniswap v4 (Privacy/Hooks)
* **Goal:** Build a Hook that enforces data attachment for compliance.
* **Implementation (Stretch Goal):** Develop a simple Uniswap v4 Hook that requires transaction metadata (an encrypted note hash) to be passed during a swap; otherwise, the transaction reverts.

## 4. Architecture & Tech Stack

**Focus:** The Dashboard Website is the primary product. The Chrome Extension is secondary.

* **Frontend (Dashboard):** Vanilla JS / HTML / CSS (Migrating to Tailwind CSS for UI polish).
* **Web3 Libraries:** `ethers.js` (v6) for blockchain interaction, `ensjs` for ENS features.
* **Smart Contracts:** Solidity (Hardhat framework). We will reuse and modify the existing logging contract structure for multi-chain deployment.
* **Storage:**
    * *On-Chain:* Encrypted note hashes stored in smart contracts on respective chains (Arc, Sepolia).
    * *ENS:* Critical metadata stored in ENS Text Records.
    * *Local:* User's browser storage for encrypted data cache.
* **Security:** Client-side AES encryption (using wallet signature as key) via `crypto-js`.

## 5. Development Roadmap & Phases

### Phase 1: Rebranding & UI Foundation
1.  Rename all mentions of "MT Note" to "KnurFi".
2.  Design new branding (Logo, color palette - professional blue/gold).
3.  Integrate Tailwind CSS into the dashboard for rapid, professional UI development.
4.  Restructure the dashboard layout to support tabs/sidebar navigation for different features (Overview, Payouts, Bridge).

### Phase 2: Multi-Chain Infrastructure
1.  Refactor the codebase to support dynamic provider switching. The user needs to be able to switch between Ethereum Mainnet (for ENS/LI.FI) and Arc Testnet within the dashboard.
2.  Create a configuration file mapping Chain IDs to their respective RPC URLs and KnurFi contract addresses.

### Phase 3: The Arc Payouts Tab
1.  Deploy the core logging contract to Arc Testnet.
2.  Build the UI for the "Payouts" tab: Upload CSV -> input note -> Encrypt -> send batch transaction to Arc contract.

### Phase 4: ENS Identity Integration
1.  In the "Overview" tab, resolve the connected wallet's ENS name.
2.  Implement functions to read and display specific ENS text records (e.g., `com.knurfi.metadata`).
3.  Implement a UI flow to write a hash to an ENS text record.

### Phase 5: LI.FI Cross-Chain Integration
1.  Integrate the LI.FI pre-built widget into a "Bridge" tab.
2.  Add a UI input for a "Cross-Chain Note" next to the widget.
3.  Develop logic to capture tx hashes from the bridging process and associate them with the note internally.

### Phase 6: Polish & Extension Update
1.  Ensure the entire dashboard flow is smooth and professional.
2.  Update the existing Chrome Extension to reflect the new branding and point to the new multi-chain contracts where applicable.