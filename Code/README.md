# Sketches ESP32 — navigation

Copie de travail organisée des sketches Freenove ESP32-WROVER. Les dossiers et fichiers d'origine restent dans `Code/` à leur emplacement initial.

## Chapitres

- `01_LED/` — clignotement de la LED intégrée et exercice Blink.
- `02_Bouton/` — bouton + LED et variante jeu de réflexes.
- `03_LED_bar/` — dossier réservé au chapitre LED bar ; aucun sketch correspondant n'a été trouvé.
- `04_PWM/` — `04_pwm.ino.ino` (dossier `04_pwm.ino`) et `03_ch03_chenille_lumineu.ino`.
- `05_RGB/` — LED RGB.
- `06_LEDPixel/` — LEDPixel, animations et sketch web.
- `07_Buzzer/` — bip, alarme avec bouton, SOS, réflexes et serveur web en point d'accès Wi-Fi.
- `09_ADC_DAC/Sketch_09.1_ADC_DAC/` — lecture du potentiomètre sur GPIO 4, sortie DAC sur GPIO 25.
- `10_Tactile/Sketch_10.2_TouchLamp/` — bascule de la LED intégrée par toucher sur GPIO 4, seuils adaptés aux mesures de la carte.
- `11_Potentiometre/` — sketches `SoftLight`, `SoftColorfulLight` et `SoftRainbowLight`.
- `12_Photoresistance/Sketch_12.1_NightLamp/` — photorésistance et LED automatique.
- `13_Thermistance/Sketch_13.1_Thermometer/` — lecture de température par thermistance sur GPIO 4.
- `14_Joystick/Sketch_14.1_Joystick/` — lecture des axes X/Y et du bouton du joystick.
- `15_74HC595/Sketch_15.1_FlowingLight02/` — chenillard sur la barre LED via le registre 74HC595.
- `16_Afficheurs/Sketch_16.1_1_Digit_7-Segment_Display/` — affiche les chiffres hexadécimaux avec le 74HC595.
- `31_Musique_SD/31_playlist_bouton/` — lecteur MP3 du dossier `/music` de la carte SD : un bouton (GPIO 13 vers GND) passe à la piste suivante, le titre s'affiche dans le moniteur série.
- `34_Camera/Sketch_34.1_CameraWebServer/` — serveur web de la caméra avec une interface refaite (`ui.html`, compressée dans `camera_ui.h` par `python3 build_ui.py`).

## Ouvrir dans Arduino IDE

Ouvrir le dossier du sketch voulu (il porte le même nom que le fichier `.ino`). `SoftRainbowLight` nécessite la bibliothèque `Freenove_WS2812_Lib_for_ESP32`. Le sketch local `06_LEDPixel/esp32_ledpixel_web/` n'est pas publié car il contient des identifiants Wi-Fi ; remplace-les par des valeurs fictives avant de le partager.

## Ambiguïtés constatées

- `03_ch03_chenille_lumineu.ino` annonce le chapitre 04 et une LED qui respire dans son en-tête, malgré son nom évoquant le chapitre 03. Il reste classé dans `04_PWM` d'après son contenu annoncé.
- `04_pwm.ino.ino` contient aussi le projet LED qui respire ; doublon probable de `03_ch03_chenille_lumineu.ino`. Les deux copies sont conservées séparément.
- Aucun sketch LED bar (chapitre 03) n'était présent dans `Code/`.
- `buzzer_connected.ino` démarre un point d'accès Wi-Fi et un serveur web. Le sketch LEDPixel web tente d'abord le mode client, puis bascule en point d'accès.
