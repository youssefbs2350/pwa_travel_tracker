# Travel Tracker PWA 🌍✈️
> Application Progressive Web App (PWA) connectée à **MongoDB**, installable et utilisable à 100% hors-ligne.

---

## 🔐 Authentification & Règle Stricte des Rôles (Module 1 - Chaima)

L'application s'ouvre désormais sur un **écran d'authentification complet** ([`AuthScreen.tsx`](file:///C:/Users/youss/.gemini/antigravity/scratch/travel-tracker-pwa/src/components/auth/AuthScreen.tsx)) :
1. **Connexion & Inscription** : Requêtes authentifiées avec jetons JWT (stockés pour maintien de session et mode hors-ligne).
2. **Attribution des Rôles** :
   - Par défaut, tout nouvel utilisateur inscrit reçoit le rôle `Traveler`.
   - **Règle stricte : Le rôle ne peut être modifié que par un Administrateur (`Admin`) !**
   - Pour les comptes `Traveler` et `Organizer`, les sélecteurs de rôle sont verrouillés (cadenas de sécurité).
   - L'utilisateur connecté avec le rôle `Admin` (ex: **Chaima Benali**) a accès au tableau d'administration des comptes dans le Module 1 et à la gestion de privilèges dans la barre de navigation.
3. **Accès Démo 1-Clic** sur l'écran d'accueil pour tester directement chaque profil :
   - 🛡️ **Chaima Benali** (`chaima@traveltracker.io`) ➔ **Admin** (Pouvoir de modification des rôles & litiges)
   - ✈️ **Youssef Trabelsi** (`youssef@traveltracker.io`) ➔ **Organizer** (Création de voyages, optimisation planning)
   - 🎒 **Ameni Mansour** (`ameni@traveltracker.io`) ➔ **Traveler** (Voyageur, suivi dépenses & avis)

---

## 🍃 Architecture Backend MongoDB

Le backend utilise **Node.js + Express + Mongoose** connecté au serveur local MongoDB (`mongodb://127.0.0.1:27017/traveltracker`) :
- [`server/models/`](file:///C:/Users/youss/.gemini/antigravity/scratch/travel-tracker-pwa/server/models/) : Modèles Mongoose pour les 7 modules (`User`, `Trip`, `Place`, `Activity`, `Expense`, `Memory`, `Complaint`).
- [`server/routes/sync.ts`](file:///C:/Users/youss/.gemini/antigravity/scratch/travel-tracker-pwa/server/routes/sync.ts) : Endpoint de synchronisation de batch qui reçoit toutes les actions créées/modifiées hors-ligne et les répercute dans MongoDB lors de la reconnexion.

---

## 📱 PWA Téléchargeable & Fonctionnement Hors-Ligne (Offline-First)

1. **Véritables Icônes PNG** : Fichiers PNG avec en-têtes et dimensions réelles `192x192` et `512x512` générés dans `public/`.
2. **Web App Manifest** : Référencé dans `index.html` (`/manifest.json` et `/manifest.webmanifest`).
3. **Service Worker Actif en Dev et Prod** : `devOptions: { enabled: true }` permet de capturer l'événement natif `beforeinstallprompt` dès le mode développement.
4. **Bouton d'Installation** :
   - Sur **Google Chrome / Microsoft Edge** : Le bouton « Installer PWA » ouvre directement l'invite système d'installation.
   - Sur **Safari iOS** : Le guide d'ajout à l'écran d'accueil est accessible dans la modale d'aide.
5. **Mode Hors-Ligne & Sync Queue** :
   - Toutes les modifications faites sans réseau sont enregistrées localement dans **IndexedDB (Dexie)**.
   - Une file d'attente (`syncQueue`) rejoue automatiquement les mutations vers MongoDB dès que la connexion est rétablie.
   - Un bouton interactif « En Ligne / Hors-Ligne » dans la barre supérieure permet de simuler la déconnexion réseau pour vos tests et présentations.

---

## 🚀 Lancement Rapide

```bash
cd "C:\Users\youss\.gemini\antigravity\scratch\travel-tracker-pwa"
npm run dev
```

L'application démarre simultanément :
- **L'API Express MongoDB** sur `http://localhost:5000`
- **Le client PWA React** sur `http://localhost:5173` (ou `5175`)
