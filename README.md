# PROJECT 2 : Test sur Voting



## Test Mocha :

**Fonctions de setup** :

- setUpSmartContract : retourne le contrat déployé, le owner et une adresse de voter

- setUpSmartContractAddProposals : retourne le contrat déployé, le owner et une adresse de voter. Le voter est ajouté au mapping des votants et la session de propositions est ouverte.

- setUpSmartContractTallyVotes : retourne le contrat déployé, le owner et l'id de la proposition gagnante. 3 voters sont ajoutés au mapping des votants, 2 propositions ont été enregistrées, les 3 votants ont voté et la session de vote est fermée.

**1. Contract** :

1. Le owner du contrat est le deployer

2. Le contrat commence avec 0 gagnants

3. Le contrat commence avec un tableau de propositions vide


**2. Voters** :

1. addVoter ne peut être appelé que par le owner

2. addVoter ne peut être appelé que pendant l'état "RegisteringVoters"

3. addVoter ne permet pas d'ajouter deux fois le même votant

4. addVoter ajoute un votant au mapping des votants

5. addVoter émet l'événement VoterRegistered après l'ajout d'un votant


**3. Proposals** :

1. addProposal ne peut être appelé que pendant l'état ProposalsRegistrationStarted

2. addProposal ne peut être appelé que par un votant enregistré

3. addProposal n'accepte pas les descriptions de propositions vides

4. addProposal ajoute une proposition 1 au tableau des propositions (vérification de sa déscription)

5. addProposal émet l'événement ProposalRegistered après l'ajout d'une proposition


**4. Votes**:

1. setVote ne peut être appelé que pendant l'état VotingSessionStarted

2. setVote ne peut être appelé que par un votant enregistré

3. setVote ne permet pas à un votant de voter deux fois

4. setVote ne permet pas de voter pour une proposition qui n'existe pas

5. setVote enregistre le vote du votant (proposalId et hasVoted)

6. setVote incrémente le nombre de votes pour la proposition choisie

7. setVote émet l'événement Voted après qu'un votant ait voté


**5. Winning**:

1. tallyVotes ne peut être appelé que par le owner

2. tallyVotes ne peut être appelé que pendant l'état VotingSessionEnded

3. tallyVotes détermine correctement la proposition gagnante

4. tallyVotes met à jour le statut du workflow à VotesTallied

5. tallyVotes émet l'événement WorkflowStatusChange après le décompte des votes


**6. Workflows**:

1. startProposalsRegistering change le statut du workflow à ProposalsRegistrationStarted

2. startProposalsRegistering initialise la proposition GENESIS

3. endProposalsRegistering change le statut du workflow à ProposalsRegistrationEnded

4. startVotingSession change le statut du workflow à VotingSessionStarted

5. endVotingSession change le statut du workflow à VotingSessionEnded
