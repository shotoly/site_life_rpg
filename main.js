// --- main.js ---

// --- VARIABLES GLOBALES ---
let globalArcsData = []; // Stocke les données des Arcs pour les réutiliser

// --- INITIALISATION ---

// Lancement de l'application
initApp();

/**
 * Fonction principale qui orchestre le chargement de l'application.
 * Rendue 'async' pour garantir que les Arcs sont chargés AVANT le reste.
 */
async function initApp() {
    console.log("Life RPG démarré. Chargement des données du Registre du Destin...");

    // 1. Initialise la logique des onglets
    setupTabs();

    // 2. Attache les écouteurs d'événements aux formulaires
    setupEventListeners();

    // 3. Déclenchement initial des fonctions de chargement
    // On 'await' les Arcs EN PREMIER, car les Quêtes et Paliers en dépendent.
    await loadArcs();

    // Maintenant que globalArcsData est rempli, on peut charger le reste
    loadPlayerStats();
    loadQuests();
    loadMilestones();
}

// --- GESTION DES ONGLETS (TABS) ---

/**
 * Configure la navigation par onglets (Quêtes, Paliers, etc.)
 */
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

// --- GESTIONNAIRES D'ÉVÉNEMENTS (FORMS) ---

/**
 * Attache les listeners 'submit' aux formulaires de création.
 */
function setupEventListeners() {
    // Formulaire de création de Quête
    const formQuest = document.getElementById('form-create-quest');
    if (formQuest) {
        formQuest.addEventListener('submit', handleCreateQuestSubmit);
    } else {
        console.warn("Le formulaire 'form-create-quest' n'a pas été trouvé.");
    }

    // Formulaire de création de Palier
    const formMilestone = document.getElementById('form-create-milestone');
    if (formMilestone) {
        formMilestone.addEventListener('submit', handleCreateMilestoneSubmit);
    } else {
        console.warn("Le formulaire 'form-create-milestone' n'a pas été trouvé.");
    }
}

/**
 * Gère la soumission du formulaire de création de Quête.
 */
async function handleCreateQuestSubmit(event) {
    event.preventDefault();
    console.log("Soumission du formulaire de création de quête...");

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

    // 3. Construire l'objet de données (correspondant aux colonnes GSheet)
    const questDataObject = {
        "Nom de l'Arc": arcId,
        "Arc": arcName,
        "Fréquence": frequency,
        "Quete": queteName,
        // "XP / Quête" (E) est géré par api.js (mis à null)
        "Intensité": parseInt(intensity, 10),
        // "" (G) est ignoré
        "Répétition": parseInt(repetition, 10),
        // "Statut" (I) est géré par api.js (mis à false)
    };

    console.log("Données envoyées à l'API (Objet):", questDataObject);

    // 4. Appeler l'API
    showToast("Création de la quête en cours...", "info");
    const success = await createQuest(questDataObject); // On envoie l'objet

    // 5. Gérer la réponse
    if (success) {
        showToast("Quête créée avec succès !", "success");
        document.getElementById('form-create-quest').reset();
        await loadQuests(); // Recharger les quêtes
    } else {
        showToast("Échec de la création de la quête.", "error");
    }
}

/**
 * Gère la soumission du formulaire de création de Palier.
 * [MISE À JOUR DE LA QUÊTE]
 */
async function handleCreateMilestoneSubmit(event) {
    event.preventDefault();
    console.log("Soumission du formulaire de création de Palier...");

    // 1. Récupérer les valeurs du formulaire
    const desc = document.getElementById('milestone-desc-input').value;
    const arcId = document.getElementById('milestone-arc-select').value;
    const difficulty = document.getElementById('milestone-difficulty-select').value;

    // [MODIFICATION] On supprime la récupération de l'XP manuelle
    // const xp = document.getElementById('milestone-xp-input').value; 

    if (!globalArcsData || globalArcsData.length === 0) {
        alert("Erreur : Les données des Arcs ne sont pas prêtes. Veuillez patienter.");
        return;
    }

    // 3. Construire l'objet de données
    const milestoneData = {
        "Arc Associé": arcId,
        "Description": desc,
        "Difficulté": difficulty,
        // [MODIFICATION] On envoie 'null' pour laisser Google Sheet calculer l'XP
        "XP Obtenue (Fixe)": null
    };

    // 4. Appeler l'API
    showToast("Création du Palier en cours...", "info");
    const success = await createMilestone(milestoneData);

    // 5. Réinitialiser et recharger
    if (success) {
        showToast("Palier créé avec succès !", "success");
        formMilestone.reset(); // Vider le formulaire
        await loadMilestones(); // Recharger les paliers
    } else {
        showToast("Échec de la création du Palier.", "error");
    }
}


// --- UTILITAIRES (Toasts) ---

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