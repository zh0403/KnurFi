// dashboard.js

const FALLBACK_CONTRACT_ADDRESS = window.KNURFI_ADDRESS || "0x3489864DC6ea7440FA54472662A50Bb26BBDD13F";
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
const payoutsRefreshAllowanceButton = document.getElementById('payouts-refresh-allowance-btn');
const payoutsStatus = document.getElementById('payouts-status');
const payoutsTxLink = document.getElementById('payouts-tx-link');
const payoutsConfig = document.getElementById('payouts-config');
const payoutsRequired = document.getElementById('payouts-required');
const payoutsAllowance = document.getElementById('payouts-allowance');
const payoutsPreviewAllButton = document.getElementById('payouts-preview-all-btn');
const payoutsModal = document.getElementById('payouts-modal');
const payoutsModalBody = document.getElementById('payouts-modal-body');
const payoutsModalClose = document.getElementById('payouts-modal-close');
const payoutsBatchesList = document.getElementById('payouts-batches-list');
const payoutsBatchesRefresh = document.getElementById('payouts-batches-refresh');
const payoutsBatchesToggle = document.getElementById('payouts-batches-toggle');

const bridgeWidgetFrame = document.getElementById('bridge-widget-frame');
const bridgeWidgetLink = document.getElementById('bridge-widget-link');
const bridgeMemo = document.getElementById('bridge-memo');
const bridgeSourceTx = document.getElementById('bridge-source-tx');
const bridgeDestTx = document.getElementById('bridge-dest-tx');
const bridgeSaveButton = document.getElementById('bridge-save-btn');
const bridgeClearButton = document.getElementById('bridge-clear-btn');
const bridgeStatus = document.getElementById('bridge-status');
const bridgeActivity = document.getElementById('bridge-activity');

const ensNameEl = document.getElementById('ens-name');
const ensNameInput = document.getElementById('ens-name-input');
const ensRecordValueEl = document.getElementById('ens-record-value');
const ensRecordInput = document.getElementById('ens-record-input');
const ensSaltInput = document.getElementById('ens-salt-input');
const ensResolveButton = document.getElementById('ens-resolve-btn');
const ensReadButton = document.getElementById('ens-read-btn');
const ensWriteButton = document.getElementById('ens-write-btn');
const ensStatus = document.getElementById('ens-status');
const ensTxLink = document.getElementById('ens-tx-link');
const ensNetworkHint = document.getElementById('ens-network-hint');
const ensCopyNameButton = document.getElementById('ens-copy-name');
const ensCopyRecordButton = document.getElementById('ens-copy-record');
const ensGenerateHashButton = document.getElementById('ens-generate-hash');
const ensGenerateSaltButton = document.getElementById('ens-generate-salt');
const ensCopySaltButton = document.getElementById('ens-copy-salt');
const ensUseNameButton = document.getElementById('ens-use-name');
const ensRecordUpdated = document.getElementById('ens-record-updated');
const ensDebugAddress = document.getElementById('ens-debug-address');
const ensDebugLookup = document.getElementById('ens-debug-lookup');
const ensDebugForward = document.getElementById('ens-debug-forward');
const ensDebugStatus = document.getElementById('ens-debug-status');
const ensDebugRefresh = document.getElementById('ens-debug-refresh');

const ENS_RECORD_KEY = "com.knurfi.metadata";
const ENS_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";
const ENS_MAINNET_RPC_URL = "wss://ethereum-rpc.publicnode.com";
const ENS_REGISTRY_ADDRESS = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const ENS_RESOLVER_ABI = [
    "function setText(bytes32 node, string key, string value) external",
    "function text(bytes32 node, string key) view returns (string)"
];
let ensNameCache = null;

const BRIDGE_STORAGE_KEY = "knurfiBridgeActivity";
const LIFI_WIDGET_BASE_URL = "https://widget.li.fi/?integrator=KnurFi";

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
initializeEns();
initializeBridge();

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
        chainSelect.style.display = "";
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

function setEnsStatus(message, isError) {
    if (!ensStatus) return;
    ensStatus.textContent = message || "";
    ensStatus.style.color = isError ? "#f87171" : "#94a3b8";
    if (ensTxLink) {
        ensTxLink.style.display = "none";
        ensTxLink.href = "#";
    }
}

