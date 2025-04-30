# Carburant - Application de suivi de consommation de carburant

## Description du projet

Carburant est une application web moderne conçue pour suivre et analyser la consommation de carburant d'une flotte de véhicules. Elle permet d'importer des données depuis des fichiers Excel, de visualiser des tendances de consommation, et d'analyser les performances énergétiques (IPE) des différents types de véhicules (camions, voitures, chariots, etc.).

L'application offre des fonctionnalités avancées :

- Importation et validation de données depuis des fichiers Excel
- Tableaux de bord avec visualisations interactives
- Analyse comparative des performances par véhicule
- Calcul automatique des indices de performance énergétique (IPE)
- Filtrage par type de véhicule, période et autres critères
- Stockage persistant des données avec historique d'importation

## Technologies utilisées

Ce projet est construit avec les technologies suivantes :

- **Next.js** - Framework React avec rendu côté serveur
- **TypeScript** - Typage statique pour JavaScript
- **React** - Bibliothèque UI pour construire des interfaces utilisateur
- **DaisyUi** - Composants d'interface utilisateur réutilisables
- **Tailwind CSS** - Framework CSS utilitaire
- **Recharts** - Bibliothèque de visualisation de données
- **XLSX** - Traitement de fichiers Excel

## Comment installer et exécuter ce projet ?

Suivez ces étapes pour configurer et exécuter l'application en local :

```sh
# Étape 1 : Cloner le dépôt
git clone <URL_DU_DÉPÔT>

# Étape 2 : Naviguer vers le répertoire du projet
cd Carburant

# Étape 3 : Installer les dépendances nécessaires
npm install

# Étape 4 : Démarrer le serveur de développement
npm run dev
```

L'application sera accessible à l'adresse [http://localhost:3000](http://localhost:3000).

## Guide d'utilisation

1. **Import de données**

   - Accédez à la page d'importation
   - Téléchargez un fichier Excel contenant les données de consommation
   - Sélectionnez la feuille appropriée
   - Choisissez le type de véhicule
   - Validez et enregistrez les données
2. **Tableaux de bord**

   - Visualisez les tendances de consommation
   - Analysez les performances par véhicule
   - Filtrez par type, période ou matricule
3. **Analyse détaillée**

   - Explorez les IPE par véhicule
   - Comparez les performances entre périodes
   - Identifiez les véhicules les plus efficaces

## Dépannage

Si les données importées n'apparaissent pas dans l'application :

1. Assurez-vous d'avoir cliqué sur "Enregistrer les données" après l'extraction
2. Vérifiez que le type de véhicule sélectionné correspond à celui que vous analysez
3. Actualisez la page pour charger les nouvelles données

## Contribution

Pour contribuer à ce projet :

1. Créez une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
2. Committez vos changements (`git commit -m 'Ajout d'une nouvelle fonctionnalité'`)
3. Poussez vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
4. Ouvrez une Pull Request

## Licence

Ce projet est realisé pour COFICAB TUNISIE
