/*
 * exo30_thermistance_sd.ino — Exercice 30.1 : journal de température sur carte SD
 * Carte : Freenove ESP32-WROVER (« ESP32 Wrover Module ») — Série : 115200 bauds
 *
 * Toutes les 10 secondes, une ligne est ajoutée à /thermistance.csv sur la carte SD :
 *   secondes,adc,temperature_c
 *   10,2048,25.00
 * « secondes » = temps écoulé depuis le démarrage de la carte (pas d'horloge à l'heure :
 * après un redémarrage, le compteur repart de 0 et les lignes s'ajoutent à la suite).
 *
 * Montage : thermistance sur GPIO 4 comme au chapitre 13, carte microSD (FAT32) dans le
 * lecteur de la carte. La SD utilise GPIO 2, 14 et 15 en mode 1 bit, donc GPIO 4 reste libre.
 *
 * Relire le fichier : éteins la carte, sors la microSD, mets-la dans un lecteur USB, puis
 * ouvre thermistance.csv (Numbers, Excel ou `cat /Volumes/<nom>/thermistance.csv`).
 * Le fichier est refermé après chaque ligne : couper l'alimentation ne perd rien.
 */

#include "FS.h"
#include "SD_MMC.h"

#define SD_MMC_CMD 15
#define SD_MMC_CLK 14
#define SD_MMC_D0  2
#define PIN_THERMISTANCE 4

#define CHEMIN     "/thermistance.csv"
#define INTERVALLE 10000UL   // ms entre deux mesures

bool carteOk = false;
unsigned long dernierReleve = 0;

void releve() {
  int adc = analogRead(PIN_THERMISTANCE);
  if (adc <= 0 || adc >= 4095) {                  // capteur débranché : la formule donnerait n'importe quoi
    Serial.println("Thermistance non branchee ou hors plage, mesure ignoree");
    return;
  }
  // Même calcul qu'au chapitre 13 (thermistance 10 kohms, B = 3950)
  double tension = (double)adc / 4095.0 * 3.3;
  double rt = 10 * tension / (3.3 - tension);
  double tempC = 1 / (1 / (273.15 + 25) + log(rt / 10) / 3950.0) - 273.15;

  File f = SD_MMC.open(CHEMIN, FILE_APPEND);
  if (!f) {
    Serial.println("Ecriture impossible (carte retiree ?)");
    return;
  }
  f.printf("%lu,%d,%.2f\n", millis() / 1000, adc, tempC);
  f.close();
  Serial.printf("%lu s : ADC %d, %.2f C -> ecrit sur la carte\n", millis() / 1000, adc, tempC);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  SD_MMC.setPins(SD_MMC_CLK, SD_MMC_CMD, SD_MMC_D0);
  if (!SD_MMC.begin("/sdcard", true, true, SDMMC_FREQ_DEFAULT, 5)) {
    Serial.println("Carte SD absente ou illisible (insere-la avant de brancher l'USB)");
    return;
  }
  if (!SD_MMC.exists(CHEMIN)) {                   // en-tête une seule fois, à la création du fichier
    File f = SD_MMC.open(CHEMIN, FILE_WRITE);
    if (!f) {
      Serial.println("Creation de " CHEMIN " impossible");
      return;
    }
    f.println("secondes,adc,temperature_c");
    f.close();
  }
  carteOk = true;
  dernierReleve = millis() - INTERVALLE;          // première mesure tout de suite
  Serial.println("Journal dans " CHEMIN ", une mesure toutes les 10 s");
}

void loop() {
  if (carteOk && millis() - dernierReleve >= INTERVALLE) {
    dernierReleve = millis();
    releve();
  }
}
