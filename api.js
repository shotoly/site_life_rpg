// --- api.js ---

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

// --- api.js (Ajout) ---

async function updateArcName(arcID, newName) {
    const updateData = {
        data: {
            "Nom Modifiable": newName
        }
    };

    // Cible la feuille Arcs, colonne 'ID Arc', avec la valeur arcID
    const patchUrl = `${BASE_API_URL}/ID Arc/${encodeURIComponent(arcID)}?sheet=${encodeURIComponent(SHEET_NAME_ARCS)}`;
    
    const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    if (patchResponse.ok) {
        console.log(`Arc ${arcID} mis à jour : ${newName}`);
        alert("Nom de l'Arc sauvegardé !");
    } else {
        alert("Erreur lors de la sauvegarde de l'Arc.");
    }
    return patchResponse.ok;
}
// --- Ajout dans api.js ---

async function createQuest(questData) {
    // questData est un objet contenant les infos du formulaire
    // ex: { Quete: "Ma nouvelle quête", "Nom de l'Arc": "Arc I", Fréquence: "Unique", Intensité: 1 }

    const dataToSend = {
        data: {
            ...questData,
            "Statut": false, // Une nouvelle quête n'est pas accomplie par défaut
            "XP / Quête": 0  // L'XP sera calculé (ou mis à jour) par une autre logique
        }
    };

    // URL de POST: on cible la feuille 'Répertoire des Quêtes'
    // Contrairement à PATCH, on ne met pas d'identifiant dans l'URL
    const postUrl = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
    
    const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });

    if (postResponse.ok) {
        console.log(`Nouvelle quête créée: ${questData.Quete}`);
        alert("Quête ajoutée !");
        return true;
    } else {
        const errorBody = await postResponse.text();
        console.error(`Impossible de créer la quête. Statut: ${postResponse.status}.`, errorBody);
        alert(`ÉCHEC CRÉATION QUÊTE ! (Code: ${postResponse.status}). Vérifiez que POST est activé.`);
        return false;
    }
}