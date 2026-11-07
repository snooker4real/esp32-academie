/*
 * ============================================================
 * CHAPITRE 31 : LECTEUR MP3 AVEC BOUTON "PISTE SUIVANTE"
 * Kit Freenove Ultimate Starter Kit ESP32-WROVER
 * ============================================================
 *
 * OBJECTIF :
 * Lire les MP3 du dossier /music de la carte SD. Un appui sur le
 * bouton passe à la piste suivante, puis revient à la première
 * après la dernière. Le titre est affiché dans le moniteur série
 * (115200 bauds). La piste suivante démarre seule à la fin d'un morceau.
 *
 * MATERIEL :
 * - ESP32-WROVER, carte microSD avec un dossier /music
 * - Montage audio du chapitre 31 (transistor NPN + haut-parleur)
 * - Bouton poussoir
 *
 * BIBLIOTHEQUE : ESP8266Audio (dans Freenove/C/Libraries)
 *
 * BRANCHEMENTS :
 * - Audio : GPIO 26, 25 et 22 comme dans le sketch 31.1
 * - Carte SD : GPIO 2, 14 et 15 (imposés, ne pas les utiliser)
 * - Bouton : GPIO 13 d'un côté, GND de l'autre.
 *   La résistance de rappel est interne (INPUT_PULLUP) :
 *   pas besoin des deux résistances de 10 kohms du chapitre 02.
 *
 * LOW = bouton appuyé, HIGH = relâché.
 * ============================================================
 */

#include <Arduino.h>
#include <WiFi.h>
#include "FS.h"
#include "SD_MMC.h"
#include "AudioFileSourceSD_MMC.h"
#include "AudioFileSourceID3.h"
#include "AudioGeneratorMP3.h"
#include "AudioOutputI2SNoDAC.h"   // sortie directe : transistor + haut-parleur
// Avec le module PCM5102A du chapitre 29, remplace par AudioOutputI2S.h
// et par "new AudioOutputI2S()" dans setup().

#define SD_MMC_CMD 15
#define SD_MMC_CLK 14
#define SD_MMC_D0  2
#define I2S_BCLK   26
#define I2S_DOUT   22
#define I2S_LRC    25
#define PIN_BOUTON 13

#define DOSSIER      "/music"
#define MAX_PISTES   32
#define ANTI_REBOND  50   // ms

AudioGeneratorMP3     *mp3;
AudioFileSourceSD_MMC *file = NULL;
AudioFileSourceID3    *id3  = NULL;
AudioOutputI2SNoDAC   *out;

String pistes[MAX_PISTES];
int nbPistes = 0;
int courante = 0;

// ------------------------------------------------------------
// Titre lu dans les balises ID3 du fichier (si le MP3 en a)
// ------------------------------------------------------------
void MDCallback(void *cbData, const char *type, bool isUnicode, const char *string)
{
  (void)cbData;
  if (strcmp(type, "Title") != 0 && strcmp(type, "Performer") != 0) return;

  String texte = "";
  if (isUnicode) string += 2;               // saute l'octet d'ordre (BOM)
  while (*string) {
    texte += *(string++);
    if (isUnicode) string++;                // 2 octets par caractère : on garde le premier
  }
  Serial.printf("   %s : %s\n", strcmp(type, "Title") == 0 ? "Titre" : "Artiste", texte.c_str());
}

// ------------------------------------------------------------
// Liste les .mp3 du dossier, triés par nom
// ------------------------------------------------------------
void listerPistes()
{
  File dir = SD_MMC.open(DOSSIER);
  if (!dir || !dir.isDirectory()) return;

  for (File f = dir.openNextFile(); f && nbPistes < MAX_PISTES; f = dir.openNextFile()) {
    String nom = f.name();
    nom = nom.substring(nom.lastIndexOf('/') + 1);
    String bas = nom;
    bas.toLowerCase();
    // Les fichiers cachés ._xxx.mp3 créés par macOS ne sont pas de la musique
    if (!f.isDirectory() && !nom.startsWith(".") && bas.endsWith(".mp3")) {
      pistes[nbPistes++] = nom;
    }
  }
  for (int i = 1; i < nbPistes; i++) {      // tri par insertion
    String x = pistes[i];
    int j = i - 1;
    while (j >= 0 && pistes[j] > x) { pistes[j + 1] = pistes[j]; j--; }
    pistes[j + 1] = x;
  }
}

// ------------------------------------------------------------
// Arrête la piste en cours et lance la piste n
// ------------------------------------------------------------
void jouer(int n)
{
  // stop() plante si aucune piste n'a encore été lancée (pointeurs vides) : on le garde pour une piste en cours
  if (mp3->isRunning()) mp3->stop();
  delete id3;  id3  = NULL;
  delete file; file = NULL;

  courante = n;
  Serial.printf("\nPiste %d/%d : %s\n", courante + 1, nbPistes, pistes[courante].c_str());

  String chemin = String(DOSSIER) + "/" + pistes[courante];
  file = new AudioFileSourceSD_MMC(chemin.c_str());
  id3  = new AudioFileSourceID3(file);
  id3->RegisterMetadataCB(MDCallback, NULL);
  mp3->begin(id3, out);
}

void setup()
{
  WiFi.mode(WIFI_OFF);
  Serial.begin(115200);
  delay(1000);
  pinMode(PIN_BOUTON, INPUT_PULLUP);

  SD_MMC.setPins(SD_MMC_CLK, SD_MMC_CMD, SD_MMC_D0);
  if (!SD_MMC.begin("/sdcard", true, true, SDMMC_FREQ_DEFAULT, 5)) {
    Serial.println("Carte SD absente ou illisible (insère-la avant de brancher l'USB)");
    return;
  }
  listerPistes();
  if (nbPistes == 0) {
    Serial.println("Aucun fichier .mp3 dans " DOSSIER);
    return;
  }
  Serial.printf("%d piste(s) trouvée(s). Appuie sur le bouton pour passer à la suivante.\n", nbPistes);

  out = new AudioOutputI2SNoDAC();
  out->SetPinout(I2S_BCLK, I2S_LRC, I2S_DOUT);
  out->SetGain(3.5);                        // volume : 0.1 à 3.9
  mp3 = new AudioGeneratorMP3();
  jouer(0);
}

void loop()
{
  if (nbPistes == 0) { delay(1000); return; }

  // Bouton : on agit au moment de l'appui, une seule fois (anti-rebond)
  static bool etatPrecedent = HIGH;
  static unsigned long dernierChangement = 0;
  bool etat = digitalRead(PIN_BOUTON);
  if (etat != etatPrecedent && millis() - dernierChangement > ANTI_REBOND) {
    dernierChangement = millis();
    etatPrecedent = etat;
    if (etat == LOW) jouer((courante + 1) % nbPistes);
  }

  // Lecture : le décodage doit être rappelé le plus souvent possible
  if (mp3->isRunning()) {
    if (!mp3->loop()) jouer((courante + 1) % nbPistes);   // fin de piste -> suivante
  }
}