function updateEnsWriteState() {
    if (!ensWriteButton) return;
    const hasName = ensNameCache && ensNameCache.length > 0;
    const isSepolia = window.ethereum && window.ethereum.chainId === "0xaa36a7";
    const enabled = !!hasName;
    ensWriteButton.disabled = !enabled;
    ensWriteButton.style.opacity = enabled ? "1" : "0.6";
    if (ensNetworkHint) {
        if (hasName && !isSepolia) {
            ensNetworkHint.textContent = "Switch to Ethereum Sepolia to write ENS records.";
        } else {
            ensNetworkHint.textContent = "";
        }
    }
}

function copyEnsValue(value) {
    if (!value || value === "-" || value === "Not resolved" || value === "No ENS name found") {
        setEnsStatus("Nothing to copy yet.", true);
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(() => {
            setEnsStatus("Copied to clipboard.");
        }).catch(() => setEnsStatus("Failed to copy.", true));
    } else {
        setEnsStatus("Clipboard not available.", true);
    }
}

function generateEnsHash() {
    if (!ensRecordInput) return;
    const text = ensRecordInput.value.trim();
    const salt = ensSaltInput ? ensSaltInput.value.trim() : "";
    if (!text) {
        setEnsStatus("Enter text to hash first.", true);
        return;
    }
    if (!salt) {
        setEnsStatus("Generate or paste a salt before hashing.", true);
        return;
    }
    const hashInput = `${salt}:${text}`;
    const hash = ethers.keccak256(ethers.toUtf8Bytes(hashInput));
    ensRecordInput.value = hash;
    setEnsStatus("Salted hash generated.");
}

function generateEnsSalt() {
    if (!ensSaltInput) return;
    if (window.crypto && window.crypto.getRandomValues) {
        const bytes = new Uint8Array(16);
        window.crypto.getRandomValues(bytes);
        ensSaltInput.value = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
    } else {
        ensSaltInput.value = Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
    setEnsStatus("Salt generated.");
}

function copyEnsSalt() {
    if (!ensSaltInput) return;
    const value = ensSaltInput.value.trim();
    if (!value) {
        setEnsStatus("No salt to copy yet.", true);
        return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(value).then(() => {
            setEnsStatus("Salt copied to clipboard.");
        }).catch(() => setEnsStatus("Failed to copy salt.", true));
    } else {
        setEnsStatus("Clipboard not available.", true);
    }
}

function useManualEnsName() {
    if (!ensNameInput) return;
    const name = ensNameInput.value.trim();
    if (!name) {
        setEnsStatus("Enter an ENS name first.", true);
        return;
    }
    ensNameCache = name;
    if (ensNameEl) ensNameEl.textContent = name;
    setEnsStatus("Using manual ENS name. You can now read/write records.");
    updateEnsWriteState();
}

window.knurfiUseManualEnsName = useManualEnsName;

function validateEnsRecordValue(value) {
    if (!value) return "Enter a value to write.";
    if (value.startsWith("0x") && value.length === 66) return null;
    return "Record value should be a 32-byte hash (0x + 64 hex chars).";
}

function getEnsReadProvider() {
    return new ethers.JsonRpcProvider(ENS_RPC_URL, {
        name: "sepolia",
        chainId: 11155111,
        ensAddress: ENS_REGISTRY_ADDRESS
    });
}

function getEnsMainnetProvider() {
    return new ethers.WebSocketProvider(ENS_MAINNET_RPC_URL, {
        name: "homestead",
        chainId: 1,
        ensAddress: ENS_REGISTRY_ADDRESS
    });
}

async function ensureEnsWalletChain() {
    const hexChainId = "0xaa36a7";
    try {
        await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: hexChainId }]
        });
    } catch (e) {
        if (e && e.code === 4902) {
            await window.ethereum.request({
                method: "wallet_addEthereumChain",
                params: [{
                    chainId: hexChainId,
                    chainName: "Ethereum Sepolia",
                    nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                    rpcUrls: [ENS_RPC_URL],
                    blockExplorerUrls: ["https://sepolia.etherscan.io"]
                }]
            });
        } else {
            throw e;
        }
    }
}

