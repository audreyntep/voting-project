import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
// Create a module for the Voting contract
// m is the deployment module builder
export default buildModule("VotingModule", (m) => {
    // Define the contract to be deployed
    const voting = m.contract("Voting");
    // Return the deployed contract instance
    return { voting };
});
