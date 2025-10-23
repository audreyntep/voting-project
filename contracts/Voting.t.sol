// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {Voting} from "./Voting.sol";
import {Test} from "forge-std/Test.sol";

// Solidity tests are compatible with foundry, so they
// use the same syntax and offer the same functionality.

contract VotingTest is Test {
    Voting voting;
    address owner;

  function setUp() public {
    voting = new Voting();
    owner = address(this);
  }

  // Testing initial state of the contract
    function test_Owner() public view {
        assertEq(voting.owner(), address(this));
    }
    function test_winningProposalID_initialState() public view {
        assertEq(voting.winningProposalID(), 0);
    }
    function test_workflowStatus_initialState() public view {
        assertEq(uint(voting.workflowStatus()), uint(Voting.WorkflowStatus.RegisteringVoters));
    }


}