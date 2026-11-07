/*
 * exo01_blink.ino — Premier programme ESP32 de Jonathan (fait le 2026-11-04)
 * Carte : Freenove ESP32-WROVER (« ESP32 Wrover Module ») — Série : 115200 bauds
 * Effet : la LED sur GPIO 2 clignote chaque seconde, avec message sur le moniteur série.
 */

#define PIN_LED 2

void setup() {
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("Demarrage ESP32 !");
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  Serial.println("LED allumee");
  delay(1000);

  digitalWrite(PIN_LED, LOW);
  Serial.println("LED eteinte");
  delay(1000);
}
