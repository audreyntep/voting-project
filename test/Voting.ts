import { expect } from "chai";
import { network } from "hardhat";
const { ethers } = await network.connect();

// Fonction de setup du déploiement du smart contract Voting
async function setUpSmartContract() {
    const voting = await ethers.deployContract("Voting");
    const [owner] = await ethers.getSigners();
    const [voter] = await ethers.getSigners();
    return { voting, owner, voter };
}

async function setUpSmartContractAddProposals() {
    const { voting, owner, voter } = await setUpSmartContract();
    await voting.addVoter(voter.address);
    await voting.startProposalsRegistering();
    return { voting, owner, voter };
}

async function setUpSmartContractTallyVotes() {
    const { voting, owner, voter } = await setUpSmartContract();
    // Ajout de 2 votants supplémentaires
    const [ , voter2, voter3] = await ethers.getSigners();
    await voting.addVoter(voter.address);
    await voting.addVoter(voter2.address);
    await voting.addVoter(voter3.address);
    await voting.startProposalsRegistering();
    // Ajout 2 propositions pour que les votants puissent voter
    await voting.connect(voter).addProposal("Proposal 1");
    await voting.connect(voter).addProposal("Proposal 2");
    await voting.endProposalsRegistering();
    await voting.startVotingSession();
    // Les votants votent
    await voting.connect(voter).setVote(1);
    await voting.connect(voter2).setVote(2);
    await voting.connect(voter3).setVote(1);
    await voting.endVotingSession();
    const winningProposalId = 1;
    return { voting, owner, winningProposalId };
}

