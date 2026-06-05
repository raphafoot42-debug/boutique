# ThreadCo — Boutique T-shirts

Boutique e-commerce complète avec paiement Stripe, suivi de commandes et dashboard admin.

## Stack

- **Next.js 14** (App Router)
- **Tailwind CSS**
- **Stripe** (paiements, checkout, webhooks)
- **Vercel** (déploiement)

## Structure

```
app/
├── page.tsx          → Page d'accueil
├── shop/             → Catalogue produits
├── success/          → Page de confirmation après achat
├── orders/           → Suivi de commandes (clients)
├── admin/            → Dashboard admin (données Stripe live)
└── api/
    ├── checkout/     → Création session Stripe
    └── orders/       → Recherche commandes par email
```

## Installation locale

```bash
npm install
```

Créer un fichier `.env.local` :

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```bash
npm run dev
```

## Configuration Stripe

### 1. Créer vos produits dans Stripe

Dans [Stripe Dashboard → Products](https://dashboard.stripe.com/products), créez vos produits et récupérez les **Price IDs** (commencent par `price_...`).

Mettez à jour `lib/products.ts` :
```ts
stripePriceId: 'price_VOTRE_VRAI_ID',
```

### 2. Variables d'environnement

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (`sk_live_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (`pk_live_...`) |
| `NEXT_PUBLIC_APP_URL` | URL de votre site en production |

## Déploiement sur Vercel

```bash
# 1. Pousser sur GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/VOTRE_USER/tshirt-store.git
git push -u origin main

# 2. Importer sur Vercel
# → https://vercel.com/new
# → Importer le repo GitHub
# → Ajouter les variables d'environnement
# → Deploy !
```

## Pages

| URL | Description |
|---|---|
| `/` | Page d'accueil |
| `/shop` | Catalogue — achat via Stripe Checkout |
| `/success` | Confirmation de commande |
| `/orders` | Suivi commandes par email |
| `/admin` | Dashboard admin (protéger en production !) |

## ⚠️ Sécurité admin

La page `/admin` est accessible sans authentification. En production, ajoutez une protection :
- [Clerk](https://clerk.com) (recommandé, gratuit)
- [NextAuth.js](https://next-auth.js.org)
- Ou un middleware `middleware.ts` avec vérification de session

## Personnalisation

- **Produits** : modifier `lib/products.ts`
- **Couleurs** : modifier `tailwind.config.js`
- **Pays de livraison** : modifier `allowed_countries` dans `app/api/checkout/route.ts`
- **Monnaie** : changer `eur` en `usd`, `chf`, etc.
