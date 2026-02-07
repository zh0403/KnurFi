window.KNURFI_CHAINS = {
    sepolia: {
        name: "Ethereum Sepolia",
        chainId: 11155111,
        rpcUrl: "https://rpc.sepolia.org",
        explorer: "https://sepolia.etherscan.io",
        contractAddress: window.MT_NOTE_ADDRESS || "0xb04D5E5234D5556b5B46600414763ff3829199fd",
        nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
        ledgerEnabled: true
    },
    arcTestnet: {
        name: "Arc Testnet",
        chainId: 5042002,
        rpcUrl: "https://rpc.testnet.arc.network",
        explorer: "https://testnet.arcscan.app",
        batchContractAddress: "0x4e752A4d38B33354a334bf95248D1498bef89319",
        usdcAddress: "0x3600000000000000000000000000000000000000",
        nativeCurrency: { name: "USD Coin", symbol: "USDC", decimals: 6 },
        ledgerEnabled: false
    }
};
