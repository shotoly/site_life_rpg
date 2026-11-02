/**
 * ============================================================================
 * LIFE RPG - CLIENT SUPABASE & SYNCHRONISATION HYBRIDE
 * ============================================================================
 * - Gère la connexion avec Supabase (Cloud ou Local via Supabase CLI / Docker)
 * - Mode Hors-ligne / LocalStorage First : Si Supabase est indisponible,
 *   l'application reste 100% fonctionnelle sans aucune erreur bloquante.
 * - Récupère les identifiants automatiquement :
 *     1) Via l'API Serverless Vercel (/api/config)
 *     2) Via la configuration personnalisée (localStorage)
 *     3) Via les variables locales par défaut (http://127.0.0.1:54321)
 * ============================================================================
 */

(function (window) {
    'use strict';

    // Clés de configuration de secours en local (CLI Supabase par défaut)
    const DEFAULT_LOCAL_URL = 'http://127.0.0.1:54321';
    const DEFAULT_LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

    const CONFIG_CACHE_KEY_URL = 'life_rpg_custom_supabase_url';
    const CONFIG_CACHE_KEY_KEY = 'life_rpg_custom_supabase_key';

    const state = {
        client: null,
        isConnected: false,
        isConnecting: false,
        url: '',
        anonKey: '',
        source: 'uninitialized', // 'vercel_env', 'custom', 'local_cli', 'offline'
        lastSyncTime: null,
        syncPending: false
    };

    /**
     * Tente de récupérer la configuration Supabase depuis différentes sources
     */
    async function resolveConfig() {
        // 1. Clés injectées dans window (optionnel)
        if (window.ENV_SUPABASE_URL && window.ENV_SUPABASE_ANON_KEY) {
            return {
                url: window.ENV_SUPABASE_URL,
                anonKey: window.ENV_SUPABASE_ANON_KEY,
                source: 'window_env'
            };
        }

        // 2. Clés personnalisées stockées dans le navigateur (pratique pour tester Supabase Cloud sans redéployer)
        const customUrl = localStorage.getItem(CONFIG_CACHE_KEY_URL);
        const customKey = localStorage.getItem(CONFIG_CACHE_KEY_KEY);
        if (customUrl && customKey) {
            return {
                url: customUrl.trim(),
                anonKey: customKey.trim(),
                source: 'custom_storage'
            };
        }

        // 3. Tenter de joindre la fonction serverless Vercel (/api/config)
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            const res = await fetch('/api/config', { signal: controller.signal });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data.supabaseUrl && data.supabaseAnonKey) {
                    return {
                        url: data.supabaseUrl,
                        anonKey: data.supabaseAnonKey,
                        source: 'vercel_env'
                    };
                }
            }
        } catch (err) {
            // Pas sur Vercel ou serveur local sans route /api, continuer vers la suite
        }

        // 4. Fallback vers le serveur local Supabase CLI (Docker)
        return {
            url: DEFAULT_LOCAL_URL,
            anonKey: DEFAULT_LOCAL_ANON_KEY,
            source: 'local_cli'
        };
    }

    /**
     * Initialise le client Supabase et teste la connexion
     */
    async function initClient() {
        if (state.isConnecting) return state.isConnected;
        state.isConnecting = true;

        try {
            // Vérifier que la bibliothèque supabase-js est bien chargée
            if (typeof window.supabase === 'undefined' || !window.supabase.createClient) {
                console.warn('[Supabase] SDK @supabase/supabase-js non détecté. Mode LocalStorage actif.');
                updateStatus(false, 'offline', 'SDK non chargé');
                state.isConnecting = false;
                return false;
            }

            const config = await resolveConfig();
            state.url = config.url;
            state.anonKey = config.anonKey;
            state.source = config.source;

            if (!state.url || !state.anonKey) {
                updateStatus(false, 'offline', 'Identifiants absents');
                state.isConnecting = false;
                return false;
            }

            // Création de l'instance client Supabase
            state.client = window.supabase.createClient(state.url, state.anonKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            });

            // Tester la connectivité en interrogeant la table player_profile avec un court timeout
            const testPromise = state.client
                .from('player_profile')
                .select('id')
                .limit(1);

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Délai de connexion dépassé (timeout 3s)')), 3000)
            );

            const { data, error } = await Promise.race([testPromise, timeoutPromise]);

            if (error) {
                console.warn('[Supabase] Serveur accessible mais table non initialisée ou erreur RLS:', error.message);
                updateStatus(false, state.source, 'Erreur table : ' + error.message);
                state.isConnected = false;
            } else {
                state.isConnected = true;
                state.lastSyncTime = new Date();
                updateStatus(true, state.source, 'Connecté');
                console.log(`%c[Supabase] Connecté avec succès ! (Source : ${state.source}, URL : ${state.url})`, 'color: #10b981; font-weight: bold;');
            }
        } catch (err) {
            console.warn('[Supabase] Non connecté à la base de données :', err.message);
            updateStatus(false, 'offline', 'Hors-ligne');
            state.isConnected = false;
        } finally {
            state.isConnecting = false;
        }

        return state.isConnected;
    }

    /**
     * Met à jour le badge visuel de synchronisation dans le DOM
     */
    function updateStatus(isConnected, source, message) {
        state.isConnected = isConnected;

        // Déclencher un événement personnalisé
        window.dispatchEvent(new CustomEvent('supabase-status-change', {
            detail: { isConnected, source, message, url: state.url }
        }));

        const statusPill = document.getElementById('cloudSyncStatus');
        if (!statusPill) return;

        const dot = statusPill.querySelector('.sync-dot');
        const text = statusPill.querySelector('.sync-text');

        if (isConnected) {
            statusPill.classList.add('connected');
            statusPill.classList.remove('disconnected');
            if (dot) dot.style.background = '#10b981';
            if (text) {
                text.textContent = (source === 'vercel_env' || source === 'custom_storage') ? 'Supabase Cloud' : 'Supabase Local';
            }
            statusPill.title = `Connecté à Supabase (${state.url})\nSauvegardes synchronisées dans le cloud.`;
        } else {
            statusPill.classList.remove('connected');
            statusPill.classList.add('disconnected');
            if (dot) dot.style.background = '#f59e0b';
            if (text) text.textContent = 'Local (Offline)';
            statusPill.title = `Mode LocalStorage actif (${message || 'Base non joignable'}).\nVos données sont conservées localement. Cliquez pour configurer.`;
        }
    }

    // ========================================================================
    // CONVERTISSEURS / MAPPERS (JS <-> SUPABASE POSTGRESQL)
    // ========================================================================

    function mapPlayerToDb(p) {
        return {
            id: 'default_hero',
            name: p.name || 'Aventurier',
            level: Number(p.level) || 1,
            current_xp: Number(p.currentXp) || 0,
            max_xp: Number(p.maxXp) || 100,
            total_xp: Number(p.totalXp) || 0,
            gold: Number(p.gold) || 0,
            streak: Number(p.streak) || 0,
            completed_count: Number(p.completedCount) || 0,
            boss_defeated: Number(p.bossDefeated) || 0,
            avatar: p.avatar || 'assets/img/player.png',
            theme: p.theme || 'theme-plaine',
            sound_enabled: p.soundEnabled !== false,
            color_theme: p.colorTheme || 'dark',
            updated_at: new Date().toISOString()
        };
    }

    function mapDbToPlayer(row) {
        return {
            name: row.name || 'Aventurier',
            level: row.level || 1,
            currentXp: row.current_xp || 0,
            maxXp: row.max_xp || 100,
            totalXp: row.total_xp || 0,
            gold: row.gold || 0,
            streak: row.streak || 0,
            completedCount: row.completed_count || 0,
            bossDefeated: row.boss_defeated || 0,
            avatar: row.avatar || 'assets/img/player.png',
            theme: row.theme || 'theme-plaine',
            soundEnabled: row.sound_enabled !== false,
            colorTheme: row.color_theme || 'dark'
        };
    }

    function mapArcToDb(arc) {
        return {
            id: arc.id,
            name: arc.name || arc.id,
            level: Number(arc.level) || 1,
            xp: Number(arc.xp) || 0,
            max_xp: Number(arc.maxXp) || 100,
            color: arc.color || '#10b981',
            quests_done: Number(arc.questsDone) || 0,
            description: arc.description || '',
            icon: arc.icon || '',
            updated_at: new Date().toISOString()
        };
    }

    function mapDbToArc(row) {
        return {
            id: row.id,
            name: row.name,
            level: row.level,
            xp: row.xp,
            maxXp: row.max_xp,
            color: row.color,
            questsDone: row.quests_done,
            description: row.description,
            icon: row.icon
        };
    }

    function mapQuestToDb(q) {
        return {
            id: String(q.id),
            title: q.title || 'Sans titre',
            description: q.desc || q.description || '',
            type: q.type || 'daily',
            rank: q.rank || 'B',
            xp: Number(q.xp) || 25,
            gold: Number(q.gold) || 15,
            tag: q.tag || 'Santé',
            completed: Boolean(q.completed),
            streak: Number(q.streak) || 0,
            boss_stages: Number(q.bossStages) || 3,
            boss_current_stage: Number(q.bossCurrentStage) || 1,
            last_completed_date: q.completedDate || q.lastCompletedDate || null,
            updated_at: new Date().toISOString()
        };
    }

    function mapDbToQuest(row) {
        return {
            id: row.id,
            title: row.title,
            desc: row.description || '',
            type: row.type || 'daily',
            rank: row.rank || 'B',
            xp: row.xp || 25,
            gold: row.gold || 15,
            tag: row.tag || 'Santé',
            completed: Boolean(row.completed),
            streak: row.streak || 0,
            bossStages: row.boss_stages || 3,
            bossCurrentStage: row.boss_current_stage || 1,
            lastCompletedDate: row.last_completed_date,
            completedDate: row.last_completed_date
        };
    }

    function mapAchievementToDb(a) {
        return {
            id: String(a.id),
            name: a.name || 'Succès',
            description: a.description || a.desc || '',
            icon: a.icon || '',
            unlocked: Boolean(a.unlocked),
            unlocked_at: a.unlocked ? (a.unlockedAt || new Date().toISOString()) : null
        };
    }

    function mapDbToAchievement(row) {
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            icon: row.icon,
            unlocked: Boolean(row.unlocked),
            unlockedAt: row.unlocked_at
        };
    }

    // ========================================================================
    // MÉTHODES DE SYNCHRONISATION ASYNCHRONES
    // ========================================================================

    /**
     * Récupère l'intégralité des données du jeu depuis Supabase
     * Retourne null si la base est inaccessible ou vide.
     */
    async function fetchFullGameState() {
        if (!state.client || !state.isConnected) return null;

        try {
            const [playerRes, arcsRes, questsRes, achieveRes] = await Promise.all([
                state.client.from('player_profile').select('*').eq('id', 'default_hero').maybeSingle(),
                state.client.from('arcs').select('*'),
                state.client.from('quests').select('*').order('created_at', { ascending: false }),
                state.client.from('achievements').select('*')
            ]);

            if (playerRes.error) throw playerRes.error;

            // Si le profil existe en base
            let player = null;
            if (playerRes.data) {
                player = mapDbToPlayer(playerRes.data);
            }

            // Reconstruction du dictionnaire des Arcs
            let arcs = null;
            if (arcsRes.data && arcsRes.data.length > 0) {
                arcs = {};
                arcsRes.data.forEach(row => {
                    arcs[row.id] = mapDbToArc(row);
                });
            }

            // Liste des quêtes
            let quests = null;
            if (questsRes.data && questsRes.data.length > 0) {
                quests = questsRes.data.map(mapDbToQuest);
            }

            // Trophées
            let achievements = null;
            if (achieveRes.data && achieveRes.data.length > 0) {
                achievements = achieveRes.data.map(mapDbToAchievement);
            }

            state.lastSyncTime = new Date();
            return { player, arcs, quests, achievements };
        } catch (err) {
            console.warn('[Supabase] Erreur lors de la récupération des données :', err.message);
            return null;
        }
    }

    /**
     * Sauvegarde le profil du joueur dans Supabase
     */
    async function syncPlayer(player) {
        if (!state.client || !state.isConnected) return false;
        try {
            const payload = mapPlayerToDb(player);
            const { error } = await state.client.from('player_profile').upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de synchronisation du joueur :', err.message);
            return false;
        }
    }

    /**
     * Sauvegarde ou met à jour une quête individuelle
     */
    async function syncQuest(quest) {
        if (!state.client || !state.isConnected) return false;
        try {
            const payload = mapQuestToDb(quest);
            const { error } = await state.client.from('quests').upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de synchronisation de la quête :', err.message);
            return false;
        }
    }

    /**
     * Supprime une quête dans Supabase
     */
    async function deleteQuest(questId) {
        if (!state.client || !state.isConnected) return false;
        try {
            const { error } = await state.client.from('quests').delete().eq('id', String(questId));
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de suppression de la quête :', err.message);
            return false;
        }
    }

    /**
     * Sauvegarde un Arc de vie
     */
    async function syncArc(arc) {
        if (!state.client || !state.isConnected) return false;
        try {
            const payload = mapArcToDb(arc);
            const { error } = await state.client.from('arcs').upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de synchronisation de l\'arc :', err.message);
            return false;
        }
    }

    /**
     * Sauvegarde l'ensemble des Arcs
     */
    async function syncAllArcs(arcsDict) {
        if (!state.client || !state.isConnected || !arcsDict) return false;
        try {
            const list = Object.values(arcsDict).map(mapArcToDb);
            const { error } = await state.client.from('arcs').upsert(list, { onConflict: 'id' });
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de synchronisation des arcs :', err.message);
            return false;
        }
    }

    /**
     * Sauvegarde un trophée
     */
    async function syncAchievement(achievement) {
        if (!state.client || !state.isConnected) return false;
        try {
            const payload = mapAchievementToDb(achievement);
            const { error } = await state.client.from('achievements').upsert(payload, { onConflict: 'id' });
            if (error) throw error;
            state.lastSyncTime = new Date();
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de synchronisation du trophée :', err.message);
            return false;
        }
    }

    /**
     * Synchronise l'intégralité du gameState (Seed initial ou sauvegarde globale)
     */
    async function syncFullState(gameState) {
        if (!state.client || !state.isConnected || !gameState) return false;
        try {
            const promises = [];

            if (gameState.player) {
                promises.push(syncPlayer(gameState.player));
            }
            if (gameState.arcs) {
                promises.push(syncAllArcs(gameState.arcs));
            }
            if (Array.isArray(gameState.quests) && gameState.quests.length > 0) {
                const questPayloads = gameState.quests.map(mapQuestToDb);
                promises.push(state.client.from('quests').upsert(questPayloads, { onConflict: 'id' }));
            }
            if (Array.isArray(gameState.achievements) && gameState.achievements.length > 0) {
                const achievePayloads = gameState.achievements.map(mapAchievementToDb);
                promises.push(state.client.from('achievements').upsert(achievePayloads, { onConflict: 'id' }));
            }

            await Promise.all(promises);
            state.lastSyncTime = new Date();
            console.log('[Supabase] Synchronisation globale effectuée avec succès.');
            return true;
        } catch (err) {
            console.warn('[Supabase] Échec de la synchronisation globale :', err.message);
            return false;
        }
    }

    // Gestion d'un debouncer pour ne pas surcharger la base de données lors d'actions rapprochées
    let debounceTimer = null;
    function debouncedSyncFull(gameState, delay = 1000) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            syncFullState(gameState);
        }, delay);
    }

    /**
     * Configure manuellement les identifiants Supabase (sauvegardés dans localStorage)
     */
    function setCustomCredentials(url, anonKey) {
        if (!url || !anonKey) {
            localStorage.removeItem(CONFIG_CACHE_KEY_URL);
            localStorage.removeItem(CONFIG_CACHE_KEY_KEY);
        } else {
            localStorage.setItem(CONFIG_CACHE_KEY_URL, url.trim());
            localStorage.setItem(CONFIG_CACHE_KEY_KEY, anonKey.trim());
        }
        return initClient();
    }

    // Export sur l'objet global window
    window.SupabaseSync = {
        state,
        initClient,
        fetchFullGameState,
        syncPlayer,
        syncQuest,
        deleteQuest,
        syncArc,
        syncAllArcs,
        syncAchievement,
        syncFullState,
        debouncedSyncFull,
        setCustomCredentials,
        resolveConfig
    };

})(window);
