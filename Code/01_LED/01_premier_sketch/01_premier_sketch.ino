#define PIN_LED 2

void setup() {
  pinMode(PIN_LED, OUTPUT);
  Serial.begin(115200);
  Serial.println("Demarrage ESP32 !");
}

void loop() {
  digitalWrite(PIN_LED, HIGH);
  Serial.println("LED allumee");
  delay(1000);

  digitalWrite(PIN_LED, LOW);
  Serial.println("LED eteinte");
  delay(1000);
}