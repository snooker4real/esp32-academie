/*
 * ============================================================
 * CHAPITRE 02 : BOUTON POUSSOIR + LED
 * Kit Freenove Ultimate Starter Kit ESP32-WROVER
 * Fait le 2026-11-04
 * ============================================================
 *
 * OBJECTIF :
 * Commander une LED rouge avec un bouton poussoir.
 *
 * MATERIEL :
 * - ESP32-WROVER
 * - LED rouge
 * - Résistance 220 ohms
 * - 2 résistances 10 kohms
 * - Bouton poussoir
 * - Breadboard et fils
 *
 * BRANCHEMENTS :
 * LED : GPIO 2 -> 220 ohms -> LED (+) -> GND
 *
 * BOUTON :
 * - R2 (10k) relie le signal à 3,3 V
 * - Bouton relie ce signal à GND quand on appuie
 * - R3 (10k) relie ce signal au GPIO 13
 *
 * HIGH = bouton relâché
 * LOW  = bouton appuyé
 * ============================================================
 */


// ------------------------------------------------------------
// 1. DÉCLARATION DES BROCHES
// ------------------------------------------------------------

#define PIN_LED 2
#define PIN_BOUTON 13


// Mémorise le dernier état du bouton.
// HIGH correspond au bouton relâché.

int dernierEtatBouton = HIGH;


// Compteur du nombre d'appuis.

int compteurAppuis = 0;


// ------------------------------------------------------------
// 2. INITIALISATION
// ------------------------------------------------------------

void setup() {

  // Configure GPIO 2 comme sortie.
  pinMode(PIN_LED, OUTPUT);

  // Configure GPIO 13 comme entrée.
  //
  // INPUT suffit car le montage Freenove
  // possède une résistance externe de 10k
  // qui maintient le signal à HIGH.

  pinMode(PIN_BOUTON, INPUT);

  // Éteint la LED au démarrage.
  digitalWrite(PIN_LED, LOW);

  // Initialise la communication série.
  Serial.begin(115200);

  delay(500);

  Serial.println("============================");
  Serial.println("CHAPITRE 02 : BOUTON + LED");
  Serial.println("ESP32 pret !");
  Serial.println("============================");
}


// ------------------------------------------------------------
// 3. BOUCLE PRINCIPALE
// ------------------------------------------------------------

void loop() {

  // Lit l'état électrique du GPIO 13.
  //
  // HIGH = bouton relâché
  // LOW  = bouton appuyé

  int etatBouton = digitalRead(PIN_BOUTON);


  // ----------------------------------------------------------
  // CAS 1 : BOUTON APPUYÉ
  // ----------------------------------------------------------

  if (etatBouton == LOW) {

    // Allume la LED rouge.
    digitalWrite(PIN_LED, HIGH);

    // Détecte un nouvel appui.
    //
    // On compte uniquement si le bouton
    // était relâché lors de la lecture précédente.

    if (dernierEtatBouton == HIGH) {

      compteurAppuis++;

      Serial.print("Bouton appuye ! Total : ");
      Serial.println(compteurAppuis);
    }

  }


  // ----------------------------------------------------------
  // CAS 2 : BOUTON RELÂCHÉ
  // ----------------------------------------------------------

  else {

    // Éteint la LED.
    digitalWrite(PIN_LED, LOW);

    // Affiche le relâchement une seule fois.

    if (dernierEtatBouton == LOW) {
      Serial.println("Bouton relache - LED OFF");
    }
  }


  // ----------------------------------------------------------
  // 4. MÉMORISATION DE L'ÉTAT
  // ----------------------------------------------------------

  // Enregistre l'état actuel pour comparer
  // lors du prochain passage dans loop().

  dernierEtatBouton = etatBouton;


  // Petite temporisation pour limiter les rebonds.
  //
  // Version simple pour apprendre :
  // un anti-rebond plus robuste pourra être
  // réalisé ensuite avec millis().

  delay(30);
}
