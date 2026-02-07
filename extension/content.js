// content.js

// Pre-compute the full URL for the extension icon from the extension context
// (page scripts like `inpage.js` cannot call `chrome.runtime` directly).
const MT_ICON_URL = chrome.runtime.getURL('icon.png');

// 1. Define the order of scripts
const scripts = ['ethers.js', 'crypto-js.js', 'abi.js', 'inpage.js'];

// 2. Recursive function to load them one by one
function loadScript(index) {
    if (index >= scripts.length) return; // Done

    const file = scripts[index];
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL(file);
    script.async = false; // Important

    // When we inject the inpage script into the page context, attach the
    // computed icon URL as a data-attribute so it can read it safely.
    if (file === 'inpage.js') {
        script.dataset.iconUrl = MT_ICON_URL;
    }

    // WAIT for this script to finish loading before starting the next one
    script.onload = function() {
        console.log(`[knurfi] Loaded: ${file}`);
        loadScript(index + 1); // Load next
        this.remove(); // Clean up the tag (optional)
    };
    
    script.onerror = function() {
        console.error(`[knurfi] Failed to load: ${file}`);
    };

    (document.head || document.documentElement).appendChild(script);
}

// Start the chain
loadScript(0);