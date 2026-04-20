"use client";

import { useEffect, useState, useRef } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../lib/firebase";
import { VirtualESP32 } from "../VirtualSensor";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SensorReading {
  nivel_pct: number;
  dist_cm: number;
  ts?: string;
}

export default function Dashboard() {
  // Estado de los datos recibidos de Firebase
  const [lectura, setLectura] = useState<SensorReading | null>(null);
  
  // Estado de control del simulador
  const [isSimulating, setIsSimulating] = useState(false);

  // Estado para la gráfica histórica (guardará las últimas 30 lecturas)
  const [historial, setHistorial] = useState<SensorReading[]>([]);
  
  // Mantener la instancia del simulador sin que React la reinicie en cada render
  const simulatorRef = useRef<VirtualESP32 | null>(null);

  // 1. Inicializar el simulador al cargar la página
  useEffect(() => {
    simulatorRef.current = new VirtualESP32(50); // Inicia al 50% de llenado
  }, []);

  // 2. Escuchar datos en tiempo real de Firebase
  useEffect(() => {
    const lecturaRef = ref(db, "tinaco/lectura");
    
    // onValue se dispara cada vez que cambia el dato en la nube
    const unsubscribe = onValue(lecturaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLectura(data);
        // Guardamos en el historial y mantenemos solo los últimos 30 puntos
        setHistorial((prev) => {
          const nuevoHistorial = [...prev, data];
          return nuevoHistorial.length > 30 ? nuevoHistorial.slice(1) : nuevoHistorial;
        });
      }
    });

    return () => unsubscribe(); // Limpiamos la conexión al desmontar
  }, []);

  // 3. Bucle del Simulador (2Hz = envia datos cada 500ms)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSimulating) {
      interval = setInterval(() => {
        if (simulatorRef.current) {
          const newData = simulatorRef.current.generateReading();
          // Guardamos el nuevo dato simulado en Firebase
          set(ref(db, "tinaco/lectura"), newData);
        }
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Funciones para interactuar manualmente con el tinaco virtual
  const modificarNivel = (delta: number) => {
    if (simulatorRef.current) simulatorRef.current.updateWaterLevel(delta);
  };

  // Variable para determinar si estamos en estado crítico
  const isNivelBajo = lectura ? lectura.nivel_pct <= 20 : false;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-bold text-blue-600">💧 Water Level Monitor</h1>
          <p className="text-slate-600">Equipo 3A - Monitoreo y Simulación E2E</p>
        </header>

        {/* Banner de Alerta Crítica */}
        {isNivelBajo && (
          <div className="bg-red-50 border border-red-500 p-4 rounded-xl flex items-center gap-4 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <span className="text-4xl">⚠️</span>
            <div>
              <h3 className="text-red-500 font-bold text-lg">ALERTA CRÍTICA: NIVEL DE AGUA BAJO</h3>
              <p className="text-red-700 text-sm">El nivel ha caído al 20% o menos. Requiere atención inmediata.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Panel Izquierdo: Visualización de Datos Reales de Firebase */}
          <div className={`bg-white p-6 rounded-xl border shadow-md transition-colors duration-300 ${isNivelBajo ? 'border-red-500' : 'border-slate-200'}`}>
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Datos en Tiempo Real (RTDB)</h2>
            
            {lectura ? (
              <div className="space-y-4">
                <div className="flex items-end gap-2">
                  <span className={`text-6xl font-bold transition-colors duration-300 ${isNivelBajo ? 'text-red-500' : 'text-blue-500'}`}>
                    {lectura.nivel_pct.toFixed(1)}%
                  </span>
                  <span className="text-slate-500 mb-2">nivel filtrado</span>
                </div>
                <p className="text-slate-600">Distancia al sensor: {lectura.dist_cm} cm</p>
                <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-emerald-700 break-all border border-slate-200">
                  {JSON.stringify(lectura, null, 2)}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 animate-pulse">Esperando datos de Firebase...</p>
            )}
          </div>

          {/* Panel Derecho: Controles del Simulador ESP32 */}
          <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-md relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600"></div>
            <h2 className="text-xl font-semibold mb-4 text-slate-800">Panel del Simulador</h2>
            
            <button 
              onClick={() => setIsSimulating(!isSimulating)}
              className={`w-full py-3 rounded-lg font-bold mb-6 transition-colors ${isSimulating ? 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}`}
            >
              {isSimulating ? "Detener Transmisión ESP32" : "Iniciar Transmisión (2Hz)"}
            </button>

            <div className="flex gap-4">
              <button onClick={() => modificarNivel(-5)} className="flex-1 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-95 transition-all duration-150 py-3 rounded-lg border border-slate-300 shadow-sm">
                🚰 Abrir Llave (-5%)
              </button>
              <button onClick={() => modificarNivel(5)} className="flex-1 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 active:scale-95 transition-all duration-150 py-3 rounded-lg border border-slate-300 shadow-sm">
                🌧️ Llenar (+5%)
              </button>
            </div>
          </div>

          {/* Panel Inferior: Gráfica Histórica en Silueta de Tinaco */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-md flex flex-col items-center">
            <h2 className="text-xl font-semibold mb-4 text-slate-800 self-start">Tendencia de Nivel (Silueta de Tinaco)</h2>
            
            <div className="relative w-full max-w-2xl h-[450px] mt-4">
              {/* Tapa del Tinaco */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-1/2 h-4 bg-slate-200 rounded-t-lg border-t-2 border-x-2 border-slate-300 z-10"></div>
              
              {/* Contenedor principal del Tinaco */}
              <div className="w-full h-full border-x-8 border-b-8 border-t-2 border-slate-300 rounded-b-3xl rounded-t-xl bg-slate-50 overflow-hidden relative shadow-inner">
                
                {/* Gráfica de Recharts simulando el agua */}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historial} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNivel" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isNivelBajo ? "#ef4444" : "#3b82f6"} stopOpacity={0.9}/>
                        <stop offset="95%" stopColor={isNivelBajo ? "#fca5a5" : "#93c5fd"} stopOpacity={0.3}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <YAxis domain={[0, 100]} width={0} tick={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', borderRadius: '0.5rem', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      labelFormatter={(label) => label ? new Date(label).toLocaleTimeString() : ''}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="nivel_pct" 
                      stroke={isNivelBajo ? "#ef4444" : "#60a5fa"}
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorNivel)" 
                      isAnimationActive={false} 
                    />
                  </AreaChart>
                </ResponsiveContainer>

                {/* Marcas de nivel absolutas sobre el tinaco */}
                <div className="absolute inset-y-0 right-4 py-4 flex flex-col justify-between text-xs font-bold text-slate-400/70 pointer-events-none">
                  <span>100% -</span>
                  <span>75% -</span>
                  <span>50% -</span>
                  <span>25% -</span>
                  <span className="opacity-0">0% -</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}