describe("Voting main functions", function () {
    describe("Tests inital state", function () {
        // Variables pour le contrat Voting et le owner
        let voting : any;
        let owner : any;
        let voter : any;
        // Avant chaque test, déployer une nouvelle instance du contrat Voting
        beforeEach(async () => {
            ({ voting, owner, voter} = await setUpSmartContract());
        });
        // 1.Le owner du contrat est le deployer
        it("Contract owner should be deployer", async function () {
            expect(await voting.owner()).to.equal(owner.address);
        });
        // 2. Le contrat commence avec 0 gagnants
        it("Contract should start with 0 winners", async function () {
            expect(await voting.winningProposalID()).to.equal(0);
        });
    });
    describe("Tests addVoter", function () {
        let voting : any;
        let owner : any;
        let voter : any;
        beforeEach(async () => {
            ({ voting, owner, voter} = await setUpSmartContract());
        });
        // 1. addVoter ne peut être appelé que par le owner
        it("addVoter should only be called by the owner", async function () {
            // TODO
            // await expect(voting.connect(voter).addVoter(voter.address))
            // .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
        });
        // 2. addVoter ne peut être appelé que pendant l'état "RegisteringVoters"
        it("addVoter should not revert with workflow status 0 ", async function () {
            expect(await voting.workflowStatus()).to.equal(0);
        });
        // 3. addVoter ne permet pas d'ajouter deux fois le même votant
        it("addVoter should not allow adding the same voter twice", async function () {
            await voting.addVoter(voter.address);
            await expect(voting.addVoter(voter.address))
            .to.be.revertedWith("Already registered");
        });
        // 4. addVoter ajoute un votant au mapping des votants
        it("addVoter should add a voter to voters", async function () {
            await voting.addVoter(voter.address);
            const voterRegistered = await voting.getVoter(voter.address);
            expect(voterRegistered.isRegistered).to.be.true;
        });
        // 5. addVoter émet l'événement VoterRegistered après l'ajout d'un votant
        it("addVoter should emit the VoterRegistered event", async function () {
            await expect(voting.addVoter(voter.address))
            .to.emit(voting, "VoterRegistered").withArgs(voter.address);
        });

        // Contract initial state
        // 6. Le contrat commence avec un tableau de propositions vide
        it("Contract should start with empty proposals array", async function () {
            await voting.addVoter(voter.address);
            await expect(voting.connect(voter).getOneProposal(0))
            .to.be.revertedWithPanic(0x32);
        });

    });

    describe("Tests addProposal", function () {
        // Variables pour le contrat Voting et le owner
        let voting : any;
        let owner : any;
        let voter : any;
        const newProposalDescription = "Proposal 1 description";
        const newProposalId = 1; // L'ID de la nouvelle proposition sera 1 (0 est réservé à GENESIS)
        beforeEach(async () => {
            ({ voting,
                owner,
                voter, 
            } = await setUpSmartContractAddProposals());
        });
        // 1. addProposal ne peut être appelé que pendant l'état ProposalsRegistrationStarted
        it("addProposalshould not revert with workflow status 1", async function () {
            expect(await voting.workflowStatus()).to.equal(1);
        });
        // 2. addProposal ne peut être appelé que par un votant enregistré
        it("addProposal should only be called by a registered voter", async function () {
            const [ , nonVoter] = await ethers.getSigners();
            await expect(voting.connect(nonVoter).addProposal(newProposalDescription))
            .to.be.revertedWith("You're not a voter");
        });
        // 3. addProposal n'accepte pas les descriptions de propositions vides
        it("addProposal should not accept empty proposal descriptions", async function () {
            await expect(voting.connect(voter).addProposal(""))
            .to.be.revertedWith("Vous ne pouvez pas ne rien proposer");
        });
        // 4. addProposal ajoute une proposition au tableau des propositions
        it("addProposal should add a proposal to proposals", async function () {
            await voting.connect(voter).addProposal(newProposalDescription);
            // donc la description de la proposition ajoutée correspond à newProposalDescription
            const proposal = await voting.getOneProposal(newProposalId);
            expect(proposal.description).to.equal(newProposalDescription);
        });
        // 5. addProposal émet l'événement ProposalRegistered après l'ajout d'une proposition
        it("addProposal should emit the ProposalRegistered event", async function () {
            await expect(voting.connect(voter).addProposal(newProposalDescription))
            .to.emit(voting, "ProposalRegistered").withArgs(newProposalId);
        });
    });
    describe("Tests setVote", function () {
        let voting : any;
        let owner : any;
        let voter : any;
        let proposalId : number = 1;
        beforeEach(async () => {
            ({ voting,
                owner,
                voter, 
            } = await setUpSmartContractAddProposals());
            // Ajout d'une proposition pour que le votant puisse voter
            await voting.connect(voter).addProposal("Proposal 1");
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
        });
        // 1. setVote ne peut être appelé que pendant l'état VotingSessionStarted
        it("setVote should not revert with workflow status 3", async function () {
            expect(await voting.workflowStatus()).to.equal(3);
        });
        // 2. setVote ne peut être appelé que par un votant enregistré
        it("setVote should only be called by a registered voter", async function () {
            const [ , nonVoter] = await ethers.getSigners();    
            await expect(voting.connect(nonVoter).setVote(proposalId))
            .to.be.revertedWith("You're not a voter");
        });
        // 3. setVote ne permet pas à un votant de voter deux fois
        it("setVote should not allow a voter to vote twice", async function () {
            await voting.connect(voter).setVote(proposalId);
            await expect(voting.connect(voter).setVote(proposalId))
            .to.be.revertedWith("You have already voted");
        });
        // 4. setVote ne permet pas de voter pour une proposition qui n'existe pas
        it("setVote should not allow voting for a non-existing proposal", async function () {
            const nonExistingProposalId = 999;
            await expect(voting.connect(voter).setVote(nonExistingProposalId))
            .to.be.revertedWith("Proposal not found");
        });
        // 5. setVote enregistre l'id de la proposition pour laquelle un votant a voté
        it("setVote should register proposalId for a voter's vote", async function () {
            await voting.connect(voter).setVote(proposalId);
            const voterVoter = await voting.getVoter(voter.address);
            expect(voterVoter.votedProposalId).to.equal(proposalId);
        });
        // 6. setVote enregistre que le votant a voté
        it("setVote should register that the voter has voted", async function () {
            await voting.connect(voter).setVote(proposalId);
            const voterVoter = await voting.getVoter(voter.address);
            expect(voterVoter.hasVoted).to.be.true;
        });
        // 7. setVote incrémente le nombre de votes pour la proposition choisie
        it("setVote should increment vote count for the chosen proposal", async function () {
            await voting.connect(voter).setVote(proposalId);
            const proposal = await voting.getOneProposal(proposalId);
            expect(proposal.voteCount).to.equal(1);
        });
        // 8. setVote émet l'événement Voted après qu'un votant ait voté
        it("setVote should emit the Voted event", async function () {
            await expect(voting.connect(voter).setVote(proposalId))
            .to.emit(voting, "Voted").withArgs(voter.address, proposalId);
        });

    });
    describe("Tests tallyVotes", function () {
        let voting : any;
        let owner : any;
        let winningProposalId : number;
        beforeEach(async () => {
            ({ voting,
                owner,
                winningProposalId
            } = await setUpSmartContractTallyVotes());
        });
        // 1. tallyVotes ne peut être appelé que par le owner
        it("tallyVotes should only be called by the owner", async function () {
            // await expect(voting.connect(voter).addVoter(voter.address))
            // .to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
        });
        // 2. tallyVotes ne peut être appelé que pendant l'état VotingSessionEnded
        it("tallyVotes should not revert with workflow status 5", async function () {
            expect(await voting.workflowStatus()).to.equal(4);
        });
        // 3. tallyVotes détermine correctement la proposition gagnante
        it("tallyVotes should correctly determine the winning proposal", async function () {
            await voting.tallyVotes();
            expect(await voting.winningProposalID()).to.equal(winningProposalId);
        });
        // 4. tallyVotes met à jour le statut du workflow à VotesTallied
        it("tallyVotes should update workflow status to VotesTallied", async function () {
            await voting.tallyVotes();
            expect(await voting.workflowStatus()).to.equal(5);
        });
        // 5. tallyVotes émet l'événement WorkflowStatusChange après le décompte des votes
        it("tallyVotes should emit the WorkflowStatusChange event", async function () {
            await expect(voting.tallyVotes())
            .to.emit(voting, "WorkflowStatusChange").withArgs(4, 5);
        });
    });
    describe("Tests workflow status state", function () {
        let voting : any;
        let owner : any;
        let voter : any;
        beforeEach(async () => {
            ({ voting, owner, voter} = await setUpSmartContract());
        });
        // 1. startProposalsRegistering change le statut du workflow à ProposalsRegistrationStarted
        it("startProposalsRegistering should change workflow status to ProposalsRegistrationStarted", async function () {
            await expect(voting.startProposalsRegistering())
            .to.emit(voting, "WorkflowStatusChange").withArgs(0, 1);
        });
        // 2. startProposalsRegistering initialise la proposition GENESIS
        it("startProposalsRegistering should initialize GENESIS proposal", async function () {
            await voting.addVoter(voter.address);
            await voting.startProposalsRegistering();
            const genesisProposal = await voting.connect(voter).getOneProposal(0);
            expect(genesisProposal).to.deep.equal(["GENESIS", 0n]);
        });
        // 3. endProposalsRegistering change le statut du workflow à ProposalsRegistrationEnded
        it("endProposalsRegistering should change workflow status to ProposalsRegistrationEnded", async function () {
            await voting.startProposalsRegistering();
            await expect(voting.endProposalsRegistering())
            .to.emit(voting, "WorkflowStatusChange").withArgs(1, 2);
        });
        // 4. startVotingSession change le statut du workflow à VotingSessionStarted
        it("startVotingSession should change workflow status to VotingSessionStarted", async function () {
            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await expect(voting.startVotingSession())
            .to.emit(voting, "WorkflowStatusChange").withArgs(2, 3);
        });
        // 5. endVotingSession change le statut du workflow à VotingSessionEnded
        it("endVotingSession should change workflow status to VotingSessionEnded", async function () {
            await voting.startProposalsRegistering();
            await voting.endProposalsRegistering();
            await voting.startVotingSession();
            await expect(voting.endVotingSession())
            .to.emit(voting, "WorkflowStatusChange").withArgs(3, 4);
        });
    });


});