async function getEnsSigner() {
    const eth = await waitForEthereum();
    if (!eth) {
        showMetaMaskError();
        return null;
    }
    await ensureEnsWalletChain();
    const ensProvider = new ethers.BrowserProvider(window.ethereum, {
        name: "sepolia",
        chainId: 11155111,
        ensAddress: ENS_REGISTRY_ADDRESS
    });
    await ensProvider.send("eth_requestAccounts", []);
    return ensProvider.getSigner();
}

async function resolveEnsName() {
    if (!currentAddress) {
        setEnsStatus("Connect your wallet first.", true);
        return;
    }
    try {
        const provider = getEnsMainnetProvider();
        const name = await provider.lookupAddress(currentAddress);
        if (!name) {
            ensNameCache = null;
            if (ensNameEl) ensNameEl.textContent = "No ENS name found";
            setEnsStatus("No ENS name found on Sepolia. Set a primary name (reverse record) in ENS Manager.");
            updateEnsWriteState();
            return;
        }
        ensNameCache = name;
        if (ensNameEl) ensNameEl.textContent = name;
        setEnsStatus("ENS name resolved.");
        updateEnsWriteState();
        updateEnsDebug();
    } catch (e) {
        setEnsStatus("Failed to resolve ENS name.", true);
    }
}

async function updateEnsDebug() {
    if (!ensDebugAddress || !ensDebugLookup || !ensDebugForward || !ensDebugStatus) return;
    if (!currentAddress) {
        ensDebugAddress.textContent = "-";
        ensDebugLookup.textContent = "-";
        ensDebugForward.textContent = "-";
        ensDebugStatus.textContent = "Connect your wallet first.";
        return;
    }
    ensDebugAddress.textContent = currentAddress;
    ensDebugStatus.textContent = "Checking mainnet reverse/forward resolution...";
    try {
        const provider = getEnsMainnetProvider();
        const name = await provider.lookupAddress(currentAddress);
        ensDebugLookup.textContent = name || "-";
        if (name) {
            const forward = await provider.resolveName(name);
            ensDebugForward.textContent = forward || "-";
            if (forward && forward.toLowerCase() === currentAddress.toLowerCase()) {
                ensDebugStatus.textContent = "Primary name is correctly configured on mainnet.";
            } else {
                ensDebugStatus.textContent = "Reverse record exists, but forward resolution does not match.";
            }
        } else {
            ensDebugForward.textContent = "-";
            ensDebugStatus.textContent = "No reverse record found on mainnet.";
        }
    } catch (e) {
        ensDebugStatus.textContent = "Failed to query mainnet ENS.";
    }
}

async function readEnsRecord() {
    if (!currentAddress) {
        setEnsStatus("Connect your wallet first.", true);
        return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:readEnsRecord:entry',message:'ENS read start',data:{hasAddress:!!currentAddress,ensNameCache:ensNameCache||null,rpc:ENS_RPC_URL},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    try {
        if (!ensNameCache) {
            await resolveEnsName();
        }
        if (!ensNameCache) return;
        const provider = getEnsReadProvider();
        const resolver = await provider.getResolver(ensNameCache);
        if (!resolver) {
            setEnsStatus("No resolver set for this ENS name.", true);
            return;
        }
        const resolverAddress = resolver.address || resolver._address;
        if (!resolverAddress) {
            setEnsStatus("Resolver address not available.", true);
            return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:readEnsRecord:resolver',message:'Resolver info',data:{ensName:ensNameCache,resolverAddress},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion agent log
        const resolverContract = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, provider);
        const node = ethers.namehash(ensNameCache);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:readEnsRecord:namehash',message:'ENS namehash computed',data:{ensName:ensNameCache,node},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion agent log
        const value = await resolverContract.text(node, ENS_RECORD_KEY);
        if (ensRecordValueEl) ensRecordValueEl.textContent = value || "-";
        setEnsStatus("Record loaded.");
        if (ensRecordUpdated) ensRecordUpdated.textContent = new Date().toLocaleString();
    } catch (e) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:readEnsRecord:error',message:'ENS read error',data:{error:(e && (e.shortMessage||e.reason||e.message))||'unknown'},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion agent log
        setEnsStatus("Failed to read ENS record.", true);
    }
}

