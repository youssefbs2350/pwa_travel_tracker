# Travel Tracker PWA 🌍✈️
> Application Progressive Web App (PWA) connectée à **MongoDB**, installable et utilisable à 100% hors-ligne avec générateur d'itinéraires et de voyages assisté par l'IA.

---

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Contrôle des Rôles
1. **Connexion & Inscription sécurisées** : Authentification par jetons JWT avec maintien de session locale sécurisée.
2. **Hiérarchie stricte des privilèges** :
   - **Voyageur (`Traveler`)** : Suivi de son agenda, consultation des lieux, gestion de son budget, publication de souvenirs et dépôt de réclamations confidentielles (visibles uniquement par lui-même).
   - **Organisateur (`Organizer`) & Administrateur (`Admin`)** : Seuls profils autorisés à créer ou générer des voyages organisés et à arbitrer les réclamations.
   - Les rôles des utilisateurs ne peuvent être modifiés que par un Administrateur.
3. **Réinitialisation de mot de passe sécurisée** : Envoi réel d'un code OTP par e-mail via serveur SMTP (Gmail sécurisé avec variables d'environnement masquées).

---

### 🤖 Générateur IA d'Itinéraires & de Voyages Organisés
- **Recherche tolérente aux fautes d'orthographe** : Reconnaissance et normalisation intelligente des villes et pays (ex. `brcelon`, `djerba`, `marakech`, `tokio`).
- **Coordonnées géographiques & photos automatiques** : Détection des coordonnées GPS réelles et association d'images haute résolution.
- **Planning journalier dynamique** : Génération complète du planning selon le nombre de jours et le rythme choisi (Relaxé, Équilibré, Intense) avec prévention des chevauchements d'horaires.
- **Budget prévisionnel automatique** : Intégration directe des coûts d'activités, transport et hébergement dans le module de budget.
- **Suggestions IA en 1 clic** : Recommandations intelligentes de lieux et activités complémentaires disponibles directement dans les onglets Lieux et Planning.

---

### 🗺️ Carte Interactive Leaflet & Géolocalisation
- Carte interactive OpenStreetMap / Leaflet avec affichage des marqueurs des lieux visités.
- Tracé polyline reliant séquentiellement chaque étape du séjour.
- Géolocalisation temps réel avec calcul instantané de la proximité kilométrique des points d'intérêt.
- Restriction sur les avis : notation possible uniquement sur les lieux visités lors de séjours terminés.

---

### 📸 Souvenirs de Voyage (Journal & Galerie)
- Attribution transparente : chaque souvenir affiche clairement le nom et le rôle de son auteur (`👤 Ajouté par : [Nom] ([Rôle])`), le voyage associé et l'emplacement exact.
- Prise en charge de l'import direct de photos locales depuis votre appareil ou via URL.
- Mode Journal chronologique et Galerie avec visionneuse plein écran.

---

### 🍃 Architecture Backend & Persistance Hors-Ligne
- **Backend Node.js + Express + TypeScript** connecté à **MongoDB** via Mongoose (`User`, `Trip`, `Place`, `Activity`, `Expense`, `Memory`, `Complaint`).
- **Offline-First (Dexie / IndexedDB)** : Fonctionnement autonome sans connexion Internet avec file d'attente de synchronisation (`syncQueue`) qui répercute automatiquement les mutations vers MongoDB dès la reconnexion.
- **PWA installable** : Fichiers manifest et Service Worker pour installation sur desktop (Chrome, Edge) et mobile (Android, iOS).

---

## 🚀 Installation & Lancement

### 1. Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- [MongoDB](https://www.mongodb.com/) (local ou cluster Atlas)

### 2. Cloner le projet
```bash
git clone https://github.com/youssefbs2350/pwa_travel_tracker.git
cd pwa_travel_tracker
```

### 3. Installer les dépendances
```bash
npm install
```

### 4. Configurer les variables d'environnement
Créez un fichier `.env` à la racine du projet en vous basant sur `.env.example` :
```bash
cp .env.example .env
```

Renseignez les variables nécessaires dans `.env` :
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/traveltracker
JWT_SECRET=votre-cle-secrete-jwt

# Configuration SMTP pour l'envoi d'OTP réels
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=votre-adresse-email@gmail.com
SMTP_PASS=votre-mot-de-passe-application
SMTP_FROM="Travel Tracker PWA" <votre-adresse-email@gmail.com>
```

### 5. Lancer l'application
```bash
npm run dev
```

L'application démarre simultanément :
- **L'API Express & MongoDB** sur `http://localhost:5000`
- **Le client PWA React** sur `http://localhost:5173`

---

## 🛠️ Scripts Disponibles

- `npm run dev` : Lance le backend Express et le frontend Vite en simultané.
- `npm run build` : Compile le projet TypeScript et génère les assets de production dans `dist/`.
- `npm run preview` : Prévisualise le build de production localement.
