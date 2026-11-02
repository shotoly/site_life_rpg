/**
 * ==========================================================================
 * LIFE RPG - MOTEUR JAVASCRIPT VANILLE (Version Hybride avec 2 Onglets & Arcs)
 * Navigation par Onglets (Quêtes VS Personnage/Stats)
 * Progression indépendante par Arc de Vie
 * Web Audio API Synth • Canvas Sparkles • Persistance LocalStorage
 * ==========================================================================
 */

// --------------------------------------------------------------------------
// 1. CONFIGURATION, BARÈMES & ARCS DE VIE
// --------------------------------------------------------------------------

const RANK_REWARDS = {
    'D': { xp: 10,  gold: 5,   label: 'Rang D' },
    'C': { xp: 25,  gold: 15,  label: 'Rang C' },
    'B': { xp: 50,  gold: 30,  label: 'Rang B' },
    'A': { xp: 100, gold: 75,  label: 'Rang A' },
    'S': { xp: 250, gold: 200, label: 'Rang S' }
};

const PLAYER_TITLES = [
    { level: 1, title: "Novice des Prairies" },
    { level: 2, title: "Explorateur des Plaines" },
    { level: 3, title: "Aventurier Agile" },
    { level: 5, title: "Chevalier du Quotidien" },
    { level: 7, title: "Paladin de la Volonté" },
    { level: 10, title: "Maître des Habitudes" },
    { level: 15, title: "Légende Vivante" }
];

const ARC_RANKS = [
    { level: 1, title: "Initié" },
    { level: 2, title: "Pratiquant" },
    { level: 3, title: "Intermédiaire" },
    { level: 5, title: "Expert" },
    { level: 8, title: "Maître" },
    { level: 10, title: "Légende" }
];

// Icônes pixel-art authentiques 8-bit intégrées (assets PNG et SVG purs)
const PIXEL_ICONS = {
    coin: `<svg class="pixel-art-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M5 1h6v1h2v1h1v2h1v6h-1v2h-1v1h-2v1H5v-1H3v-1H2v-2H1V5h1V3h1V2h2V1zm0 2H4v1H3v2H2v4h1v2h1v1h2v1h6v-1h1v-1h1v-2h1V6h-1V4h-1V3h-1V2H5v1zm2 2h2v1h1v4H9v1H7v-1H6V6h1V5zm1 2H7v2h2V7z" fill="#B45309"/><path d="M5 2h6v1h2v2h1v6h-1v2h-2v1H5v-1H3v-2H2V5h1V3h2V2z" fill="#FBBF24"/><path d="M5 3h4v1h1v2h1v4h-1v1H9v1H5v-1H4V9h1V5H4V4h1V3z" fill="#FEF08A"/><path d="M7 6h2v4H7V6z" fill="#D97706"/></svg>`,
    heart: `<svg class="pixel-art-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M2 3h4v1h2v1h-2V4H2v5h1v1h1v1h1v1h1v1h1v1h1v1h2v-1h1v-1h1v-1h1v-1h1v-1h1V4h-4v1h-2V4h2V3h4v1h1v1h1v4h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1H7v-1H6v-1H5v-1H4v-1H3v-1H2V9H1V5h1V4h1V3h-1z" fill="#991B1B"/><path d="M3 4h3v1h1v1h2V5h1V4h3v1h1v3h-1v1h-1v1h-1v1h-1v1h-1v1h-2v-1H6v-1H5v-1H4v-1H3V8H2V5h1V4z" fill="#EF4444"/><path d="M4 5h2v2H4V5zm5 0h2v2H9V5z" fill="#FECACA"/></svg>`,
    fire: `<img src="assets/img/flame_pixel_art.png" class="inline-pixel-icon" alt="flamme">`,
    xp: `<svg class="pixel-art-svg" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 1h4v2h-2v2h-1v2h3v2h-2v2h-2v2h-2v2H5v-3h2v-2h2V8H6V6h2V4h1V1z" fill="#065F46"/><path d="M8 2h4v1h-2v2h-1v2h3v1h-2v2h-2v2h-2v2H6v-2h2v-2h2V8H7V6h2V4h1V2H8z" fill="#10B981"/><path d="M8 3h2v2H8V3zm1 4h2v1H9V7z" fill="#D1FAE5"/></svg>`,
    crown: `<img src="assets/img/crown_pixel_art.png" class="inline-pixel-icon" alt="couronne">`,
    star: `<img src="assets/img/etoile_pixel_art.png" class="inline-pixel-icon" alt="étoile">`,
    sprout: `<img src="assets/img/sprout_pixelart.png" class="inline-pixel-icon" alt="habitude">`,
    scroll: `<img src="assets/img/questpaper.png" class="inline-pixel-icon" alt="quête">`
};

const DEFAULT_ARCS = {
    'Santé': {
        id: 'Santé',
        name: 'Santé & Vitalité',
        icon: '<img src="assets/img/sprout_pixelart.png" class="arc-icon-img" alt="Santé">',
        level: 2,
        xp: 45,
        maxXp: 100,
        color: '#10b981',
        questsDone: 3,
        description: 'Endurance physique, énergie, sommeil et nutrition.'
    },
    'Code': {
        id: 'Code',
        name: 'Code & Ingénierie',
        icon: '<img src="assets/img/questpaper.png" class="arc-icon-img" alt="Code">',
        level: 3,
        xp: 70,
        maxXp: 120,
        color: '#0284c7',
        questsDone: 5,
        description: 'Création logicielle, architecture et apprentissage continu.'
    },
    'Social': {
        id: 'Social',
        name: 'Social & Charisme',
        icon: '<img src="assets/img/taverne_1.svg" class="arc-icon-img" alt="Social">',
        level: 1,
        xp: 20,
        maxXp: 80,
        color: '#f59e0b',
        questsDone: 2,
        description: 'Relations sincères, écoute, famille et entraide.'
    },
    'Créativité': {
        id: 'Créativité',
        name: 'Créativité & Esprit',
        icon: '<img src="assets/img/livre_1.svg" class="arc-icon-img" alt="Créativité">',
        level: 2,
        xp: 30,
        maxXp: 100,
        color: '#8b5cf6',
        questsDone: 2,
        description: 'Design, écriture, dessin, musique et méditation.'
    },
    'Aventure': {
        id: 'Aventure',
        name: 'Aventure & Découverte',
        icon: '<img src="assets/img/bouclier_1.svg" class="arc-icon-img" alt="Aventure">',
        level: 1,
        xp: 15,
        maxXp: 80,
        color: '#06b6d4',
        questsDone: 1,
        description: 'Exploration, voyages et nouveaux défis du monde réel.'
    }
};

const DEFAULT_ACHIEVEMENTS = [
    { id: 'first_quest', name: 'Premier Pas', desc: 'Valider une première quête dans le journal', icon: '<img src="assets/img/sprout_pixelart.png" class="achieve-pixel-img" alt="Premier Pas">', unlocked: true },
    { id: 'streak_3', name: 'Habituel Déterminé', desc: 'Maintenir une série de 3 jours actifs', icon: '<img src="assets/img/flame_pixel_art.png" class="achieve-pixel-img" alt="Série">', unlocked: true },
    { id: 'boss_slayer', name: 'Tueur de Boss', desc: 'Vaincre un grand palier de projet', icon: '<img src="assets/img/crown_pixel_art.png" class="achieve-pixel-img" alt="Boss">', unlocked: true },
    { id: 'code_pro', name: 'Artisan du Code', desc: 'Atteindre le niveau 3 dans l\'Arc Code', icon: '<img src="assets/img/questpaper.png" class="achieve-pixel-img" alt="Code">', unlocked: true },
    { id: 'health_champion', name: 'Vigueur Inébranlable', desc: 'Atteindre le niveau 3 dans l\'Arc Santé', icon: '<img src="assets/img/sprout_pixelart.png" class="achieve-pixel-img" alt="Santé">', unlocked: false },
    { id: 'hero_lvl5', name: 'Héros Émérite', desc: 'Atteindre le niveau global 5', icon: '<img src="assets/img/etoile_pixel_art.png" class="achieve-pixel-img" alt="Étoile">', unlocked: false }
];

const AVATAR_PRESETS = [
    { id: 'player_hero', name: 'Aventurier (Plein Pied)', src: 'assets/img/player.png' },
    { id: 'fairy', name: 'Fée Guide (Navi)', src: 'assets/img/fairy.png' },
    { id: 'codedex_boy', name: 'Héros Codédex', src: 'assets/img/codedex_boy.png' },
    { id: 'codedex_robot', name: 'DexBot 8-bit', src: 'assets/img/codedex_robot.png' },
    { id: 'codedex_girl', name: 'Héroïne Codédex', src: 'assets/img/codedex_girl.png' },
    { id: 'codedex_foxboy', name: 'Renard Vagabond', src: 'assets/img/codedex_foxboy.png' },
    { id: 'codedex_foxgirl', name: 'Renarde Mage', src: 'assets/img/codedex_foxgirl.png' },
    { id: 'adventurer', name: 'Aventurier Pixel', src: 'assets/img/avatar@2x.png' },
    { id: 'shield_hero', name: 'Paladin au Bouclier', src: 'assets/img/bouclier_1.svg' },
    { id: 'scholar', name: 'Érudit & Arcaniste', src: 'assets/img/livre_1.svg' },
    { id: 'tavernier', name: 'Aubergiste Convivial', src: 'assets/img/taverne_1.svg' }
];

