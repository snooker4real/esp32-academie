
/*
 * ============================================================
 * ESP32 - CHAPITRE 02 : JEU DE REFLEXES
 * ============================================================
 *
 * MATERIEL :
 * - ESP32-WROVER
 * - LED rouge + resistance 220 ohms
 * - Bouton poussoir + 2 resistances 10 kohms
 *
 * CABLAGE : identique au chapitre 2 Freenove
 *
 * REGLES DU JEU :
 * 1. Appuie pour demarrer une partie.
 * 2. Attends que la LED s'allume.
 * 3. Appuie le plus rapidement possible.
 * 4. Lis ton temps dans le Moniteur serie.
 *
 * ATTENTION :
 * Si tu appuies avant le signal, tu perds !
 * ============================================================
 */

#define PIN_LED 2
#define PIN_BOUTON 13

// Les differents etats du jeu
enum EtatJeu {
  ATTENTE,
  PREPARATION,
  SIGNAL,
  RESULTAT
};

EtatJeu etatJeu = ATTENTE;

// Gestion du temps
unsigned long debutAttente = 0;
unsigned long delaiAleatoire = 0;
unsigned long debutReaction = 0;

// Scores
unsigned long meilleurTemps = 0;
unsigned long dernierTemps = 0;

// Gestion du bouton
bool dernierEtatBouton = HIGH;
unsigned long dernierChangement = 0;
const unsigned long antiRebond = 30;

void setup() {
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_BOUTON, INPUT);

  digitalWrite(PIN_LED, LOW);

  Serial.begin(115200);
  delay(500);

  // Initialise le generateur pseudo-aleatoire
  randomSeed(micros());

  Serial.println("============================");
  Serial.println("     ESP32 REFLEX GAME");
  Serial.println("============================");
  Serial.println("Appuie pour commencer !");
}

void loop() {

  // Lecture du bouton avec anti-rebond
  bool lecture = digitalRead(PIN_BOUTON);

  static bool etatStable = HIGH;

  // Un changement brut relance la temporisation
  if (lecture != dernierEtatBouton) {
    dernierChangement = millis();
  }

  // Accepte le nouvel etat apres 30 ms de stabilite
  if (millis() - dernierChangement >= antiRebond) {

    if (lecture != etatStable) {
      etatStable = lecture;

      // Evenement : nouvel appui
      if (etatStable == LOW) {
        gererAppui();
      }
    }
  }

  dernierEtatBouton = lecture;

  // Gestion du jeu sans bloquer le programme
  if (etatJeu == PREPARATION) {

    // Appuyer trop tot fait perdre la partie.
    // La detection est faite dans gererAppui().

    if (millis() - debutAttente >= delaiAleatoire) {
      digitalWrite(PIN_LED, HIGH);
      debutReaction = millis();
      etatJeu = SIGNAL;

      Serial.println("GO ! APPUIE !");
    }
  }
}

void gererAppui() {

  switch (etatJeu) {

    case ATTENTE:
      // Demarre une nouvelle partie
      digitalWrite(PIN_LED, LOW);

      delaiAleatoire = random(2000, 5001);
      debutAttente = millis();

      etatJeu = PREPARATION;

      Serial.println("");
      Serial.println("Prepare-toi...");
      Serial.println("Attends la LED !");
      break;

    case PREPARATION:
      // Le joueur a appuye trop tot
      digitalWrite(PIN_LED, LOW);

      Serial.println("FAUX DEPART !");
      Serial.println("Appuie pour recommencer.");

      etatJeu = ATTENTE;
      break;

    case SIGNAL:
      // Mesure le temps de reaction
      dernierTemps = millis() - debutReaction;

      digitalWrite(PIN_LED, LOW);

      Serial.print("Temps : ");
      Serial.print(dernierTemps);
      Serial.println(" ms");

      // Enregistre le meilleur score
      if (meilleurTemps == 0 ||
          dernierTemps < meilleurTemps) {

        meilleurTemps = dernierTemps;

        Serial.println("NOUVEAU RECORD !");
      }

      Serial.print("Record : ");
      Serial.print(meilleurTemps);
      Serial.println(" ms");

      Serial.println("Appuie pour rejouer.");

      etatJeu = RESULTAT;
      break;

    case RESULTAT:
      // Revient a l'ecran d'attente
      etatJeu = ATTENTE;
      Serial.println("Pret ! Appuie pour commencer.");
      break;
  }
}
