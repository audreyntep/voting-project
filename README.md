# voting-smart-contract
Un smart contract de vote.


## Le processus de vote : 

➡️ L'administrateur du vote enregistre une liste blanche d'électeurs identifiés par leur adresse Ethereum.

➡️ L'administrateur du vote commence la session d'enregistrement des propositions.

➡️ Les électeurs inscrits sont autorisés à enregistrer leurs propositions pendant que la session d'enregistrement est active.

➡️ L'administrateur de vote met fin à la session d'enregistrement des propositions.

➡️ L'administrateur du vote commence la session de vote.

➡️ Les électeurs inscrits votent pour leur proposition préférée.

➡️ L'administrateur du vote met fin à la session de vote.

➡️ L'administrateur du vote comptabilise les votes.

➡️ Tout le monde peut vérifier les derniers détails de la proposition gagnante.


## Les contraintes :

✔️ Le smart contract s’appelle “Voting”.

✔️ Le smart contract utilise la dernière version du compilateur (0.8.30).

✔️ Le smart contract importe la librairie “Ownable” d’OpenZepplin.

✔️ L’adresse qui déploie le smart contrat devient administrateur. 

✔️ Le vote n'est pas secret pour les adresses de la whitelist d'électeurs.

✔️ Chaque électeur peut voir les votes des autres en utilisant leurs adresses.

✔️ La première proposition de la liste qui obtient le plus de voix l'emporte (les ex aequo ne sont pas gérés).

## Les ajouts :

Pour optimiser les frais de gas en évitant les transactions inutiles et garantir le bon déroulement du processus de vote.

✅ L'administrateur est enregistré comme le premier élécteur dès le déploiement du contrat.

✅ Le déploiement du contrat ne peut pas être réalisé par une adresse zéro.

✅ Une addresse ne peut pas être enregistrée deux fois.

✅ Chaque changement de status du workflow est sousmis à une vérification de condition du status en cours avec le modifier atStatus.

✅ L'ouverture d'une session de proposition n'est possible que si il y a au moins 2 élécteurs enregistrés.

✅ Un électeur enregistré peut proposer plusieurs propositions dans une même transaction.

✅ Les propositions sans description ne sont pas enregistrées.

✅ La fin d'une session de proposition n'est possible que s'il y a au moins 2 propositions enregistrées.

✅ Les électeurs ne peuvent voter qu'une seule fois.

✅ Le vote pour un identifiant de proposition invalide est rejeté.

✅ La fin d'une session de vote n'est possible que si il y a au moins 1 vote.

✅ La fonction permettant de récupérer l'identifiant de la proposition gagnante n'est possible qu'en fonction du status du workflow.


# TODO:

- Vérifier qu'une adresse existe avant de l'enregistrer.
- Limiter le nombre d'adresses dans la whiteliste pour éviter les tableaux trop grand.
- Gérer les propositions en doublon.
- Vérifier la taille et le type des descriptions des propositions.
- Limiter le nombre de propositions pour éviter les tableaux trop grand.
- Gérer les ex aequo.