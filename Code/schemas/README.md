# Schémas de câblage — Freenove Ultimate Starter Kit for ESP32

Extraits du `C_Tutorial.pdf` officiel (pages « Circuit » : schéma électronique en haut, photo du câblage réel sur breadboard en bas).

| Chapitre | Exercice | Fichier(s) |
|---|---|---|
| 1 | LED | `ch1_circuit_led.png` (+ `ch1_composants_led.png` pour la théorie) |
| 2 | Bouton + LED | `ch2_circuit_bouton_led.png` |
| 3 | Barre de LED | `ch03_led_bar.png` |
| 4 | Analogique & PWM (LED qui respire) | `ch04_analog_pwm.png` |
| 5 | LED RGB | `ch05_rgb_led.png` |
| 6 | Ruban LEDPixel | `ch06_ledpixel.png` |
| 7 | Buzzer | `ch07_buzzer.png` |
| 8 | Communication série | *(pas de schéma : chapitre 100 % logiciel, rien à câbler — exercices `Sketch_08.1_SerialPrinter` et `Sketch_08.2_SerialReadWrite`, déjà couverts par l'usage du moniteur série)* |
| 9 | Convertisseur ADC/DAC | `ch09_adc_dac.png` |
| 10 | Capteur tactile | `ch10_touch_1.png`, `ch10_touch_2.png` |
| 11 | Potentiomètre + LED | `ch11_potentiometre_1/2/3.png` |
| 12 | Photorésistance | `ch12_photoresistance.png` |
| 13 | Thermistance | `ch13_thermistance.png` |
| 14 | Joystick | `ch14_joystick.png` |
| 15 | 74HC595 + barre LED | `ch15_74hc595_ledbar.png` |
| 16 | Afficheur 7 segments / matrice LED | `ch16_7segments_1/2.png`, `ch16_matrice_led.png` |
| 17 | Relais & moteur | `ch17_relais_moteur.png` |
| 18 | Servomoteur | `ch18_servo_1.png`, `ch18_servo_2.png` |
| 19 | Moteur pas à pas | `ch19_moteur_pas_a_pas.png` |
| 20 | Écran LCD1602 (I2C) | `ch20_lcd1602.png` |
| 21 | Télémètre ultrason | `ch21_ultrason.png` |
| 22 | Clavier matriciel | `ch22_clavier_1.png`, `ch22_clavier_2.png` |
| 23 | Télécommande infrarouge | `ch23_infrarouge_1.png`, `ch23_infrarouge_2.png` |
| 24 | Capteur DHT11 (temp/humidité) | `ch24_dht11_1.png`, `ch24_dht11_2.png` |
| 25 | Détecteur de mouvement PIR | `ch25_detecteur_mouvement.png` |
| 26 | Centrale inertielle MPU6050 | `ch26_mpu6050.png` |
| 27 | Bluetooth | `ch27_bluetooth.png` |
| 28 | Bluetooth audio (DAC) | `ch28_bluetooth_dac.png` |
| 29 | Bluetooth audio (module) | `ch29_bluetooth_audio.png` |
| 31 | Musique depuis carte SD | `ch31_musique_sd_1.png`, `ch31_musique_sd_2.png` |
| 36 | Soudure sur plaque | `ch36_soudure_1.png`, `ch36_soudure_2.png` |

Les codes correspondants sont dans `../Freenove_Ultimate_Starter_Kit_for_ESP32-master/C/Sketches/Sketch_<num>_*`.

Rappels : carte = **ESP32-WROVER** (« ESP32 Wrover Module » dans l'IDE), moniteur série **115200 bauds**, logique **3,3 V**, jamais de 5 V sur un GPIO.