async function writeEnsRecord() {
    if (!currentAddress) {
        setEnsStatus("Connect your wallet first.", true);
        return;
    }
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:writeEnsRecord:entry',message:'ENS write start',data:{hasAddress:!!currentAddress,ensNameCache:ensNameCache||null,chainId:window.ethereum && window.ethereum.chainId},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion agent log
    if (window.ethereum && window.ethereum.chainId !== "0xaa36a7") {
        setEnsStatus("Switching to Ethereum Sepolia...");
        try {
            await ensureEnsWalletChain();
        } catch (e) {
            setEnsStatus("Please switch to Ethereum Sepolia to write ENS.", true);
            return;
        }
    }
    if (!ensRecordInput || !ensRecordInput.value.trim()) {
        setEnsStatus("Enter a value to write.", true);
        return;
    }
    const validationError = validateEnsRecordValue(ensRecordInput.value.trim());
    if (validationError) {
        setEnsStatus(validationError, true);
        return;
    }
    try {
        if (!ensNameCache) {
            await resolveEnsName();
        }
        if (!ensNameCache) return;
        const signer = await getEnsSigner();
        if (!signer) return;
        const resolver = await signer.provider.getResolver(ensNameCache);
        if (!resolver) {
            setEnsStatus("No resolver set for this ENS name.", true);
            return;
        }
        const resolverAddress = resolver.address || resolver._address;
        if (!resolverAddress) {
            setEnsStatus("Resolver address not available.", true);
            return;
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:writeEnsRecord:resolver',message:'Resolver info',data:{ensName:ensNameCache,resolverAddress},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H2'})}).catch(()=>{});
        // #endregion agent log
        const resolverContract = new ethers.Contract(resolverAddress, ENS_RESOLVER_ABI, signer);
        const node = ethers.namehash(ensNameCache);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:writeEnsRecord:namehash',message:'ENS namehash computed',data:{ensName:ensNameCache,node,recordKey:ENS_RECORD_KEY},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H3'})}).catch(()=>{});
        // #endregion agent log
        setEnsStatus("Submitting ENS record update...");
        const tx = await resolverContract.setText(node, ENS_RECORD_KEY, ensRecordInput.value.trim());
        setEnsStatus(`ENS update submitted: ${tx.hash}`);
        await tx.wait();
        setEnsStatus("ENS record updated.");
        if (ensTxLink) {
            ensTxLink.href = `https://sepolia.etherscan.io/tx/${tx.hash}`;
            ensTxLink.style.display = "inline-flex";
        }
        if (ensRecordUpdated) ensRecordUpdated.textContent = new Date().toLocaleString();
        await readEnsRecord();
    } catch (e) {
        const raw = (e.shortMessage || e.reason || e.message || "").toLowerCase();
        let message = e.shortMessage || e.reason || e.message || "ENS update failed.";
        if (raw.includes("user rejected") || raw.includes("user denied")) {
            message = "Transaction was rejected in the wallet.";
        }
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/6cf098c8-b720-49c8-9e5a-8a0c47c861ed',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dashboard.js:writeEnsRecord:error',message:'ENS write error',data:{error:(e && (e.shortMessage||e.reason||e.message))||'unknown'},timestamp:Date.now(),runId:'ens-debug',hypothesisId:'H4'})}).catch(()=>{});
        // #endregion agent log
        setEnsStatus(message, true);
    }
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

    if (payoutsRefreshAllowanceButton) {
        payoutsRefreshAllowanceButton.onclick = () => updateApprovalState(true);
    }

    if (payoutsPreviewAllButton) {
        payoutsPreviewAllButton.onclick = openPayoutsModal;
    }

    if (payoutsModalClose) {
        payoutsModalClose.onclick = closePayoutsModal;
    }

    if (payoutsBatchesRefresh) {
        payoutsBatchesRefresh.onclick = loadRecentBatches;
    }
    if (payoutsBatchesToggle) {
        payoutsBatchesToggle.onchange = loadRecentBatches;
    }

    if (payoutsMemo) {
        payoutsMemo.oninput = updatePayoutActionsState;
    }

    updatePayoutActionsState();
    renderPayoutConfig();
    loadRecentBatches();
}

