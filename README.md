# Jungle à Pat' — Site v2 "Carnet d'explorateur immersif"

Site vitrine one-page haut de gamme pour le jardin botanique Jungle à Pat', La Rivière Saint-Louis, La Réunion.

## ✨ Ce qui change par rapport à la v1

- **Sentier animé** qui court sur toute la page (fil conducteur visuel)
- **Rayons de lumière tropicale** qui pulsent doucement dans le hero
- **5 feuilles flottantes** avec parallax et animation de balancement
- **Alternance gauche/droite** des sections pour simuler la balade
- **Cartes "featured"** avec tag ("Différenciant", "Moment fort")
- **Galerie masonry** avec légendes qui apparaissent au hover
- **Ruban de scotch** sur l'image du carnet (effet carnet collé)
- **Compas animé** sur le plan du jardin
- **Preuve sociale** avec compteur animé dans le hero
- **Note manuscrite** "Apprécié des familles et des écoles" dans le hero
- **Filigranes numéros de section** (01, 02, 03…) façon livre
- **Plus d'animations subtiles** : hover, stickers flottants, pulsations

## 📁 Contenu du dossier

- `index.html` — structure du site
- `style.css` — design complet (~1100 lignes)
- `script.js` — interactions (menu mobile, reveal, parallax, compteurs)
- `README.md` — ce fichier

## 🖼️ Images à ajouter dans ce même dossier

Noms EXACTS à respecter :

- `jardin-1.jpg` — photo d'ambiance principale (portrait 4:5 recommandé)
- `jardin-2.jpg` — autre vue du jardin
- `sentier.jpg` — sentier principal
- `coin-cafe.jpg` — coin café
- `coin-marmaille.jpg` — coin marmaille / enfants
- `plantes.jpg` — gros plan sur la végétation
- `point-de-vue.jpg` — vue depuis le point de vue (paysage recommandé)
- `carnet-pedagogique.jpg` — photo du carnet ou d'un enfant l'utilisant
- `plan-jungle-a-pat.jpg` — le plan illustré du jardin
- `plan-jungle-a-pat.pdf` — version PDF téléchargeable (optionnel)
- `hero-jungle.jpg` — image pour le partage sur réseaux sociaux

**Conseils photos :**
- Compresse tes images sur [tinypng.com](https://tinypng.com) avant publication
- Privilégie les formats **JPG** (plus légers que PNG pour les photos)
- Taille idéale : entre **1200 et 1800 px de large**
- Format **4:5 portrait** pour `jardin-1.jpg` (section Découvrir)
- Format **paysage** pour la galerie et le point de vue

## 🚀 Publier le site en ligne (gratuit, 2 minutes)

### Méthode la plus simple : Netlify Drop

1. Va sur **[app.netlify.com/drop](https://app.netlify.com/drop)**
2. Glisse-dépose tout le dossier `jungle-a-pat-v2` sur la page
3. Ton site est en ligne en quelques secondes avec une URL `xxx.netlify.app`
4. Tu peux ensuite connecter ton propre nom de domaine (ex: `junglapat.re`)

### Alternative : Vercel

1. Crée un compte sur [vercel.com](https://vercel.com)
2. Importe le dossier
3. Déploiement automatique

## ✏️ Modifier les textes

Tous les textes sont dans `index.html`. Ouvre le fichier avec :
- **Bloc-notes** (simple)
- **VS Code** (recommandé, gratuit sur [code.visualstudio.com](https://code.visualstudio.com))
- **Claude Code** (si tu es à l'aise avec le terminal)

### Modifications fréquentes

| Ce que tu veux changer | Où chercher |
|---|---|
| Numéro de téléphone | `0693 05 40 38` |
| Adresse | `213 route Hubert Delisle` |
| Tarifs | classe `.info-prices` (ligne ~450) |
| Horaires | classe `.info-hours` |
| Nom de l'équipe | `Patricia & l'équipe` (bas du CTA) |

## 🎨 Changer les couleurs

Tout est centralisé dans `style.css` tout en haut, dans la section `:root`. Modifie ces variables et toutes les couleurs du site s'adaptent :

```css
--c-jungle: #1a3a2e;        /* Vert dominant */
--c-terracotta: #b55a3a;    /* Accents orange */
--c-cream: #f4ede0;         /* Fond principal */
--c-sand: #c9ab7c;          /* Beige/or */
```

## 📱 Tester sur mobile

Dans Chrome : **clic-droit → Inspecter → icône téléphone** en haut à gauche.

## ♿ Accessibilité

Le site respecte :
- `prefers-reduced-motion` (les utilisateurs sensibles aux animations)
- Niveaux de titres sémantiques (H1, H2, H3)
- Contrastes de couleurs conformes
- Navigation clavier
- Focus visibles
- Alt text sur toutes les images
- ARIA labels sur les boutons importants

## 🔍 SEO

Le site est optimisé pour ces mots-clés :
- jardin botanique La Réunion
- jardin tropical La Réunion
- sortie famille La Réunion
- visite jardin La Rivière Saint-Louis
- sortie scolaire nature La Réunion

## 🧰 Pas de framework

Pas de React, pas de jQuery, pas de build. C'est du **HTML / CSS / JS pur**, qui marche partout, se charge vite, et se modifie facilement.

---

🌿 Bon lancement Nathan ! Si tu veux faire évoluer le site par la suite, il suffit de demander.