const DEFAULT_QUESTS = [
    {
        id: 'q_1',
        title: "Boire 1.5L d'eau fraîche",
        desc: "Hydrater son corps d'aventurier tout au long de la journée pour garder toute sa vigueur et concentration.",
        type: 'daily',
        rank: 'C',
        xp: 25,
        gold: 15,
        tag: 'Santé',
        completed: false,
        streak: 3,
        lastCompletedDate: null
    },
    {
        id: 'q_2',
        title: "Coder 30 minutes sans distraction",
        desc: "Avancer pas à pas sur le code ou l'apprentissage d'un nouveau concept avec attention et régularité.",
        type: 'daily',
        rank: 'B',
        xp: 50,
        gold: 30,
        tag: 'Code',
        completed: false,
        streak: 1,
        lastCompletedDate: null
    },
    {
        id: 'q_3',
        title: "Marcher 20 min dans la nature",
        desc: "Prendre un grand bol d'air frais, écouter le vent dans les arbres et reposer ses yeux d'écran.",
        type: 'unique',
        rank: 'C',
        xp: 25,
        gold: 15,
        tag: 'Santé',
        completed: false,
        streak: 0,
        lastCompletedDate: null
    },
    {
        id: 'q_4',
        title: "Terrasser le Projet Life RPG V2",
        desc: "Concevoir l'interface hybride lumineuse, l'audio vanille, les animations et la persistance locale !",
        type: 'boss',
        rank: 'S',
        xp: 250,
        gold: 200,
        tag: 'Code',
        completed: false,
        bossStages: 3,
        bossCurrentStage: 2,
        streak: 0,
        lastCompletedDate: null
    },
    {
        id: 'q_5',
        title: "Prendre des nouvelles d'un ami",
        desc: "Envoyer un mot chaleureux ou passer un appel spontané pour entretenir les liens qui comptent.",
        type: 'unique',
        rank: 'D',
        xp: 10,
        gold: 5,
        tag: 'Social',
        completed: false,
        streak: 0,
        lastCompletedDate: null
    },
    {
        id: 'q_6',
        title: "Dessiner ou créer un pixel art",
        desc: "Laisser libre cours à son imagination en concevant une nouvelle icône ou illustration rétro.",
        type: 'unique',
        rank: 'B',
        xp: 50,
        gold: 30,
        tag: 'Créativité',
        completed: false,
        streak: 0,
        lastCompletedDate: null
    }
];

// --------------------------------------------------------------------------
// 2. ÉTAT GLOBAL DU JEU
// --------------------------------------------------------------------------

let gameState = {
    currentTab: 'quests', // 'quests' ou 'character'
    player: {
        name: "Aventurier",
        level: 1,
        currentXp: 40,
        maxXp: 100,
        totalXp: 40,
        gold: 45,
        streak: 3,
        completedCount: 4,
        bossDefeated: 1,
        avatar: 'assets/img/player.png',
        theme: 'theme-plaine',
        soundEnabled: true
    },
    arcs: JSON.parse(JSON.stringify(DEFAULT_ARCS)),
    achievements: JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)),
    quests: [],
    filters: {
        type: 'all',
        tag: 'all',
        status: 'pending',
        search: ''
    }
};

// --------------------------------------------------------------------------
// 3. MOTEUR AUDIO RÉTRO 8-BIT (Web Audio API)
// --------------------------------------------------------------------------

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSoundBlip() {
    if (!gameState.player.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.warn('Audio non supporté', e);
    }
}

function playSoundCoin() {
    if (!gameState.player.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(987.77, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.07);

        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
        console.warn(e);
    }
}

function playSoundSuccess() {
    if (!gameState.player.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const notes = [
            { f: 523.25, d: 0.09 },
            { f: 659.25, d: 0.09 },
            { f: 783.99, d: 0.09 },
            { f: 1046.50, d: 0.22 }
        ];

        let time = audioCtx.currentTime;
        notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, time);

            gain.gain.setValueAtTime(0.11, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + note.d);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(time);
            osc.stop(time + note.d);
            time += note.d * 0.85;
        });
    } catch (e) {
        console.warn(e);
    }
}

function playSoundLevelUp() {
    if (!gameState.player.soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const notes = [
            { f: 440.00, t: 0.10 },
            { f: 554.37, t: 0.10 },
            { f: 659.25, t: 0.10 },
            { f: 880.00, t: 0.18 },
            { f: 783.99, t: 0.10 },
            { f: 880.00, t: 0.35 }
        ];

        let time = audioCtx.currentTime;
        notes.forEach(note => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(note.f, time);

            gain.gain.setValueAtTime(0.12, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + note.t);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(time);
            osc.stop(time + note.t);
            time += note.t * 0.85;
        });
    } catch (e) {
        console.warn(e);
    }
}

// --------------------------------------------------------------------------
// 4. MOTEUR DE PARTICULES CANVAS
// --------------------------------------------------------------------------

const canvas = document.getElementById('particleCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let animFrameId = null;

function resizeCanvas() {
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnParticles(x, y, count = 30, colors = ['#10b981', '#34d399', '#f59e0b', '#fbbf24', '#ffffff']) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 6;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            size: 4 + Math.floor(Math.random() * 5),
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: 0.02 + Math.random() * 0.02
        });
    }

    if (!animFrameId) {
        renderParticles();
    }
}

function renderParticles() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.18;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.fillRect(Math.floor(p.x), Math.floor(p.y), p.size, p.size);
    }

    ctx.globalAlpha = 1.0;

    if (particles.length > 0) {
        animFrameId = requestAnimationFrame(renderParticles);
    } else {
        animFrameId = null;
    }
}

function createFloatingRewardBadge(x, y, content, color = '#10b981') {
    const badge = document.createElement('div');
    badge.innerHTML = content;
    badge.style.position = 'fixed';
    badge.style.left = `${x}px`;
    badge.style.top = `${y}px`;
    badge.style.fontFamily = "'Press Start 2P', monospace";
    badge.style.fontSize = '0.7rem';
    badge.style.color = color;
    badge.style.background = '#ffffff';
    badge.style.padding = '5px 12px';
    badge.style.borderRadius = '9999px';
    badge.style.border = '1px solid #e2e8f0';
    badge.style.boxShadow = '0 6px 14px rgba(0, 0, 0, 0.08)';
    badge.style.pointerEvents = 'none';
    badge.style.zIndex = '1000001';
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.gap = '6px';
    badge.style.transition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.85s ease';
    badge.style.transform = 'translate(-50%, 0) scale(1)';
    badge.style.opacity = '1';

    document.body.appendChild(badge);

    requestAnimationFrame(() => {
        badge.style.transform = 'translate(-50%, -44px) scale(1.1)';
        badge.style.opacity = '0';
    });

    setTimeout(() => {
        if (badge.parentNode) {
            badge.parentNode.removeChild(badge);
        }
    }, 900);
}

// --------------------------------------------------------------------------
// 5. SAUVEGARDE & CHARGEMENT LOCALSTORAGE
// --------------------------------------------------------------------------

const STORAGE_KEY = 'life_rpg_hybrid_v2';

function saveGame(syncToRemote = true) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    } catch (e) {
        console.warn('Erreur de sauvegarde localStorage', e);
    }

    if (syncToRemote && window.SupabaseSync && window.SupabaseSync.state.isConnected) {
        window.SupabaseSync.debouncedSyncFull(gameState, 1200);
    }
}

function applyRemoteData(remoteData) {
    if (!remoteData) return;

    if (remoteData.player) {
        gameState.player = Object.assign({}, gameState.player, remoteData.player);
        if (gameState.player.avatar === 'assets/img/codedex_boy.png') {
            gameState.player.avatar = 'assets/img/player.png';
        }
    }

    if (Array.isArray(remoteData.quests) && remoteData.quests.length > 0) {
        gameState.quests = remoteData.quests;
    }

    if (remoteData.arcs && Object.keys(remoteData.arcs).length > 0) {
        gameState.arcs = Object.assign({}, DEFAULT_ARCS, remoteData.arcs);
        Object.keys(DEFAULT_ARCS).forEach(k => {
            if (gameState.arcs[k]) {
                gameState.arcs[k].icon = DEFAULT_ARCS[k].icon;
            }
        });
    }

    if (Array.isArray(remoteData.achievements) && remoteData.achievements.length > 0) {
        gameState.achievements = remoteData.achievements;
        DEFAULT_ACHIEVEMENTS.forEach(da => {
            const existing = gameState.achievements.find(a => a.id === da.id);
            if (existing) existing.icon = da.icon;
        });
    }
}

