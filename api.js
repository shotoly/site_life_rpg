// --- api.js (Version Furtive : Tunneling POST + Text/Plain) ---

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

    // --- DÉBUT DE LA LOGIQUE ---

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

    // 4. Mettre à jour la feuille de Quête (Statut et Compteur)
    // MODIFICATION FURTIVE : On ajoute &method=PATCH à l'URL
    const patchQuestUrl = QUOTES_API_URL + "&method=PATCH";

    const questUpdateData = {
        data: {
            "find_key_column": "Quete",
            "find_key_value": identifier,
            "Statut": newStatus,
            "": newCounter
        }
    };

    // MODIFICATION FURTIVE : Envoi en POST avec text/plain
    const questPatchResponse = await fetch(patchQuestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
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
            "find_key_column": "ID Arc",
            "find_key_value": arcID,
            "Nom Modifiable": newName
        }
    };

    // MODIFICATION FURTIVE : URL + méthode PATCH
    const patchUrl = ARCS_API_URL + "&method=PATCH";

    // MODIFICATION FURTIVE : POST + text/plain
    const patchResponse = await fetch(patchUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
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
 * @param {Object} questDataObject - Un OBJET de données
 */
async function createQuest(questDataObject) {

    const dataToSend = {
        data: {
            ...questDataObject,
            "Statut": false, // Une nouvelle quête n'est pas faite
        }
    };

    const postUrl = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;

    try {
        // MODIFICATION FURTIVE : POST + text/plain
        const postResponse = await fetch(postUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(dataToSend)
        });

        if (postResponse.ok) {
            console.log(`Nouvelle Quête créée: ${questDataObject.Quete}`);
            return true;
        } else {
            // Note: text() peut échouer si la réponse est vide, mais pour le debug c'est ok
            console.error(`Impossible de créer la quête. Statut: ${postResponse.status}.`);
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
    const dataToSend = {
        data: {
            ...milestoneData,
            "Atteint?": false // Un nouveau palier n'est pas atteint
        }
    };

    const postUrl = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;

    // MODIFICATION FURTIVE : POST + text/plain
    const postResponse = await fetch(postUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(dataToSend)
    });

    if (postResponse.ok) {
        console.log(`Nouveau Palier créé: ${milestoneData.Description}`);
        alert("Palier ajouté !");
        return true;
    } else {
        console.error(`Impossible de créer le palier. Statut: ${postResponse.status}.`);
        alert(`ÉCHEC CRÉATION PALIER ! (Code: ${postResponse.status}).`);
        return false;
    }
}


/**
 * Marque un Palier (Milestone) comme 'Atteint' (TRUE).
 * @param {string} identifier - La description unique du Palier.
 */
async function markMilestoneAsDone(identifier) {
    // MODIFICATION FURTIVE : URL + méthode PATCH
    const updateUrl = PALIERS_API_URL + "&method=PATCH";

    const dataToSend = {
        data: {
            "find_key_column": "Description",
            "find_key_value": identifier,
            "Atteint?": true
        }
    };

    // MODIFICATION FURTIVE : POST + text/plain
    const patchResponse = await fetch(updateUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(dataToSend)
    });

    if (patchResponse.ok) {
        console.log(`Palier marqué comme atteint: ${identifier}`);
        return true;
    } else {
        console.error(`Impossible de mettre à jour le Palier. Statut: ${patchResponse.status}.`);
        return false;
    }
}

// --- Suppressions ---

/**
 * Supprime une Quête en utilisant sa description (Quete) comme clé.
 * @param {string} questName - L'identifiant (la description) de la quête.
 */
async function deleteQuest(questName) {
    // MODIFICATION FURTIVE : URL + méthode DELETE
    const deleteUrl = QUOTES_API_URL + "&method=DELETE";

    const dataToSend = {
        data: {
            "find_key_column": "Quete",
            "find_key_value": questName,
        }
    };

    // MODIFICATION FURTIVE : POST + text/plain
    const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(dataToSend)
    });

    if (deleteResponse.ok) {
        console.log(`Quête supprimée: ${questName}`);
        return true;
    } else {
        console.error(`Impossible de supprimer la quête. Statut: ${deleteResponse.status}.`);
        return false;
    }
}

/**
 * Supprime un Palier en utilisant sa Description comme clé.
 * @param {string} description - L'identifiant (la description) du palier.
 */
async function deleteMilestone(description) {
    // MODIFICATION FURTIVE : URL + méthode DELETE
    const deleteUrl = PALIERS_API_URL + "&method=DELETE";

    const dataToSend = {
        data: {
            "find_key_column": "Description",
            "find_key_value": description,
        }
    };

    // MODIFICATION FURTIVE : POST + text/plain
    const deleteResponse = await fetch(deleteUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: JSON.stringify(dataToSend)
    });

    if (deleteResponse.ok) {
        console.log(`Palier supprimé: ${description}`);
        return true;
    } else {
        console.error(`Impossible de supprimer le palier. Statut: ${deleteResponse.status}.`);
        return false;
    }
}

async function getPlayerStats() {
    // Le GET reste un GET standard (Fonctionne déjà)
    const response = await fetch(PLAYER_API_URL);
    if (!response.ok) {
        console.error("Impossible de charger les stats du joueur.");
        return null;
    }
    const data = await response.json();
    return data[0];
}

/**
 * Met à jour l'XP du joueur dans la feuille.
 * @param {string} playerName - Le nom du joueur (la clé de recherche).
 * @param {number} newTotalXp - La nouvelle valeur d'XP.
 */
async function updatePlayerXp(playerName, newTotalXp) {
    // MODIFICATION FURTIVE : URL + méthode PATCH
    const patchUrl = PLAYER_API_URL + "&method=PATCH";

    const updateData = {
        data: {
            "find_key_column": "Nom",
            "find_key_value": playerName,
            "XP Actuelle": newTotalXp
        }
    };

    // MODIFICATION FURTIVE : POST + text/plain
    const patchResponse = await fetch(patchUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(updateData)
    });

    return patchResponse.ok;
}