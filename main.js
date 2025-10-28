// --- main.js (Corrigé) ---

// [CORRECTION 1] Déclare la variable globale pour les Arcs
let globalArcsData = [];

function setupTabs() {
    const buttons = document.querySelectorAll('.tab-button');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;

            // Masquer tout le contenu et désactiver tous les boutons
            contents.forEach(content => content.classList.remove('active'));
            buttons.forEach(btn => btn.classList.remove('active'));

            // Afficher le contenu ciblé et activer le bouton
            document.getElementById(targetTab).classList.add('active');
            button.classList.add('active');
        });
    });
}


const form = document.getElementById('form-create-quest');
form.addEventListener('submit', handleCreateQuestSubmit);


async function handleCreateQuestSubmit(event) {
    event.preventDefault();
    console.log("Soumission du formulaire de création de quête (Mode Fetch/SheetDB)...");

    // 1. Récupérer les valeurs du formulaire
    const queteName = document.getElementById('quest-name-input').value;
    const arcId = document.getElementById('quest-arc-select').value;
    const frequency = document.getElementById('quest-frequency-select').value;
    const repetition = document.getElementById('quest-repetition-input').value;
    const intensity = document.getElementById('quest-intensity-select').value;

    // 2. Trouver le nom de l'Arc (l'icône + nom)
    const selectedArc = globalArcsData.find(a => a["ID Arc"] === arcId);
    if (!selectedArc) {
        console.error("Erreur: Arc non trouvé pour l'ID:", arcId);
        showToast("Erreur lors de la création de la quête (Arc non trouvé).", "error");
        return;
    }
    const arcName = selectedArc["Nom Modifiable"];

    // 3. CONSTRUIRE L'OBJET (correspondant aux noms des colonnes)
    // C'est la principale modification : on passe d'un Array [val1, val2] 
    // à un Objet { "colonne1": val1, "colonne2": val2 }
    
    const questDataObject = {
        "Nom de l'Arc": arcId,       // Colonne A (dans tes commentaires)
        "Arc": arcName,              // Colonne B
        "Fréquence": frequency,      // Colonne C
        "Quete": queteName,          // Colonne D
        // "XP / Quête" (E) est géré par api.js (mis à null)
        "Intensité": parseInt(intensity, 10), // Colonne F
        // "" (G) est ignoré
        "Répétition": parseInt(repetition, 10), // Colonne H
        // "Statut" (I) est géré par api.js (mis à false)
    };

    console.log("Données envoyées à l'API (Objet):", questDataObject);

    // 4. Appeler l'API avec le NOUVEL OBJET
    showToast("Création de la quête en cours...", "info");
    const success = await createQuest(questDataObject); // On envoie l'objet

    if (success) {
        showToast("Quête créée avec succès !", "success");
        // Réinitialiser et fermer le modal (si tu en as un)
        document.getElementById('form-create-quest').reset();
        
        // (Optionnel : si tu as un modal)
        // document.getElementById('quest-creation-modal').style.display = 'none';

        // Recharger les données
        // (Tu n'as pas fetchAllData, donc on appelle les fonctions individuelles)
        await loadQuests();
        
    } else {
        showToast("Échec de la création de la quête.", "error");
    }
}
const formMilestone = document.getElementById('form-create-milestone');
if (formMilestone) {
    formMilestone.addEventListener('submit', handleCreateMilestoneSubmit);
} else {
    console.warn("Le formulaire 'form-create-milestone' n'a pas été trouvé.");
}


async function handleCreateMilestoneSubmit(event) {
    event.preventDefault();
    console.log("Soumission du formulaire de création de Palier...");

    // 1. Récupérer les valeurs du formulaire
    const desc = document.getElementById('milestone-desc-input').value;
    const arcId = document.getElementById('milestone-arc-select').value;
    const difficulty = document.getElementById('milestone-difficulty-select').value;
    const xp = document.getElementById('milestone-xp-input').value;

    if (!globalArcsData) {
        alert("Erreur : Les données des Arcs ne sont pas prêtes.");
        return;
    }

    // 3. Construire l'objet de données
    const milestoneData = {
        "Arc Associé": arcId,
        "Description": desc,
        "Difficulté": difficulty,
        "XP Obtenue (Fixe)": parseInt(xp, 10)
    };

    // 4. Appeler l'API
    const success = await createMilestone(milestoneData);

    // 5. Réinitialiser et recharger
    if (success) {
        formMilestone.reset(); // Vider le formulaire
        await loadMilestones();
    }
}

// [CORRECTION 2] Rendre initApp 'async' pour contrôler l'ordre
async function initApp() {
    console.log("Life RPG démarré. Chargement des données du Registre du Destin...");

    // 1. Initialise la logique des onglets
    setupTabs();

    // 2. Déclenchement initial des fonctions
    // On doit 'await' les Arcs EN PREMIER, car les Paliers en dépendent.

    await loadArcs(); // Charge les Arcs (et remplit 'globalArcsData')

    // Maintenant que globalArcsData existe, on peut charger le reste
    loadPlayerStats();
    loadQuests();
    loadMilestones();
}



// Lancement de l'application
initApp();


// --- À AJOUTER À LA FIN DE main.js ---

/**
 * Affiche une notification (toast) à l'écran.
 * @param {string} message - Le message à afficher.
 * @param {string} type - 'success', 'error', ou 'info'
 */
function showToast(message, type = 'info') {
    // Crée l'élément toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`; // Assigne les classes CSS
    toast.textContent = message;

    // Ajoute le toast au body
    document.body.appendChild(toast);

    // Style pour le faire apparaître (après un court délai)
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translate(-50%, 0)';
    }, 100); 

    // Fait disparaître le toast après 3 secondes
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translate(-50%, -20px)';
        
        // Supprime l'élément du DOM après la transition
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 500); // Doit correspondre à la transition CSS
    }, 3000);
}