import {onValueWritten} from "firebase-functions/v2/database";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";

// Inicializa el SDK de administrador para tener acceso total a la base de datos
admin.initializeApp();

export const checkWaterLevel = onValueWritten(
  "/tinaco/lectura",
  async (event) => {
    const data = event.data.after.val();

    // Si no hay datos (ej. se borró el nodo manualmente), no hacemos nada
    if (!data) return;

    const nivel = data.nivel_pct;

    // Regla de Negocio: Si el nivel es mayor al 20%, el sistema está estable
    if (nivel > 20) return;

    // Leemos el tiempo de la última alerta para evitar hacer SPAM (Cooldown)
    const configRef = admin.database().ref("/tinaco/config/ultima_alerta");
    const configSnapshot = await configRef.once("value");
    const ultimaAlerta = configSnapshot.val() || 0;

    const now = Date.now();
    // 5 minutos de espera obligatoria entre alertas
    const COOLDOWN_MS = 5 * 60 * 1000;

    if (now - ultimaAlerta < COOLDOWN_MS) {
      logger.info(`Nivel bajo (${nivel}%), pero en cooldown. Esperando...`);
      return;
    }

    logger.warn(`🚨 ALERTA CRÍTICA: Nivel de agua al ${nivel.toFixed(1)}%!`);

    // 1. Actualizamos el timer para reiniciar el Cooldown de 5 minutos
    await configRef.set(now);
  }
);
