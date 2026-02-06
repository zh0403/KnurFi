// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol"; // Use OpenZeppelin for security

contract mt_note is Ownable {
    
    // --- Revenue Model ---
    uint256 public noteFee = 0; // Initially 0 for Hackathon judges!
    
    event NoteLog(address indexed user, bytes32 indexed txHash, string ipfsCid, uint256 timestamp);
    event FeeUpdated(uint256 newFee);

    // Pass msg.sender to Ownable to set you as the owner
    constructor() Ownable(msg.sender) {}

    mapping(address => mapping(bytes32 => string)) private userNotes;

    /**
     * @notice Save a note. Requires payment if noteFee > 0.
     */
    function addNote(bytes32 _txHash, string calldata _ipfsCid) external payable {
        require(bytes(_ipfsCid).length > 0, "CID cannot be empty");
        
        // 💰 The Money Maker: Check if user sent enough ETH
        require(msg.value >= noteFee, "Insufficient fee sent");

        userNotes[msg.sender][_txHash] = _ipfsCid;

        emit NoteLog(msg.sender, _txHash, _ipfsCid, block.timestamp);
    }

    // --- Admin Functions (For You) ---
    
    // 1. Change the price later (e.g., set to 0.0005 ETH after hackathon)
    function setFee(uint256 _newFee) external onlyOwner {
        noteFee = _newFee;
        emit FeeUpdated(_newFee);
    }

    // 2. Withdraw your earnings
    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function getNote(address _user, bytes32 _txHash) external view returns (string memory) {
        return userNotes[_user][_txHash];
    }
}