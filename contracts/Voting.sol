// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

// Import Ownable library from OpenZeppelin
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {

    // Enums
    enum WorkflowStatus { 
        RegisteringVoters, 
        ProposalsRegistrationStarted, 
        ProposalsRegistrationEnded, 
        VotingSessionStarted, 
        VotingSessionEnded, 
        VotesTallied 
    }

    // Structures
    struct Voter { 
        bool isRegistered; 
        bool hasVoted; 
        uint votedProposalId; 
    } 
    struct Proposal {
        uint proposalId; //
        string description;
        uint voteCount;
    }

    // Events
    event ProposalRegistered(uint indexed _proposalId);
    event Voted (address indexed _voterAddress, uint indexed _proposalId);
    event VoterRegistered(address indexed _voterAddress);
    event WorkflowStatusChange(
        WorkflowStatus _previousStatus, 
        WorkflowStatus _newStatus
    );
    
    // State variables
    WorkflowStatus private currentStatus;
    uint256 private votersCount; // savoir si il y a suffisament de votants pour ouvrir la session de propositions
    uint256 private totalVotesCount; // savoir si il a suffisament de votes pour cloturer la session de votes
    uint256 private winningProposalId;

    // Mapping to store voter information
    mapping(address => Voter) private voters;
    // Array to store proposals for iteration
    Proposal[] private proposals;

    // Constructor
    constructor() Ownable(msg.sender) {
        // Prevent deploying contract with zero address as owner
        require(msg.sender != address(0), "Invalid zero address");
        // Register the owner as a voter
        voters[msg.sender].isRegistered = true;
        votersCount++;
        emit VoterRegistered(msg.sender);
    }

    // Modifiers
    modifier onlyRegisteredVoter() {
        require(voters[msg.sender].isRegistered, "Caller not authorized");
        _;
    }
    modifier atStatus(WorkflowStatus _status) {
        require(currentStatus == _status, "Function cannot be called");
        _;
    }

    // Getters
    function getCurrentStatus() external view returns(WorkflowStatus) {
        return currentStatus;
    }
    function getVotersCount() external view returns(uint) {
        return votersCount;
    }
    function getVoterByAdress(address _address) onlyRegisteredVoter external view returns(Voter memory) {
        return voters[_address];
    }
    function getProposals() external view returns(Proposal[] memory) {
        return proposals;
    }
    function getWinningProposalId() external view returns(uint) {
        require(currentStatus == WorkflowStatus.VotesTallied, "No winner yet");
        return winningProposalId;
    }

    // Setters
    function setVoters(address[] calldata _votersAddresses) 
        onlyOwner
        atStatus(WorkflowStatus.RegisteringVoters) 
        external  
    {
        // Check if array is not empty
        require(_votersAddresses.length > 0, "No addresses provided");
        for (uint256 i = 0; i < _votersAddresses.length; i++) {
            address voter = _votersAddresses[i];
            // Register voter if not already registered
            if (!voters[voter].isRegistered && voter != address(0)) {
                voters[voter].isRegistered = true;
                votersCount++;
                emit VoterRegistered(voter);
            }
        }
    }
    function setProposals(string[] calldata _proposalsDescriptions)
        onlyRegisteredVoter
        atStatus(WorkflowStatus.ProposalsRegistrationStarted) 
        external 
    {
        // Check if array is not empty
        require(_proposalsDescriptions.length > 0, "No proposal provided");
        for (uint256 i = 0; i < _proposalsDescriptions.length; i++) {
            string calldata _description = _proposalsDescriptions[i];
            // Check if description is not empty
            if(bytes(_description).length > 0) {
                // Register proposal
                uint256 _id = proposals.length + 1;
                proposals.push(Proposal({
                    proposalId: _id,
                    description: _description,
                    voteCount: 0
                }));
                emit ProposalRegistered(_id);
            }
        }
    }
    
    // Workflow
    function _changeWorkflowStatus(WorkflowStatus _newStatus) 
        private 
    {
        WorkflowStatus _previousStatus = currentStatus;
        currentStatus = _newStatus;
        emit WorkflowStatusChange(_previousStatus, _newStatus);
    }
    function openProposalsRegistration()
        onlyOwner
        atStatus(WorkflowStatus.RegisteringVoters)  
        public 
    {
        require(votersCount >= 2, "Not enough voters registered");
        _changeWorkflowStatus(WorkflowStatus.ProposalsRegistrationStarted);
    }
    function closeProposalsRegistration() 
        onlyOwner
        atStatus(WorkflowStatus.ProposalsRegistrationStarted) 
        public  
    {
        require(proposals.length >= 2, "Not enough proposals registered");
        _changeWorkflowStatus(WorkflowStatus.ProposalsRegistrationEnded);
    }
    function openVotingSession() 
        onlyOwner 
        atStatus(WorkflowStatus.ProposalsRegistrationEnded) 
        public 
    {
        _changeWorkflowStatus(WorkflowStatus.VotingSessionStarted);
    }
    function closeVotingSession() 
        onlyOwner 
        atStatus(WorkflowStatus.VotingSessionStarted) 
        public
    {  
        require(totalVotesCount > 0, "No votes have been cast yet");
        _changeWorkflowStatus(WorkflowStatus.VotingSessionEnded);
    }

    // Functions
    function tallyVotesAndGetWinner()
        onlyOwner
        atStatus(WorkflowStatus.VotingSessionEnded) 
        external 
    {  
        uint256 maxVotes;
        for (uint256 i = 0; i < proposals.length; i++) {
            uint256 _votes = proposals[i].voteCount;
            if (_votes > 0 && _votes > maxVotes) {
                maxVotes = _votes;
                winningProposalId = proposals[i].proposalId;
            }
        }
        _changeWorkflowStatus(WorkflowStatus.VotesTallied);
    }
    function registerVote(uint256 _proposalId)
        onlyRegisteredVoter 
        atStatus(WorkflowStatus.VotingSessionStarted) 
        public 
    {
        Voter storage voter = voters[msg.sender];
        // Check if the voter has already voted
        require(!voter.hasVoted, "Voter has already voted");
        // Check if the proposal ID is valid
        require(_proposalId > 0 && _proposalId <= proposals.length, "Invalid proposal ID");
        // Record the vote
        voter.hasVoted = true;
        voter.votedProposalId = _proposalId;
        // Update the vote count for the selected proposal
        proposals[_proposalId - 1].voteCount++;
        // Increment the total votes count
        totalVotesCount += 1;
        emit Voted(msg.sender, _proposalId);
    }


}