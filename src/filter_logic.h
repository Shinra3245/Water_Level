#ifndef FILTER_LOGIC_H
#define FILTER_LOGIC_H

class KalmanFilter {
private:
    float x; // Estimación actual del estado (distancia) [cite: 248]
    float P; // Covarianza del error [cite: 249]
    float Q; // Ruido del proceso [cite: 250]
    float R; // Ruido de la medición [cite: 251]
    float altura_tinaco;

public:
    // Inicialización de variables Kalman: x=0, P=1, Q=0.1, R=1.0 [cite: 217, 218]
    // Se establece una altura por defecto de 60 cm para el tinaco [cite: 281]
    KalmanFilter(float q = 0.1, float r = 1.0, float p = 1.0, float initial_x = 0.0, float altura = 60.0);
    
    float getFilteredDistance(float raw_distance);
    float getWaterLevelCm(float filtered_distance);
    float getWaterLevelPct(float level_cm);
    bool isLevelLow(float level_pct, float threshold = 20.0);
};

#endif