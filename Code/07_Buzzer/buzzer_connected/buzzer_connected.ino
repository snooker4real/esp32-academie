
/*
 * FREEnove ESP32-WROVER
 * Chapitre 7 - Buzzer Wi-Fi
 *
 * GPIO 13 -> transistor -> buzzer
 * GPIO 4  -> bouton (non utilise ici)
 *
 * ESP32 en point d'acces Wi-Fi
 * Adresse Web : http://192.168.4.1
 */

#include <WiFi.h>
#include <WebServer.h>

// --- Configuration ---
const int BUZZER = 13;

const char* WIFI_NAME = "ESP32-BUZZER";
const char* WIFI_PASS = "buzzer1234";

WebServer server(80);

// --- Etats ---
enum Mode {
  STOP,
  BIP,
  ALARME,
  SOS,
  MINUTEUR
};

Mode mode = STOP;

unsigned long derniereEtape = 0;
unsigned long debutMinuteur = 0;
unsigned long dureeMinuteur = 0;

int etape = 0;

// SOS : alternance SON / SILENCE en ms
const unsigned int morse[] = {
  150, 150, 150, 150, 150, 450,
  450, 150, 450, 150, 450, 450,
  150, 150, 150, 150, 150, 0
};

const int NB_ETAPES_MORSE =
  sizeof(morse) / sizeof(morse[0]);

void arreter() {
  digitalWrite(BUZZER, LOW);
  mode = STOP;
  etape = 0;
}

void demarrer(Mode nouveauMode) {
  arreter();
  mode = nouveauMode;
  derniereEtape = millis();
  etape = 0;

  if (mode == BIP || mode == ALARME ||
      mode == SOS) {
    digitalWrite(BUZZER, HIGH);
  }
}

// Moteur non bloquant des animations sonores
void actualiserBuzzer() {
  unsigned long maintenant = millis();

  if (mode == STOP) return;

  if (mode == MINUTEUR) {
    if (maintenant - debutMinuteur >= dureeMinuteur) {
      demarrer(ALARME);
    }
    return;
  }

  unsigned long ecoule =
    maintenant - derniereEtape;

  if (mode == BIP) {
    if (ecoule >= 250) arreter();
    return;
  }

  if (mode == ALARME) {
    if (ecoule >= 200) {
      derniereEtape = maintenant;
      etape = 1 - etape;

      digitalWrite(BUZZER,
                   etape == 0 ? HIGH : LOW);
    }
    return;
  }

  if (mode == SOS) {
    if (ecoule >= morse[etape]) {
      etape++;

      if (etape >= NB_ETAPES_MORSE - 1) {
        arreter();
        return;
      }

      derniereEtape = maintenant;
      digitalWrite(
        BUZZER,
        etape % 2 == 0 ? HIGH : LOW
      );
    }
  }
}

const char PAGE[] PROGMEM = R"HTML(
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport"
      content="width=device-width,initial-scale=1">
<title>ESP32 Buzzer</title>
<style>
* { box-sizing: border-box; }

