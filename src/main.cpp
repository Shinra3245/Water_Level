#include <Arduino.h>
#include "filter_logic.h"

// Definición de pines (Ajustar según tu conexión física)
const int trigPin = 5;
const int echoPin = 18;

// Instanciar el filtro con los parámetros del KR 1.3
KalmanFilter tinacoFilter; 

void setup() {
    Serial.begin(115200);
    pinMode(trigPin, OUTPUT);
    pinMode(echoPin, INPUT);
    // inicializar_comunicacion_MQTT(); [cite: 221]
}

void loop() {
    // Generar pulso TRIGGER de 10 µs [cite: 178, 204]
    digitalWrite(trigPin, LOW);
    delayMicroseconds(2);
    digitalWrite(trigPin, HIGH);
    delayMicroseconds(10);
    digitalWrite(trigPin, LOW);

    // Leer ECHO y convertir a cm [cite: 179, 205]
    long duration = pulseIn(echoPin, HIGH);
    float raw_distance = duration * 0.034 / 2;

    // Procesar a través del módulo de filtrado
    float filtered_dist = tinacoFilter.getFilteredDistance(raw_distance);
    float level_cm = tinacoFilter.getWaterLevelCm(filtered_dist);
    float level_pct = tinacoFilter.getWaterLevelPct(level_cm);

    // Lógica de validación y publicación [cite: 243, 244]
    if (tinacoFilter.isLevelLow(level_pct)) {
        Serial.println("¡ALERTA! Nivel de agua por debajo del 20%");
        // activar_alerta();
    }

    Serial.printf("Distancia: %.2f cm | Nivel: %.2f cm | Capacidad: %.1f%%\n", filtered_dist, level_cm, level_pct);
    // publicar_MQTT(filtered_dist, level_cm, level_pct);

    delay(500); // Frecuencia de muestreo 2 Hz [cite: 212]
}