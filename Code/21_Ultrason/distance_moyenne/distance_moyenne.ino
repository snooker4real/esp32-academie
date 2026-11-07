const int trigPin = 13;
const int echoPin = 14;
const float distanceMin = 2.0;
const float distanceMax = 400.0;
const int nombreMesures = 5;
const unsigned long delaiEcho = 25000;

float mesurerDistance() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  unsigned long duree = pulseIn(echoPin, HIGH, delaiEcho);
  return duree * 0.034f / 2.0f;
}

void setup() {
  Serial.begin(115200);
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  digitalWrite(trigPin, LOW);
}

void loop() {
  float somme = 0;
  int mesuresValides = 0;

  for (int mesure = 0; mesure < nombreMesures; mesure++) {
    float distance = mesurerDistance();
    if (distance >= distanceMin && distance <= distanceMax) {
      somme += distance;
      mesuresValides++;
    }
    delay(100);
  }

  if (mesuresValides == 0) {
    Serial.println("Aucune mesure valide.");
    return;
  }

  float moyenne = somme / mesuresValides;
  Serial.printf("Distance moyenne : %.1f cm (%d/%d mesures valides)\n",
                moyenne, mesuresValides, nombreMesures);
  if (moyenne < 20.0f) {
    Serial.println("Attention : obstacle a moins de 20 cm !");
  }
}