function initializeEns() {
    if (ensResolveButton) {
        ensResolveButton.onclick = resolveEnsName;
    }
    if (ensReadButton) {
        ensReadButton.onclick = readEnsRecord;
    }
    if (ensWriteButton) {
        ensWriteButton.onclick = writeEnsRecord;
    }
    if (ensCopyNameButton) {
        ensCopyNameButton.onclick = () => copyEnsValue(ensNameEl && ensNameEl.textContent);
    }
    if (ensCopyRecordButton) {
        ensCopyRecordButton.onclick = () => copyEnsValue(ensRecordValueEl && ensRecordValueEl.textContent);
    }
    if (ensGenerateHashButton) {
        ensGenerateHashButton.onclick = generateEnsHash;
    }
    if (ensGenerateSaltButton) {
        ensGenerateSaltButton.onclick = generateEnsSalt;
    }
    if (ensCopySaltButton) {
        ensCopySaltButton.onclick = copyEnsSalt;
    }
    if (ensUseNameButton) {
        ensUseNameButton.onclick = useManualEnsName;
    }
    if (ensDebugRefresh) {
        ensDebugRefresh.onclick = updateEnsDebug;
    }
    updateEnsWriteState();
    if (window.ethereum && window.ethereum.on) {
        window.ethereum.on("chainChanged", () => updateEnsWriteState());
    }
}

function initializeBridge() {
    if (bridgeSaveButton) {
        bridgeSaveButton.onclick = saveBridgeRecord;
    }
    if (bridgeClearButton) {
        bridgeClearButton.onclick = clearBridgeForm;
    }
    setBridgeWidgetUrl();
    renderBridgeActivity();
}

function setBridgeStatus(message, isError) {
    if (!bridgeStatus) return;
    bridgeStatus.textContent = message || "";
    bridgeStatus.style.color = isError ? "#f87171" : "#94a3b8";
}

function getBridgeWidgetUrl() {
    try {
        const url = new URL(LIFI_WIDGET_BASE_URL);
        url.searchParams.set("integrator", "KnurFi");
        if (currentAddress) {
            url.searchParams.set("toAddress", currentAddress);
        }
        return url.toString();
    } catch (e) {
        return LIFI_WIDGET_BASE_URL;
    }
}

function setBridgeWidgetUrl() {
    const url = getBridgeWidgetUrl();
    if (bridgeWidgetFrame) {
        bridgeWidgetFrame.src = url;
    }
    if (bridgeWidgetLink) {
        bridgeWidgetLink.href = url;
    }
}

function getBridgeActivity() {
    try {
        const stored = localStorage.getItem(BRIDGE_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function saveBridgeActivity(items) {
    localStorage.setItem(BRIDGE_STORAGE_KEY, JSON.stringify(items));
}

function clearBridgeForm() {
    if (bridgeMemo) bridgeMemo.value = "";
    if (bridgeSourceTx) bridgeSourceTx.value = "";
    if (bridgeDestTx) bridgeDestTx.value = "";
    setBridgeStatus("");
}

function normalizeTxHash(value) {
    if (!value) return "";
    return value.trim();
}

function buildBridgeTxLink(hash) {
    if (!hash) return "#";
    return `https://scan.li.fi/tx/${hash}`;
}

function saveBridgeRecord() {
    if (!bridgeMemo || !bridgeSourceTx || !bridgeDestTx) return;
    const memo = bridgeMemo.value.trim();
    const sourceTx = normalizeTxHash(bridgeSourceTx.value);
    const destTx = normalizeTxHash(bridgeDestTx.value);
    if (!memo) {
        setBridgeStatus("Add a memo before saving.", true);
        return;
    }
    if (!sourceTx && !destTx) {
        setBridgeStatus("Add at least one transaction hash.", true);
        return;
    }

    const items = getBridgeActivity();
    items.unshift({
        id: `bridge_${Date.now()}`,
        memo,
        sourceTx,
        destTx,
        address: currentAddress || null,
        createdAt: new Date().toISOString()
    });
    saveBridgeActivity(items.slice(0, 50));
    renderBridgeActivity();
    clearBridgeForm();
    setBridgeStatus("Bridge memo saved.");
}

function renderBridgeActivity() {
    if (!bridgeActivity) return;
    const items = getBridgeActivity();
    if (!items.length) {
        bridgeActivity.textContent = "No bridge activity recorded yet.";
        return;
    }
    const rows = items.map(item => {
        const when = new Date(item.createdAt).toLocaleString();
        const memo = item.memo || "-";
        const source = item.sourceTx
            ? `<a href="${buildBridgeTxLink(item.sourceTx)}" target="_blank" rel="noopener">Source Tx</a>`
            : "Source Tx -";
        const dest = item.destTx
            ? `<a href="${buildBridgeTxLink(item.destTx)}" target="_blank" rel="noopener">Dest Tx</a>`
            : "Dest Tx -";
        const owner = item.address ? `${item.address.slice(0, 6)}...${item.address.slice(-4)}` : "Wallet -";
        return `• <span>${memo}</span><br><span class="text-slate-500 text-xs">${when} • ${owner}</span><br>${source} • ${dest}`;
    });
    bridgeActivity.innerHTML = rows.join("<br><br>");
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
        await requestAccountSelection();
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        currentAddress = await signer.getAddress();

        const address = currentAddress;
        const shortAddr = address.slice(0, 6) + "..." + address.slice(-4);
        connectButton.innerText = `${shortAddr} [Disconnect]`;
        connectButton.disabled = false;
        connectButton.onclick = disconnectWallet;
        setBridgeWidgetUrl();

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

        contract = new ethers.Contract(contractAddress, window.KNURFI_ABI, signer);
        
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
        if (ensNameEl && ensNameEl.textContent === "Not resolved") {
            resolveEnsName();
        }

    } catch (err) {
        console.error(err);
        updateStatus("Connection Error: " + (err.reason || err.message));
    }
}

async function requestAccountSelection() {
    if (!window.ethereum || !window.ethereum.request) return;
    try {
        await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }]
        });
    } catch (e) {
        // If user rejects or provider doesn't support it, fallback to eth_requestAccounts
        console.warn("Account selection not available.", e);
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
    if (payoutsTxLink) {
        payoutsTxLink.style.display = "none";
        payoutsTxLink.href = "#";
    }
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
    closePayoutsModal();
    setPayoutStatus("");
    updatePayoutActionsState();
}

