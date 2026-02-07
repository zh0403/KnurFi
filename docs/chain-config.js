window.KNURFI_CHAINS = {
    sepolia: {
        name: "Ethereum Sepolia",
        chainId: 11155111,
        rpcUrl: "https://rpc.sepolia.org",
        explorer: "https://sepolia.etherscan.io",
        contractAddress: window.KNURFI_ADDRESS || "0x3489864DC6ea7440FA54472662A50Bb26BBDD13F",
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