async function initSupabaseSync() {
    if (!window.SupabaseSync) return;

    try {
        const connected = await window.SupabaseSync.initClient();
        if (connected) {
            const remoteData = await window.SupabaseSync.fetchFullGameState();
            if (remoteData && remoteData.player) {
                console.log('%c[Supabase] Données synchronisées depuis PostgreSQL !', 'color: #10b981; font-weight: bold;');
                applyRemoteData(remoteData);
                saveGame(false);
                updatePlayerHUD();
                updateTagChips();
                renderQuests();
                renderCharacterSheet();
                renderArcsGrid();
                renderSideArcsMiniList();
                renderAchievementsGrid();
            } else {
                console.log('[Supabase] Initialisation de la base distante avec les données locales...');
                await window.SupabaseSync.syncFullState(gameState);
            }
        }
    } catch (err) {
        console.warn('[Supabase] Erreur synchronisation :', err);
    }
}

function loadGame() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.player && Array.isArray(parsed.quests)) {
                gameState.player = Object.assign({}, gameState.player, parsed.player);
                if (gameState.player.avatar === 'assets/img/codedex_boy.png') {
                    gameState.player.avatar = 'assets/img/player.png';
                }
                gameState.quests = parsed.quests;
                if (parsed.arcs) {
                    gameState.arcs = Object.assign({}, DEFAULT_ARCS, parsed.arcs);
                    Object.keys(DEFAULT_ARCS).forEach(k => {
                        if (gameState.arcs[k]) {
                            gameState.arcs[k].icon = DEFAULT_ARCS[k].icon;
                        }
                    });
                }
                if (parsed.achievements) {
                    gameState.achievements = parsed.achievements;
                    DEFAULT_ACHIEVEMENTS.forEach(da => {
                        const existing = gameState.achievements.find(a => a.id === da.id);
                        if (existing) existing.icon = da.icon;
                    });
                }
                if (parsed.currentTab) {
                    gameState.currentTab = parsed.currentTab;
                }
                if (parsed.player && parsed.player.theme) {
                    gameState.player.theme = parsed.player.theme;
                }
                return;
            }
        }
    } catch (e) {
        console.warn('Erreur de lecture de la sauvegarde', e);
    }

    gameState.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
    gameState.arcs = JSON.parse(JSON.stringify(DEFAULT_ARCS));
    gameState.achievements = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS));
    saveGame();
}

function applyTheme(themeId) {
    document.body.classList.remove('theme-plaine', 'theme-montage', 'theme-ocean', 'theme-marin');
    document.body.classList.add(themeId);
    gameState.player.theme = themeId;

    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.classList.toggle('active', item.dataset.theme === themeId);
    });

    document.querySelectorAll('.banner-pill').forEach(pill => {
        pill.classList.toggle('active', pill.dataset.theme === themeId);
    });
}

// --------------------------------------------------------------------------
// 5bis. THÈME DE COULEURS CLAIR / SOMBRE (distinct du décor de fond)
// --------------------------------------------------------------------------

const THEME_STORAGE_KEY = 'life_rpg_theme';

function getCurrentColorTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
}

function applyColorTheme(theme) {
    const resolved = theme === 'dark' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', resolved);
    try { localStorage.setItem(THEME_STORAGE_KEY, resolved); } catch (e) {}
    syncThemeToggleLabel();
}

function syncThemeToggleLabel() {
    const label = document.getElementById('themeToggleLabel');
    if (!label) return;
    const dark = getCurrentColorTheme() === 'dark';
    label.innerHTML = dark 
        ? `<img src="assets/img/soleil.png" class="pixel-btn-icon" alt="Jour"> JOUR` 
        : `<img src="assets/img/lune.png" class="pixel-btn-icon" alt="Nuit"> NUIT`;
    const btn = document.getElementById('themeToggleBtn');
    if (btn) btn.title = dark ? 'Passer en mode clair' : 'Passer en mode sombre';
}

// --------------------------------------------------------------------------
// 6. GESTION DES 2 ONGLETS PRINCIPAUX & FOND DYNAMIQUE
// --------------------------------------------------------------------------

function switchTab(tabId, forcedTheme = null) {
    gameState.currentTab = tabId;
    playSoundBlip();

    const tabQuestsBtn = document.getElementById('tabBtnQuests');
    const tabCharBtn = document.getElementById('tabBtnCharacter');
    const viewQuests = document.getElementById('viewQuestsSection');
    const viewChar = document.getElementById('viewCharacterSection');
    const welcomeHero = document.getElementById('welcomeHeroCard');

    if (tabId === 'quests') {
        document.body.classList.remove('view-character-active');
        tabQuestsBtn?.classList.add('active');
        tabCharBtn?.classList.remove('active');

        if (viewQuests) viewQuests.style.display = 'flex';
        if (viewChar) viewChar.style.display = 'none';
        if (welcomeHero) welcomeHero.style.display = 'block';

        // Décor pour la Plaine d'Aventure
        applyTheme(forcedTheme || 'theme-plaine');
    } else {
        document.body.classList.add('view-character-active');
        tabCharBtn?.classList.add('active');
        tabQuestsBtn?.classList.remove('active');

        if (viewQuests) viewQuests.style.display = 'none';
        if (viewChar) viewChar.style.display = 'flex';
        if (welcomeHero) welcomeHero.style.display = 'none';

        // Décor pour la Montagne du Refuge / Campement
        applyTheme(forcedTheme || 'theme-montage');

        // Mettre à jour l'affichage de la fiche de personnage et des Arcs
        renderCharacterSheet();
        renderArcsGrid();
        renderAchievementsGrid();
    }

    saveGame();
}

// --------------------------------------------------------------------------
// 7. SYSTÈME DE PROGRESSION : JOUEUR GLOBAL & ARCS INDÉPENDANTS
// --------------------------------------------------------------------------

function calculateMaxXpForLevel(lvl) {
    return Math.floor(100 * Math.pow(1.35, lvl - 1));
}

function getPlayerTitle(lvl) {
    let currentTitle = PLAYER_TITLES[0].title;
    for (const t of PLAYER_TITLES) {
        if (lvl >= t.level) {
            currentTitle = t.title;
        }
    }
    return currentTitle;
}

function getPlayerRankBadge(lvl) {
    if (lvl >= 10) return 'Légende';
    if (lvl >= 7) return 'Diamant';
    if (lvl >= 5) return 'Or';
    if (lvl >= 3) return 'Argent';
    return 'Bronze';
}

function getArcRankTitle(lvl) {
    let currentTitle = ARC_RANKS[0].title;
    for (const r of ARC_RANKS) {
        if (lvl >= r.level) {
            currentTitle = r.title;
        }
    }
    return currentTitle;
}

function addExperience(amount, arcTag = null) {
    // 1. Progression globale du Joueur
    gameState.player.currentXp += amount;
    gameState.player.totalXp += amount;

    let leveledUp = false;
    while (gameState.player.currentXp >= gameState.player.maxXp) {
        gameState.player.currentXp -= gameState.player.maxXp;
        gameState.player.level += 1;
        gameState.player.maxXp = calculateMaxXpForLevel(gameState.player.level);
        gameState.player.gold += 50;
        leveledUp = true;
    }

    // 2. Progression spécifique de l'Arc de Vie correspondant
    let arcLeveledUp = false;
    let arcObj = null;

    if (arcTag) {
        // Recherche de l'arc ou création s'il s'agit d'un nouveau tag personnalisé
        if (!gameState.arcs[arcTag]) {
            gameState.arcs[arcTag] = {
                id: arcTag,
                name: arcTag,
                icon: '⭐',
                level: 1,
                xp: 0,
                maxXp: 80,
                color: '#10b981',
                questsDone: 0,
                description: `Objectifs et progression dans l'Arc ${arcTag}.`
            };
        }

        arcObj = gameState.arcs[arcTag];
        arcObj.xp += amount;
        arcObj.questsDone += 1;

        while (arcObj.xp >= arcObj.maxXp) {
            arcObj.xp -= arcObj.maxXp;
            arcObj.level += 1;
            arcObj.maxXp = Math.floor(arcObj.maxXp * 1.35);
            arcLeveledUp = true;
        }
    }

    // Vérification des Succès
    checkAchievements();

    updatePlayerHUD();
    renderCharacterSheet();
    renderArcsGrid();
    saveGame();

    if (leveledUp) {
        triggerLevelUpCelebration('player', gameState.player.level);
    } else if (arcLeveledUp && arcObj) {
        triggerLevelUpCelebration('arc', arcObj.level, arcObj.name);
    }
}

function addGold(amount) {
    gameState.player.gold += amount;
    updatePlayerHUD();
    renderCharacterSheet();
    saveGame();
}