function downloadPayoutTemplate() {
    const header = "address,amount\n";
    const rows = [
        "0x1111111111111111111111111111111111111111,1.25",
        "0x2222222222222222222222222222222222222222,0.5",
        "0x3333333333333333333333333333333333333333,10"
    ];
    const csvContent = header + rows.join("\n") + "\n";
    const filename = "knurfi_payouts_template.csv";
    try {
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
            window.navigator.msSaveOrOpenBlob(blob, filename);
        } else {
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.rel = "noopener";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        setPayoutStatus("Template downloaded.");
    } catch (e) {
        const dataUrl = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
        window.open(dataUrl, "_blank", "noopener");
        setPayoutStatus("Template opened in new tab.");
    }
}

function renderPayoutPreview() {
    if (!payoutsPreview || !payoutsSummary) return;
    if (payoutRecipients.length === 0) {
        payoutsPreview.textContent = "No file loaded yet.";
        payoutsSummary.textContent = "";
        if (payoutsRequired) payoutsRequired.textContent = "0";
        if (payoutsAllowance) payoutsAllowance.textContent = "-";
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
    if (payoutsRequired) payoutsRequired.textContent = totalDisplay;
    renderPayoutsModalBody();
    updatePayoutActionsState();
    updateApprovalState();
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
        explorer: arc.explorer,
        rpcUrl: arc.rpcUrl
    };
}

function renderPayoutConfig() {
    if (!payoutsConfig) return;
    const config = getArcBatchConfig();
    if (!config) {
        payoutsConfig.textContent = "Arc configuration unavailable.";
        return;
    }
    const contract = config.batchContractAddress || "Not deployed";
    const usdc = config.usdcAddress || "Missing";
    payoutsConfig.innerHTML = `
        <div>Arc USDC: <span style="color:#e2e8f0;">${usdc}</span></div>
        <div>Batch Contract: <span style="color:#e2e8f0;">${contract}</span></div>
    `;
}

function updatePayoutActionsState() {
    const hasCsv = payoutRecipients.length > 0;
    const hasMemo = payoutsMemo && payoutsMemo.value.trim().length > 0;
    if (payoutsSubmitButton) {
        payoutsSubmitButton.disabled = !(hasCsv && hasMemo);
        payoutsSubmitButton.style.opacity = payoutsSubmitButton.disabled ? "0.6" : "1";
    }
    if (payoutsPreviewAllButton) {
        payoutsPreviewAllButton.disabled = !hasCsv;
        payoutsPreviewAllButton.style.opacity = hasCsv ? "1" : "0.6";
    }
}

