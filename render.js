// --- Fichier : render.js (Mis à jour) ---
async function completeQuest(identifier, xp) {
    
    // Nettoyage de la chaîne XP pour retirer les espaces et garantir la conversion numérique
    const cleanedXpString = xp ? xp.toString().replace(/[^0-9]/g, '') : '0';
    const xpNumeric = parseInt(cleanedXpString) || 0;

    if (confirm(`Es-tu sûr d'avoir accompli : "${identifier}" ? (Gain potentiel de ${xpNumeric} XP)`)) {
        
        // 1. Tente de marquer la quête comme faite dans Sheets (PATCH)
        const success = await markQuestAsDone(identifier);

        if (success) {
            // 2. Rechargement des stats du joueur pour que la barre d'XP se mette à jour 
            //    (via la formule SOMME de Google Sheets).
            await loadPlayerStats();

            // 3. Mise à jour visuelle immédiate du Frontend
            alert(`Victoire ! ${identifier} accomplie ! L'XP a été ajouté à votre total.`);
            
            const item = document.querySelector(`[data-quest-id="${identifier}"]`);
            if (item) {
                item.style.opacity = 0.5;
                item.querySelector('button').disabled = true;
                item.querySelector('button').textContent = 'Accomplie !';
            }
        }
    }
}
async function loadPlayerStats() {
    const statsElement = document.getElementById('player-stats');
    
    try {
        const response = await fetch(PLAYER_API_URL);
        const data = await response.json(); 

        if (Array.isArray(data) && data.length > 0) { 
            const player = data[0]; 
            // Clés basées sur la feuille Joueur transposée
            const currentXP = parseInt(player['XP Actuelle']) || 0;
            const currentLevel = parseInt(player['Niveau']) || 1;
            
            // Formule simple pour l'affichage de progression
            const nextLevelXP = currentLevel * 1000; 

            statsElement.innerHTML = `
                <h2>${player['Nom'] || 'Héros Inconnu'} <small>(Niveau ${currentLevel})</small></h2>
                <p>XP Totale : ${currentXP} / ${nextLevelXP}</p>
                <div class="xp-bar-container" style="background-color: #3b3b64; height: 15px; border-radius: 5px;">
                    <div class="xp-bar" 
                         style="width: ${Math.min(100, (currentXP / nextLevelXP) * 100)}%; 
                                background-color: #00bcd4; height: 100%; border-radius: 5px;">
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
    // NOTE: loadingMessage a été retiré de la nouvelle structure HTML.
    // L'élément est ici commenté pour éviter le crash.

    // Affiche un message de chargement tant que le fetch n'a pas réussi
    listElement.innerHTML = '<p>Chargement des quêtes...</p>'; 

    try {
        const response = await fetch(QUOTES_API_URL);
        if (!response.ok) {
            throw new Error(`Erreur HTTP! Statut: ${response.status}`);
        }

        const data = await response.json();
        console.log("Données Quêtes reçues :", data); 
        console.log("Nombre d'éléments :", data.length);
        
        if (Array.isArray(data)) {
            
            // Nettoie l'élément de la quête (plus besoin de loadingMessage.style.display)
            listElement.innerHTML = ''; 

            if (data.length === 0) {
                listElement.innerHTML = '<p>Aucune quête trouvée. Ajoutez des entrées !</p>';
                return;
            }

            data.forEach(quest => {
                // Clés basées sur le format de votre CSV
                const questIdentifier = quest['Quete']; 
                const xpReward = quest['XP / Quête'];
                const isDone = quest['Statut'] === 'TRUE' || quest['Statut'] === 'VRAI' || quest['Statut'] === true; // Vérifie le statut

                const questItem = document.createElement('div');
                questItem.className = 'quest-item';
                questItem.setAttribute('data-quest-id', questIdentifier);
                if (isDone) {
                    questItem.style.opacity = 0.5;
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

                const completeButton = document.createElement('button');
                completeButton.textContent = isDone ? 'Accomplie !' : 'Accomplir';
                completeButton.disabled = isDone;
                completeButton.onclick = () => {
                    completeQuest(questIdentifier, xpReward);
                };

                questItem.appendChild(questInfo);
                questItem.appendChild(xpLabel);
                questItem.appendChild(completeButton);
                listElement.appendChild(questItem);
            });
        } else {
            listElement.innerHTML = '<p>Erreur: Le format de données reçu pour les quêtes est inattendu.</p>';
        }

    } catch (error) {
        // Affiche l'erreur dans l'élément listElement
        listElement.innerHTML = '<p>Erreur: Impossible de contacter le Registre du Destin (Quêtes). Vérifiez la console.</p>'; 
        console.error('Erreur lors du chargement des quêtes:', error);
    }
}
async function loadMilestones() {
    const listElement = document.getElementById('milestones-list');
    
    try {
        const response = await fetch(PALIERS_API_URL);
        const data = await response.json(); 

        if (Array.isArray(data) && data.length > 0) {
            listElement.innerHTML = '';

            data.forEach(palier => {
                // Clé basée sur la feuille Sanctuaire des Paliers
                const isAchieved = palier['Atteint?'] === 'VRAI' || palier['Atteint?'] === 'TRUE'; 

                const palierItem = document.createElement('div');
                palierItem.className = 'quest-item';
                palierItem.style.backgroundColor = isAchieved ? '#4d7c0f' : '#6b4d3b'; 

                palierItem.innerHTML = `
                    <div class="quest-info">
                        <strong>[${palier['Arc Associé'] || 'N/A'}]</strong> ${palier['Description'] || 'Palier sans nom'}
                        <br>
                        <small>Difficulté: ${palier['Difficulté'] || 'N/A'}</small>
                    </div>
                    <span class="xp-label" style="background-color: #f59e0b;">
                        +${palier['XP Obtenue (Fixe)'] || 0} XP (Palier)
                    </span>
                    <button disabled style="margin-left: 10px;">${isAchieved ? 'DÉBLOQUÉ' : 'EN COURS'}</button>
                `;

                listElement.appendChild(palierItem);
            });

        } else {
            listElement.innerHTML = '<p>Aucun Palier majeur trouvé.</p>';
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
            // Pas grave si l'un n'existe pas, on continue
            console.warn("Un élément <select> d'Arc n'a pas été trouvé.");
            return;
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
}



/**
 * [VERSION MISE À JOUR]
 * Charge les Paliers et les affiche groupés par Arc,
 * avec des boutons de complétion fonctionnels.
 */
async function loadMilestones() {
    const listElement = document.getElementById('milestones-list');
    listElement.innerHTML = '<p>Chargement du Sanctuaire des Paliers...</p>';
    
    try {
        const response = await fetch(PALIERS_API_URL); // Défini dans config.js
        const data = await response.json(); 

        if (!Array.isArray(data) || data.length === 0) {
            listElement.innerHTML = '<p>Aucun Palier majeur trouvé.</p>';
            return;
        }

        // --- Logique de Groupement ---
        const milestonesByArc = {};
        data.forEach(palier => {
            const arcName = palier['Arc Associé'] || 'Non assigné'; // Clé du CSV
            if (!milestonesByArc[arcName]) {
                milestonesByArc[arcName] = [];
            }
            milestonesByArc[arcName].push(palier);
        });
        
        listElement.innerHTML = ''; // Nettoie le conteneur

        // --- Logique de Rendu (Refactorisée) ---
        for (const arcName in milestonesByArc) {
            
            const arcGroup = document.createElement('div');
            arcGroup.className = 'milestone-arc-group';
            
            // On cherche le nom lisible de l'Arc (ex: "🩻 Santé")
            const arcDetails = globalArcsData.find(a => a["ID Arc"] === arcName);
            const arcDisplayName = arcDetails ? arcDetails["Nom Modifiable"] : arcName;
            
            arcGroup.innerHTML = `<h3>${arcDisplayName}</h3>`;

            const arcPaliersList = document.createElement('div');

            // Tri : Paliers non atteints en premier
            const sortedPaliers = milestonesByArc[arcName].sort((a, b) => {
                const aDone = a['Atteint?'] === 'VRAI' || a['Atteint?'] === 'TRUE';
                const bDone = b['Atteint?'] === 'VRAI' || b['Atteint?'] === 'TRUE';
                return aDone - bDone; // false (0) vient avant true (1)
            });

            sortedPaliers.forEach(palier => {
                const isAchieved = palier['Atteint?'] === 'VRAI' || palier['Atteint?'] === 'TRUE';
                const description = palier['Description'] || 'Palier sans nom';
                const xpFixed = palier['XP Obtenue (Fixe)'] || 0;
                const difficulte = palier['Difficulté'] || 'N/A';

                // 1. Créer l'item principal
                const palierItem = document.createElement('div');
                palierItem.className = 'quest-item';
                palierItem.style.backgroundColor = isAchieved ? '#4d7c0f' : '#6b4d3b';
                // Ajout de l'attribut pour la sélection (utilisé dans completeMilestone)
                palierItem.setAttribute('data-milestone-id', description);

                // 2. Créer l'info
                const info = document.createElement('div');
                info.className = 'quest-info';
                info.innerHTML = `<strong>[${difficulte}]</strong> ${description}`;

                // 3. Créer le label d'XP
                const xpLabel = document.createElement('span');
                xpLabel.className = 'xp-label';
                xpLabel.style.backgroundColor = '#f59e0b';
                xpLabel.textContent = `+${xpFixed} XP`;

                // 4. Créer le bouton
                const completeButton = document.createElement('button');
                completeButton.style.marginLeft = '10px';
                completeButton.textContent = isAchieved ? 'DÉBLOQUÉ' : 'Valider';
                completeButton.disabled = isAchieved;
                
                // C'est ici que la magie opère !
                if (!isAchieved) {
                    completeButton.onclick = () => {
                        completeMilestone(description, xpFixed);
                    };
                }

                // 5. Assembler
                palierItem.appendChild(info);
                palierItem.appendChild(xpLabel);
                palierItem.appendChild(completeButton);
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


// --- Ajout dans render.js ---

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
        const success = await markMilestoneAsDone(description);

        if (success) {
            // 3. Recharger les stats du joueur (pour la barre d'XP)
            await loadPlayerStats();

            // 4. Mettre à jour l'interface immédiatement
            alert(`Triomphe ! Palier atteint : "${description}" ! +${xpNumeric} XP !`);
            
            // Cible l'élément grâce à un attribut que nous allons ajouter (voir Mission 3)
            const item = document.querySelector(`[data-milestone-id="${description}"]`);
            if (item) {
                // Change la couleur et désactive le bouton
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