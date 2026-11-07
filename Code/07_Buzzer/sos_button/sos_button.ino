
/*
 * Freenove ESP32-WROVER
 * Chapitre 7 - SOS en code Morse
 *
 * GPIO 13 : buzzer via transistor
 * GPIO 4  : bouton actif LOW
 */

const int BUZZER = 13;
const int BOUTON = 4;

const int POINT = 150;
const int TRAIT = 450;

// Faire un bip d'une durée donnée
void bip(int duree) {
  digitalWrite(BUZZER, HIGH);
  delay(duree);

  digitalWrite(BUZZER, LOW);
  delay(POINT);
}

// Lettre S : trois points
void lettreS() {
  for (int i = 0; i < 3; i++) {
    bip(POINT);
  }
}

// Lettre O : trois traits
void lettreO() {
  for (int i = 0; i < 3; i++) {
    bip(TRAIT);
  }
}

void envoyerSOS() {
  Serial.println("Envoi SOS ... --- ...");

  lettreS();
  delay(2 * POINT);

  lettreO();
  delay(2 * POINT);

  lettreS();

  Serial.println("SOS termine !");
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(BOUTON, INPUT);

  digitalWrite(BUZZER, LOW);

  Serial.println("Appuie pour envoyer SOS");
}

void loop() {
  if (digitalRead(BOUTON) == LOW) {

    envoyerSOS();

    // Attendre le relachement
    // pour ne pas relancer le SOS
    while (digitalRead(BOUTON) == LOW) {
      delay(10);
    }

    delay(50); // anti-rebond simple
  }
}
