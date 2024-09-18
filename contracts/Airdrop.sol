// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract Airdrop {
    address owner;
    address public tokenAddress;
    bytes32 public merkleRoot;
    address nftAddress = 0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D;


    event ClaimSuccessful();
    error AirdropAlreadyClaimed();
    
    constructor(address _tokenAddress, bytes32 _merkleRoot) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
        merkleRoot = _merkleRoot;
    }
    mapping(address => bool) public hasClaimed;

    function claimAirdrop(
        bytes32[] memory proof,
        uint256 amount
    ) public {
        if(IERC721(nftAddress).balanceOf(msg.sender) == 0){
            revert ("You need BoredApeYatchClub (BAYC) NFT before you can claim.");
        }
        if(hasClaimed[msg.sender]){
            revert AirdropAlreadyClaimed();
        }
        
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");
        
        hasClaimed[msg.sender] = true;
    
        IERC20(tokenAddress).transfer(msg.sender, amount);
       emit ClaimSuccessful();
    }

    function eligibility() external{

    }

}