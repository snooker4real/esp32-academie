
/*
 * Freenove ESP32-WROVER
 * Chapitre 7 - Alarme a impulsions
 *
 * GPIO 13 : buzzer via transistor
 * GPIO 4  : bouton actif LOW
 */

const int BUZZER = 13;
const int BOUTON = 4;

bool buzzerAllume = false;
unsigned long dernierChangement = 0;

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(BOUTON, INPUT);

  digitalWrite(BUZZER, LOW);
}

void loop() {
  bool appuye = digitalRead(BOUTON) == LOW;

  if (appuye) {
    // Toutes les 150 ms, inverser l'etat du buzzer
    if (millis() - dernierChangement >= 150) {
      dernierChangement = millis();

      buzzerAllume = !buzzerAllume;

      digitalWrite(
        BUZZER,
        buzzerAllume ? HIGH : LOW
      );
    }
  } else {
    // Arret immediat au relachement
    buzzerAllume = false;
    digitalWrite(BUZZER, LOW);
    dernierChangement = millis();
  }
}
