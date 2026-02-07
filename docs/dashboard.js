// dashboard.js

const FALLBACK_CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0xb04D5E5234D5556b5B46600414763ff3829199fd";
let provider, signer, contract;
let allEvents = []; // Store raw events here
let isConnected = false;
let isUnlocked = false;
let currentDecryptKey = null;
let currentAddress = null;
let activeChainKey = "sepolia";

// Wire up buttons
const connectButton = document.getElementById('connect-btn');
const unlockButton = document.getElementById('unlock-btn');
const navItems = document.querySelectorAll('.nav-item[data-tab]');
const explorerLink = document.getElementById('nav-explorer');
const chainSelect = document.getElementById('chain-select');
const tabProfile = document.getElementById('tab-profile');
const tabOverview = document.getElementById('tab-overview');
const tabPayouts = document.getElementById('tab-payouts');
const tabBridge = document.getElementById('tab-bridge');
const tabSettings = document.getElementById('tab-settings');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const downloadCsvButton = document.getElementById('download-csv-btn');
const overviewEmptyCard = document.getElementById('overview-empty-card');
const overviewEmptyText = document.getElementById('overview-empty-text');
const payoutsFileInput = document.getElementById('payouts-file');
const payoutsUploadButton = document.getElementById('payouts-upload-btn');
const payoutsTemplateButton = document.getElementById('payouts-template-btn');
const payoutsClearButton = document.getElementById('payouts-clear-btn');
const payoutsFileName = document.getElementById('payouts-file-name');
const payoutsPreview = document.getElementById('payouts-preview');
const payoutsSummary = document.getElementById('payouts-summary');
const payoutsMemo = document.getElementById('payouts-memo');
const payoutsSubmitButton = document.getElementById('payouts-submit-btn');
const payoutsApproveButton = document.getElementById('payouts-approve-btn');
const payoutsStatus = document.getElementById('payouts-status');

let payoutRecipients = [];
let payoutAmounts = [];
let payoutTotal = null;

connectButton.onclick = initDashboard;
if (unlockButton) {
    unlockButton.style.display = 'none';
    unlockButton.onclick = unlockNotes;
}

if (navItems && tabProfile && tabSettings) {
    navItems.forEach(item => {
        item.onclick = () => switchTab(item.dataset.tab);
    });
}

if (downloadCsvButton) {
    downloadCsvButton.onclick = downloadLedgerAsCsv;
}

if (explorerLink) {
    explorerLink.onclick = (event) => {
        event.preventDefault();
        openExplorer();
    };
}

if (chainSelect) {
    chainSelect.onchange = () => {
        setActiveChain(chainSelect.value);
    };
}

initializeChains();
initializePayouts();

function getChains() {
    return window.KNURFI_CHAINS || {};
}

function initializeChains() {
    const chains = getChains();
    const stored = localStorage.getItem("knurfiActiveChain");
    if (stored && chains[stored]) {
        activeChainKey = stored;
    }

    if (chainSelect) {
        chainSelect.innerHTML = "";
        const entries = Object.entries(chains).filter(([, chain]) => chain.ledgerEnabled !== false);
        if (entries.length <= 1) {
            chainSelect.style.display = "none";
        } else {
            chainSelect.style.display = "";
        }
        entries.forEach(([key, chain]) => {
            const option = document.createElement("option");
            option.value = key;
            option.textContent = chain.name;
            if (key === activeChainKey) option.selected = true;
            chainSelect.appendChild(option);
        });
    }

    updateExplorerLabel();
}

function setActiveChain(key) {
    const chains = getChains();
    if (!chains[key]) return;
    activeChainKey = key;
    localStorage.setItem("knurfiActiveChain", key);
    updateExplorerLabel();

    if (isConnected) {
        disconnectWallet();
        initDashboard();
    }
}

function getActiveChain() {
    const chains = getChains();
    return chains[activeChainKey] || chains.sepolia;
}

function getArcChain() {
    const chains = getChains();
    return chains.arcTestnet;
}

function getActiveContractAddress() {
    const chain = getActiveChain();
    if (chain && chain.contractAddress) return chain.contractAddress;
    if (activeChainKey === "sepolia") return FALLBACK_CONTRACT_ADDRESS;
    return null;
}

function getExplorerBase() {
    const chain = getActiveChain();
    return chain && chain.explorer ? chain.explorer : "https://sepolia.etherscan.io";
}

function updateExplorerLabel() {
    if (!explorerLink) return;
    explorerLink.textContent = "🔗 Explorer";
}

