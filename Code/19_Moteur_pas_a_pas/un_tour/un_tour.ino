const int outPorts[] = {14, 27, 26, 25};
const int pasParTour = 2048;

void setup() {
  Serial.begin(115200);

  for (int broche : outPorts) {
    pinMode(broche, OUTPUT);
  }

  for (int pas = 0; pas < pasParTour; pas++) {
    int bobine = pas % 4;

    for (int index = 0; index < 4; index++) {
      digitalWrite(outPorts[index], index == bobine ? HIGH : LOW);
    }

    delay(3);
  }

  for (int broche : outPorts) {
    digitalWrite(broche, LOW);
  }

  Serial.printf("Tour termine : %d pas commandes\n", pasParTour);
}

void loop() {
}
