// --- Fichier : render.js (Mis à jour) ---


async function loadPlayerStats() {
    const statsElement = document.getElementById('player-stats');

    try {
        const response = await fetch(PLAYER_API_URL);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {
            const player = data[0];

            // --- DÉBUT DES MODIFICATIONS ---

            // 1. Lire les données brutes (comme avant)
            const currentXP = parseInt(player['XP Actuelle']) || 0;
            const currentLevelName = player['Niveau'] || "LVL ???";
            const playerName = player['Nom'] || 'Héros Inconnu';
            const playerAvatarUrl = player['AvatarURL'] || 'image/default-avatar.png';
            // 2. [NOUVEAU] Lire les paliers que nous venons de créer
            const xpPalierActuel = parseInt(player['XP Palier Actuel (Absolu)']) || 0;
            // (Si le palier suivant n'existe pas, on met 1 de plus pour éviter une division par zéro)
            const xpPalierSuivant = parseInt(player['XP Palier Suivant (Absolu)']) || (xpPalierActuel + 1);

            // 3. [NOUVEAU] Calculer la progression pour le niveau actuel
            const xpRequisPourNiveau = xpPalierSuivant - xpPalierActuel;
            const xpActuelDansNiveau = currentXP - xpPalierActuel;

            // 4. Calculer le ratio de progression (basé sur le niveau actuel)
            const progressRatio = (xpRequisPourNiveau > 0) ? (xpActuelDansNiveau / xpRequisPourNiveau) : 0;
            const progressPercent = Math.min(100, Math.max(0, progressRatio * 100)); // Garantit 0-100%

            // --- FIN DES MODIFICATIONS ---

            // 5. Mettre à jour le HTML avec les NOUVELLES variables
            statsElement.innerHTML = `
                
                <div class="player-header">
                    <img src="${playerAvatarUrl}" alt="Avatar" class="player-avatar">
                    <h2>${playerName} <small>(${currentLevelName})</small></h2>
                </div>
                
                <p>Progression Niveau : ${xpActuelDansNiveau} / ${xpRequisPourNiveau} XP</p>
                
                <div class="xp-bar-container">
                    <div class="xp-bar" 
                         style="width: ${progressPercent}%;">
                    </div>
                </div>
            `;
        } else {
            statsElement.innerHTML = '<p>Erreur: Impossible de charger les stats du joueur.</p>';
        }

    } catch (error) {
        console.error('Erreur lors du chargement des stats du joueur:', error);
        statsElement.innerHTML = '<p>Erreur de connexion au Registre du Destin (Stats).</p>';
    }
}

async function loadQuests() {
    const listElement = document.getElementById('quests-list');
    listElement.innerHTML = '<p>Chargement des quêtes...</p>';

    try {
        const response = await fetch(QUOTES_API_URL); // Note: Tu l'as appelé QUOTES_API_URL
        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const data = await response.json();

        if (Array.isArray(data)) {
            listElement.innerHTML = '';

            if (data.length === 0) {
                listElement.innerHTML = '<p>Aucune quête trouvée. Ajoutez des entrées !</p>';
                return;
            }

            // Tri : non-faites (FALSE) en premier
            const sortedQuests = data.sort((a, b) => {
                const aDone = a['Statut'] === 'TRUE' || a['Statut'] === 'VRAI' || a['Statut'] === true;
                const bDone = b['Statut'] === 'TRUE' || b['Statut'] === 'VRAI' || b['Statut'] === true;
                return aDone - bDone; // false (0) vient avant true (1)
            });

            sortedQuests.forEach(quest => {
                const questIdentifier = quest['Quete'];
                const xpReward = quest['XP / Quête'];
                const isDone = quest['Statut'] === 'TRUE' || quest['Statut'] === 'VRAI' || quest['Statut'] === true;

                const questItem = document.createElement('div');
                questItem.className = 'quest-item';
                questItem.setAttribute('data-quest-id', questIdentifier);
                if (isDone) {
                    questItem.classList.add('quest-done');
                }

                const questInfo = document.createElement('div');
                questInfo.className = 'quest-info';
                questInfo.innerHTML = `
                <strong>[${quest['Arc'] || 'N/A'}]</strong> ${quest['Quete'] || 'Quête sans nom'} 
                <br>
                <small>Fréquence: ${quest['Fréquence'] || 'N/A'} | Intensité: ${quest['Intensité'] || 'N/A'}</small>`;

                const xpLabel = document.createElement('span');
                xpLabel.className = 'xp-label';
                xpLabel.textContent = `+${xpReward || 0} XP`;

                // --- [MISE À JOUR] ---
                // Conteneur pour les boutons
                const questActions = document.createElement('div');
                questActions.className = 'quest-actions'; // (Tu peux styliser .quest-actions en flex)

                const completeButton = document.createElement('button');
                completeButton.textContent = isDone ? 'Accomplie !' : 'Accomplir';
                completeButton.disabled = isDone;
                completeButton.onclick = () => {
                    completeQuest(quest);
                };

                // Ajout du bouton POUBELLE
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '🗑️'; // Ou 'Suppr.'
                deleteButton.className = 'delete-btn'; // Pour le style
                deleteButton.style.backgroundColor = '#a83232';
                deleteButton.onclick = () => {
                    handleDeleteQuest(questIdentifier);
                };
                // --- [FIN MISE À JOUR] ---


                questItem.appendChild(questInfo);
                questItem.appendChild(xpLabel);

                // Ajout des boutons au conteneur d'actions
                questActions.appendChild(completeButton);
                questActions.appendChild(deleteButton);
                questItem.appendChild(questActions); // Ajout du conteneur

                listElement.appendChild(questItem);
            });
        } else {
            listElement.innerHTML = '<p>Erreur: Le format de données reçu pour les quêtes est inattendu.</p>';
        }

    } catch (error) {
        listElement.innerHTML = '<p>Erreur: Impossible de contacter le Registre du Destin (Quêtes). Vérifiez la console.</p>';
        console.error('Erreur lors du chargement des quêtes:', error);
    }

}