async function ensureWalletChain() {
    const chain = getActiveChain();
    if (!chain || !chain.chainId) return;

    const hexChainId = "0x" + chain.chainId.toString(16);
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }]
        });
    } catch (e) {
        if (e && e.code === 4902 && chain.rpcUrl && chain.nativeCurrency) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: hexChainId,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: [chain.rpcUrl],
                    blockExplorerUrls: chain.explorer ? [chain.explorer] : []
                }]
            });
        } else {
            throw e;
        }
    }
}

async function ensureArcWalletChain() {
    const chain = getArcChain();
    if (!chain || !chain.chainId) return;

    const hexChainId = "0x" + chain.chainId.toString(16);
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }]
        });
    } catch (e) {
        if (e && e.code === 4902 && chain.rpcUrl && chain.nativeCurrency) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: hexChainId,
                    chainName: chain.name,
                    nativeCurrency: chain.nativeCurrency,
                    rpcUrls: [chain.rpcUrl],
                    blockExplorerUrls: chain.explorer ? [chain.explorer] : []
                }]
            });
        } else {
            throw e;
        }
    }
}

function openExplorer() {
    const base = getExplorerBase();
    if (!currentAddress) {
        window.open(base, "_blank");
        return;
    }
    window.open(`${base}/address/${currentAddress}`, "_blank");
}

function initializePayouts() {
    if (payoutsUploadButton && payoutsFileInput) {
        payoutsUploadButton.onclick = () => payoutsFileInput.click();
        payoutsFileInput.onchange = handlePayoutFile;
    }

    if (payoutsClearButton) {
        payoutsClearButton.onclick = clearPayouts;
    }

    if (payoutsTemplateButton) {
        payoutsTemplateButton.onclick = downloadPayoutTemplate;
    }

    if (payoutsSubmitButton) {
        payoutsSubmitButton.onclick = submitPayoutBatch;
    }

    if (payoutsApproveButton) {
        payoutsApproveButton.onclick = approveUsdcForPayouts;
    }
}

// --- Polling Helper to wait for MetaMask ---
async function waitForEthereum() {
    if (window.ethereum) return window.ethereum;
    
    console.log("Waiting for MetaMask to inject...");
    // Check every 100ms for up to 3 seconds
    for (let i = 0; i < 30; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (window.ethereum) return window.ethereum;
    }
    return null;
}

async function initDashboard() {
    // 1. Wait for MetaMask
    const eth = await waitForEthereum();
    if (!eth) return showMetaMaskError();

    // 2. Setup Provider
    provider = new ethers.BrowserProvider(window.ethereum);
    
    try {
        await ensureWalletChain();
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        currentAddress = await signer.getAddress();

        const address = currentAddress;
        const shortAddr = address.slice(0, 6) + "..." + address.slice(-4);
        connectButton.innerText = `${shortAddr} [Disconnect]`;
        connectButton.disabled = false;
        connectButton.onclick = disconnectWallet;

        const contractAddress = getActiveContractAddress();
        if (!contractAddress) {
            isConnected = true;
            isUnlocked = false;
            setLedgerEmptyState("Connected. No contract deployed on this network yet.");
            setOverviewEmptyState("Connect complete. A contract will be deployed on this network soon.");
            updateStatus("No contract configured for this network yet.");
            if (unlockButton) {
                unlockButton.style.display = 'none';
            }
            return;
        }

        contract = new ethers.Contract(contractAddress, window.MT_NOTE_ABI, signer);
        
        console.log("Querying Contract:", contractAddress, "For User:", address);

        // Owner check for Admin Zone
        let isOwner = false;
        try {
            const owner = await contract.owner();
            isOwner = owner && owner.toLowerCase() === address.toLowerCase();
        } catch (e) {
            console.warn("Failed to fetch owner()", e);
        }

        // Get the current block number first
        const currentBlock = await provider.getBlockNumber();
        
        // We only scan the last 5,000 blocks to stay under the 10k limit
        // (This covers about ~2 hours of history, perfect for a demo)
        const startBlock = currentBlock - 5000; 

        console.log(`Scanning from block ${startBlock} to ${currentBlock}`);

        const filter = contract.filters.NoteLog(address);
        
        // Pass 'startBlock' instead of 0
        const events = await contract.queryFilter(filter, startBlock, "latest");
        allEvents = events.reverse(); 

        // 3. Update UI statistics based on fetched events
        document.getElementById('stat-count').innerText = events.length;
        
        if (events.length > 0) {
            // Get the block number of the most recent event (first in array since we reversed it)
            const lastBlock = allEvents[0].blockNumber;
            document.getElementById('stat-last').innerText = "Block " + lastBlock;
        } else {
            document.getElementById('stat-last').innerText = "None";
        }

        // 4. Finally, render the table
        renderTable(allEvents, null); // Render LOCKED initially
        setOverviewEmptyState("");

        // 5. Update buttons and status
        if (unlockButton) {
            unlockButton.style.display = 'inline-flex';
            unlockButton.disabled = false;
            unlockButton.innerText = "Unlock Notes";
            unlockButton.onclick = unlockNotes;
        }

        // If owner, show and populate Admin Zone in Settings
        if (isOwner) {
            setupAdminZone();
        }

        isConnected = true;
        isUnlocked = false;
        
        updateStatus(`Found ${events.length} notes in the last 5,000 blocks.`);

    } catch (err) {
        console.error(err);
        updateStatus("Connection Error: " + (err.reason || err.message));
    }
}

