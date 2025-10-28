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
    event.preventDefault(); // Empêche la page de se recharger

    console.log("Soumission du formulaire de création de quête...");

    // 1. Récupérer les valeurs du formulaire
    const queteName = document.getElementById('quest-name-input').value;
    const arcId = document.getElementById('quest-arc-select').value; // ex: "Arc II"
    const frequency = document.getElementById('quest-frequency-select').value;
    const intensity = document.getElementById('quest-intensity-select').value;

    // 2. Retrouver le nom de l'Arc
    const selectedArc = globalArcsData.find(a => a["ID Arc"] === arcId);
    
    if (!selectedArc) {
        alert("Erreur : Arc sélectionné invalide.");
        return;
    }
    
    const arcName = selectedArc["Nom Modifiable"]; 

    // 3. Construire l'objet de données de la quête
    const questData = {
        "Quete": queteName,
        "Nom de l'Arc": arcId,
        "Arc": arcName,
        "Fréquence": frequency,
        "Intensité": parseInt(intensity, 10) 
    };

    // 4. Appeler l'API
    const success = await createQuest(questData);

    // 5. Réinitialiser et recharger
    if (success) {
        form.reset(); // Vider le formulaire
        
        // [CORRECTION 3] Correction du nom de la fonction (loadQuestsData -> loadQuests)
        await loadQuests(); 
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