
/*
 * =====================================================
 * CHAPITRE 05 - LED RGB
 * Freenove ESP32-WROVER
 * =====================================================
 *
 * LED RGB a anode commune.
 *
 * ROUGE : GPIO 4
 * VERT  : GPIO 2
 * BLEU  : GPIO 15
 * COMMUN : EXT-3.3V
 *
 * Une resistance 220 ohms par couleur.
 *
 * OBJECTIF :
 * Faire defiler les couleurs de l'arc-en-ciel.
 * =====================================================
 */

#define PIN_R 4
#define PIN_G 2
#define PIN_B 15

// Resolution PWM : 8 bits (0 a 255)
#define PWM_FREQ 5000
#define PWM_BITS 8

void setColor(int rouge, int vert, int bleu) {

  // Anode commune : valeurs inversees
  // 255 = intensite maximale
  // 0   = canal eteint

  ledcWrite(PIN_R, 255 - rouge);
  ledcWrite(PIN_G, 255 - vert);
  ledcWrite(PIN_B, 255 - bleu);
}

void setup() {

  Serial.begin(115200);

  // Initialisation des trois sorties PWM
  bool okR = ledcAttach(PIN_R, PWM_FREQ, PWM_BITS);
  bool okG = ledcAttach(PIN_G, PWM_FREQ, PWM_BITS);
  bool okB = ledcAttach(PIN_B, PWM_FREQ, PWM_BITS);

  if (!okR || !okG || !okB) {
    Serial.println("Erreur configuration PWM");
    while (true) {
      delay(1000);
    }
  }

  // Eteint les trois couleurs
  setColor(0, 0, 0);

  Serial.println("CHAPITRE 05 - RGB LED");
  Serial.println("Arc-en-ciel demarre !");
}

void loop() {

  // Rouge vers jaune
  for (int i = 0; i <= 255; i++) {
    setColor(255, i, 0);
    delay(10);
  }

  // Jaune vers vert
  for (int i = 255; i >= 0; i--) {
    setColor(i, 255, 0);
    delay(10);
  }

  // Vert vers cyan
  for (int i = 0; i <= 255; i++) {
    setColor(0, 255, i);
    delay(10);
  }

  // Cyan vers bleu
  for (int i = 255; i >= 0; i--) {
    setColor(0, i, 255);
    delay(10);
  }

  // Bleu vers violet
  for (int i = 0; i <= 255; i++) {
    setColor(i, 0, 255);
    delay(10);
  }

  // Violet vers rouge
  for (int i = 255; i >= 0; i--) {
    setColor(255, 0, i);
    delay(10);
  }
}
