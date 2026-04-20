/**
 * Implementación del Filtro de Kalman Simple de 1 dimensión.
 * Traducido de la lógica en C++ (filter_logic.cpp) para el simulador web.
 */
export class KalmanFilter {
  private q: number; // Varianza del proceso (ruido del sistema)
  private r: number; // Varianza de la estimación (ruido del sensor)
  private x: number; // Valor estimado
  private p: number; // Error de covarianza de la estimación
  private k: number; // Ganancia de Kalman

  constructor(processNoise: number = 1, sensorNoise: number = 1, estimatedError: number = 1, initialValue: number = 0) {
    this.q = processNoise;
    this.r = sensorNoise;
    this.p = estimatedError;
    this.x = initialValue;
    this.k = 0;
  }

  public updateEstimate(measurement: number): number {
    // 1. Ecuación de Predicción
    this.p = this.p + this.q;

    // 2. Ecuación de Actualización (Corrección)
    this.k = this.p / (this.p + this.r);
    this.x = this.x + this.k * (measurement - this.x);
    this.p = (1 - this.k) * this.p;

    return parseFloat(this.x.toFixed(2)); // Retornamos suavizado a 2 decimales
  }
}