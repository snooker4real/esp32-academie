
/*
 * Chapitre 7 - Test buzzer Freenove
 *
 * GPIO 13 -> R1 1k -> base transistor
 * Buzzer + -> 5V
 * Buzzer - -> collecteur transistor
 * Emetteur transistor -> GND
 */

const int PIN_BUZZER = 13;

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  Serial.println("Chapitre 7 : Buzzer !");
}

void loop() {
  Serial.println("Buzzer ON");
  digitalWrite(PIN_BUZZER, HIGH);
  delay(500);

  Serial.println("Buzzer OFF");
  digitalWrite(PIN_BUZZER, LOW);
  delay(500);
}