function triggerLevelUpCelebration(type, newLevel, arcName = '') {
    playSoundLevelUp();
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 80, ['#f59e0b', '#fbbf24', '#10b981', '#38bdf8', '#ffffff']);

    const modal = document.getElementById('levelUpModal');
    const modalTypeBadge = document.getElementById('modalLevelTypeBadge');
    const modalLevel = document.getElementById('modalNewLevel');
    const modalTitle = document.getElementById('modalNewTitle');
    const modalCongrats = document.getElementById('modalCongratsText');
    const modalRewards = document.getElementById('modalRewardsBox');

    if (modalLevel) modalLevel.textContent = newLevel;

    if (type === 'player') {
        if (modalTypeBadge) modalTypeBadge.textContent = '⭐ NIVEAU SUPÉRIEUR DU HÉROS ! ⭐';
        if (modalTitle) modalTitle.textContent = getPlayerTitle(newLevel);
        if (modalCongrats) modalCongrats.textContent = "Félicitations Aventurier ! Tes efforts et ta détermination portent leurs fruits dans le monde réel.";
        if (modalRewards) {
            modalRewards.innerHTML = `
                <div class="recap-item" style="display:flex; align-items:center; justify-content:center; gap:8px;">${PIXEL_ICONS.coin} <span>+50 Pièces d'Or bonus</span></div>
                <div class="recap-item" style="display:flex; align-items:center; justify-content:center; gap:8px;">${PIXEL_ICONS.xp} <span>Jauge d'Énergie restaurée</span></div>
            `;
        }
    } else {
        if (modalTypeBadge) modalTypeBadge.textContent = `🌿 ARC ${arcName.toUpperCase()} EN PROGRÈS !`;
        if (modalTitle) modalTitle.textContent = `${arcName} : ${getArcRankTitle(newLevel)}`;
        if (modalCongrats) modalCongrats.textContent = `Tu maîtrises de mieux en mieux tes objectifs dans l'Arc ${arcName} !`;
        if (modalRewards) {
            modalRewards.innerHTML = `
                <div class="recap-item">✨ Bonus de maîtrise d'Arc débloqué</div>
                <div class="recap-item">📈 Progression des compétences accélérée</div>
            `;
        }
    }

    if (modal) modal.style.display = 'flex';
}

function checkAchievements() {
    const ach = gameState.achievements;
    const p = gameState.player;
    const arcs = gameState.arcs;

    ach.forEach(a => {
        if (a.id === 'first_quest' && p.completedCount >= 1) a.unlocked = true;
        if (a.id === 'streak_3' && p.streak >= 3) a.unlocked = true;
        if (a.id === 'boss_slayer' && p.bossDefeated >= 1) a.unlocked = true;
        if (a.id === 'code_pro' && arcs['Code'] && arcs['Code'].level >= 3) a.unlocked = true;
        if (a.id === 'health_champion' && arcs['Santé'] && arcs['Santé'].level >= 3) a.unlocked = true;
        if (a.id === 'hero_lvl5' && p.level >= 5) a.unlocked = true;
    });
}

// --------------------------------------------------------------------------
// 8. RENDU DES VUES ET COMPOSANTS
// --------------------------------------------------------------------------

function updatePlayerHUD() {
    const p = gameState.player;

    const nameEl = document.getElementById('playerName');
    const titleEl = document.getElementById('playerTitle');
    const lvlBadge = document.getElementById('navLevelBadge');
    const avatarImg = document.getElementById('navAvatarImg');

    if (nameEl && document.activeElement !== nameEl) nameEl.textContent = p.name;
    if (titleEl) titleEl.textContent = getPlayerTitle(p.level);
    if (lvlBadge) lvlBadge.textContent = p.level;
    if (avatarImg) {
        const isPlayerSprite = !p.avatar || p.avatar === 'assets/img/player.png';
        avatarImg.src = isPlayerSprite ? 'assets/img/player.png' : p.avatar;
        avatarImg.classList.toggle('is-player-sprite', isPlayerSprite);
    }

    const currentXpEl = document.getElementById('currentXpVal');
    const maxXpEl = document.getElementById('maxXpVal');
    const xpFillEl = document.getElementById('xpProgressFill');

    if (currentXpEl) currentXpEl.textContent = p.currentXp;
    if (maxXpEl) maxXpEl.textContent = p.maxXp;

    const percentage = Math.min(100, Math.max(0, (p.currentXp / p.maxXp) * 100));
    if (xpFillEl) {
        xpFillEl.style.width = `${percentage}%`;
    }

    const goldEl = document.getElementById('goldCount');
    const streakEl = document.getElementById('streakCount');
    if (goldEl) goldEl.textContent = p.gold;
    if (streakEl) streakEl.textContent = `${p.streak}j`;

    const audioIcon = document.getElementById('audioIcon');
    if (audioIcon) audioIcon.textContent = p.soundEnabled ? '🔊' : '🔇';
    const audioIconImg = document.getElementById('audioIconImg');
    if (audioIconImg) audioIconImg.classList.toggle('muted', !p.soundEnabled);

    // Synchronisation éléments spécifiques au Dashboard Codédex
    const bubblePlayerName = document.getElementById('bubblePlayerName');
    if (bubblePlayerName) bubblePlayerName.textContent = '@' + p.name;

    const sidePlayerName = document.getElementById('sidePlayerName');
    const sidePlayerLvl = document.getElementById('sidePlayerLvl');
    const sidePlayerTitle = document.getElementById('sidePlayerTitle');
    const sideAvatarImg = document.getElementById('sideAvatarImg');
    const sideTotalXp = document.getElementById('sideTotalXp');
    const sideRankName = document.getElementById('sideRankName');
    const sideQuestsCount = document.getElementById('sideQuestsCount');
    const sideStreakDays = document.getElementById('sideStreakDays');
    const sideCurrentXp = document.getElementById('sideCurrentXp');
    const sideMaxXp = document.getElementById('sideMaxXp');
    const sideXpFill = document.getElementById('sideXpFill');

    if (sidePlayerName) sidePlayerName.textContent = p.name;
    if (sidePlayerLvl) sidePlayerLvl.textContent = p.level;
    if (sidePlayerTitle) sidePlayerTitle.textContent = getPlayerTitle(p.level);
    if (sideAvatarImg && p.avatar) sideAvatarImg.src = p.avatar;
    if (sideTotalXp) sideTotalXp.textContent = p.totalXp || p.currentXp;
    if (sideRankName) sideRankName.textContent = getPlayerRankBadge(p.level) || 'Bronze';
    const completedTotal = gameState.quests.filter(q => q.status === 'completed').length;
    if (sideQuestsCount) sideQuestsCount.textContent = p.completedCount || completedTotal;
    if (sideStreakDays) sideStreakDays.textContent = `${p.streak} j`;
    if (sideCurrentXp) sideCurrentXp.textContent = p.currentXp;
    if (sideMaxXp) sideMaxXp.textContent = p.maxXp;
    if (sideXpFill) sideXpFill.style.width = `${percentage}%`;
}

function updateTypeCounts() {
    const all = gameState.quests.length;
    const daily = gameState.quests.filter(q => q.type === 'daily').length;
    const unique = gameState.quests.filter(q => q.type === 'unique').length;
    const boss = gameState.quests.filter(q => q.type === 'boss').length;

    const countAll = document.getElementById('countAll');
    const countDaily = document.getElementById('countDaily');
    const countUnique = document.getElementById('countUnique');
    const countBoss = document.getElementById('countBoss');

    if (countAll) countAll.textContent = all;
    if (countDaily) countDaily.textContent = daily;
    if (countUnique) countUnique.textContent = unique;
    if (countBoss) countBoss.textContent = boss;
}