async function loadMilestones() {
    const listElement = document.getElementById('milestones-list');
    listElement.innerHTML = '<p>Chargement du Sanctuaire des Paliers...</p>';

    try {
        const response = await fetch(PALIERS_API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            listElement.innerHTML = '<p>Aucun Palier majeur trouvé.</p>';
            return;
        }

        const milestonesByArc = {};
        data.forEach(palier => {
            const arcName = palier['Arc Associé'] || 'Non assigné';
            if (!milestonesByArc[arcName]) {
                milestonesByArc[arcName] = [];
            }
            milestonesByArc[arcName].push(palier);
        });

        listElement.innerHTML = '';

        for (const arcName in milestonesByArc) {

            const arcGroup = document.createElement('div');
            arcGroup.className = 'milestone-arc-group';

            const arcDetails = globalArcsData.find(a => a["ID Arc"] === arcName);
            const arcDisplayName = arcDetails ? arcDetails["Nom Modifiable"] : arcName;

            arcGroup.innerHTML = `<h3>${arcDisplayName}</h3>`;

            const arcPaliersList = document.createElement('div');

            const sortedPaliers = milestonesByArc[arcName].sort((a, b) => {
                const aDone = a['Atteint?'] === 'VRAI' || a['Atteint?'] === 'TRUE';
                const bDone = b['Atteint?'] === 'VRAI' || b['Atteint?'] === 'TRUE';
                return aDone - bDone;
            });

            sortedPaliers.forEach(palier => {
                const isAchieved = palier['Atteint?'] === 'VRAI' || palier['Atteint?'] === 'TRUE';
                const description = palier['Description'] || 'Palier sans nom';
                const xpFixed = palier['XP Obtenue (Fixe)'] || 0;
                const difficulte = palier['Difficulté'] || 'N/A';

                const palierItem = document.createElement('div');
                palierItem.className = 'quest-item';
                palierItem.style.backgroundColor = isAchieved ? '#4d7c0f' : '#6b4d3b';
                palierItem.setAttribute('data-milestone-id', description);

                const info = document.createElement('div');
                info.className = 'quest-info';
                info.innerHTML = `<strong>[${difficulte}]</strong> ${description}`;

                const xpLabel = document.createElement('span');
                xpLabel.className = 'xp-label';
                xpLabel.style.backgroundColor = '#f59e0b';
                xpLabel.textContent = `+${xpFixed} XP`;

                // --- [MISE À JOUR] ---
                const palierActions = document.createElement('div');
                palierActions.className = 'quest-actions';

                const completeButton = document.createElement('button');
                completeButton.style.marginLeft = '10px';
                completeButton.textContent = isAchieved ? 'DÉBLOQUÉ' : 'Valider';
                completeButton.disabled = isAchieved;

                if (!isAchieved) {
                    completeButton.onclick = () => {
                        completeMilestone(description, xpFixed);
                    };
                }

                // Ajout du bouton POUBELLE
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '🗑️';
                deleteButton.className = 'delete-btn';
                deleteButton.style.backgroundColor = '#a83232';
                deleteButton.onclick = () => {
                    handleDeleteMilestone(description);
                };
                // --- [FIN MISE À JOUR] ---

                palierItem.appendChild(info);
                palierItem.appendChild(xpLabel);

                // Ajout des boutons au conteneur
                palierActions.appendChild(completeButton);
                palierActions.appendChild(deleteButton);
                palierItem.appendChild(palierActions);

                arcPaliersList.appendChild(palierItem);
            });

            arcGroup.appendChild(arcPaliersList);
            listElement.appendChild(arcGroup);
        }

    } catch (error) {
        console.error('Erreur lors du chargement des paliers:', error);
        listElement.innerHTML = '<p>Erreur de connexion au Registre du Destin (Paliers).</p>';
    }
}

