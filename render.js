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