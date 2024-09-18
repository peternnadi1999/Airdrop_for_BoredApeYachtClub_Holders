```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.ts
```

# Airdrop Contract with BAYC Ownership Requirement

This contract implements a Merkle-based airdrop distribution with an additional requirement that users must own a Bored Ape Yacht Club (BAYC) NFT to claim their tokens.

# Features

1. Merkle Airdrop: The contract utilizes Merkle proof verification to ensure that only eligible addresses can claim their tokens.
2. BAYC NFT Requirement: Users must own at least one BAYC NFT to be eligible to claim their airdrop.
3. Claim Tracking: The contract prevents double claiming by keeping track of addresses that have already claimed their tokens.

# How to Use

1. Deployment

The contract can be deployed with two parameters:
-- tokenAddress: The address of the ERC-20 token being airdropped.
-- merkleRoot: The Merkle root that is generated off-chain, representing the eligible users and their corresponding airdrop amounts.
Example:
Airdrop airdrop = new Airdrop(tokenAddress, merkleRoot); 2. Claim Airdrop

Users can claim their airdrop by providing a valid Merkle proof and the amount they are eligible for.

Example:
airdrop.claimAirdrop(proof, amount);

If the user:

Doesn't own a BAYC NFT, the transaction will revert with the message "You need BoredApeYatchClub (BAYC) NFT before you can claim.".
Has already claimed, the transaction will revert with the message "Airdrop already claimed.".

# Prerequisites

1. Generate Merkle Tree

You must generate a Merkle tree off-chain with the eligible addresses and their respective token amounts. The root of this tree will be passed to the contract constructor.

2. BAYC NFT Ownership

Users must have at least one BAYC NFT to claim their airdrop.

Example Usage
// Assume tokenAddress and merkleRoot are defined.

    Airdrop airdrop = new Airdrop(tokenAddress, merkleRoot);
    // User wants to claim their airdrop.

    bytes32[] memory proof = /* merkle proof for the user */;
    uint256 amount = /* amount the user is entitled to claim */;

    // Call the claimAirdrop function.
    airdrop.claimAirdrop(proof, amount);

# Considerations

Ensure that the Merkle tree is generated correctly and the proofs are valid for eligible users.
Make sure the NFT ownership check is working properly by using the correct BAYC NFT contract address.
Keep track of the users who have already claimed their airdrop to prevent double claims.

# Conclusion

This Merkle Airdrop contract adds an additional layer of verification by requiring users to own a BAYC NFT in addition to passing a Merkle proof to claim their tokens. This ensures that only qualified users can claim their rightful tokens, while also preventing any double claims.
