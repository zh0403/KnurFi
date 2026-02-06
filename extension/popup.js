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

    // 2. Quick Link: Go to MantleScan
    const btnMantle = document.getElementById('go-mantle');
    if (btnMantle) {
        btnMantle.addEventListener('click', () => {
            chrome.tabs.create({ url: 'https://sepolia.mantlescan.xyz/' });
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