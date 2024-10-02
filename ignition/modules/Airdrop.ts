import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const AirdropModule = buildModule("AirdropModule", (m) => {

  const tokenAddress = "0x7B4982e1F7ee384F206417Fb851a1EB143c513F9";
  const merkleRoot = "0xcbed6aec0244ac87ac76e7f2d428cd814b9c3a21abc9129839422568b089ac03";
  
  const airdrop = m.contract("Airdrop", [tokenAddress, merkleRoot]);

  return { airdrop };
});

export default AirdropModule;