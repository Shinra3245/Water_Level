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
    const rawReading = this.currentLevelPct + noise;
    
    // 2. Filtrar usando el algoritmo de Kalman
    const filteredLevel = this.kalman.updateEstimate(rawReading);
    
    // 3. Calcular distancia basándonos en el nivel
    const levelCm = this.maxDistanceCm * (filteredLevel / 100);
    const distanceCm = this.maxDistanceCm - levelCm;

    // 4. Formatear el payload según el contrato de interfaz (KR 3.2)
    const now = new Date();
    
    return {
      d: parseFloat(distanceCm.toFixed(1)), // distancia en cm
      n: parseFloat(levelCm.toFixed(1)), // nivel en cm
      p: parseFloat(filteredLevel.toFixed(1)), // nivel en porcentaje
      a: 0, // alerta local (0 = no, 1 = si)
      t: now.toISOString(), // Timestamp del "dispositivo" (NTP)
      s: { ".sv": "timestamp" }, // Macro de Firebase para timestamp del servidor
    };
  }
}