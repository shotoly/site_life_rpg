// --- config.js ---

// Identifiant unique SheetDB (doit être le même que dans app.js)
const SHEET_ID = "9uyx13661dl1l"; 
const BASE_API_URL = `https://sheetdb.io/api/v1/${SHEET_ID}`; 

// Noms des feuilles Google Sheets
const SHEET_NAME_QUETES = "Répertoire des Quêtes";
const SHEET_NAME_JOUEUR = "Joueur";
const SHEET_NAME_PALIERS = "Sanctuaire des Paliers";

// URLs d'accès (Lecture/Écriture)
const QUOTES_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
const PLAYER_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_JOUEUR)}`;
const PALIERS_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;