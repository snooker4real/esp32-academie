
/*
 * Freenove ESP32-WROVER
 * Chapitre 7 - Jeu de reflexes
 *
 * GPIO 13 : buzzer
 * GPIO 4  : bouton actif LOW
 */

const int BUZZER = 13;
const int BOUTON = 4;

unsigned long depart = 0;

void bip(int duree) {
  digitalWrite(BUZZER, HIGH);
  delay(duree);
  digitalWrite(BUZZER, LOW);
}

void attendreRelachement() {
  while (digitalRead(BOUTON) == LOW) {
    delay(10);
  }
  delay(30);
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  pinMode(BOUTON, INPUT);
  digitalWrite(BUZZER, LOW);

  randomSeed(micros());

  Serial.println("=== JEU DE REFLEXES ===");
  Serial.println("Appuie pour commencer !");
}

void loop() {
  // Attendre que le joueur demarre
  if (digitalRead(BOUTON) == HIGH) {
    return;
  }

  attendreRelachement();

  Serial.println("Prepare-toi...");
  unsigned long attente = random(2000, 5001);
  unsigned long debutAttente = millis();

  // Detecter les faux departs
  while (millis() - debutAttente < attente) {
    if (digitalRead(BOUTON) == LOW) {
      Serial.println("FAUX DEPART !");
      bip(400);
      attendreRelachement();
      Serial.println("Appuie pour recommencer.");
      return;
    }
    delay(1);
  }

  // Signal de depart
  depart = millis();
  digitalWrite(BUZZER, HIGH);

  // Bip de 60 ms sans bloquer la lecture du bouton
  bool bipActif = true;

  while (true) {
    unsigned long maintenant = millis();

    if (digitalRead(BOUTON) == LOW) {
      unsigned long reaction = maintenant - depart;

      digitalWrite(BUZZER, LOW);

      Serial.print("Temps de reaction : ");
      Serial.print(reaction);
      Serial.println(" ms");

      if (reaction < 200) {
        Serial.println("Excellent !");
      } else if (reaction < 350) {
        Serial.println("Tres bon reflexe !");
      } else if (reaction < 500) {
        Serial.println("Bien joue !");
      } else {
        Serial.println("Tu peux faire mieux !");
      }

      attendreRelachement();
      Serial.println();
      Serial.println("Appuie pour rejouer.");
      return;
    }

    if (bipActif && maintenant - depart >= 60) {
      digitalWrite(BUZZER, LOW);
      bipActif = false;
    }

    // Fin de manche apres 5 secondes
    if (maintenant - depart >= 5000) {
      digitalWrite(BUZZER, LOW);
      Serial.println("Temps ecoule !");
      Serial.println("Appuie pour rejouer.");
      return;
    }

    delay(1);
  }
}