function updateTagChips() {
    const container = document.getElementById('tagChipsContainer');
    if (!container) return;

    const tagsSet = new Set(['Santé', 'Code', 'Social', 'Créativité', 'Aventure']);
    gameState.quests.forEach(q => {
        if (q.tag && q.tag.trim()) tagsSet.add(q.tag.trim());
    });

    const tagsArray = Array.from(tagsSet);
    container.innerHTML = `
        <button class="modern-tag-chip ${gameState.filters.tag === 'all' ? 'active' : ''}" data-tag="all"># Tous les Arcs</button>
        ${tagsArray.map(tag => {
            const arc = gameState.arcs[tag];
            const icon = (tag === 'Santé') ? PIXEL_ICONS.heart : (arc ? arc.icon : '#');
            return `<button class="modern-tag-chip ${gameState.filters.tag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${icon} ${escapeHtml(tag)}</button>`;
        }).join('')}
    `;

    container.querySelectorAll('.modern-tag-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            playSoundBlip();
            gameState.filters.tag = btn.dataset.tag;
            updateTagChips();
            renderQuests();
        });
    });
}

function getQuestBanner(quest) {
    if (quest.type === 'boss') return 'assets/img/banner_montage.jpeg';
    const byArc = {
        'Santé': 'assets/img/banner_plaine.jpeg',
        'Code': 'assets/img/banner_ocean.jpeg',
        'Social': 'assets/img/banner_fond_Marin.jpeg',
        'Créativité': 'assets/img/banner_montage.jpeg',
        'Aventure': 'assets/img/banner_montage.jpeg'
    };
    return byArc[quest.tag] || 'assets/img/banner_plaine.jpeg';
}

function renderQuests() {
    const grid = document.getElementById('questCardsGrid');
    const emptyState = document.getElementById('questEmptyState');
    if (!grid) return;

    updateTypeCounts();

    const filtered = gameState.quests.filter(q => {
        if (gameState.filters.status === 'pending' && q.completed) return false;
        if (gameState.filters.status === 'completed' && !q.completed) return false;

        if (gameState.filters.type !== 'all' && q.type !== gameState.filters.type) return false;
        if (gameState.filters.tag !== 'all' && q.tag !== gameState.filters.tag) return false;

        if (gameState.filters.search) {
            const query = gameState.filters.search.toLowerCase();
            const matchTitle = q.title && q.title.toLowerCase().includes(query);
            const matchDesc = q.desc && q.desc.toLowerCase().includes(query);
            const matchTag = q.tag && q.tag.toLowerCase().includes(query);
            if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        return true;
    });

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'flex';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    grid.innerHTML = filtered.map(quest => {
        const typeLabel = quest.type === 'daily' 
            ? `${PIXEL_ICONS.sprout} Habitude` 
            : (quest.type === 'boss' ? `${PIXEL_ICONS.crown} Boss` : `${PIXEL_ICONS.scroll} Quête`);
        const arc = gameState.arcs[quest.tag] || { icon: PIXEL_ICONS.star, color: '#38bdf8' };
        const tagIcon = arc.icon;
        const arcColor = arc.color || '#38bdf8';
        const banner = getQuestBanner(quest);

        let bossHtml = '';
        if (quest.type === 'boss') {
            const stages = quest.bossStages || 3;
            const current = quest.bossCurrentStage || 1;
            const hpPercent = quest.completed ? 0 : Math.round(((stages - current + 1) / stages) * 100);
            bossHtml = `
                <div class="boss-banner">
                    <div class="boss-row">
                        <span>${PIXEL_ICONS.crown} Étape ${quest.completed ? stages : current}/${stages}</span>
                        <span>PV : ${quest.completed ? 0 : hpPercent}%</span>
                    </div>
                    <div class="boss-track">
                        <div class="boss-fill" style="width: ${quest.completed ? 0 : hpPercent}%;"></div>
                    </div>
                </div>
            `;
        }

        let dailyHtml = '';
        if (quest.type === 'daily' && quest.streak > 0) {
            const streakLabel = quest.streak > 1 ? `${quest.streak} jours` : `1 jour`;
            dailyHtml = `<span class="streak">${PIXEL_ICONS.fire} Série : ${streakLabel}</span>`;
        }

        return `
            <article class="codedex-card pixel-card ${quest.completed ? 'completed' : ''}" data-id="${quest.id}">
                <img class="card-banner" src="${banner}" alt="" loading="lazy">
                <div class="card-body">
                    <div class="card-category-row">
                        <span class="card-category">${typeLabel}</span>
                        <span class="card-arc" style="color:${arcColor}; background:${arcColor}18; border-color:${arcColor}40;">${tagIcon} ${escapeHtml(quest.tag || 'Aventure')}</span>
                    </div>
                    <h4 class="card-title">${escapeHtml(quest.title)}</h4>
                    ${quest.desc ? `<p class="card-desc">${escapeHtml(quest.desc)}</p>` : ''}
                    ${bossHtml}
                    ${dailyHtml}
                    <div class="card-footer">
                        <div class="card-badges">
                            <span class="card-badge badge-xp">${PIXEL_ICONS.xp} +${quest.xp} XP</span>
                            <span class="card-badge badge-gold">${PIXEL_ICONS.coin} +${quest.gold}</span>
                        </div>
                        <div class="card-actions">
                            <button class="card-btn-validate" data-action="validate" data-id="${quest.id}" title="${quest.completed ? 'Annuler' : 'Valider'}">
                                ${quest.completed ? '↩ Annuler' : '✔ Terminer'}
                            </button>
                            <button class="card-btn-delete" data-action="delete" data-id="${quest.id}" title="Supprimer">✕</button>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    grid.querySelectorAll('.card-btn-validate').forEach(btn => {
        btn.addEventListener('click', handleQuestValidation);
    });

    grid.querySelectorAll('.card-btn-delete').forEach(btn => {
        btn.addEventListener('click', handleQuestDeletion);
    });
}

// --------------------------------------------------------------------------
// 9. RENDU DE LA FICHE DE PERSONNAGE & PROGRESSION DES ARCS
// --------------------------------------------------------------------------

function renderCharacterSheet() {
    const p = gameState.player;

    // Éléments de la Fiche Joueur & Profil
    const charName = document.getElementById('jrpgCharName');
    const classTag = document.getElementById('jrpgClassTag');
    const heroImg = document.getElementById('jrpgHeroImg');
    const lvlVal = document.getElementById('jrpgLevelVal');
    const currXp = document.getElementById('jrpgCurrXp');
    const maxXp = document.getElementById('jrpgMaxXp');
    const xpPct = document.getElementById('jrpgXpPct');
    const expFill = document.getElementById('jrpgExpFill');

    const goldAmount = document.getElementById('jrpgGoldAmount');
    const questsDone = document.getElementById('jrpgQuestsDone');
    const rankName = document.getElementById('jrpgRankName');
    const streakVal = document.getElementById('jrpgStreakVal');
    const bossVal = document.getElementById('jrpgBossVal');

    if (charName) charName.textContent = p.name;
    if (classTag) classTag.textContent = getPlayerTitle(p.level);
    if (lvlVal) lvlVal.textContent = p.level;

    const pct = Math.min(100, Math.round((p.currentXp / p.maxXp) * 100));
    if (currXp) currXp.textContent = p.currentXp;
    if (maxXp) maxXp.textContent = p.maxXp;
    if (xpPct) xpPct.textContent = pct;
    if (expFill) expFill.style.width = `${pct}%`;

    // Statistiques intégrées au profil du joueur
    if (goldAmount) goldAmount.textContent = p.gold;
    if (questsDone) questsDone.textContent = p.completedCount;
    if (rankName) rankName.textContent = `${getPlayerRankBadge(p.level)} (${getPlayerTitle(p.level)})`;
    if (streakVal) streakVal.textContent = `${p.streak} jour${p.streak > 1 ? 's' : ''}`;
    if (bossVal) bossVal.textContent = `${p.bossDefeated} vaincu${p.bossDefeated > 1 ? 's' : ''}`;

    // Avatar : focus/recadrage sur la tête
    if (heroImg) {
        const isPlayerSprite = !p.avatar || p.avatar === 'assets/img/player.png';
        heroImg.src = isPlayerSprite ? 'assets/img/player.png' : p.avatar;
        heroImg.classList.toggle('is-player-sprite', isPlayerSprite);
    }
}

