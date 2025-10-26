// --- main.js ---


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
// --- Ajout dans main.js (dans la section d'initialisation) ---

// --- Ajout dans main.js (dans la section d'initialisation) ---

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

    // 2. Retrouver le nom de l'Arc (ex: "🩻 Santé") à partir de l'ID (ex: "Arc II")
    // (Nous avons besoin des DEUX pour remplir la feuille "Répertoire des Quêtes")
    const selectedArc = globalArcsData.find(a => a["ID Arc"] === arcId);
    
    if (!selectedArc) {
        alert("Erreur : Arc sélectionné invalide.");
        return;
    }
    
    const arcName = selectedArc["Nom Modifiable"]; // ex: "🩻 Santé"

    // 3. Construire l'objet de données de la quête (doit correspondre aux colonnes)
    const questData = {
        "Quete": queteName,
        "Nom de l'Arc": arcId,
        "Arc": arcName,
        "Fréquence": frequency,
        "Intensité": parseInt(intensity, 10) // Convertir en nombre
        // Le Statut (false) et l'XP (0) sont gérés par la fonction createQuest
    };

    // 4. Appeler l'API
    const success = await createQuest(questData);

    // 5. Réinitialiser et recharger
    if (success) {
        form.reset(); // Vider le formulaire
        
        // Recharger les données des quêtes pour voir la nouvelle quête !
        // (J'assume que tu as une fonction pour recharger juste les quêtes)
        await loadQuestsData(); 
        // (Si tu n'as pas 'loadQuestsData', tu peux utiliser 'loadData' 
        // ou la fonction qui rafraîchit les listes de quêtes)
    }
}

function initApp() {
    console.log("Life RPG démarré. Chargement des données du Registre du Destin...");
    
    // 1. Initialise la logique des onglets
    setupTabs(); 
    
    // 2. Déclenchement initial des fonctions
    // Assurez-vous que les fonctions loadXxx sont dans render.js
    loadPlayerStats();
    loadQuests();
    loadMilestones();
    loadArcs();
}

initApp();
