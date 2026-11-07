# État des changements

- Inventaire réalisé sous `Code/` ; 16 fichiers `.ino` identifiés.
- Création de `Code/Organise/` avec une copie des sketches classés dans les chapitres 01 à 07.
- Chaque sketch copié se trouve dans un dossier portant le nom de base de son fichier `.ino`.
- Aucun original, fichier de données ou projet externe n'a été supprimé ni déplacé.
- Chapitre 03 (LED bar) sans sketch correspondant trouvé ; dossier de repérage vide créé.
- Deux sketches d'apparence PWM/LED respirante conservés distinctement en raison de leurs noms et en-têtes discordants.
- Ressources Freenove, documentation et schémas sont restés à leur emplacement ; ils restent accessibles dans le dépôt fournisseur et `schemas/`.
- Chapitre 09 : ajout du sketch ADC/DAC prêt à téléverser ; potentiomètre sur GPIO 4, sortie DAC GPIO 25, moniteur série à 115200 bauds.
- Chapitre 10 : ajout du sketch tactile avec seuils appuyé/libéré à 350/450, calibrés d'après les mesures 180/585 relevées sur cette carte.
- Ajout des sketches Freenove 11.1, 11.2, 11.3 et 12.1; le 11.3 dépend de `Freenove_WS2812_Lib_for_ESP32`.
- Ajout du sketch Freenove 13.1 Thermometer; sortie de température dans le moniteur série à 115200 bauds.
- Ajout du sketch Freenove 14.1 Joystick; axes analogiques GPIO 13/12 et bouton GPIO 14.
- Ajout du sketch Freenove 15.1 FlowingLight02; barre LED pilotée par le 74HC595.
- Ajout du sketch Freenove 16.1 pour afficheur 7 segments à un chiffre.