function renderArcsGrid() {
    const arcKeys = Object.keys(gameState.arcs);

    // Remplissage de la section "Arcs de Vie" de la Fiche de Statut du Joueur
    const jrpgArcsList = document.getElementById('jrpgArcsBarsList');
    if (jrpgArcsList) {
        jrpgArcsList.innerHTML = arcKeys.map(key => {
            const arc = gameState.arcs[key];
            const pct = Math.min(100, Math.round((arc.xp / arc.maxXp) * 100));
            return `
                <div class="jrpg-arc-item" title="${escapeHtml(arc.description || '')}">
                    <div class="jrpg-arc-header">
                        <span class="jrpg-arc-header-left">
                            <span class="jrpg-arc-mini-icon">${arc.icon || '♦'}</span>
                            <span class="jrpg-arc-name">${escapeHtml(arc.name)}</span>
                        </span>
                        <span class="jrpg-arc-lvl">Niv. ${arc.level} • <strong>${arc.xp}</strong>/${arc.maxXp} XP (${pct}%)</span>
                    </div>
                    <div class="jrpg-arc-bar-frame">
                        <div class="jrpg-arc-bar-fill" style="width: ${pct}%; background: ${arc.color};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Grille classique si présente
    const grid = document.getElementById('arcsCardsGrid');
    if (grid) {
        grid.innerHTML = arcKeys.map(key => {
            const arc = gameState.arcs[key];
            const pct = Math.min(100, Math.round((arc.xp / arc.maxXp) * 100));
            const rankTitle = getArcRankTitle(arc.level);
            const arcIcon = arc.icon || PIXEL_ICONS.star;

            return `
                <div class="arc-progress-card">
                    <div class="arc-card-header">
                        <div class="arc-title-group">
                            <span class="arc-pixel-icon">${arcIcon}</span>
                            <div>
                                <h4 class="arc-name">${escapeHtml(arc.name)}</h4>
                                <span class="arc-rank-title">${rankTitle}</span>
                            </div>
                        </div>
                        <span class="arc-level-pill" style="background-color: ${arc.color}15; color: ${arc.color}; border: 1px solid ${arc.color}40;">
                            Niv. ${arc.level}
                        </span>
                    </div>

                    <div class="arc-xp-block">
                        <div class="arc-xp-header">
                            <span>EXPÉRIENCE D'ARC</span>
                            <span><strong>${arc.xp}</strong> / ${arc.maxXp} XP (${pct}%)</span>
                        </div>
                        <div class="arc-track-modern">
                            <div class="arc-fill-modern" style="width: ${pct}%; background: ${arc.color};"></div>
                        </div>
                    </div>

                    <div class="arc-card-footer">
                        <span>${arc.questsDone} objectifs validés</span>
                        <button class="arc-filter-link" data-arc="${escapeHtml(arc.id)}">Filtrer les quêtes →</button>
                    </div>
                </div>
            `;
        }).join('');

        grid.querySelectorAll('.arc-filter-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetArc = e.currentTarget.dataset.arc;
                gameState.filters.tag = targetArc;
                switchTab('quests');
                updateTagChips();
                renderQuests();
            });
        });
    }

    renderSideArcsMiniList();
}

function renderSideArcsMiniList() {
    const miniContainer = document.getElementById('sideArcsMiniList');
    if (!miniContainer) return;
    const arcKeys = Object.keys(gameState.arcs);
    miniContainer.innerHTML = arcKeys.map(key => {
        const arc = gameState.arcs[key];
        const pct = Math.min(100, Math.round((arc.xp / arc.maxXp) * 100));
        return `
            <div style="display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem;">
                    <span style="display:flex; align-items:center; gap:6px; color:#f1f5f9; font-weight:600;">
                        <span style="font-size:0.85rem;">${arc.icon || '⚔️'}</span>
                        ${escapeHtml(arc.name)}
                    </span>
                    <span style="color:#94a3b8; font-size:0.7rem; font-family:'Press Start 2P', monospace;">Niv.${arc.level}</span>
                </div>
                <div style="height:6px; background:#141b3d; border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${arc.color || '#38bdf8'}; border-radius:3px;"></div>
                </div>
            </div>
        `;
    }).join('');
}

function renderAchievementsGrid() {
    const grid = document.getElementById('achievementsGrid');
    const badge = document.getElementById('achievementsCountBadge');
    if (!grid) return;

    const total = gameState.achievements.length;
    const unlocked = gameState.achievements.filter(a => a.unlocked).length;

    if (badge) badge.textContent = `${unlocked} / ${total} Débloqués`;

    grid.innerHTML = gameState.achievements.map(a => {
        let iconHtml = a.icon;
        if (a.id === 'streak_3') iconHtml = `<img src="assets/img/flame_pixel_art.png" class="achieve-pixel-img" alt="Flamme">`;
        else if (a.id === 'boss_slayer') iconHtml = `<img src="assets/img/crown_pixel_art.png" class="achieve-pixel-img" alt="Boss">`;
        else if (a.id === 'first_quest' || a.id === 'health_champion') iconHtml = `<img src="assets/img/sprout_pixelart.png" class="achieve-pixel-img" alt="Santé">`;
        else if (a.id === 'code_pro') iconHtml = `<img src="assets/img/questpaper.png" class="achieve-pixel-img" alt="Code">`;
        else if (a.id === 'hero_lvl5') iconHtml = `<img src="assets/img/etoile_pixel_art.png" class="achieve-pixel-img" alt="Étoile">`;
        return `
            <div class="trophy-item-card ${a.unlocked ? 'unlocked' : 'locked'}">
                <span class="trophy-symbol">${iconHtml}</span>
                <div class="trophy-meta">
                    <h4 class="trophy-name">${escapeHtml(a.name)}</h4>
                    <p class="trophy-desc">${escapeHtml(a.desc)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// --------------------------------------------------------------------------
// 10. VALIDATION DE QUÊTE (AVEC IMPACT SUR L'ARC CORRESPONDANT)
// --------------------------------------------------------------------------

function handleQuestValidation(e) {
    const questId = e.currentTarget.dataset.id;
    const quest = gameState.quests.find(q => q.id === questId);
    if (!quest) return;

    const card = e.currentTarget.closest('.codedex-card, .pixel-card');
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = rect.left + rect.width / 2;
    const clickY = rect.top;

    if (!quest.completed) {
        // Combat de Boss à étapes
        if (quest.type === 'boss' && quest.bossCurrentStage < quest.bossStages) {
            quest.bossCurrentStage += 1;
            playSoundCoin();
            spawnParticles(clickX, clickY, 20, ['#f43f5e', '#fb7185', '#ffffff']);
            createFloatingRewardBadge(clickX, clickY, `${PIXEL_ICONS.crown} Étape franchie !`, '#e11d48');
            saveGame();
            renderQuests();
            return;
        }

        quest.completed = true;
        quest.completedDate = new Date().toISOString();
        gameState.player.completedCount += 1;

        if (quest.type === 'boss') {
            gameState.player.bossDefeated += 1;
        }

        if (quest.type === 'daily') {
            quest.streak = (quest.streak || 0) + 1;
        }

        playSoundSuccess();
        playSoundCoin();

        spawnParticles(clickX, clickY, 35, ['#10b981', '#34d399', '#f59e0b', '#ffffff']);
        createFloatingRewardBadge(clickX - 45, clickY, `${PIXEL_ICONS.xp} +${quest.xp} XP`, '#047857');
        setTimeout(() => {
            createFloatingRewardBadge(clickX + 45, clickY, `${PIXEL_ICONS.coin} +${quest.gold}`, '#b45309');
        }, 140);

        if (card) {
            card.classList.add('just-completed');
            setTimeout(() => card.classList.remove('just-completed'), 400);
        }

        // Ajout d'expérience globale ET spécifique à l'Arc !
        addExperience(quest.xp, quest.tag);
        addGold(quest.gold);
        window.SupabaseSync?.syncQuest(quest);
        window.SupabaseSync?.syncPlayer(gameState.player);

    } else {
        playSoundBlip();
        quest.completed = false;
        quest.completedDate = null;
        if (gameState.player.completedCount > 0) {
            gameState.player.completedCount -= 1;
        }
        if (quest.type === 'boss') {
            quest.bossCurrentStage = 1;
            if (gameState.player.bossDefeated > 0) gameState.player.bossDefeated -= 1;
        }
        updatePlayerHUD();
        renderCharacterSheet();
        saveGame();
        window.SupabaseSync?.syncQuest(quest);
        window.SupabaseSync?.syncPlayer(gameState.player);
    }

    renderQuests();
}

function handleQuestDeletion(e) {
    const questId = e.currentTarget.dataset.id;
    const index = gameState.quests.findIndex(q => q.id === questId);
    if (index === -1) return;

    if (confirm("Supprimer cette quête du journal ?")) {
        playSoundBlip();
        const deletedId = questId;
        gameState.quests.splice(index, 1);
        saveGame();
        window.SupabaseSync?.deleteQuest(deletedId);
        updateTagChips();
        renderQuests();
    }
}

// --------------------------------------------------------------------------
// 11. GESTION DES MODALES
// --------------------------------------------------------------------------

function setupModals() {
    // --- Modale Nouvelle Quête ---
    const newQuestModal = document.getElementById('newQuestModal');
    const openBtn = document.getElementById('openNewQuestModalBtn');
    const navNewBtn = document.getElementById('navNewQuestBtn');
    const heroOpenBtn = document.getElementById('heroOpenQuestBtn');
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    const closeBtn = document.getElementById('closeNewQuestModalBtn');
    const cancelBtn = document.getElementById('cancelNewQuestBtn');
    const form = document.getElementById('newQuestForm');
    const typeSelect = document.getElementById('questTypeSelect');
    const bossGroup = document.getElementById('bossStagesGroup');
    const customTagInput = document.getElementById('customTagInput');
    const quickTagContainer = document.getElementById('quickTagButtons');

    function openModal() {
        playSoundBlip();
        if (newQuestModal) {
            newQuestModal.style.display = 'flex';
            document.getElementById('questTitleInput')?.focus();
        }
    }

    function closeModal() {
        playSoundBlip();
        if (newQuestModal) newQuestModal.style.display = 'none';
        if (form) form.reset();
        if (bossGroup) bossGroup.style.display = 'none';
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (navNewBtn) navNewBtn.addEventListener('click', openModal);
    if (heroOpenBtn) heroOpenBtn.addEventListener('click', openModal);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openModal);
    const footerNewQuestBtn = document.getElementById('footerNewQuestBtn');
    if (footerNewQuestBtn) footerNewQuestBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (newQuestModal) {
        newQuestModal.addEventListener('click', (e) => {
            if (e.target === newQuestModal) closeModal();
        });
    }

    if (typeSelect && bossGroup) {
        typeSelect.addEventListener('change', () => {
            bossGroup.style.display = (typeSelect.value === 'boss') ? 'flex' : 'none';
        });
    }

    let selectedQuickTag = 'Santé';
    if (quickTagContainer) {
        quickTagContainer.querySelectorAll('.qtag-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                playSoundBlip();
                quickTagContainer.querySelectorAll('.qtag-pill').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedQuickTag = btn.dataset.tag;
                if (customTagInput) customTagInput.value = '';
            });
        });
    }

    if (customTagInput) {
        customTagInput.addEventListener('input', () => {
            if (customTagInput.value.trim().length > 0) {
                quickTagContainer.querySelectorAll('.qtag-pill').forEach(b => b.classList.remove('active'));
            }
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = document.getElementById('questTitleInput').value.trim();
            const desc = document.getElementById('questDescInput').value.trim();
            const type = document.getElementById('questTypeSelect').value;
            const rank = document.getElementById('questRankSelect').value;
            const customTag = customTagInput ? customTagInput.value.trim() : '';
            const tag = customTag || selectedQuickTag || 'Aventure';

            const reward = RANK_REWARDS[rank] || RANK_REWARDS['B'];

            const newQuest = {
                id: 'q_' + Date.now(),
                title: title,
                desc: desc,
                type: type,
                rank: rank,
                xp: reward.xp,
                gold: reward.gold,
                tag: tag,
                completed: false,
                streak: 0,
                lastCompletedDate: null
            };

            if (type === 'boss') {
                const stagesInput = document.getElementById('bossStagesInput');
                newQuest.bossStages = parseInt(stagesInput.value, 10) || 3;
                newQuest.bossCurrentStage = 1;
            }

            gameState.quests.unshift(newQuest);
            saveGame();
            window.SupabaseSync?.syncQuest(newQuest);

            playSoundCoin();
            closeModal();
            updateTagChips();
            renderQuests();

            spawnParticles(window.innerWidth / 2, 200, 30, ['#10b981', '#34d399', '#f59e0b', '#ffffff']);
        });
    }

    // --- Modale Level Up ---
    const levelUpModal = document.getElementById('levelUpModal');
    const closeLevelUpBtn = document.getElementById('closeLevelUpModalBtn');
    if (closeLevelUpBtn && levelUpModal) {
        closeLevelUpBtn.addEventListener('click', () => {
            playSoundBlip();
            levelUpModal.style.display = 'none';
        });
        levelUpModal.addEventListener('click', (e) => {
            if (e.target === levelUpModal) levelUpModal.style.display = 'none';
        });
    }

    // --- Modale Avatar ---
    const avatarModal = document.getElementById('avatarModal');
    const capsuleAvatar = document.getElementById('navPlayerCapsule');
    const charPortrait = document.getElementById('charPortraitClickable');
    const heroAvatarBtn = document.getElementById('heroChangeAvatarBtn');
    const closeAvatarBtn = document.getElementById('closeAvatarModalBtn');
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    const avatarGrid = document.getElementById('avatarSelectionGrid');
    let tempSelectedAvatar = gameState.player.avatar;

    function renderAvatarGrid() {
        if (!avatarGrid) return;
        avatarGrid.innerHTML = AVATAR_PRESETS.map(preset => `
            <div class="avatar-pick-card ${gameState.player.avatar === preset.src ? 'selected' : ''}" data-src="${preset.src}">
                <img src="${preset.src}" alt="${preset.name}" class="avatar-pick-img" onerror="this.src='assets/img/avatar@2x.png'">
                <span class="avatar-pick-name">${preset.name}</span>
            </div>
        `).join('');

        avatarGrid.querySelectorAll('.avatar-pick-card').forEach(card => {
            card.addEventListener('click', () => {
                playSoundBlip();
                avatarGrid.querySelectorAll('.avatar-pick-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                tempSelectedAvatar = card.dataset.src;
            });
        });
    }

    function openAvatarModal() {
        playSoundBlip();
        tempSelectedAvatar = gameState.player.avatar;
        renderAvatarGrid();
        if (avatarModal) avatarModal.style.display = 'flex';
    }

    if (charPortrait) charPortrait.addEventListener('click', openAvatarModal);
    if (heroAvatarBtn) heroAvatarBtn.addEventListener('click', openAvatarModal);
    const sideEditBtn = document.getElementById('sideEditProfileBtn');
    if (sideEditBtn) sideEditBtn.addEventListener('click', openAvatarModal);
    const jrpgChangeAvatarBtn = document.getElementById('jrpgChangeAvatarBtn');
    if (jrpgChangeAvatarBtn) jrpgChangeAvatarBtn.addEventListener('click', openAvatarModal);
    const footerEditAvatarBtn = document.getElementById('footerEditAvatarBtn');
    if (footerEditAvatarBtn) footerEditAvatarBtn.addEventListener('click', openAvatarModal);

    if (closeAvatarBtn && avatarModal) {
        closeAvatarBtn.addEventListener('click', () => {
            playSoundBlip();
            avatarModal.style.display = 'none';
        });
    }

    if (saveAvatarBtn && avatarModal) {
        saveAvatarBtn.addEventListener('click', () => {
            playSoundSuccess();
            gameState.player.avatar = tempSelectedAvatar;
            updatePlayerHUD();
            renderCharacterSheet();
            saveGame();
            window.SupabaseSync?.syncPlayer(gameState.player);
            avatarModal.style.display = 'none';
        });
    }
}

// --------------------------------------------------------------------------
// 12. ÉVÉNEMENTS DU HUD & NAVIGATION PAR ONGLETS
// --------------------------------------------------------------------------

function setupNavigationEvents() {
    // Boutons des 2 Onglets Principaux
    const tabQuestsBtn = document.getElementById('tabBtnQuests');
    const tabCharBtn = document.getElementById('tabBtnCharacter');
    const navCapsule = document.getElementById('navPlayerCapsule');
    const heroSwitchQuestsBtn = document.getElementById('heroSwitchToQuestsBtn');

    if (tabQuestsBtn) tabQuestsBtn.addEventListener('click', () => switchTab('quests'));
    if (tabCharBtn) tabCharBtn.addEventListener('click', () => switchTab('character'));
    if (navCapsule) navCapsule.addEventListener('click', () => switchTab('character'));
    if (heroSwitchQuestsBtn) heroSwitchQuestsBtn.addEventListener('click', () => switchTab('quests'));

    const sideViewProfileBtn = document.getElementById('sideViewProfileBtn');
    if (sideViewProfileBtn) sideViewProfileBtn.addEventListener('click', () => switchTab('character'));

    // Raccourcis Barre Contrôleur JRPG en bas de fiche
    const footerBackToQuestsBtn = document.getElementById('footerBackToQuestsBtn');
    if (footerBackToQuestsBtn) footerBackToQuestsBtn.addEventListener('click', () => switchTab('quests'));

    const footerResetBtn = document.getElementById('footerResetBtn');
    if (footerResetBtn) {
        footerResetBtn.addEventListener('click', () => {
            const resetBtn = document.getElementById('resetAllDataBtn');
            if (resetBtn) resetBtn.click();
        });
    }

    const jrpgEditNameBtn = document.getElementById('jrpgEditNameBtn');
    if (jrpgEditNameBtn) {
        jrpgEditNameBtn.addEventListener('click', () => {
            const newName = prompt("Nouveau nom de ton aventurier :", gameState.player.name);
            if (newName && newName.trim()) {
                gameState.player.name = newName.trim();
                saveGame();
                window.SupabaseSync?.syncPlayer(gameState.player);
                updatePlayerHUD();
                renderCharacterSheet();
                playSoundSuccess();
            }
        });
    }

    const sideJoinChallengeBtn = document.getElementById('sideJoinChallengeBtn');
    if (sideJoinChallengeBtn) {
        sideJoinChallengeBtn.addEventListener('click', () => {
            playSoundFanfare();
            switchTab('quests');
            gameState.filters.type = 'boss';
            document.querySelectorAll('.modern-tab-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.type === 'boss');
            });
            renderQuests();
            createFloatingRewardBadge(window.innerWidth / 2, 120, '👑 Défi du Mois Sélectionné !', '#f59e0b');
        });
    }

    // Logo mène à l'onglet quêtes
    const brandHome = document.getElementById('brandHomeLink');
    if (brandHome) brandHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab('quests');
    });

    // Onglets de Types de Quêtes
    document.querySelectorAll('.modern-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            playSoundBlip();
            document.querySelectorAll('.modern-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            gameState.filters.type = btn.dataset.type;
            renderQuests();
        });
    });

    // Statut (En cours / Accomplies)
    const pendingBtn = document.getElementById('filterStatusPending');
    const completedBtn = document.getElementById('filterStatusCompleted');

    if (pendingBtn && completedBtn) {
        pendingBtn.addEventListener('click', () => {
            playSoundBlip();
            pendingBtn.classList.add('active');
            completedBtn.classList.remove('active');
            gameState.filters.status = 'pending';
            renderQuests();
        });

        completedBtn.addEventListener('click', () => {
            playSoundBlip();
            completedBtn.classList.add('active');
            pendingBtn.classList.remove('active');
            gameState.filters.status = 'completed';
            renderQuests();
        });
    }

    // Recherche Texte
    const searchInput = document.getElementById('questSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            gameState.filters.search = e.target.value.trim();
            renderQuests();
        });
    }

    // Modification du Nom Joueur
    const nameEl = document.getElementById('playerName');
    if (nameEl) {
        nameEl.addEventListener('blur', () => {
            const val = nameEl.textContent.trim();
            if (val) {
                gameState.player.name = val;
                saveGame();
                updatePlayerHUD();
                renderCharacterSheet();
            } else {
                nameEl.textContent = gameState.player.name;
            }
        });
        nameEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                nameEl.blur();
            }
        });
    }

    // Audio Toggle
    const audioBtn = document.getElementById('audioToggleBtn');
    if (audioBtn) {
        audioBtn.addEventListener('click', () => {
            gameState.player.soundEnabled = !gameState.player.soundEnabled;
            if (gameState.player.soundEnabled) playSoundBlip();
            updatePlayerHUD();
            saveGame();
        });
    }

    // Bascule Light / Dark (☀️ Jour / 🌙 Nuit)
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            playSoundBlip();
            const next = getCurrentColorTheme() === 'dark' ? 'light' : 'dark';
            applyColorTheme(next);
        });
        syncThemeToggleLabel();
    }

    // Sélecteur Manuel de Décor
    const themeBtn = document.getElementById('bgThemeToggleBtn');
    const themeMenu = document.getElementById('themeDropdownMenu');

    if (themeBtn && themeMenu) {
        themeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            playSoundBlip();
            themeMenu.classList.toggle('show');
        });

        document.addEventListener('click', () => {
            themeMenu.classList.remove('show');
        });

        document.querySelectorAll('.dropdown-item').forEach(opt => {
            opt.addEventListener('click', (e) => {
                e.stopPropagation();
                playSoundCoin();
                const chosen = opt.dataset.theme;
                applyTheme(chosen);
                saveGame();
                themeMenu.classList.remove('show');
                createFloatingRewardBadge(window.innerWidth / 2, 70, `Décor : ${opt.textContent}`, '#0284c7');
            });
        });
    }

    // Pills du Hero pour changer le décor
    document.querySelectorAll('.banner-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            playSoundCoin();
            const chosen = pill.dataset.theme;
            applyTheme(chosen);
            saveGame();
            createFloatingRewardBadge(window.innerWidth / 2, 100, `Décor : ${pill.textContent}`, '#10b981');
        });
    });

    // Reset Data
    const resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm("Réinitialiser les données et recharger les quêtes et statistiques de démo ?")) {
                localStorage.removeItem(STORAGE_KEY);
                gameState.currentTab = 'quests';
                gameState.player = {
                    name: "Aventurier",
                    level: 1,
                    currentXp: 40,
                    maxXp: 100,
                    totalXp: 40,
                    gold: 45,
                    streak: 3,
                    completedCount: 4,
                    bossDefeated: 1,
                    avatar: 'assets/img/player.png',
                    theme: 'theme-plaine',
                    soundEnabled: true
                };
                gameState.quests = JSON.parse(JSON.stringify(DEFAULT_QUESTS));
                gameState.arcs = JSON.parse(JSON.stringify(DEFAULT_ARCS));
                gameState.achievements = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS));
                saveGame();
                window.SupabaseSync?.syncFullState(gameState);
                switchTab('quests');
                updatePlayerHUD();
                updateTagChips();
                renderQuests();
                playSoundSuccess();
            }
        });
    }
}