async function loadArcs() {
    const listElement = document.getElementById('arc-list-manager');
    listElement.innerHTML = '<p>Chargement des Arcs...</p>';

    try {
        const response = await fetch(ARCS_API_URL);
        const data = await response.json();

        if (Array.isArray(data) && data.length > 0) {

            // --- DÉBUT DU PATCH ---
            // 1. Stocke les données globalement pour le formulaire de création
            globalArcsData = data;
            // 2. APPELLE LA FONCTION pour remplir le <select> !
            populateArcOptions(globalArcsData);
            // --- FIN DU PATCH ---

            listElement.innerHTML = ''; // Nettoie la liste de *gestion*

            // Le reste de ta fonction continue pour remplir la liste de gestion...
            data.forEach(arc => {
                const arcID = arc['ID Arc'];
                const arcName = arc['Nom Modifiable'];

                const li = document.createElement('li');

                // Crée les éléments
                const idLabel = document.createElement('span');
                idLabel.textContent = `[${arcID}]`;

                const nameLabel = document.createElement('span');
                nameLabel.className = 'arc-name';
                nameLabel.textContent = arcName;

                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.value = arcName;
                inputField.style.display = 'none'; // Caché par défaut

                const editButton = document.createElement('button');
                editButton.textContent = 'Modifier';

                const saveButton = document.createElement('button');
                saveButton.textContent = 'Sauver';
                saveButton.style.display = 'none'; // Caché par défaut

                // Logique d'édition
                editButton.onclick = () => {
                    nameLabel.style.display = 'none';
                    editButton.style.display = 'none';
                    inputField.style.display = 'block';
                    saveButton.style.display = 'block';
                };

                // Logique de sauvegarde
                saveButton.onclick = async () => {
                    const newName = inputField.value;
                    const success = await updateArcName(arcID, newName);

                    if (success) {
                        nameLabel.textContent = newName;
                        nameLabel.style.display = 'block';
                        editButton.style.display = 'block';
                        inputField.style.display = 'none';
                        saveButton.style.display = 'none';
                        // Idéalement, il faudrait aussi recharger les Quêtes 
                        // pour mettre à jour les dropdowns (si on en avait).
                    }
                };

                // Ajoute les éléments au DOM
                li.appendChild(idLabel);
                li.appendChild(nameLabel);
                li.appendChild(inputField);
                li.appendChild(editButton);
                li.appendChild(saveButton);
                listElement.appendChild(li);
            });
        } else {
            listElement.innerHTML = '<p>Aucun Arc Narratif trouvé.</p>';
            // S'il n'y a pas d'arcs, on le dit aussi dans le dropdown
            populateArcOptions([]);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des Arcs:', error);
        listElement.innerHTML = '<p>Erreur de connexion (Arcs).</p>';
    }
}


/**
 * Remplit TOUTES les listes déroulantes des Arcs.
 * @param {Array} arcs - Le tableau des objets Arcs (venant de globalArcsData)
 */
function populateArcOptions(arcs) {

    const questSelect = document.getElementById('quest-arc-select');
    const milestoneSelect = document.getElementById('milestone-arc-select');

    const selects = [questSelect, milestoneSelect];

    selects.forEach(selectElement => {
        if (!selectElement) {
            console.warn("Un élément <select> d'Arc n'a pas été trouvé.");
            return; // Pas grave si l'un n'existe pas, on continue
        }

        selectElement.innerHTML = '<option value="">-- Choisir un Arc --</option>';

        arcs.forEach(arc => {
            const idArc = arc["ID Arc"];
            const nomArc = arc["Nom Modifiable"];

            if (idArc && nomArc) {
                const option = document.createElement('option');
                option.value = idArc;
                option.textContent = nomArc;
                selectElement.appendChild(option);
            }
        });
    });

    // --- CORRECTION AJOUTÉE ---
    // Maintenant que les <select> sont pleins, on active le bouton !
    const questButton = document.getElementById('btn-submit-quest');
    if (questButton) {
        if (arcs.length > 0) {
            questButton.disabled = false; // On retire la désactivation
            questButton.innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter la Quête'; // On change le texte
        } else {
            // S'il n'y a pas d'arcs, on affiche une erreur
            questButton.innerHTML = 'Erreur: Arcs non chargés';
            // et on le laisse désactivé
        }
    }
    // --- FIN DE LA CORRECTION ---
}


async function loadMilestones() {
    const listElement = document.getElementById('milestones-list');
    listElement.innerHTML = '<p>Chargement du Sanctuaire des Paliers...</p>';

    try {
        const response = await fetch(PALIERS_API_URL);
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            listElement.innerHTML = '<p>Aucun Palier majeur trouvé.</p>';
            return;
        }

        const milestonesByArc = {};
        data.forEach(palier => {
            const arcName = palier['Arc Associé'] || 'Non assigné';
            if (!milestonesByArc[arcName]) {
                milestonesByArc[arcName] = [];
            }
            milestonesByArc[arcName].push(palier);
        });

        listElement.innerHTML = '';

        for (const arcName in milestonesByArc) {

            const arcGroup = document.createElement('div');
            arcGroup.className = 'milestone-arc-group';

            const arcDetails = globalArcsData.find(a => a["ID Arc"] === arcName);
            const arcDisplayName = arcDetails ? arcDetails["Nom Modifiable"] : arcName;

            arcGroup.innerHTML = `<h3>${arcDisplayName}</h3>`;

            const arcPaliersList = document.createElement('div');

            const sortedPaliers = milestonesByArc[arcName].sort((a, b) => {
                const aDone = a['Atteint?'] === 'VRAI' || a['Atteint?'] === 'TRUE';
                const bDone = b['Atteint?'] === 'VRAI' || b['Atteint?'] === 'TRUE';
                return aDone - bDone;
            });

            sortedPaliers.forEach(palier => {
                const isAchieved = palier['Atteint?'] === 'VRAI' || palier['Atteint?'] === 'TRUE';
                const description = palier['Description'] || 'Palier sans nom';
                const xpFixed = palier['XP Obtenue (Fixe)'] || 0;
                const difficulte = palier['Difficulté'] || 'N/A';

                const palierItem = document.createElement('div');
                palierItem.className = 'quest-item';
                palierItem.style.backgroundColor = isAchieved ? '#4d7c0f' : '#6b4d3b';
                palierItem.setAttribute('data-milestone-id', description);

                const info = document.createElement('div');
                info.className = 'quest-info';
                info.innerHTML = `<strong>[${difficulte}]</strong> ${description}`;

                const xpLabel = document.createElement('span');
                xpLabel.className = 'xp-label';
                xpLabel.style.backgroundColor = '#f59e0b';
                xpLabel.textContent = `+${xpFixed} XP`;

                // --- [MISE À JOUR] ---
                const palierActions = document.createElement('div');
                palierActions.className = 'quest-actions';

                const completeButton = document.createElement('button');
                completeButton.style.marginLeft = '10px';
                completeButton.textContent = isAchieved ? 'DÉBLOQUÉ' : 'Valider';
                completeButton.disabled = isAchieved;

                if (!isAchieved) {
                    completeButton.onclick = () => {
                        completeMilestone(description, xpFixed);
                    };
                }

                // Ajout du bouton POUBELLE
                const deleteButton = document.createElement('button');
                deleteButton.textContent = '🗑️';
                deleteButton.className = 'delete-btn';
                deleteButton.style.backgroundColor = '#a83232';
                deleteButton.onclick = () => {
                    handleDeleteMilestone(description);
                };
                // --- [FIN MISE À JOUR] ---

                palierItem.appendChild(info);
                palierItem.appendChild(xpLabel);

                // Ajout des boutons au conteneur
                palierActions.appendChild(completeButton);
                palierActions.appendChild(deleteButton); // <-- CORRECTION ICI

                palierItem.appendChild(palierActions);

                arcPaliersList.appendChild(palierItem);
            });

            arcGroup.appendChild(arcPaliersList);
            listElement.appendChild(arcGroup);
        }

    } catch (error) {
        console.error('Erreur lors du chargement des paliers:', error);
        listElement.innerHTML = '<p>Erreur de connexion au Registre du Destin (Paliers).</p>';
    }
}


