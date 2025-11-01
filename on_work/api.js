// --- api.js ---

// --- REMPLACEMENT (dans api.js) ---

/**
 * Logique complète de complétion de quête.
 * Gère l'ajout d'XP et la logique de répétition/décochage.
 * @param {object} questObject - L'OBJET de quête complet (lu depuis l'API).
 */
async function completeQuest(questObject) {

    // 1. Récupérer les données de la quête
    const identifier = questObject.Quete;
    const xpString = questObject["XP / Quête"] ? questObject["XP / Quête"].toString() : '0';
    const xpNumeric = parseInt(xpString.replace(/[^0-9]/g, '')) || 0;
    
    const repetitionNeeded = parseInt(questObject["Répétition"]) || 1;
    const frequency = questObject.Fréquence;
    
    // Assurer que le compteur (colonne G) est un nombre
    let currentCount = parseInt(questObject[""]) || 0; // Colonne G est vide ""

    // 2. Demander confirmation
    if (!confirm(`Es-tu sûr d'avoir accompli : "${identifier}" ? (Gain potentiel de ${xpNumeric} XP)`)) {
        return; // L'utilisateur a annulé
    }

    // --- DÉBUT DE LA LOGIQUE PORTÉE DEPUIS APPS SCRIPT ---

    let newStatus = true; // Par défaut, la quête reste cochée
    let newCounter = currentCount + 1;
    let questIsFinished = true; // Indique si la quête doit être rechargée
    
    // 3. Logique de Répétition
    if (frequency !== "Unique" && repetitionNeeded > 1) {
        
        if (newCounter < repetitionNeeded) {
            // --- Pas encore terminé ---
            newStatus = false; // On décoche la case
            questIsFinished = false; // La quête n'est pas "finie", juste "progressée"
            alert(`Progression : ${newCounter}/${repetitionNeeded} validée !`);

        } else {
            // --- C'est la dernière répétition ! ---
            newCounter = repetitionNeeded; // Bloquer au max
            newStatus = true; // Laisser la case cochée
            alert(`Quête complétée (${newCounter}/${repetitionNeeded}) !`);
        }
    }
    // Si c'est une quête simple (répétition = 1), newStatus reste TRUE.


    // 4. Mettre à jour la feuille de Quête (Statut et Compteur)
    const patchQuestUrl = `${BASE_API_URL}/Quete/${encodeURIComponent(identifier)}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
    const questUpdateData = {
        data: {
            "Statut": newStatus,
            "": newCounter // Met à jour la colonne G (Compteur)
        }
    };
    
    const questPatchResponse = await fetch(patchQuestUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questUpdateData)
    });

    if (!questPatchResponse.ok) {
        alert("ERREUR : Impossible de sauvegarder l'état de la quête.");
        return; // Arrêter si la sauvegarde échoue
    }

    // 5. Mettre à jour l'XP du Joueur
    try {
        const player = await getPlayerStats();
        if (!player) {
            alert("ERREUR : Joueur introuvable pour ajouter l'XP.");
            return;
        }

        const currentXP = parseInt(player["XP Actuelle"]) || 0;
        const newTotalXP = currentXP + xpNumeric;

        const xpSuccess = await updatePlayerXp(player.Nom, newTotalXP);

        if (xpSuccess) {
            alert(`Victoire ! ${xpNumeric} XP ajoutés ! Total : ${newTotalXP} XP.`);
        } else {
            alert("ERREUR : L'XP n'a pas pu être ajoutée.");
        }

    } catch (error) {
        console.error("Erreur lors de la mise à jour de l'XP:", error);
        alert("Erreur critique lors de la mise à jour de l'XP.");
    }

    // 6. Recharger les données
    await loadPlayerStats(); // Mettre à jour le dashboard
    await loadQuests(); // Mettre à jour la liste des quêtes (pour voir le décochage)
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

async function getPlayerStats() {
    // On suppose qu'il n'y a qu'une seule ligne de joueur
    const response = await fetch(PLAYER_API_URL);
    if (!response.ok) {
        console.error("Impossible de charger les stats du joueur.");
        return null;
    }
    const data = await response.json();
    // On retourne le premier (et unique) objet joueur
    return data[0]; 
}

/**
 * Met à jour l'XP du joueur dans la feuille.
 * @param {string} playerName - Le nom du joueur (la clé de recherche).
 * @param {number} newTotalXp - La nouvelle valeur d'XP.
 */
async function updatePlayerXp(playerName, newTotalXp) {
    const patchUrl = `${BASE_API_URL}/Nom/${encodeURIComponent(playerName)}?sheet=${encodeURIComponent(SHEET_NAME_JOUEUR)}`;
    
    const updateData = {
        data: {
            "XP Actuelle": newTotalXp
        }
    };

    const patchResponse = await fetch(patchUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
    });

    return patchResponse.ok;
}