// --------------------------------------------------------------------------
// 13. GESTION DE LA MODALE SUPABASE & SYNCHRONISATION
// --------------------------------------------------------------------------

function setupSupabaseModal() {
    const statusPill = document.getElementById('cloudSyncStatus');
    const modal = document.getElementById('supabaseConfigModal');
    const closeBtn = document.getElementById('closeSupabaseModalBtn');
    const testBtn = document.getElementById('supabaseTestAndSaveBtn');
    const forcePushBtn = document.getElementById('supabaseForcePushBtn');
    const forcePullBtn = document.getElementById('supabaseForcePullBtn');

    const statusBadge = document.getElementById('supabaseModalStatusBadge');
    const urlDisplay = document.getElementById('supabaseModalUrl');
    const lastSyncDisplay = document.getElementById('supabaseModalLastSync');
    const customUrlInput = document.getElementById('supabaseCustomUrlInput');
    const customKeyInput = document.getElementById('supabaseCustomKeyInput');

    function updateModalView() {
        if (!window.SupabaseSync) return;
        const state = window.SupabaseSync.state;

        if (statusBadge) {
            if (state.isConnected) {
                statusBadge.textContent = '🟢 Connecté (' + state.source + ')';
                statusBadge.style.color = '#10b981';
            } else {
                statusBadge.textContent = '🟡 LocalStorage (Hors-ligne)';
                statusBadge.style.color = '#f59e0b';
            }
        }

        if (urlDisplay) {
            urlDisplay.textContent = state.url || 'Non configuré';
        }

        if (lastSyncDisplay) {
            if (state.lastSyncTime) {
                lastSyncDisplay.textContent = new Date(state.lastSyncTime).toLocaleTimeString();
            } else {
                lastSyncDisplay.textContent = 'Aucune synchro récente';
            }
        }

        if (customUrlInput && !customUrlInput.value) {
            customUrlInput.value = localStorage.getItem('life_rpg_custom_supabase_url') || '';
        }
        if (customKeyInput && !customKeyInput.value) {
            customKeyInput.value = localStorage.getItem('life_rpg_custom_supabase_key') || '';
        }
    }

    if (statusPill && modal) {
        statusPill.addEventListener('click', () => {
            playSoundBlip();
            updateModalView();
            modal.style.display = 'flex';
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', () => {
            playSoundBlip();
            modal.style.display = 'none';
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            playSoundBlip();
            testBtn.disabled = true;
            testBtn.textContent = 'Connexion en cours...';

            const customUrl = customUrlInput ? customUrlInput.value.trim() : '';
            const customKey = customKeyInput ? customKeyInput.value.trim() : '';

            if (window.SupabaseSync) {
                const connected = await window.SupabaseSync.setCustomCredentials(customUrl, customKey);
                if (connected) {
                    playSoundSuccess();
                    createFloatingRewardBadge(window.innerWidth / 2, 100, '🟢 Connecté à Supabase !', '#10b981');
                } else {
                    playSoundBlip();
                    createFloatingRewardBadge(window.innerWidth / 2, 100, '🟡 Échec connexion (Vérifiez Docker / URL)', '#f59e0b');
                }
            }

            testBtn.disabled = false;
            testBtn.textContent = 'Tester la connexion';
            updateModalView();
        });
    }

    if (forcePushBtn) {
        forcePushBtn.addEventListener('click', async () => {
            if (!window.SupabaseSync || !window.SupabaseSync.state.isConnected) {
                alert("Supabase n'est pas encore connecté. Veuillez démarrer Docker ou vérifier vos clés.");
                return;
            }
            playSoundBlip();
            forcePushBtn.disabled = true;
            forcePushBtn.textContent = 'Envoi...';
            const ok = await window.SupabaseSync.syncFullState(gameState);
            forcePushBtn.disabled = false;
            forcePushBtn.textContent = 'Envoyer vers Cloud';
            if (ok) {
                playSoundSuccess();
                createFloatingRewardBadge(window.innerWidth / 2, 100, '☁️ Données envoyées à Supabase !', '#10b981');
                updateModalView();
            }
        });
    }

    if (forcePullBtn) {
        forcePullBtn.addEventListener('click', async () => {
            if (!window.SupabaseSync || !window.SupabaseSync.state.isConnected) {
                alert("Supabase n'est pas encore connecté. Veuillez démarrer Docker ou vérifier vos clés.");
                return;
            }
            playSoundBlip();
            forcePullBtn.disabled = true;
            forcePullBtn.textContent = 'Téléchargement...';
            const remoteData = await window.SupabaseSync.fetchFullGameState();
            forcePullBtn.disabled = false;
            forcePullBtn.textContent = 'Charger du Cloud';
            if (remoteData && remoteData.player) {
                applyRemoteData(remoteData);
                saveGame(false);
                updatePlayerHUD();
                updateTagChips();
                renderQuests();
                renderCharacterSheet();
                renderArcsGrid();
                renderSideArcsMiniList();
                renderAchievementsGrid();
                playSoundSuccess();
                createFloatingRewardBadge(window.innerWidth / 2, 100, '⬇️ Données Supabase chargées !', '#10b981');
                updateModalView();
            }
        });
    }

    window.addEventListener('supabase-status-change', () => {
        updateModalView();
    });
}

