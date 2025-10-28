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

// --- Dans api.js ---

/**
 * Ajoute une nouvelle quête (une ligne) à la feuille 'Répertoire des Quêtes'.
 * @param {Object} questDataObject - Un OBJET de données (pas un array)
 */
async function createQuest(questDataObject) {
    
    // On prépare les données pour la méthode POST de SheetDB
    const dataToSend = {
        data: {
            ...questDataObject,
            "Statut": false, // Une nouvelle quête n'est pas faite
            "XP / Quête": null // Laisse la formule Google Sheet calculer l'XP
        }
    };

    // URL de POST: on cible la feuille 'Répertoire des Quêtes'
    const postUrl = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
    
    try {
        const postResponse = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });

        if (postResponse.ok) {
            console.log(`Nouvelle Quête créée: ${questDataObject.Quete}`);
            return true;
        } else {
            const errorBody = await postResponse.text();
            console.error(`Impossible de créer la quête. Statut: ${postResponse.status}.`, errorBody);
            return false;
        }
    } catch (error) {
        console.error("Erreur lors de la création de la quête via API (fetch):", error);
        return false;
    }
}
/**
 * @param {Object} milestoneData 
 */
async function createMilestone(milestoneData) {
    // milestoneData ex: { "Arc Associé": "Arc II", "Description": "Test", ... }

    const dataToSend = {
        data: {
            ...milestoneData,
            "Atteint?": false // Un nouveau palier n'est pas atteint
        }
    };

    // URL de POST: on cible la feuille 'Sanctuaire des Paliers'
    const postUrl = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;
    
    const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });

    if (postResponse.ok) {
        console.log(`Nouveau Palier créé: ${milestoneData.Description}`);
        alert("Palier ajouté !");
        return true;
    } else {
        const errorBody = await postResponse.text();
        console.error(`Impossible de créer le palier. Statut: ${postResponse.status}.`, errorBody);
        alert(`ÉCHEC CRÉATION PALIER ! (Code: ${postResponse.status}).`);
        return false;
    }
}



/**
 * Marque un Palier (Milestone) comme 'Atteint' (TRUE).
 * @param {string} identifier - La description unique du Palier.
 */
async function markMilestoneAsDone(identifier) {
    // L'identifiant est la colonne "Description"
    const keyColumn = "Description";
    
    // [CORRECTION]
    // L'URL doit suivre le format: /API_ID/Nom_Colonne/Valeur
    // au lieu de ?key=...&value=...
    const updateUrl = `${BASE_API_URL}/${encodeURIComponent(keyColumn)}/${encodeURIComponent(identifier)}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;
    
    const dataToSend = {
        data: {
            "Atteint?": true // La colonne à mettre à jour
        }
    };
    
    const patchResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
    });

    if (patchResponse.ok) {
        console.log(`Palier marqué comme atteint: ${identifier}`);
        return true;
    } else {
        const errorBody = await patchResponse.text();
        // L'erreur 405 n'apparaîtra plus ici
        console.error(`Impossible de mettre à jour le Palier. Statut: ${patchResponse.status}.`, errorBody);
        return false;
    }
}

// --- Ajout dans api.js ---

/**
 * Supprime une Quête en utilisant sa description (Quete) comme clé.
 * @param {string} questName - L'identifiant (la description) de la quête.
 */
async function deleteQuest(questName) {
    const keyColumn = "Quete";
    
    // L'URL pour DELETE est : /API_ID/Colonne_Clé/Valeur_Clé
    const deleteUrl = `${BASE_API_URL}/${encodeURIComponent(keyColumn)}/${encodeURIComponent(questName)}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;

    const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (deleteResponse.ok) {
        console.log(`Quête supprimée: ${questName}`);
        return true;
    } else {
        const errorBody = await deleteResponse.text();
        console.error(`Impossible de supprimer la quête. Statut: ${deleteResponse.status}.`, errorBody);
        return false;
    }
}

/**
 * Supprime un Palier en utilisant sa Description comme clé.
 * @param {string} description - L'identifiant (la description) du palier.
 */
async function deleteMilestone(description) {
    const keyColumn = "Description";
    
    // L'URL pour DELETE
    const deleteUrl = `${BASE_API_URL}/${encodeURIComponent(keyColumn)}/${encodeURIComponent(description)}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;

    const deleteResponse = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (deleteResponse.ok) {
        console.log(`Palier supprimé: ${description}`);
        return true;
    } else {
        const errorBody = await deleteResponse.text();
        console.error(`Impossible de supprimer le palier. Statut: ${deleteResponse.status}.`, errorBody);
        return false;
    }
}