/*
 * exo08_interpreteur.ino — Exercice 8.1 : mini-interpréteur de commandes série
 * Carte : Freenove ESP32-WROVER (« ESP32 Wrover Module ») — Série : 115200 bauds
 *
 * Commandes (une par ligne, majuscules ou minuscules) :
 *   on          allume la LED (GPIO 2)
 *   off         éteint la LED
 *   blink 500   la fait clignoter, la valeur est la durée de chaque état en ms
 *
 * Dans le moniteur série, choisis « Nouvelle ligne » (ou « Both NL & CR »)
 * à côté de la vitesse : sans fin de ligne, la commande n'est jamais envoyée.
 *
 * Pas de blocage : loop() ne fait que lire les caractères déjà arrivés
 * (Serial.available) et comparer millis(). Aucun delay(), aucun readString().
 */

#define PIN_LED 2
#define TAILLE_LIGNE 32

enum Mode { ETEINT, ALLUME, CLIGNOTE };

Mode mode = ETEINT;
unsigned long demiPeriode = 500;   // ms entre deux changements d'état en mode CLIGNOTE
unsigned long dernierChangement = 0;
bool etatLed = false;

char ligne[TAILLE_LIGNE];
byte longueur = 0;
bool ligneTropLongue = false;

void ecrireLed(bool etat) {
  etatLed = etat;
  digitalWrite(PIN_LED, etat);
}

// Analyse une ligne complète et applique la commande
void executer(char *cmd) {
  char mot[8];
  long ms = 0;
  int n = sscanf(cmd, "%7s %ld", mot, &ms);
  if (n < 1) return;                              // ligne vide ou espaces

  for (char *p = mot; *p; p++) *p = tolower(*p);

  if (!strcmp(mot, "on")) {
    mode = ALLUME;
    ecrireLed(HIGH);
    Serial.println("LED allumee");
  } else if (!strcmp(mot, "off")) {
    mode = ETEINT;
    ecrireLed(LOW);
    Serial.println("LED eteinte");
  } else if (!strcmp(mot, "blink") && n == 2 && ms > 0) {
    mode = CLIGNOTE;
    demiPeriode = ms;
    dernierChangement = millis();
    ecrireLed(HIGH);
    Serial.printf("LED clignote : %ld ms par etat\n", ms);
  } else {
    Serial.println("Commande inconnue. Essaie : on, off, blink 500");
  }
}

// Lit uniquement ce qui est déjà arrivé, puis rend la main
void lireSerie() {
  while (Serial.available()) {
    char c = Serial.read();
    if (c == '\n' || c == '\r') {
      if (ligneTropLongue) {
        Serial.println("Ligne trop longue, ignoree");
      } else if (longueur > 0) {
        ligne[longueur] = '\0';
        executer(ligne);
      }
      longueur = 0;
      ligneTropLongue = false;
    } else if (longueur < TAILLE_LIGNE - 1) {
      ligne[longueur++] = c;
    } else {
      ligneTropLongue = true;                     // on jette la ligne entière plutôt que d'en exécuter un bout
    }
  }
}

void setup() {
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("Pret. Commandes : on, off, blink 500");
}

void loop() {
  lireSerie();

  if (mode == CLIGNOTE && millis() - dernierChangement >= demiPeriode) {
    dernierChangement = millis();
    ecrireLed(!etatLed);
  }
}
