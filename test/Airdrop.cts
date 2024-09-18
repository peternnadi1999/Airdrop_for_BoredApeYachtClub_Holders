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
    const values = [
      ["0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69", ethers.parseUnits("100")],
      ["0xCA1257Ade6F4fA6c6834fdC42E030bE6C0f5A813", ethers.parseUnits("200")],
      ["0xe67112647B7aEA8b7490F27e1c75208868138df2", ethers.parseUnits("300")],
    ];

    tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    root = tree.root;
    validProof = tree.getProof([values[0][0], values[0][1], values[0][2]]);

    const BAYC_TOKEN = "0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D";
    const BAYC_CONTRACT = await hre.ethers.getContractAt(
      "IERC721",
      BAYC_TOKEN
    );

    const { token } = await loadFixture(deployToken);

    const Airdrop = await hre.ethers.getContractFactory("Airdrop");
    const airdrop = await Airdrop.deploy(token, root);

    return { airdrop, validProof, BAYC_CONTRACT };
  }

  describe("Claim", function () {
    it("Should check wheather the if the user has the BAYC NFT", async function () {
      const { airdrop, validProof, BAYC_CONTRACT } = await loadFixture(deployAirdrop);
      const { token } = await loadFixture(deployToken);

      token.transfer(airdrop, ethers.parseUnits("10000"));
      const add1 = "0xbB05F71952B30786d0aC7c7A8fA045724B8d2D69";
      await impersonateAccount(add1);
      const impersonatedSigner = await hre.ethers.getSigner(add1);
      

      const bal = await BAYC_CONTRACT.balanceOf(impersonatedSigner.address);
      console.log(validProof);
      console.log(bal);

      // expect(await BAYC_CONTRACT.balanceOf(impersonatedSigner)).not.to.be.equal(
      //   0
      // );

      const claim = await airdrop
        .connect(impersonatedSigner)
        .claimAirdrop(validProof, 100);
      expect(claim).emit(airdrop, "ClaimSuccessful");
    });

    it("Check if user have claimed before", async () => {
      const { airdrop } = await loadFixture(deployAirdrop);
    });
  });
});
