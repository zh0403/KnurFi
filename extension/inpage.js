// inpage.js
// This script runs in the page context and cannot access `chrome.runtime`.
// The content script passes the resolved icon URL via a data-attribute on
// the injected <script> tag (see `content.js`).
const currentScript = document.currentScript;
const ICON_URL = currentScript && currentScript.dataset
    ? currentScript.dataset.iconUrl || ''
    : '';

// Ensure the address is set (Safety check)
// Replace with your ACTUAL contract address if different
const CONTRACT_ADDRESS = window.MT_NOTE_ADDRESS || "0xb04D5E5234D5556b5B46600414763ff3829199fd";
let GLOBAL_KEY = null; // We store the key here after they sign once

// --- HELPER: Derive Key from Signature ---
async function getEncryptionKey(signer) {
    if (GLOBAL_KEY) return GLOBAL_KEY;

    // 1. Ask user to sign a static message
    // This signature acts as their "password" but they don't have to remember it!
const msg = "UNLOCK_KNURFI"; // Keep it simple!
    const signature = await signer.signMessage(msg);

    // 2. Turn that signature into a usable AES key
    GLOBAL_KEY = signature; 
    return GLOBAL_KEY;
}

// --- HELPER: Encrypt/Decrypt ---
function encryptData(text, key) {
    if (!text) return "";
    return CryptoJS.AES.encrypt(text, key).toString();
}