/**
 * Gère le processus de complétion d'un Palier.
 * @param {string} description - L'identifiant du Palier (sa description)
 * @param {number} xp - L'XP fixe à gagner
 */
async function completeMilestone(description, xp) {

    const xpNumeric = parseInt(xp) || 0;

    // 1. Demander confirmation
    if (confirm(`As-tu vraiment atteint le Palier majeur : "${description}" ?\n\n(Gain unique : ${xpNumeric} XP)`)) {

        // 2. Appeler l'API pour marquer comme "Atteint?" = TRUE
        const success = await markMilestoneAsDone(description); // (Depuis api.js)

        if (success) {

            // --- DÉBUT DE LA CORRECTION ---
            // 3. Si le marquage a réussi, on AJOUTE l'XP (logique déplacée depuis onEdit)
            try {
                const player = await getPlayerStats(); // (Depuis api.js)
                if (!player) {
                    alert("ERREUR : Joueur introuvable pour ajouter l'XP.");
                    return;
                }

                const currentXP = parseInt(player["XP Actuelle"]) || 0;
                const newTotalXP = currentXP + xpNumeric;

                // On appelle l'API pour mettre à jour l'XP
                const xpSuccess = await updatePlayerXp(player.Nom, newTotalXP); // (Depuis api.js)

                if (!xpSuccess) {
                    alert("ERREUR : L'XP n'a pas pu être ajoutée, mais le palier est marqué comme 'Atteint'.");
                } else {
                    // L'alerte de victoire est maintenant ici
                    alert(`Triomphe ! Palier atteint : "${description}" ! +${xpNumeric} XP !`);
                }

            } catch (error) {
                console.error("Erreur lors de la mise à jour de l'XP du Palier:", error);
                alert("Erreur critique lors de la mise à jour de l'XP.");
            }
            // --- FIN DE LA CORRECTION ---


            // 4. Recharger les stats du joueur (pour la barre d'XP)
            await loadPlayerStats();

            // 5. Mettre à jour l'interface immédiatement
            const item = document.querySelector(`[data-milestone-id="${description}"]`);
            if (item) {
                item.style.backgroundColor = '#4d7c0f'; // Couleur "Atteint"
                const button = item.querySelector('button');
                button.disabled = true;
                button.textContent = 'DÉBLOQUÉ';
            }
        } else {
            alert("Échec de la validation du Palier. L'API a peut-être échoué (voir console).");
        }
    }
}