function renderPayoutsModalBody() {
    if (!payoutsModalBody) return;
    if (!payoutRecipients.length) {
        payoutsModalBody.textContent = "No recipients loaded.";
        return;
    }
    const rows = payoutRecipients.map((recipient, index) => {
        const amount = payoutAmounts[index];
        return `${index + 1}. ${recipient} — ${formatUsdcAmount(amount)} USDC`;
    });
    payoutsModalBody.innerHTML = rows.join("<br>");
}

function openPayoutsModal() {
    if (!payoutsModal) return;
    renderPayoutsModalBody();
    payoutsModal.style.display = "block";
}

function closePayoutsModal() {
    if (!payoutsModal) return;
    payoutsModal.style.display = "none";
}

async function loadRecentBatches() {
    if (!payoutsBatchesList) return;
    const config = getArcBatchConfig();
    if (!config || !config.batchContractAddress || !config.rpcUrl) {
        payoutsBatchesList.textContent = "Batch contract not configured.";
        return;
    }
    if (!window.ARC_BATCH_ABI || window.ARC_BATCH_ABI.length === 0) {
        payoutsBatchesList.textContent = "Batch ABI missing. Reload the page.";
        setPayoutStatus("Batch ABI missing. Check abi.js.", true);
        return;
    }

    try {
        payoutsBatchesList.textContent = "Loading batch history...";
        const provider = new ethers.JsonRpcProvider(config.rpcUrl);
        const contract = new ethers.Contract(config.batchContractAddress, window.ARC_BATCH_ABI || [], provider);
        const latest = await provider.getBlockNumber();
        const startBlock = Math.max(latest - 20000, 0);
        const filter = currentAddress
            ? contract.filters.BatchPayout(currentAddress)
            : contract.filters.BatchPayout();
        const events = await contract.queryFilter(filter, startBlock, "latest");
        const limit = payoutsBatchesToggle && payoutsBatchesToggle.checked ? 20 : 10;
        const recent = events.slice(-limit).reverse();

        if (!recent.length) {
            payoutsBatchesList.textContent = "No batch activity yet.";
            return;
        }

        const rows = recent.map(ev => {
            const txHash = ev.transactionHash;
            const memoHash = ev.args.memoHash;
            const count = Number(ev.args.count);
            const total = formatUsdcAmount(ev.args.totalAmount);
            const shortTx = txHash.slice(0, 6) + "..." + txHash.slice(-4);
            const shortMemo = memoHash.slice(0, 6) + "..." + memoHash.slice(-4);
            const link = `${config.explorer}/tx/${txHash}`;
            return `• <a href="${link}" target="_blank" rel="noopener">${shortTx}</a> — ${count} recipients — ${total} USDC — memo ${shortMemo} <button class="btn btn-outline" style="padding:2px 8px; margin-left:6px;" data-memo="${memoHash}">Copy memo</button>`;
        });
        payoutsBatchesList.innerHTML = rows.join("<br>");
        payoutsBatchesList.querySelectorAll("button[data-memo]").forEach(button => {
            button.onclick = () => {
                const memo = button.getAttribute("data-memo");
                if (!memo || !navigator.clipboard) return;
                navigator.clipboard.writeText(memo).then(() => {
                    setPayoutStatus("Memo hash copied.");
                }).catch(() => setPayoutStatus("Failed to copy memo hash.", true));
            };
        });
    } catch (e) {
        const message = e && (e.shortMessage || e.reason || e.message)
            ? (e.shortMessage || e.reason || e.message)
            : "Failed to load batch history.";
        payoutsBatchesList.textContent = "Failed to load batch history.";
        setPayoutStatus(message, true);
    }
}

async function getArcSigner() {
    const eth = await waitForEthereum();
    if (!eth) {
        showMetaMaskError();
        return null;
    }
    await ensureArcWalletChain();
    const arcProvider = new ethers.BrowserProvider(window.ethereum);
    await arcProvider.send("eth_requestAccounts", []);
    return arcProvider.getSigner();
}