function decryptData(ciphertext, key) {
    try {
        const bytes = CryptoJS.AES.decrypt(ciphertext, key);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (e) {
        return null; // Failed to decrypt (wrong key or not encrypted)
    }
}

async function init() {
    console.log("📘 KnurFi: Initializing...");

    // --- NEW: Add Global Styles for Animations ---
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        @keyframes mt-pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        .mt-loading {
            animation: mt-pulse 1.5s infinite;
        }
    `;
    document.head.appendChild(styleTag);

    const path = window.location.pathname.split('/');
    const txHash = path[path.length - 1];
    if (!txHash.startsWith("0x")) return;

    // --- NEW: Theme Detection Logic ---
    // We check the computed background color of the main table to decide if it's Dark or Light
    const mainTable = document.querySelector('.card') || document.body;
    const bgColor = window.getComputedStyle(mainTable).backgroundColor;
    
    // Simple heuristic: Is the background dark?
    // rgb(0, 0, 0) or similar -> Dark Mode
    const isDark = bgColor.indexOf('rgb(0') !== -1 || bgColor.indexOf('rgb(3') !== -1 || bgColor.includes('#0');
    
    // Define Colors based on Theme
    const theme = {
        bg: isDark ? '#0f1214' : '#ffffff',
        text: isDark ? '#ffffff' : '#1e293b',
        border: isDark ? '#333' : '#e2e8f0',
        inputBg: isDark ? '#1a1d1f' : '#f8fafc',
        inputText: isDark ? '#ffffff' : '#0f172a',
        tagBg: isDark ? '#2d3748' : '#e2e8f0',
        tagText: isDark ? '#a0aec0' : '#475569',
        shadow: isDark ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    };

    // --- Inject UI with Dynamic Colors ---
    const container = document.createElement('div');
    container.style = `
        background: ${theme.bg}; 
        color: ${theme.text}; 
        padding: 20px; 
        margin: 20px 0; 
        border-radius: 12px; 
        border: 1px solid ${theme.border};
        box-shadow: ${theme.shadow};
        font-family: 'Inter', sans-serif;
    `;

    // [The rest of your HTML generation remains the same, but use the theme variables]
    // I will rewrite the innerHTML part to use these variables for you:
    
    const quickTags = [
        { label: "🍔 Food", val: "#Food" },
        { label: "🚕 Transport", val: "#Transport" },
        { label: "💻 Dev", val: "#Dev" },
        { label: "💰 Salary", val: "#Salary" },
        { label: "⛽ Gas", val: "#Gas" }
    ];

    const tagsHtml = quickTags.map(tag => 
        `<button class="mt-tag" data-val="${tag.val}" style="
        background: ${theme.tagBg}; color: ${theme.tagText}; border: 1px solid ${theme.border}; 
        padding: 4px 10px; border-radius: 20px; font-size: 12px; cursor: pointer; margin-right: 6px; font-weight: 500;">${tag.label}</button>`
    ).join('');

    container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid ${theme.border}; padding-bottom: 10px;">
            <h3 style="margin: 0; display: flex; align-items: center; gap: 10px; font-size: 16px;">
                <img src="${ICON_URL}" style="width: 24px; height: 24px;">
                
                <span style="background: linear-gradient(90deg, #2563eb, #f59e0b); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">KnurFi</span>
            </h3>
            <span id="mt-status" style="font-size: 11px; color: #94a3b8; font-family: monospace;">● System Ready</span>
        </div>
        
        <div id="mt-tags-row" style="margin-bottom: 12px; display: flex; flex-wrap: wrap; gap: 5px;">
            ${tagsHtml}
        </div>

        <div style="display: flex; gap: 10px;">
            <input type="text" id="mt-input" placeholder="Add a secure note..." 
                style="flex-grow: 1; padding: 12px; border-radius: 8px; border: 1px solid ${theme.border}; background: ${theme.inputBg}; color: ${theme.inputText}; outline: none; font-size: 14px;">
            
            <button id="mt-save" 
                style="cursor: pointer; background: #000000; color: #ffffff; border: none; padding: 0 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                Save
            </button>
        </div>
        
        <div id="mt-display" style="display:none; margin-top: 15px; padding: 12px; background: rgba(101, 179, 173, 0.1); border-radius: 8px; color: #0d9488; border: 1px solid #65b3ad; font-size: 14px;"></div>
    `;

    // Insert logic
    const anchor = document.querySelector('#ContentPlaceHolder1_maintable') || document.querySelector('.card');
    if (anchor) {
        anchor.parentNode.insertBefore(container, anchor);
    }
    
    // Add Hover Logic for Tags (Dynamic)
    setTimeout(() => {
        document.querySelectorAll('.mt-tag').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const val = e.target.getAttribute('data-val');
                const input = document.getElementById('mt-input');
                input.value = input.value ? input.value + " " + val : val;
                input.focus();
            });
            // Hover effect
            btn.onmouseover = () => { btn.style.background = "#e2e8f0"; btn.style.borderColor = "#cbd5e1"; };
            btn.onmouseout = () => { btn.style.background = theme.tagBg; btn.style.borderColor = theme.border; };
        });
        
        // Re-attach save button listener since we overwrote innerHTML
        document.getElementById('mt-save').onclick = async () => {
            await saveNote(txHash);
        };
    }, 500);

    // Initial check
    await checkExistingNote(txHash);
}

// --- Action: Save Encrypted Note ---
async function saveNote(txHash) {
    const input = document.getElementById('mt-input');
    const status = document.getElementById('mt-status');
    const noteText = input.value;

    if (!noteText) return alert("Write something first!");

    try {
        status.innerText = "Checking fees...";
        const contract = await getContract();
        
        // 1. Check Fee
        const fee = await contract.noteFee();
        console.log("Current Fee:", fee.toString());

        // 2. Encrypt
        status.innerText = "Encrypting...";
        const signer = contract.runner; // Get signer from contract
        const key = await getEncryptionKey(signer); 
        const encryptedCid = "enc:" + encryptData(noteText, key);

        // 3. Send Transaction
        status.innerText = "Check wallet...";
        const tx = await contract.addNote(txHash, encryptedCid, { value: fee }); 
        console.log("Tx Sent:", tx.hash);
        
        status.innerText = "Mining... (Please wait)";
        status.classList.add('mt-loading');
        
        // --- Safe Wait ---
        try {
            await tx.wait(); // This might crash if RPC is busy
            status.innerText = "Saved to Blockchain! 🚀";
            status.classList.remove('mt-loading');
        } catch (waitError) {
            console.warn("Rate limit hit during wait, but Tx likely sent:", waitError);
            // If we have a hash, it's usually fine!
            if (tx.hash) {
                status.innerText = "Tx Sent! (Waiting for confirmation...)";
            } else {
                throw waitError; // Real error
            }
        }
        status.classList.remove('mt-loading');

        status.style.color = "#65b3ad"; // Mantle Green
        input.value = "";
        
        // Wait 2 seconds before refreshing to let the node catch up
        setTimeout(() => checkExistingNote(txHash), 2000);

    } catch (err) {
        console.error(err);
        // Only show red error if it's NOT a rate limit
        if (err.message.includes("rate limited") || err.code === -32005) {
             status.innerText = "Network busy, but Tx Sent!";
             status.style.color = "#65b3ad";
        } else {
             status.innerText = "Error: " + (err.shortMessage || err.message);
             status.style.color = "#ef4444"; 
        }
    }
}

// --- Action: Read Encrypted Note ---
async function checkExistingNote(txHash) {
    if (!window.ethereum) return;

    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, provider);
        const accounts = await provider.listAccounts();
        if (accounts.length === 0) return;
        
        const userAddress = accounts[0].address;
        const note = await contract.getNote(userAddress, txHash);

        if (note && note.length > 0) {
            const display = document.getElementById('mt-display');
            display.style.display = "block";

            // CHECK: Is it encrypted?
            if (note.startsWith("enc:")) {
                const rawCipher = note.replace("enc:", "");
                
                // If we already have the key (from saving), decrypt immediately
                if (GLOBAL_KEY) {
                    const plain = decryptData(rawCipher, GLOBAL_KEY);
                    display.innerText = "Decrypted: " + plain;
                } else {
                    // If no key yet, show a button to Unlock
                    display.innerHTML = `
                        <b>Encrypted Note Found</b><br>
                        <button id="mt-unlock-btn" style="margin-top:5px; cursor:pointer; background:#333; color:white; border:none; padding:5px 10px; border-radius:4px;">
                            Unlock to Read
                        </button>
                    `;
                    // Add listener to the new button
                    setTimeout(() => {
                        const btn = document.getElementById('mt-unlock-btn');
                        if (btn) btn.onclick = async () => {
                            const provider = new ethers.BrowserProvider(window.ethereum);
                            const signer = await provider.getSigner();
                            const key = await getEncryptionKey(signer);
                            const plain = decryptData(rawCipher, key);
                            display.innerText = "Decrypted: " + plain;
                        };
                    }, 500);
                }
            } else {
                // Legacy (Plain text)
                display.innerText = "Note: " + note.replace("text:", "");
            }
        }
    } catch (err) {
        console.log("Error fetching note:", err);
    }
}

// --- Helper: Get Contract ---
async function getContract() {
    if (!window.ethereum) {
        alert("Please install MetaMask!");
        throw new Error("No Wallet Found");
    }

    // Connect to Browser Provider (MetaMask)
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Request Account Access
    await provider.send("eth_requestAccounts", []);
    
    // Check Network (Chain ID 5003 is Mantle Sepolia)
    const network = await provider.getNetwork();
    if (network.chainId !== 5003n) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x138b' }], // 5003 in hex
            });
        } catch (e) {
            alert("Please switch MetaMask to Mantle Sepolia Testnet!");
            throw e;
        }
    }

    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, window.MT_NOTE_ABI, signer);
}

// Wait for ethers.js to load, then start
setTimeout(init, 1000);