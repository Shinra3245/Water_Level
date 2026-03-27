#include "filter_logic.h"

KalmanFilter::KalmanFilter(float q, float r, float p, float initial_x, float altura) {
    this->Q = q;
    this->R = r;
    this->P = p;
    this->x = initial_x;
    this->altura_tinaco = altura;
}

float KalmanFilter::getFilteredDistance(float raw_distance) {
    // 1. Validación de rango: descartar si está fuera de 2 cm - 400 cm [cite: 225, 226, 229]
    if (raw_distance < 2.0 || raw_distance > 400.0) {
        return this->x; // Se devuelve la última estimación válida
    }

    // 2. Filtro de Kalman Simple [cite: 231-236]
    float x_pred = this->x;                // Predicción
    float P_pred = this->P + this->Q;
    float K = P_pred / (P_pred + this->R); // Ganancia
    
    this->x = x_pred + K * (raw_distance - x_pred); // Corrección
    this->P = (1 - K) * P_pred;

    return this->x; // Distancia filtrada
}

float KalmanFilter::getWaterLevelCm(float filtered_distance) {
    return this->altura_tinaco - filtered_distance; // [cite: 239]
}

float KalmanFilter::getWaterLevelPct(float level_cm) {
    return (level_cm / this->altura_tinaco) * 100.0; // [cite: 242]
}

bool KalmanFilter::isLevelLow(float level_pct, float threshold) {
    return level_pct < threshold; // [cite: 243]
}