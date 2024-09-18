import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre, { ethers } from "hardhat";
import { expect } from "chai";
import { impersonateAccount } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { StandardMerkleTree } from "@openzeppelin/merkle-tree";

describe("Airdrop", function () {
  let tree, root, validProof;

  async function deployToken() {
    const [owner, otherAccount] = await hre.ethers.getSigners();

    const erc20Token = await hre.ethers.getContractFactory("PETWED");
    const token = await erc20Token.deploy();
    return { token };
  }

  async function deployAirdrop() {
    const [owner, otherAccount] = await hre.ethers.getSigners();
    const values = [
      ["0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69", ethers.parseUnits("100")],
      ["0xCA1257Ade6F4fA6c6834fdC42E030bE6C0f5A813", ethers.parseUnits("200")],
      ["0xe67112647B7aEA8b7490F27e1c75208868138df2", ethers.parseUnits("300")],
    ];

    tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    root = tree.root;

    const add1 = "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69";
    const adr2 = "0xCA1257Ade6F4fA6c6834fdC42E030bE6C0f5A813";

    const { token } = await loadFixture(deployToken);

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(token, root);

    return { airdrop, tree, add1, adr2, owner };
  }

  it("Should deploy the contract with correct Merkle root", async function () {
    const { airdrop, tree } = await loadFixture(deployAirdrop);

    expect(await airdrop.merkleRoot()).to.equal(tree.root);
  });

  describe("Claim", function () {
    it("Should allow valid claims", async function () {
      const { owner, airdrop, add1, tree } = await loadFixture(deployAirdrop);
      const {token} = await loadFixture(deployToken);
      
      await token.transfer(airdrop, ethers.parseUnits("10000"));

      await impersonateAccount(add1);
      const impersonatedSigner = await ethers.getSigner(add1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      const leaf = [add1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      await airdrop
        .connect(impersonatedSigner)
        .claimAirdrop(proof, ethers.parseEther("100"));
    });

    it("Should reject invalid claims", async function () {
      const { owner, airdrop, adr2, add1, tree } = await loadFixture(
        deployAirdrop
      );
      const {token} = await loadFixture(deployToken);
      
      await token.transfer(airdrop, ethers.parseUnits("10000"));

      const leaf = [add1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      await impersonateAccount(add1);
      const impersonatedSigner = await ethers.getSigner(add1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      await impersonateAccount(adr2);
      const impersonatedSigner1 = await ethers.getSigner(adr2);

      await owner.sendTransaction({
        to: impersonatedSigner1,
        value: ethers.parseEther("1"),
      });

      await expect(
        airdrop
          .connect(impersonatedSigner1)
          .claimAirdrop(proof, ethers.parseEther("100"))
      ).to.be.revertedWith("Invalid proof");
    });

    it("Should reject if amount is wrong", async function () {
      const { owner, airdrop, add1, tree } = await loadFixture(deployAirdrop);
      const {token} = await loadFixture(deployToken);
      
      await token.transfer(airdrop, ethers.parseUnits("10000"));

      await impersonateAccount(add1);
      const impersonatedSigner = await ethers.getSigner(add1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      const leaf = [add1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      await expect(
        airdrop
          .connect(impersonatedSigner)
          .claimAirdrop(proof, ethers.parseEther("200"))
      ).to.be.revertedWith("Invalid proof");
    });

    it("Should prevent the user to claim twice", async function () {
      const { owner, airdrop, add1, tree } = await loadFixture(deployAirdrop);
      const {token} = await loadFixture(deployToken);
      
      await token.transfer(airdrop, ethers.parseUnits("10000"));

      await impersonateAccount(add1);
      const impersonatedSigner = await ethers.getSigner(add1);

      await owner.sendTransaction({
        to: impersonatedSigner,
        value: ethers.parseEther("1"),
      });

      const leaf = [add1, ethers.parseEther("100")];
      const proof = tree.getProof(leaf);

      await airdrop
        .connect(impersonatedSigner)
        .claimAirdrop(proof, ethers.parseEther("100"));

      await expect(
        airdrop
          .connect(impersonatedSigner)
          .claimAirdrop(proof, ethers.parseEther("100"))
      ).to.be.revertedWith("Airdrop already claimed.");
    });
  });
});
