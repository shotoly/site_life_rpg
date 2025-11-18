// --- config.js ---

// Identifiant unique SheetDB (doit être le même que dans app.js)
const BASE_API_URL = "https://script.google.com/macros/s/AKfycbyLB11__X4e7V_7x9eXJV-SI65dzxOn1iRYortqKldC4qmICvJXkgGpOL6Cowtz05izmA/exec";

// Noms des feuilles Google Sheets
const SHEET_NAME_QUETES = "Répertoire des Quêtes";
const SHEET_NAME_JOUEUR = "Joueur";
const SHEET_NAME_PALIERS = "Sanctuaire des Paliers";
const SHEET_NAME_ARCS = "Arcs Narratifs";

// URLs d'accès (Lecture/Écriture)
const QUOTES_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_QUETES)}`;
const PLAYER_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_JOUEUR)}`;
const PALIERS_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_PALIERS)}`;
const ARCS_API_URL = `${BASE_API_URL}?sheet=${encodeURIComponent(SHEET_NAME_ARCS)}`;

