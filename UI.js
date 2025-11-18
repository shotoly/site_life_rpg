// Fichier : UI.js (Ce que je suppose qu'il contient)

console.log("Parchemin UI.js chargé.");

// --- GESTION DE LA MODALE DE QUÊTE ---
const openQuestModalBtn = document.getElementById('btn-open-quest-modal');
const closeQuestModalBtn = document.getElementById('btn-close-quest-modal');
const questModalOverlay = document.getElementById('modal-quest-overlay');

if (openQuestModalBtn && questModalOverlay) {
    // Ouvre la modale
    openQuestModalBtn.addEventListener('click', () => {
        console.log("Clic détecté: Ouverture modale"); 
        questModalOverlay.classList.add('active');
    });
}

if (closeQuestModalBtn && questModalOverlay) {
    // Ferme la modale avec le bouton (X)
    closeQuestModalBtn.addEventListener('click', () => {
        console.log("Clic détecté: Fermeture modale (croix)"); 
        questModalOverlay.classList.remove('active');
    });
}

if (questModalOverlay) {
    // Ferme la modale en cliquant sur l'overlay (le fond gris)
    questModalOverlay.addEventListener('click', (event) => {
        if (event.target === questModalOverlay) {
            console.log("Clic détecté: Fermeture modale (overlay)");
            questModalOverlay.classList.remove('active');
        }
    });
}