body {
  margin: 0;
  min-height: 100vh;
  background: #0b1020;
  color: white;
  font-family: system-ui, sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.panel {
  width: 100%;
  max-width: 430px;
  background: #172034;
  border: 1px solid #334155;
  border-radius: 24px;
  padding: 28px;
  text-align: center;
}

h1 { margin: 5px 0; }
p { color: #94a3b8; }

.status {
  padding: 22px;
  background: #0b1020;
  border-radius: 16px;
  margin: 22px 0;
  color: #67e8f9;
  font-size: 19px;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

button {
  padding: 18px 12px;
  border: 0;
  border-radius: 14px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  background: #334155;
}

button:active { transform: scale(.97); }

.stop {
  background: #dc2626;
  width: 100%;
  margin-top: 12px;
}

.timer {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

input {
  width: 100%;
  min-width: 0;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #475569;
  color: white;
  background: #0b1020;
  font-size: 16px;
}
</style>
</head>
<body>
<main class="panel">
  <div style="font-size:42px">🔊</div>
  <h1>ESP32 Buzzer</h1>
  <p>Controle Wi-Fi local</p>

  <div id="status" class="status">Chargement...</div>

  <div class="grid">
    <button onclick="action('bip')">
      🔔 Bip simple
    </button>
    <button onclick="action('alarme')">
      🚨 Alarme
    </button>
    <button onclick="action('sos')">
      📡 SOS Morse
    </button>
    <button onclick="action('stop')">
      🔇 Silence
    </button>
  </div>

  <div class="timer">
    <input type="number" id="secondes"
           value="10" min="1" max="3600">
    <button onclick="minuteur()">
      ⏱ Demarrer
    </button>
  </div>

  <button class="stop" onclick="action('stop')">
    ARRETER LE BUZZER
  </button>

  <p>Freenove ESP32-WROVER</p>
</main>

<script>
async function action(nom) {
  try {
    const rep = await fetch('/api/' + nom);
    if (!rep.ok) throw new Error('Commande refusee');
    await actualiser();
  } catch (e) {
    document.getElementById('status').textContent =
      'Erreur de connexion';
  }
}

async function minuteur() {
  const sec = document.getElementById('secondes').value;
  if (+sec < 1 || +sec > 3600) {
    alert('Entre 1 et 3600 secondes');
    return;
  }
  try {
    const rep = await fetch('/api/timer?sec=' + sec);
    if (!rep.ok) throw new Error('Duree invalide');
    await actualiser();
  } catch (e) {
    document.getElementById('status').textContent =
      'Erreur de connexion';
  }
}

async function actualiser() {
  try {
    const rep = await fetch('/api/status');
    if (!rep.ok) throw new Error();
    const data = await rep.json();
    document.getElementById('status').textContent =
      data.status;
  } catch (e) {
    document.getElementById('status').textContent =
      'ESP32 indisponible';
  }
}

setInterval(actualiser, 1000);
actualiser();
</script>
</body>
</html>
)HTML";

// --- Serveur HTTP ---

void envoyerEtat() {
  String etat = "Silencieux";

  switch (mode) {
    case BIP: etat = "Bip en cours"; break;
    case ALARME: etat = "Alarme active"; break;
    case SOS: etat = "SOS en cours"; break;

    case MINUTEUR: {
      unsigned long ecoule =
        millis() - debutMinuteur;

      unsigned long restant =
        ecoule >= dureeMinuteur
        ? 0
        : (dureeMinuteur - ecoule + 999) / 1000;

      etat = "Minuteur : " + String(restant) + " s";
      break;
    }

    default: break;
  }

  String json = "{\"status\":\"" + etat + "\"}";
  server.send(200, "application/json", json);
}

void setup() {
  Serial.begin(115200);

  pinMode(BUZZER, OUTPUT);
  arreter();

  WiFi.mode(WIFI_AP);

  if (!WiFi.softAP(WIFI_NAME, WIFI_PASS)) {
    Serial.println("Erreur point d'acces Wi-Fi");
    return;
  }

  Serial.println();
  Serial.println("=== BUZZER WIFI ===");
  Serial.print("Reseau : ");
  Serial.println(WIFI_NAME);
  Serial.print("Adresse : http://");
  Serial.println(WiFi.softAPIP());

  server.on("/", HTTP_GET, []() {
    server.send_P(200, "text/html", PAGE);
  });

  server.on("/api/bip", HTTP_GET, []() {
    demarrer(BIP);
    server.send(200, "text/plain", "OK");
  });

  server.on("/api/alarme", HTTP_GET, []() {
    demarrer(ALARME);
    server.send(200, "text/plain", "OK");
  });

  server.on("/api/sos", HTTP_GET, []() {
    demarrer(SOS);
    server.send(200, "text/plain", "OK");
  });

  server.on("/api/stop", HTTP_GET, []() {
    arreter();
    server.send(200, "text/plain", "OK");
  });

  server.on("/api/timer", HTTP_GET, []() {
    String valeur = server.arg("sec");
    long secondes = valeur.toInt();

    if (secondes < 1 || secondes > 3600) {
      server.send(400, "text/plain",
                  "Duree invalide");
      return;
    }

    arreter();
    debutMinuteur = millis();
    dureeMinuteur = (unsigned long)secondes * 1000UL;
    mode = MINUTEUR;

    server.send(200, "text/plain", "OK");
  });

  server.on("/api/status", HTTP_GET, envoyerEtat);

  server.begin();
  Serial.println("Serveur Web demarre !");
}

void loop() {
  server.handleClient();
  actualiserBuzzer();
  delay(1);
}
