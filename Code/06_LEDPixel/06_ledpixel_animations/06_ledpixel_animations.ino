
/*
 * ====================================================
 * ESP32 FREenove - CHAPITRE 06
 * 8 ANIMATIONS LEDPIXEL
 * ====================================================
 *
 * S (IN) -> GPIO 2
 * V (IN) -> EXT-3.3V
 * G (IN) -> GND
 *
 * Bibliotheque : Adafruit NeoPixel
 *
 * Chaque animation dure environ 5 secondes.
 * ====================================================
 */

#include <Adafruit_NeoPixel.h>
#include <math.h>

#define PIN_LED 2
#define NB_LEDS 8
#define LUMINOSITE 30

Adafruit_NeoPixel leds(
  NB_LEDS, PIN_LED, NEO_GRB + NEO_KHZ800
);

// Couleurs utiles
uint32_t rouge()  { return leds.Color(255, 0, 0); }
uint32_t bleu()   { return leds.Color(0, 0, 255); }
uint32_t vert()   { return leds.Color(0, 255, 0); }
uint32_t orange() { return leds.Color(255, 80, 0); }

void eteindre() {
  leds.clear();
  leds.show();
}

// 1. ARC-EN-CIEL TOURNANT
void arcEnCiel() {
  for (int tour = 0; tour < 150; tour++) {
    for (int i = 0; i < NB_LEDS; i++) {
      uint16_t teinte =
        (tour * 400 + i * 65536L / NB_LEDS) % 65536;

      leds.setPixelColor(
        i, leds.gamma32(leds.ColorHSV(teinte))
      );
    }
    leds.show();
    delay(30);
  }
}

// 2. CHENILLARD
void chenillard() {
  for (int tour = 0; tour < 5; tour++) {
    for (int i = 0; i < NB_LEDS; i++) {
      leds.clear();
      leds.setPixelColor(i, bleu());
      leds.show();
      delay(120);
    }
  }
}

// 3. BATTEMENT DE COEUR
void coeur() {
  for (int cycle = 0; cycle < 4; cycle++) {
    for (int pulse = 0; pulse < 2; pulse++) {
      for (int b = 0; b <= 255; b += 15) {
        leds.fill(leds.Color(b, 0, 0));
        leds.show();
        delay(8);
      }
      for (int b = 255; b >= 0; b -= 15) {
        leds.fill(leds.Color(b, 0, 0));
        leds.show();
        delay(8);
      }
      delay(120);
    }
    delay(600);
  }
}

// 4. EFFET FEU
void feu() {
  for (int t = 0; t < 100; t++) {
    for (int i = 0; i < NB_LEDS; i++) {
      int intensite = random(30, 180);
      leds.setPixelColor(
        i, leds.Color(intensite, intensite / 4, 0)
      );
    }
    leds.show();
    delay(50);
  }
}

// 5. MINI-HORLOGE
void horloge() {
  for (int i = 0; i < NB_LEDS; i++) {
    leds.clear();
    leds.setPixelColor(i, vert());
    leds.show();
    delay(1000);
  }
}

// 6. VAGUE BLEUE
void vague() {
  for (int t = 0; t < 150; t++) {
    for (int i = 0; i < NB_LEDS; i++) {
      float onde = sin(t * 0.15 - i * 0.8);
      int intensite = (onde + 1.0) * 127.5;

      leds.setPixelColor(
        i, leds.Color(0, intensite / 3, intensite)
      );
    }
    leds.show();
    delay(30);
  }
}

// 7. ETOILES SCINTILLANTES
void etoiles() {
  for (int t = 0; t < 100; t++) {
    leds.clear();

    int pixel = random(NB_LEDS);
    int luminosite = random(50, 255);

    leds.setPixelColor(
      pixel,
      leds.Color(luminosite, luminosite, luminosite)
    );

    leds.show();
    delay(50);
  }
}

// 8. GYROPHARE
void gyrophare() {
  for (int t = 0; t < 25; t++) {
    for (int i = 0; i < NB_LEDS; i++) {
      leds.setPixelColor(
        i, i < 4 ? rouge() : bleu()
      );
    }
    leds.show();
    delay(100);

    for (int i = 0; i < NB_LEDS; i++) {
      leds.setPixelColor(
        i, i < 4 ? bleu() : rouge()
      );
    }
    leds.show();
    delay(100);
  }
}

// INITIALISATION
void setup() {
  Serial.begin(115200);

  leds.begin();
  leds.setBrightness(LUMINOSITE);
  eteindre();

  // Initialise le generateur aleatoire
  randomSeed(micros());

  Serial.println("8 animations LEDPixel !");
}

// BOUCLE PRINCIPALE
void loop() {
  Serial.println("1 - Arc-en-ciel");
  arcEnCiel();
  eteindre();

  Serial.println("2 - Chenillard");
  chenillard();
  eteindre();

  Serial.println("3 - Coeur");
  coeur();
  eteindre();

  Serial.println("4 - Feu");
  feu();
  eteindre();

  Serial.println("5 - Horloge");
  horloge();
  eteindre();

  Serial.println("6 - Vague");
  vague();
  eteindre();

  Serial.println("7 - Etoiles");
  etoiles();
  eteindre();

  Serial.println("8 - Gyrophare");
  gyrophare();
  eteindre();

  delay(1000);
}