async function unlockNotes() {
    try {
        updateStatus("✍️ Please sign the message to generate your decryption key...");
        
        // 1. Get Key
        const msg = "UNLOCK_KNURFI";
        const signature = await signer.signMessage(msg);

        // Debugging: Print the key to console to verify
        console.log("Generated Key:", signature);
        
        currentDecryptKey = signature;

        // 2. Re-render Table with Key
        updateStatus("🔓 Decrypting...");
        renderTable(allEvents, signature); // Pass the key this time
        
        // 3. Update UI - keep the button visible but mark as unlocked
        if (unlockButton) {
            unlockButton.innerText = "✨ Ledger Unlocked";
            unlockButton.disabled = true;
            unlockButton.onclick = null;
        }
        isUnlocked = true;
        updateStatus("✨ Ledger Unlocked. All data visible.");
        
    } catch (err) {
        alert("Unlock failed: " + err.message);
    }
}

function renderTable(events, key) {
    const tbody = document.getElementById('ledger-body');
    tbody.innerHTML = ""; // Clear current rows

    if (events.length === 0) {
        setLedgerEmptyState("No notes found for this wallet.");
        return;
    }

    events.forEach(event => {
        const txHash = event.args.txHash;
        const rawNote = event.args.ipfsCid; // In our 'Lite' version this is the text/cipher
        const blockTime = event.args.timestamp; // We added this to the contract? 
        // Wait, did we add timestamp to the event in Step 2? 
        // If your contract version doesn't have timestamp in the event, we can't show Date easily without fetching block.
        // For Hackathon speed, let's just show "Block " + event.blockNumber if timestamp is missing.
        
        let displayDate = "Block " + event.blockNumber;
        
        let displayNote = "";
        let isEncrypted = rawNote.startsWith("enc:");

        if (isEncrypted) {
            if (key) {
                // Try to decrypt
                const cipher = rawNote.replace("enc:", "");
                const plain = decrypt(cipher, key);
                displayNote = plain ? plain : "⚠️ Decryption Failed";
            } else {
                displayNote = "🔒 <i>Encrypted Content</i>";
            }
        } else {
            // Legacy/Plain text
            displayNote = rawNote.replace("text:", "");
        }

        // Format Tx Hash link
        const shortHash = txHash.slice(0, 6) + "..." + txHash.slice(-4);
        const link = `${getExplorerBase()}/tx/${txHash}`;

        const row = `
            <tr>
                <td style="color:#666;">${displayDate}</td>
                <td><a href="${link}" target="_blank">${shortHash}</a></td>
                <td style="color: ${key || !isEncrypted ? '#fff' : '#666'}">${displayNote}</td>
                <td>
                    <button style="background:none; border:none; color:#666; cursor:pointer;">✏️</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function decrypt(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) { return null; }
}

function updateStatus(msg) {
    const el = document.getElementById('status-bar');
    el.style.display = 'block';
    el.innerText = msg;
}

function setLedgerEmptyState(message) {
    const tbody = document.getElementById('ledger-body');
    if (!tbody) return;
    tbody.innerHTML = `
        <tr>
            <td colspan="4" style="text-align:center; padding: 40px; color: #555;">
                ${message}
            </td>
        </tr>
    `;
}

function setOverviewEmptyState(message) {
    if (!overviewEmptyCard || !overviewEmptyText) return;
    if (!message) {
        overviewEmptyCard.style.display = "none";
        return;
    }
    overviewEmptyText.textContent = message;
    overviewEmptyCard.style.display = "";
}

function setPayoutStatus(message, isError) {
    if (!payoutsStatus) return;
    payoutsStatus.textContent = message || "";
    payoutsStatus.style.color = isError ? "#f87171" : "#94a3b8";
}

function handlePayoutFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    if (payoutsFileName) payoutsFileName.textContent = file.name;

    const reader = new FileReader();
    reader.onload = () => {
        const text = String(reader.result || "");
        try {
            const parsed = parseCsvRecipients(text);
            payoutRecipients = parsed.recipients;
            payoutAmounts = parsed.amounts;
            payoutTotal = parsed.total;
            renderPayoutPreview();
            setPayoutStatus("CSV loaded. Review recipients before submitting.");
        } catch (e) {
            clearPayouts();
            setPayoutStatus(e.message || "Failed to parse CSV.", true);
        }
    };
    reader.readAsText(file);
}

function clearPayouts() {
    payoutRecipients = [];
    payoutAmounts = [];
    payoutTotal = null;
    if (payoutsFileInput) payoutsFileInput.value = "";
    if (payoutsFileName) payoutsFileName.textContent = "No file selected.";
    if (payoutsPreview) payoutsPreview.textContent = "No file loaded yet.";
    if (payoutsSummary) payoutsSummary.textContent = "";
    setPayoutStatus("");
}

function downloadPayoutTemplate() {
    const header = "address,amount\n";
    const rows = [
        "0x1111111111111111111111111111111111111111,1.25",
        "0x2222222222222222222222222222222222222222,0.5",
        "0x3333333333333333333333333333333333333333,10"
    ];
    const csvContent = header + rows.join("\n") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knurfi_payouts_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderPayoutPreview() {
    if (!payoutsPreview || !payoutsSummary) return;
    if (payoutRecipients.length === 0) {
        payoutsPreview.textContent = "No file loaded yet.";
        payoutsSummary.textContent = "";
        return;
    }

    const previewLines = payoutRecipients.slice(0, 5).map((recipient, index) => {
        const amount = payoutAmounts[index];
        return `${recipient} — ${formatUsdcAmount(amount)}`;
    });
    payoutsPreview.innerHTML = previewLines.join("<br>");
    const remaining = payoutRecipients.length - previewLines.length;
    if (remaining > 0) {
        payoutsPreview.innerHTML += `<br>+ ${remaining} more recipients`;
    }

    const totalDisplay = payoutTotal ? formatUsdcAmount(payoutTotal) : "0";
    payoutsSummary.textContent = `Total: ${totalDisplay} USDC`;
}

function parseCsvRecipients(csvText) {
    const lines = csvText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        throw new Error("CSV is empty.");
    }

    const header = lines[0].toLowerCase();
    const startIndex = header.includes("address") || header.includes("recipient") ? 1 : 0;
    const recipients = [];
    const amounts = [];

    for (let i = startIndex; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim()).filter(Boolean);
        if (parts.length < 2) continue;
        const recipient = parts[0];
        const amountStr = parts[1];
        if (!ethers.isAddress(recipient)) {
            throw new Error(`Invalid address on line ${i + 1}.`);
        }
        const amount = ethers.parseUnits(amountStr, 6);
        recipients.push(recipient);
        amounts.push(amount);
    }

    if (recipients.length === 0) {
        throw new Error("No valid recipient rows found.");
    }

    const total = amounts.reduce((acc, val) => acc + val, 0n);
    return { recipients, amounts, total };
}

function formatUsdcAmount(amount) {
    try {
        return Number(ethers.formatUnits(amount, 6)).toLocaleString(undefined, {
            maximumFractionDigits: 6
        });
    } catch (e) {
        return "0";
    }
}

function getArcBatchConfig() {
    const arc = getArcChain();
    if (!arc) return null;
    return {
        batchContractAddress: arc.batchContractAddress,
        usdcAddress: arc.usdcAddress,
        chainId: arc.chainId,
        explorer: arc.explorer
    };
}

async function approveUsdcForPayouts() {
    const config = getArcBatchConfig();
    if (!config || !config.usdcAddress) {
        setPayoutStatus("USDC address is not configured.", true);
        return;
    }
    if (!config.batchContractAddress) {
        setPayoutStatus("Batch contract is not deployed yet.", true);
        return;
    }
    const eth = await waitForEthereum();
    if (!eth) return showMetaMaskError();

    try {
        await ensureArcWalletChain();
        const arcProvider = new ethers.BrowserProvider(window.ethereum);
        await arcProvider.send("eth_requestAccounts", []);
        const arcSigner = await arcProvider.getSigner();
        const erc20 = new ethers.Contract(
            config.usdcAddress,
            [
                "function approve(address spender, uint256 amount) public returns (bool)"
            ],
            arcSigner
        );
        setPayoutStatus("Confirm USDC approval in your wallet...");
        const tx = await erc20.approve(config.batchContractAddress, ethers.MaxUint256);
        setPayoutStatus(`Approval submitted: ${tx.hash}`);
        await tx.wait();
        setPayoutStatus("USDC approval confirmed.");
    } catch (e) {
        setPayoutStatus(e.message || "USDC approval failed.", true);
    }
}

async function submitPayoutBatch() {
    const config = getArcBatchConfig();
    if (!config || !config.usdcAddress) {
        setPayoutStatus("USDC address is not configured.", true);
        return;
    }
    if (!config.batchContractAddress) {
        setPayoutStatus("Batch contract is not deployed yet.", true);
        return;
    }
    if (!payoutRecipients.length || !payoutAmounts.length) {
        setPayoutStatus("Upload a CSV with recipients and amounts first.", true);
        return;
    }
    if (!payoutsMemo || !payoutsMemo.value.trim()) {
        setPayoutStatus("Add a compliance memo before submitting.", true);
        return;
    }

    const eth = await waitForEthereum();
    if (!eth) return showMetaMaskError();

    try {
        await ensureArcWalletChain();
        const arcProvider = new ethers.BrowserProvider(window.ethereum);
        await arcProvider.send("eth_requestAccounts", []);
        const arcSigner = await arcProvider.getSigner();
        const batch = new ethers.Contract(
            config.batchContractAddress,
            window.ARC_BATCH_ABI || [],
            arcSigner
        );

        const memoHash = ethers.keccak256(ethers.toUtf8Bytes(payoutsMemo.value.trim()));
        setPayoutStatus("Submitting batch payout... confirm in wallet.");
        const tx = await batch.batchPayout(payoutRecipients, payoutAmounts, memoHash);
        setPayoutStatus(`Batch submitted: ${tx.hash}`);
        await tx.wait();
        setPayoutStatus("Batch payout confirmed.");
    } catch (e) {
        setPayoutStatus(e.shortMessage || e.message || "Batch payout failed.", true);
    }
}

function switchTab(tab) {
    const tabs = {
        profile: tabProfile,
        overview: tabOverview,
        payouts: tabPayouts,
        bridge: tabBridge,
        settings: tabSettings
    };

    const titles = {
        profile: {
            title: "Profile",
            subtitle: "Your ENS identity and compliance metadata."
        },
        overview: {
            title: "Overview",
            subtitle: "Context layer for on-chain finance."
        },
        payouts: {
            title: "Payouts",
            subtitle: "Batch compliance notes for Arc USDC payouts."
        },
        bridge: {
            title: "Bridge",
            subtitle: "Attach cross-chain memos to every transfer."
        },
        settings: {
            title: "Settings",
            subtitle: "Preferences and UI customization."
        }
    };

    Object.entries(tabs).forEach(([key, el]) => {
        if (el) el.style.display = key === tab ? "" : "none";
    });

    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.tab === tab);
    });

    if (pageTitle && pageSubtitle && titles[tab]) {
        pageTitle.innerText = titles[tab].title;
        pageSubtitle.innerText = titles[tab].subtitle;
    }
}

function downloadLedgerAsCsv() {
    if (!allEvents || allEvents.length === 0) {
        alert("No ledger data loaded yet. Connect your wallet first.");
        return;
    }

    const rows = [["Date", "TxHash", "Note"]];

    allEvents.forEach(ev => {
        const txHash = ev.args.txHash;
        const rawNote = ev.args.ipfsCid;
        const ts = ev.args.timestamp;

        let dateStr = "";
        if (ts) {
            // timestamp is uint256 seconds
            const d = new Date(Number(ts) * 1000);
            dateStr = d.toISOString();
        } else {
            dateStr = "Block " + ev.blockNumber;
        }

        let noteText = "";
        if (rawNote && rawNote.startsWith("enc:")) {
            if (currentDecryptKey) {
                const plain = decrypt(rawNote.replace("enc:", ""), currentDecryptKey);
                noteText = plain || "DECRYPT_FAILED";
            } else {
                noteText = "Encrypted (locked)";
            }
        } else if (rawNote) {
            noteText = rawNote.replace("text:", "");
        }

        const shortHash = txHash;

        rows.push([dateStr, shortHash, noteText]);
    });

    const csvContent = rows
        .map(cols =>
            cols
                .map(v => {
                    const s = String(v ?? "");
                    const escaped = s.replace(/"/g, '""');
                    return `"${escaped}"`;
                })
                .join(",")
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "knurfi_ledger.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function setupAdminZone() {
    const adminZone = document.getElementById('admin-zone');
    if (!adminZone) return;

    adminZone.style.display = 'block';
    adminZone.innerHTML = `
        <h4>Admin Zone</h4>
        <p style="color:#facc15; font-size:13px; margin-top:4px;">
            Super user controls &amp; contract revenue.
        </p>
        <div style="margin-top:10px; display:flex; flex-direction:column; gap:12px;">
            <div>
                <div style="font-size:12px; color:var(--text-muted);">Contract Balance (ETH)</div>
                <div id="admin-balance" style="font-size:18px; margin-top:4px;">Loading...</div>
            </div>
            <div>
                <label for="admin-fee-input" style="font-size:12px; color:var(--text-muted); display:block; margin-bottom:4px;">
                    Update Fee (ETH)
                </label>
                <div style="display:flex; gap:8px; align-items:center;">
                    <input id="admin-fee-input" type="number" min="0" step="0.0001"
                        style="flex:1; padding:8px 10px; border-radius:8px; border:1px solid var(--border); background:#111827; color:#e5e7eb;"/>
                    <button id="admin-fee-btn" class="btn">Update Fee</button>
                </div>
            </div>
            <div>
                <button id="admin-withdraw-btn" class="btn btn-outline" style="width:100%;">Withdraw Revenue</button>
            </div>
        </div>
    `;

    // Fetch and display balance
    const contractAddress = getActiveContractAddress();
    if (provider && contractAddress) {
        provider.getBalance(contractAddress).then(bn => {
            const mnt = Number(ethers.formatEther(bn));
            const el = document.getElementById('admin-balance');
            if (el) el.innerText = mnt.toFixed(4) + " ETH";
        }).catch(err => console.warn("Failed to load balance", err));
    }

    const feeInput = document.getElementById('admin-fee-input');
    const feeBtn = document.getElementById('admin-fee-btn');
    const withdrawBtn = document.getElementById('admin-withdraw-btn');

    if (feeBtn && feeInput) {
        feeBtn.onclick = async () => {
            if (!contract || !signer) {
                alert("Wallet not connected.");
                return;
            }
            const val = feeInput.value;
            if (!val) {
                alert("Enter a fee amount in ETH.");
                return;
            }
            try {
                const wei = ethers.parseEther(val.toString());
                const tx = await contract.setFee(wei);
                updateStatus("Updating fee... " + tx.hash);
                await tx.wait();
                updateStatus("Fee updated successfully.");
            } catch (e) {
                console.error(e);
                alert("Failed to update fee: " + (e.reason || e.message));
            }
        };
    }

    if (withdrawBtn) {
        withdrawBtn.onclick = async () => {
            if (!contract || !signer) {
                alert("Wallet not connected.");
                return;
            }
            try {
                const tx = await contract.withdraw();
                updateStatus("Withdrawing revenue... " + tx.hash);
                await tx.wait();
                updateStatus("Withdrawal complete.");
            } catch (e) {
                console.error(e);
                alert("Failed to withdraw: " + (e.reason || e.message));
            }
        };
    }
}

function disconnectWallet() {
    // Reset connection state
    provider = undefined;
    signer = undefined;
    contract = undefined;
    allEvents = [];
    isConnected = false;
    isUnlocked = false;
    currentAddress = null;

    // Reset stats
    document.getElementById('stat-count').innerText = "-";
    document.getElementById('stat-last').innerText = "-";

    // Reset table body to initial message
    setLedgerEmptyState("Please connect your wallet to view history.");
    setOverviewEmptyState("Connect your wallet to load your ledger.");

    // Hide status bar
    const statusBar = document.getElementById('status-bar');
    statusBar.style.display = 'none';
    statusBar.innerText = "";

    // Reset buttons
    connectButton.innerText = "Connect Wallet";
    connectButton.disabled = false;
    connectButton.onclick = initDashboard;

    if (unlockButton) {
        unlockButton.style.display = 'none';
        unlockButton.disabled = false;
        unlockButton.innerText = "Unlock Notes";
        unlockButton.onclick = unlockNotes;
    }
}