# 🏪 FarTech — Application de gestion de boutique

Application Next.js + PostgreSQL (Neon) déployée sur Vercel.

---

## 🚀 Installation en local

### 1. Cloner / copier le projet
```bash
# Si tu viens de GitHub :
git clone https://github.com/TON_USERNAME/fartech.git
cd fartech
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Créer la base de données sur Neon
1. Va sur **https://console.neon.tech**
2. Clique **New Project** → donne un nom "fartech"
3. Copie la **Connection string** (commence par `postgresql://...`)

### 4. Configurer les variables d'environnement
```bash
cp .env.example .env.local
```
Ouvre `.env.local` et remplis :
```
DATABASE_URL="postgresql://...ton URL neon..."
JWT_SECRET="une-chaine-aleatoire-longue-min-32-chars"
```

### 5. Créer les tables dans la base
```bash
npm run db:push
```

### 6. Remplir les données initiales
```bash
npm run db:seed
```

### 7. Démarrer l'application
```bash
npm run dev
```
Ouvre **http://localhost:3000**

### 🔑 Identifiants par défaut
- **Admin** : `admin@fartech.com` / `admin123`
- **Employé** : `emp@fartech.com` / `emp123`

---

## ☁️ Déploiement sur Vercel

### 1. Pousser sur GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/fartech.git
git push -u origin main
```

### 2. Déployer sur Vercel
1. Va sur **https://vercel.com**
2. Clique **New Project** → importe ton repo GitHub `fartech`
3. Dans **Environment Variables**, ajoute :
   - `DATABASE_URL` → ton URL Neon
   - `JWT_SECRET` → ta clé secrète
4. Clique **Deploy**

### 3. Après le déploiement — créer les tables
Dans le terminal local :
```bash
npm run db:push
npm run db:seed
```

C'est tout ! Ton app est en ligne et synchronisée 🎉

---

## 📁 Structure du projet

```
fartech/
├── app/
│   ├── page.jsx          ← Application complète (React)
│   ├── layout.jsx        ← Layout HTML root
│   ├── globals.css       ← Tous les styles
│   └── api/              ← APIs backend
│       ├── auth/         ← Login / Logout
│       ├── products/     ← CRUD produits
│       ├── transactions/ ← Ventes + échanges
│       ├── employees/    ← Employés
│       ├── categories/   ← Catégories
│       ├── brands/       ← Marques
│       ├── suppliers/    ← Fournisseurs
│       ├── purchases/    ← Achats stock
│       ├── savings/      ← Épargne
│       ├── dashboard/    ← KPIs
│       └── settings/     ← Paramètres
├── lib/
│   ├── db.js             ← Connexion Prisma
│   ├── auth.js           ← JWT helpers
│   ├── api.js            ← Client API frontend
│   ├── middleware.js     ← Protection routes
│   └── utils.js          ← Formatters
└── prisma/
    ├── schema.prisma     ← Schéma base de données
    └── seed.js           ← Données initiales
```

---

## 🔄 Données synchronisées

Toutes les données (produits, ventes, échanges, employés) sont stockées dans PostgreSQL sur Neon. Chaque appareil (téléphone, ordinateur, tablette) lit et écrit dans la même base → synchronisation automatique en temps réel.
