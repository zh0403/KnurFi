document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Open Dashboard (Your GitHub Pages Link)
    const btn = document.getElementById('open-dash');
    if (btn) {
        btn.addEventListener('click', () => {
            // REPLACE THIS with your actual GitHub Pages URL when you have it!
            // For now, it points to localhost or the one you set up.
            chrome.tabs.create({ url: 'https://zh0403.github.io/KnurFi/dashboard.html' });
        });
    }

    // 2. Quick Link: Open Explorer
    const btnExplorer = document.getElementById('go-explorer');
    if (btnExplorer) {
        btnExplorer.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sepolia.etherscan.io/' });
        });
    }

    const btnArc = document.getElementById('go-arc');
    if (btnArc) {
        btnArc.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://testnet.arcscan.app/' });
        });
    }

    // 3. Quick Link: Go to GitHub (Good for judges)
    const btnGit = document.getElementById('go-github');
    if (btnGit) {
        btnGit.addEventListener('click', () => {
            // Replace with your Repo URL
            chrome.tabs.create({ url: 'https://github.com/zh0403/KnurFi' });
        });
    }
});