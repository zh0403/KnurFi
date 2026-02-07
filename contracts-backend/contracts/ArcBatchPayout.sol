// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IERC20 {
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

contract ArcBatchPayout {
    address public immutable usdc;

    event BatchPayout(
        address indexed sender,
        bytes32 indexed memoHash,
        uint256 totalAmount,
        uint256 count,
        bytes32 recipientsHash
    );

    constructor(address usdcAddress) {
        require(usdcAddress != address(0), "USDC address required");
        usdc = usdcAddress;
    }

    function batchPayout(
        address[] calldata recipients,
        uint256[] calldata amounts,
        bytes32 memoHash
    ) external {
        require(recipients.length > 0, "No recipients");
        require(recipients.length == amounts.length, "Length mismatch");

        uint256 totalAmount = 0;
        for (uint256 i = 0; i < recipients.length; i++) {
            totalAmount += amounts[i];
            bool ok = IERC20(usdc).transferFrom(msg.sender, recipients[i], amounts[i]);
            require(ok, "Transfer failed");
        }

        bytes32 recipientsHash = keccak256(abi.encode(recipients, amounts));
        emit BatchPayout(msg.sender, memoHash, totalAmount, recipients.length, recipientsHash);
    }
}