/**
 * Gère la suppression d'une quête.
 * @param {string} questName - L'identifiant de la quête
 */
async function handleDeleteQuest(questName) {
    // Confirmation
    if (confirm(`Veux-tu vraiment bannir la quête : "${questName}" ?\n(Cette action est irréversible)`)) {

        const success = await deleteQuest(questName);

        if (success) {
            // Supprime l'élément du DOM
            const item = document.querySelector(`[data-quest-id="${questName}"]`);
            if (item) {
                item.remove();
            }
            // Recharge les stats au cas où la quête supprimée était validée
            await loadPlayerStats();
            alert("Quête bannie !");
        } else {
            alert("Échec du bannissement. (Voir console)");
        }
    }
}

/**
 * Gère la suppression d'un palier.
 * @param {string} description - L'identifiant du palier
 */
async function handleDeleteMilestone(description) {
    // Confirmation
    if (confirm(`Veux-tu vraiment bannir le Palier : "${description}" ?\n(Cette action est irréversible)`)) {

        const success = await deleteMilestone(description);

        if (success) {
            // Supprime l'élément du DOM
            const item = document.querySelector(`[data-milestone-id="${description}"]`);
            if (item) {
                item.remove();
            }
            // Recharge les stats au cas où le palier supprimé était validé
            await loadPlayerStats();
            alert("Palier banni !");
        } else {
            alert("Échec du bannissement. (Voir console)");
        }
    }
}