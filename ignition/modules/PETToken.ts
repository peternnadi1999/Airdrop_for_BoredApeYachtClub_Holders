import {buildModule} from "@nomicfoundation/hardhat-ignition/modules"

const PETTokenModule = buildModule("PETTokenModule", (m) => {

    const erc20 = m.contract("PETToken");

    return { erc20 };
});

export default PETTokenModule;
