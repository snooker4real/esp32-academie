
/*
 * ============================================================
 * CHAPITRE 04 : ANALOG & PWM
 * Projet : LED qui respire
 * Kit Freenove ESP32-WROVER
 * ============================================================
 *
 * OBJECTIF :
 * Faire augmenter puis diminuer progressivement
 * la luminosite d'une LED rouge.
 *
 * MATERIEL :
 * - ESP32-WROVER
 * - LED rouge
 * - Resistance 220 ohms
 * - Breadboard et fils
 *
 * BRANCHEMENT :
 * GPIO 2 -> Resistance 220 ohms -> LED (+)
 * LED (-) -> GND
 *
 * ============================================================
 */

// Broche utilisee pour commander la LED
#define PIN_LED 2

// Luminosite comprise entre 0 et 255
int luminosite = 0;

// Vitesse de variation de la luminosite
int vitesse = 10;

void setup() {

  // Configure GPIO 2 comme sortie
  pinMode(PIN_LED, OUTPUT);

  // Initialise le Moniteur serie
  Serial.begin(115200);

  // Eteint la LED au demarrage
  analogWrite(PIN_LED, 0);

  Serial.println("========================");
  Serial.println("CHAPITRE 04 - PWM");
  Serial.println("LED BREATHING");
  Serial.println("========================");
}

void loop() {

  // PHASE 1 : augmenter la luminosite
  for (luminosite = 0; luminosite <= 255; luminosite++) {

    // Applique la valeur PWM
    analogWrite(PIN_LED, luminosite);

    // Attend quelques millisecondes
    delay(vitesse);
  }

  // PHASE 2 : diminuer la luminosite
  for (luminosite = 255; luminosite >= 0; luminosite--) {

    // Diminue progressivement le PWM
    analogWrite(PIN_LED, luminosite);

    delay(vitesse);
  }
}
