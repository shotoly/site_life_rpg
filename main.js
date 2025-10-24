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

function initApp() {
    console.log("Life RPG démarré. Chargement des données du Registre du Destin...");
    
    // 1. Initialise la logique des onglets
    setupTabs(); 
    
    // 2. Déclenchement initial des fonctions
    // Assurez-vous que les fonctions loadXxx sont dans render.js
    loadPlayerStats();
    loadQuests();
    loadMilestones();
}

initApp();
