import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("Airdrop", function () {
  let tree, root;

  async function deployToken() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const erc20Token = await hre.ethers.getContractFactory("PETWED");
    const token = await erc20Token.deploy();
    return { token };
  }

  async function deployAirdrop() {
    const [owner] = await hre.ethers.getSigners();

    const adr1 = "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69";
    const adr2 = "0xCA1257Ade6F4fA6c6834fdC42E030bE6C0f5A813";
    const adr3 = "0xe67112647B7aEA8b7490F27e1c75208868138df2";

    const values = [
      [adr1, ethers.parseUnits("100")],
      [adr2, ethers.parseUnits("200")],
      [adr3, ethers.parseUnits("300")],
    ];

    tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    root = tree.root;

    const { token } = await loadFixture(deployToken);

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(token, root);

    await token.transfer(
      await airdrop.getAddress(),
      ethers.parseEther("10000")
    );

    return { airdrop, tree, adr1, adr2, owner, token };
  }

  it("Should deploy the contract with correct Merkle root", async function () {
    const { airdrop, tree, token } = await loadFixture(deployAirdrop);

    expect(await airdrop.tokenAddress()).to.be.equal(await token.getAddress());
    expect(await airdrop.merkleRoot()).to.equal(tree.root);
  });

  describe("Claim", function () {
    it("Should revert if user does not own BAYC NFT", async function () {
      const { owner, airdrop, adr1, tree } = await loadFixture(deployAirdrop);

      await impersonateAccount(adr1);
      const impersonatedSigner = await ethers.getSigner(adr1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      const leaf = [adr1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      expect(
        await airdrop
          .connect(impersonatedSigner)
          .claimAirdrop(proof, ethers.parseUnits("100"))
      ).to.be.revertedWith(
        "You need BoredApeYatchClub (BAYC) NFT before you can claim."
      );
    });

    it("Should revert if Merkle proof is invalid", async function () {
      const { owner, airdrop, adr1, tree } = await loadFixture(deployAirdrop);

      const leaf = [adr1, ethers.parseUnits("100")];
      const proof = tree.getProof(leaf);

      await impersonateAccount(adr1);
      const impersonatedSigner = await ethers.getSigner(adr1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      expect(
        await airdrop
          .connect(impersonatedSigner)
          .claimAirdrop(proof, ethers.parseUnits("100"))
        ).to.be.revertedWith("Invalid proof");
    });

    it("Should revert if user tries to claim twice", async function () {
      const { owner, airdrop, adr1, tree } = await loadFixture(deployAirdrop);

      await impersonateAccount(adr1);
      const impersonatedSigner = await ethers.getSigner(adr1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      const leaf = [adr1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      await airdrop
        .connect(impersonatedSigner)
        .claimAirdrop(proof, ethers.parseEther("100"));

      await expect(
        airdrop
          .connect(impersonatedSigner)
          .claimAirdrop(proof, ethers.parseEther("100"))
      ).to.be.revertedWithCustomError(airdrop, "AirdropAlreadyClaimed");
    });
  });
});