window.KNURFI_CHAINS = {
    sepolia: {
        name: "Ethereum Sepolia",
        chainId: 11155111,
        rpcUrl: "https://rpc.sepolia.org",
        explorer: "https://sepolia.etherscan.io",
        contractAddress: window.MT_NOTE_ADDRESS || "0xb04D5E5234D5556b5B46600414763ff3829199fd",
        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 }
    },
    ethereum: {
        name: "Ethereum Mainnet",
        chainId: 1,
        rpcUrl: "https://cloudflare-eth.com",
        explorer: "https://etherscan.io",
        contractAddress: "",
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 }
    },
    arcTestnet: {
        name: "Arc Testnet",
        chainId: 5042002,
        rpcUrl: "https://rpc.testnet.arc.network",
        explorer: "https://testnet.arcscan.app",
        contractAddress: "",
        nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 }
    }
};