// --------------------------------------------------------------------------
// 14. INITIALISATION
// --------------------------------------------------------------------------

function initApp() {
    try {
        // Restaurer le thème clair / sombre (défaut 'dark' pour l'esthétique authentique Codédex arcade)
        const savedColorTheme = localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
        applyColorTheme(savedColorTheme);

        loadGame();
        updatePlayerHUD();

        // Restaurer l'onglet actif et le thème (supporte ?tab=character, #character, et href)
        const urlParams = new URLSearchParams(window.location.search);
        const href = window.location.href;
        const tabParam = urlParams.get('tab') || 
                         (href.includes('tab=character') || href.includes('#character') ? 'character' : null);
        const initialTab = tabParam || gameState.currentTab || 'quests';
        switchTab(initialTab);

        updateTagChips();
        renderQuests();
        setupModals();
        setupNavigationEvents();
        setupSupabaseModal();

        // Support d'ouverture directe de modale par paramètre (?modal=new, ?modal=levelup, ?modal=avatar)
        const modalParam = urlParams.get('modal');
        if (modalParam === 'new') {
            const modal = document.getElementById('newQuestModal');
            if (modal) modal.style.display = 'flex';
        } else if (modalParam === 'levelup') {
            triggerLevelUpCelebration('player', 2);
        } else if (modalParam === 'avatar') {
            const avatarBtn = document.getElementById('heroChangeAvatarBtn') || document.getElementById('navPlayerCapsule');
            avatarBtn?.click();
        }

        // Support de filtre par recherche direct (?search=...)
        const searchParam = urlParams.get('search');
        if (searchParam) {
            gameState.filters.search = searchParam.toLowerCase();
            const searchInput = document.getElementById('questSearchInput');
            if (searchInput) searchInput.value = searchParam;
            renderQuests();
        }

        // Lancement asynchrone de la synchronisation Supabase (non-bloquant)
        initSupabaseSync();

        console.log("🎮 Life RPG (Codédex Arcade UI & Arcs de Vie) initialisé avec succès !");
    } catch (err) {
        console.error("Erreur initialisation Life RPG:", err);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
