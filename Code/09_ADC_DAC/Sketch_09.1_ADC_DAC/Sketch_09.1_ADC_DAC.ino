const int PIN_ANALOG_IN = 4;
const int PIN_DAC_OUT = 25;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
}

void loop() {
  const int adcValue = analogRead(PIN_ANALOG_IN);
  const int dacValue = map(adcValue, 0, 4095, 0, 255);
  const float inputVoltage = adcValue * 3.3f / 4095.0f;

  dacWrite(PIN_DAC_OUT, dacValue);
  Serial.printf("ADC: %4d | DAC: %3d | Tension: %.2f V\n", adcValue, dacValue, inputVoltage);
  delay(200);
}
