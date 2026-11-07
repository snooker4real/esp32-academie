#include <ESP32Servo.h>

Servo myservo;

const int servoPin = 15;
const int potPin = 34;
const unsigned long duree = 1000;

float position = 0;
float depart = 0;
int consigne = 0;
unsigned long debut = 0;
unsigned long dernierAffichage = 0;

int lireAngle() {
  return map(analogRead(potPin), 0, 4095, 0, 180);
}

void setup() {
  Serial.begin(115200);
  myservo.setPeriodHertz(50);
  myservo.attach(servoPin, 500, 2500);

  consigne = lireAngle();
  position = consigne;
  depart = position;
  myservo.write(consigne);
  debut = millis();
}

void loop() {
  unsigned long maintenant = millis();
  unsigned long ecoule = maintenant - debut;

  if (ecoule >= duree) {
    position = consigne;
  } else {
    position = depart + (consigne - depart) * (ecoule / 1000.0f);
  }

  int angleDemande = lireAngle();

  if (abs(angleDemande - consigne) >= 2) {
    depart = position;
    consigne = angleDemande;
    debut = maintenant;
  }

  myservo.write((int)(position + 0.5f));
  if (maintenant - dernierAffichage >= 250) {
    Serial.printf("Potentiometre : %d deg | Consigne : %d deg | Position commandee : %.1f deg\n",
                  angleDemande, consigne, position);
    dernierAffichage = maintenant;
  }
  delay(15);
}
