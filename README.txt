MIRADOR BUZZ - prêt à publier
=============================
Fichiers : index.html, auth.js, firebase-config.js (déjà rempli), api/music.js

1. METTRE LES FICHIERS SUR GITHUB
   - Créez un compte sur github.com, puis un dépôt (repository) vide.
   - Touchez "uploading an existing file" et envoyez TOUS les fichiers,
     avec le dossier "api" (music.js dedans). Touchez "Commit changes".

2. PUBLIER AVEC VERCEL (gratuit)
   - Sur vercel.com, connectez-vous avec GitHub.
   - Add New > Project > choisissez le dépôt > Deploy.
   - Vercel donne un lien du type mirador-buzz.vercel.app.

3. AUTORISER LE LIEN DANS FIREBASE (obligatoire)
   - Firebase > Authentication > Paramètres > Domaines autorisés
     > Ajouter un domaine > collez votre lien Vercel sans https://.