async function updateApprovalState(forceRefresh) {
    const config = getArcBatchConfig();
    if (!config || !config.usdcAddress || !config.batchContractAddress) return;
    if (!payoutTotal || payoutTotal <= 0n) return;
    try {
        const arcSigner = await getArcSigner();
        if (!arcSigner) return;
        const owner = await arcSigner.getAddress();
        const erc20 = getArcErc20(config.usdcAddress, arcSigner);
        const allowance = await erc20.allowance(owner, config.batchContractAddress);
        if (payoutsAllowance) {
            payoutsAllowance.textContent = formatAllowanceDisplay(allowance);
        }
        if (forceRefresh) {
            setPayoutStatus("Allowance refreshed.");
        }
        if (payoutsApproveButton) {
            if (allowance >= payoutTotal) {
                payoutsApproveButton.textContent = "Approved";
                payoutsApproveButton.disabled = true;
                payoutsApproveButton.style.opacity = "0.6";
            } else {
                payoutsApproveButton.textContent = "Approve USDC";
                payoutsApproveButton.disabled = false;
                payoutsApproveButton.style.opacity = "1";
            }
        }
    } catch (e) {
        setPayoutStatus("Could not check USDC allowance.", true);
    }
}

function formatAllowanceDisplay(amount) {
    if (amount >= ethers.MaxUint256 / 2n) {
        return "Unlimited";
    }
    return formatUsdcAmount(amount);
}

function getArcErc20(tokenAddress, signer) {
    return new ethers.Contract(
        tokenAddress,
        [
            "function approve(address spender, uint256 amount) public returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)",
            "function balanceOf(address owner) view returns (uint256)"
        ],
        signer
    );
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
    try {
        const arcSigner = await getArcSigner();
        if (!arcSigner) return;
        const erc20 = getArcErc20(config.usdcAddress, arcSigner);
        setPayoutStatus("Confirm USDC approval in your wallet...");
        const tx = await erc20.approve(config.batchContractAddress, ethers.MaxUint256);
        setPayoutStatus(`Approval submitted: ${tx.hash}`);
        await tx.wait();
        setPayoutStatus("USDC approval confirmed.");
        await updateApprovalState();
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

    try {
        const arcSigner = await getArcSigner();
        if (!arcSigner) return;
        const owner = await arcSigner.getAddress();
        const erc20 = getArcErc20(config.usdcAddress, arcSigner);
        const balance = await erc20.balanceOf(owner);
        if (balance < payoutTotal) {
            const have = formatUsdcAmount(balance);
            const need = formatUsdcAmount(payoutTotal);
            setPayoutStatus(`Insufficient USDC balance. Have ${have}, need ${need}.`, true);
            return;
        }
        const batch = new ethers.Contract(
            config.batchContractAddress,
            window.ARC_BATCH_ABI || [],
            arcSigner
        );

        const memoHash = ethers.keccak256(ethers.toUtf8Bytes(payoutsMemo.value.trim()));
        setPayoutStatus("Submitting batch payout... confirm in wallet.");
        const tx = await batch.batchPayout(payoutRecipients, payoutAmounts, memoHash);
        setPayoutStatus(`Batch submitted: ${tx.hash} — check status on Explorer.`);
        await tx.wait();
        setPayoutStatus("Batch payout confirmed. Check the transaction hash on Explorer.");
        if (payoutsTxLink) {
            payoutsTxLink.href = `${config.explorer}/tx/${tx.hash}`;
            payoutsTxLink.style.display = "inline-flex";
        }
    } catch (e) {
        const raw = (e.shortMessage || e.reason || e.message || "").toLowerCase();
        let message = e.shortMessage || e.reason || e.message || "Batch payout failed.";
        if (raw.includes("transfer amount exceeds balance")) {
            message = "Insufficient USDC balance for this batch.";
        } else if (raw.includes("insufficient allowance")) {
            message = "USDC allowance too low. Please approve USDC.";
        } else if (raw.includes("user rejected") || raw.includes("user denied")) {
            message = "Transaction was rejected in the wallet.";
        }
        setPayoutStatus(message, true);
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

    if (unlockButton) {
        const shouldShow = tab === "overview" && isConnected;
        unlockButton.style.display = shouldShow ? "inline-flex" : "none";
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
    setBridgeWidgetUrl();

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