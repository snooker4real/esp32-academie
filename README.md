# ESP32 Académie

Un site d'apprentissage local pour le **Freenove Ultimate Starter Kit for ESP32-WROVER**, en français.
Il suit 36 chapitres, propose des quiz et des défis, et regroupe 28 projets libres avec leur liste d'achats Amazon.fr (page Panier).

Le site est en JavaScript et CSS sans framework. Un petit serveur Python sert les pages et enregistre la progression sur le disque.

## Lancer le site

```bash
cd site
python3 server.py
```

Puis ouvrir http://localhost:8743. Il faut Python 3 et rien d'autre. La progression est enregistrée dans `site/progress.json` et `site/extra.json`, créés au premier usage et absents du dépôt.

## Tests

```bash
cd site
python3 test_site.py
node test_game.js
```

## Contenu du dépôt

- `site/` contient le site, son serveur et ses tests. Les textes des chapitres et des projets sont dans `site/content/`.
- `Code/` contient mes sketches Arduino, un dossier par chapitre. Voir `Code/README.md`.
- `schemas/` contient les schémas de câblage affichés dans les chapitres.

## Le kit Freenove

Les pages de documentation et les sketches d'origine viennent du dépôt officiel du kit, qui n'est pas copié ici. Pour les avoir dans le site, télécharger
[Freenove_Ultimate_Starter_Kit_for_ESP32](https://github.com/Freenove/Freenove_Ultimate_Starter_Kit_for_ESP32)
et placer le dossier décompressé, nommé `Freenove_Ultimate_Starter_Kit_for_ESP32-master`, à côté de `site/`. Sans lui, le site marche, mais ces pages restent vides.

## Mots de passe Wi-Fi

Les sketches qui utilisent le Wi-Fi contiennent `VOTRE_WIFI` et `VOTRE_MOT_DE_PASSE`. Les remplacer par tes valeurs avant de téléverser. Le serveur masque aussi ces lignes quand il affiche du code dans le site.

## Licences et crédits

- Les schémas de `schemas/` sont extraits du tutoriel officiel de Freenove, et les sketches de `Code/` sont adaptés de ceux du kit.
  Ils sont sous licence [CC BY-NC-SA 3.0](https://creativecommons.org/licenses/by-nc-sa/3.0/) : attribution à Freenove, pas d'usage commercial, partage dans les mêmes conditions.
- Les illustrations des badges, des projets et de l'icône ont été générées avec Google Flow.
- Le code du site n'a pas encore de licence.
