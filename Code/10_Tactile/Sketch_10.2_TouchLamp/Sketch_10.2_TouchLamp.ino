const int PIN_LED = 2;
const int TOUCH_PIN = T0;
const int PRESS_THRESHOLD = 350;
const int RELEASE_THRESHOLD = 450;

bool isPressed = false;

void setup() {
  Serial.begin(115200);
  pinMode(PIN_LED, OUTPUT);
}

void loop() {
  const int touchValue = touchRead(TOUCH_PIN);
  Serial.printf("Touch: %d\n", touchValue);

  if (!isPressed && touchValue < PRESS_THRESHOLD) {
    isPressed = true;
    digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    Serial.println("Touch detected!");
  } else if (isPressed && touchValue > RELEASE_THRESHOLD) {
    isPressed = false;
    Serial.println("Released!");
  }

  delay(250);
}
