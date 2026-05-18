import {onValueWritten} from "firebase-functions/v2/database";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Inicializa el SDK de administrador para tener acceso total a la base de datos
admin.initializeApp();
const db = admin.database();

// --- Constantes de Lógica de Negocio ---
// 5 minutos para cooldown de alertas
const ALERT_COOLDOWN_MS = 5 * 60 * 1000;
// 5 minutos para guardado histórico
const HISTORY_SAVE_INTERVAL_MS = 5 * 60 * 1000;
// 10% de cambio para disparo de historial
const ABRUPT_CHANGE_THRESHOLD_PCT = 10;

/** Interfaz para tipar el payload y evitar advertencias de tipo 'any' */
interface SensorPayload {
  p?: number;
  d?: number;
  n?: number;
  a?: number;
  t?: string;
  s?: number | object;
}

/**
 * KR 3.5: Controlador HTTP para Ingesta de Datos (API REST)
 */
export const updateWaterLevel = onRequest({cors: true}, async (req, res) => {
  try {
    const data: SensorPayload = req.body;

    // Validamos que el body exista y sea un objeto válido antes de evaluarlo
    if (!data || typeof data !== "object") {
      res.status(400).json({error: "Bad Request: Body vacio o invalido."});
      return;
    }

    // KR 3.4: Middleware de Validación de Esquema
    const requiredKeys = ["d", "n", "p", "a", "t", "s"];
    const receivedKeys = Object.keys(data);
    const hasAllKeys = requiredKeys.every((key) => receivedKeys.includes(key));

    if (!hasAllKeys) {
      logger.warn("Payload incompleto", {requiredKeys, receivedKeys});
      res.status(400).json({
        error: "Bad Request: Missing required fields.",
      });
      return;
    }

    const p = data.p;
    if (p === undefined || typeof p !== "number" || p < 0 || p > 100) {
      res.status(400).json({
        error: "Bad Request: 'p' must be a number [0-100]",
      });
      return;
    }

    // 1. Lógica de Negocio: Truncar decimales por seguridad
    const sanitizedData = {
      ...data,
      p: data.p !== undefined ? parseFloat(Number(data.p).toFixed(1)) : 0,
      n: data.n !== undefined ? parseFloat(Number(data.n).toFixed(1)) : 0,
      // 's' es manejado por Firebase, no se necesita 'updatedAt'
    };

    // 2. Persistencia en el nodo de lectura actual
    await db.ref("tinaco/lectura").set(sanitizedData);

    // 3. Respuesta exitosa según contrato KR 3.3
    res.status(200).json({status: "success", data: sanitizedData});
  } catch (error) {
    logger.error("Error en updateWaterLevel:", error);
    res.status(500).json({error: "Internal Server Error"});
  }
});

export const onWaterLevelUpdate = onValueWritten(
  "/tinaco/lectura",
  async (event) => {
    // Validamos que el evento contenga datos
    if (!event.data) {
      logger.warn("El evento de escritura no contiene datos.");
      return;
    }

    // Si el nodo de lectura es eliminado, no hacemos nada.
    if (!event.data.after.exists()) {
      logger.info("Nodo /tinaco/lectura eliminado. No hay acciones.");
      return;
    }

    const currentData = event.data.after.val() as SensorPayload;
    const previousData = event.data.before.exists() ?
      (event.data.before.val() as SensorPayload) : null;

    await Promise.all([
      handleAlerts(currentData),
      handleHistoricalPersistence(currentData, previousData),
    ]);
  }
);

/**
 * Gestiona el envío de alertas por niveles críticos (bajos o altos).
 * @param {SensorPayload} data - Los datos actuales del sensor.
 * @return {Promise<void>}
 */
async function handleAlerts(data: SensorPayload): Promise<void> {
  const nivel = data.p; // Usamos la clave 'p' del payload optimizado (KR 3.2)
  if (nivel === undefined || nivel === null) return;

  const isBajo = nivel <= 20;
  const isAlto = nivel >= 90;

  if (!isBajo && !isAlto) return; // Nivel estable, no se requiere alerta.

  const ultimaAlertaRef = db.ref("/tinaco/config/ultima_alerta");
  const snapshot = await ultimaAlertaRef.once("value");
  const ultimaAlerta = (snapshot.val() as number | null) || 0;
  const now = Date.now();

  if (now - ultimaAlerta < ALERT_COOLDOWN_MS) {
    logger.info(
      `Alerta retenida por cooldown. Nivel actual: ${nivel.toFixed(1)}%`
    );
    return;
  }

  const tipo = isBajo ? "Nivel de agua BAJO" : "Riesgo de DESBORDAMIENTO";
  logger.warn(`🚨 ALERTA CRÍTICA: ${tipo} (${nivel.toFixed(1)}%)!`);

  await ultimaAlertaRef.set(now);
}

/**
 * Guarda una muestra de la lectura en /tinaco/historial para análisis
 * a largo plazo.
 * El guardado se activa si ha pasado un intervalo de tiempo o si hay
 * un cambio brusco en el nivel.
 * @param {SensorPayload} currentData - Los datos actuales leídos del sensor.
 * @param {SensorPayload | null} previousData - Los datos anteriores,
 * si existen.
 * @return {Promise<void>}
 */
async function handleHistoricalPersistence(
  currentData: SensorPayload,
  previousData: SensorPayload | null
): Promise<void> {
  const currentLevel = currentData.p;
  if (currentLevel === undefined || currentLevel === null) return;

  const previousLevel = previousData?.p;
  const levelChange =
    previousLevel !== undefined && previousLevel !== null ?
      Math.abs(currentLevel - previousLevel) :
      0;

  const isAbruptChange = levelChange > ABRUPT_CHANGE_THRESHOLD_PCT;

  const lastSaveRef = db.ref("/tinaco/config/last_historical_save");
  const snapshot = await lastSaveRef.once("value");
  const lastSaveTime = (snapshot.val() as number | null) || 0;
  const now = Date.now();
  const isTimeForSave = (now - lastSaveTime) > HISTORY_SAVE_INTERVAL_MS;

  if (isAbruptChange || isTimeForSave) {
    await db.ref("/tinaco/historial").push(currentData);
    await lastSaveRef.set(now);
    const reason = isAbruptChange ?
      `Cambio abrupto de ${levelChange.toFixed(1)}%` : "Lapso de 5 min";
    logger.log(`Historial guardado: ${reason}. Nivel: ${currentLevel}%`);
  }
}
