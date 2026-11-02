# 🚀 Guide de Déploiement : Life RPG avec Supabase & Vercel

Ce projet fonctionne en **mode hybride (Offline-First)** :
- Si Supabase est connecté (localement ou dans le cloud), toutes les données (profil, quêtes, arcs, succès) sont synchronisées dans PostgreSQL.
- Si Supabase n'est pas accessible ou si vous êtes hors-ligne, le jeu fonctionne automatiquement à 100% via `localStorage` sans aucune interruption.

---

## 🛠️ Option 1 : Développement Local (Docker + Supabase CLI)

Cette méthode vous permet d'avoir une réplique exacte de Supabase sur votre machine sans toucher à une base de données distante.

### Prérequis
1. **Docker Desktop** : Assurez-vous que l'application Docker Desktop est lancée sur votre ordinateur.
2. **Supabase CLI** : Déjà installée globalement via `npm install -g supabase`.

### Étapes

1. **Démarrer les conteneurs Supabase :**
   Ouvrez un terminal dans le dossier du projet et exécutez :
   ```bash
   supabase start
   ```
   *(Le premier lancement télécharge les images Docker nécessaires).*

2. **Accéder à Supabase Studio local :**
   Une fois démarré, le terminal affichera :
   - **Studio URL :** `http://localhost:54323` (Interface web visuelle de votre base)
   - **API URL :** `http://127.0.0.1:54321`
   - **anon key :** Votre clé publique locale (déjà pré-renseignée dans `.env.local`)

3. **Appliquer les migrations :**
   Le schéma est déjà prêt dans `supabase/migrations/`. La commande `supabase start` l'applique automatiquement. Vous pouvez également exécuter le script standalone `supabase/schema.sql` depuis l'éditeur SQL du Studio local (`http://localhost:54323`).

4. **Lancer le jeu :**
   Servez le projet avec n'importe quel serveur HTTP local (par exemple Live Server dans VS Code ou `npx serve .`). Le voyant en haut à droite passera au **Vert : Supabase Local**.

5. **Arrêter l'environnement local :**
   Pour libérer la mémoire et le processeur :
   ```bash
   supabase stop
   ```

---

## 🌐 Option 2 : Déploiement en Production (Supabase Cloud + Vercel)

### Étape 1 : Créer la base de données sur Supabase Cloud
1. Rendez-vous sur [supabase.com](https://supabase.com) et créez un projet gratuit (ex: `life-rpg`).
2. Allez dans le menu **SQL Editor** dans le tableau de bord Supabase.
3. Ouvrez le fichier `supabase/schema.sql` de ce projet, copiez l'intégralité de son contenu, collez-le dans l'éditeur SQL et cliquez sur **Run**.
   - *Cela crée les tables `player_profile`, `arcs`, `quests`, `achievements`, les règles de sécurité RLS et injecte les données de départ.*
4. Allez dans **Project Settings** > **API** et notez :
   - **Project URL** (ex: `https://abcdefghijkl.supabase.co`)
   - **anon / public key** (ex: `eyJhbGciOi...`)

### Étape 2 : Déployer sur Vercel
1. Poussez votre projet sur GitHub ou GitLab.
2. Connectez-vous sur [vercel.com](https://vercel.com) et importez votre dépôt.
3. Dans la section **Environment Variables** du projet Vercel, ajoutez ces 2 variables :
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://votre-projet.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `votre-cle-anon-publique`
4. Cliquez sur **Deploy**.

Vercel hébergera instantanément le jeu statique et la fonction serverless `/api/config.js` qui fournit les clés au client de façon transparente et sécurisée !

---

## 🎮 Indicateur Cloud & Configuration en Jeu

Dans l'en-tête de l'application, un voyant interactif indique l'état en direct :
- 🟢 **Supabase Cloud / Local :** Sauvegardes instantanément synchronisées avec PostgreSQL.
- 🟡 **Local (Offline) :** Sauvegardes conservées dans `localStorage`.

En cliquant sur ce voyant, vous pouvez :
- Vérifier l'URL et la dernière date de synchronisation.
- Forcer un transfert des données locales vers Supabase (*Envoyer vers Cloud*).
- Télécharger les données de Supabase (*Charger du Cloud*).
- Renseigner manuellement une URL et une clé sans avoir à redéployer.
