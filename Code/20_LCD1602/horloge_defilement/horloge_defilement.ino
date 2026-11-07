#include <LiquidCrystal_I2C.h>
#include <Wire.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);
const char phrase[] = "Bienvenue dans l'univers ESP32 !    ";
const unsigned long intervalleDefilement = 300;
unsigned long dernierDefilement = 0;
unsigned long dernierTick = 0;
unsigned long secondes = 0;
unsigned int position = 0;

void afficherPhrase() {
  lcd.setCursor(0, 0);
  for (int colonne = 0; colonne < 16; colonne++) {
    lcd.print(phrase[(position + colonne) % (sizeof(phrase) - 1)]);
  }
}

void afficherHorloge() {
  char heure[9];
  snprintf(heure, sizeof(heure), "%02lu:%02lu:%02lu",
           (secondes / 3600) % 24, (secondes / 60) % 60, secondes % 60);
  lcd.setCursor(0, 1);
  lcd.print(heure);
}

void setup() {
  Wire.begin(13, 14);
  Wire.beginTransmission(0x27);
  if (Wire.endTransmission() != 0) {
    lcd = LiquidCrystal_I2C(0x3F, 16, 2);
  }
  lcd.init();
  lcd.backlight();
  dernierTick = millis();
  dernierDefilement = dernierTick;
  afficherPhrase();
  afficherHorloge();
}

void loop() {
  unsigned long maintenant = millis();
  unsigned long secondesEcoulees = (maintenant - dernierTick) / 1000;
  if (secondesEcoulees > 0) {
    dernierTick += secondesEcoulees * 1000;
    secondes = (secondes + secondesEcoulees) % 86400;
    afficherHorloge();
  }

  if (maintenant - dernierDefilement >= intervalleDefilement) {
    dernierDefilement = maintenant;
    position = (position + 1) % (sizeof(phrase) - 1);
    afficherPhrase();
  }
}
