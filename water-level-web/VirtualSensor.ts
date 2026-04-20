import { KalmanFilter } from "./KalmanFilter";

export class VirtualESP32 {
  private currentLevelPct: number;
  private kalman: KalmanFilter;
  private maxDistanceCm: number = 100; // Profundidad del tinaco simulada

  constructor(initialLevelPct: number = 50) {
    this.currentLevelPct = initialLevelPct;
    // Inicializamos el filtro ajustando R (ruido del sensor alto) y Q (varianza baja)
    this.kalman = new KalmanFilter(0.125, 32, 1023, initialLevelPct);
  }

  // Simula el nivel del agua cambiando (llenando o vaciando)
  public updateWaterLevel(delta: number) {
    this.currentLevelPct = Math.max(0, Math.min(100, this.currentLevelPct + delta));
  }

  public generateReading() {
    // 1. Añadir ruido blanco artificial al HC-SR04 (outliers/rebotes)
    const noise = (Math.random() * 10) - 5; // Ruido entre -5% y +5%
    let rawReading = this.currentLevelPct + noise;
    
    // 2. Filtrar usando el algoritmo de Kalman
    const filteredLevel = this.kalman.updateEstimate(rawReading);
    
    // 3. Calcular distancia basándonos en el nivel
    const distanceCm = this.maxDistanceCm * (1 - (filteredLevel / 100));

    // 4. Formatear timestamps para la sincronización E2E
    const now = new Date();
    
    return {
      dist_cm: parseFloat(distanceCm.toFixed(1)),
      nivel_pct: filteredLevel,
      ts: now.toISOString(), // Formato ISO 8601 (requerimiento NTP)
      ts_server: now.getTime()
    };
  }
}