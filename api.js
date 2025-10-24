// --- api.js ---

/**
 * Fonction d'aide pour marquer une quête comme faite dans Google Sheets (PATCH).
 */
async function markQuestAsDone(questName) {
    const updateData = {
        data: {
            "Statut": true 
        }
    };
    
    // URL de PATCH: on cible la colonne 'Quete' de la feuille 'Répertoire des Quêtes'
    const patchUrl = `${BASE_API_URL}/Quete/${encodeURIComponent(questName)}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
    
    const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (patchResponse.ok) {
        console.log(`Statut de quête mis à jour pour ${questName}.`);
    } else {
        const errorBody = await patchResponse.text();
        console.warn(`Impossible de sauvegarder l'état de la quête. Statut: ${patchResponse.status}.`, errorBody);
        alert(`ÉCHEC PERSISTANCE ! (Code: ${patchResponse.status}). Vérifiez que PATCH est activé.`);
    }
    return patchResponse.ok;
}

/**
 * Gère la complétion d'une quête et la mise à jour de l'état/XP.
 */
async function completeQuest(identifier, xp) {
    const cleanedXpString = xp ? xp.toString().replace(/[^0-9]/g, '') : '0';
    const xpNumeric = parseInt(cleanedXpString) || 0;

    if (confirm(`Es-tu sûr d'avoir accompli : "${identifier}" ? (Gain potentiel de ${xpNumeric} XP)`)) {
        
        const success = await markQuestAsDone(identifier);

        if (success) {
            // Rechargement des données nécessaires pour l'affichage
            await loadPlayerStats();
            await loadQuests(); // Recharger les quêtes pour mettre à jour l'état visuel

            alert(`Victoire ! ${identifier} accomplie ! L'XP a été ajouté à votre total.`);
        }
    }
}