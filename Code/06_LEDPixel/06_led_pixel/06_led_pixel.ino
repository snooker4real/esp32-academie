
/*
 * =====================================================
 * CHAPITRE 06 - LEDPIXEL
 * Freenove ESP32-WROVER
 * =====================================================
 *
 * OBJECTIF :
 * Creer un arc-en-ciel tournant sur 8 LED RGB.
 *
 * BRANCHEMENTS :
 * LEDPixel IN S -> GPIO 2
 * LEDPixel IN V -> EXT-3.3V
 * LEDPixel IN G -> GND
 *
 * Bibliotheque : Adafruit NeoPixel
 * =====================================================
 */

#include <Adafruit_NeoPixel.h>

// Broche qui transmet les donnees aux LED
#define PIN_LED 2

// Nombre de LED sur l'anneau
#define NB_LEDS 8

// Creation du controleur NeoPixel
Adafruit_NeoPixel anneau(
  NB_LEDS,
  PIN_LED,
  NEO_GRB + NEO_KHZ800
);

void setup() {

  Serial.begin(115200);

  // Initialise l'anneau
  anneau.begin();

  // Limite la luminosite pour reduire
  // la consommation electrique
  anneau.setBrightness(30);

  // Eteint toutes les LED
  anneau.clear();
  anneau.show();

  Serial.println("CHAPITRE 06 - LEDPIXEL");
  Serial.println("Arc-en-ciel demarre !");
}

void loop() {

  // Fait tourner les couleurs autour de l'anneau
  for (int decalage = 0; decalage < 65536;
       decalage += 256) {

    // Configure chaque LED individuellement
    for (int i = 0; i < NB_LEDS; i++) {

      // Calcule une couleur differente
      // selon la position de la LED
      uint16_t teinte =
        decalage + (i * 65536L / NB_LEDS);

      uint32_t couleur =
        anneau.gamma32(anneau.ColorHSV(teinte));

      // Applique la couleur au pixel
      anneau.setPixelColor(i, couleur);
    }

    // Envoie les donnees a l'anneau
    anneau.show();

    // Vitesse de l'animation
    delay(30);
  }
}
