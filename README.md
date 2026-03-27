# 💧 Water Level
# 💧 Monitor de Nivel de Agua IoT (ESP32 + HC-SR04)

Este repositorio contiene el firmware para el **KR 1.5** del proyecto de monitoreo de nivel de agua para tinacos. El sistema utiliza un microcontrolador ESP32 y un sensor ultrasónico HC-SR04 para calcular el porcentaje de llenado y detectar niveles bajos de agua.

## 🚀 Características Principales

* **Filtrado Avanzado:** Implementación de un Filtro de Kalman Simple de bajo costo computacional (~8 bytes de RAM) para suavizar las lecturas del sensor y descartar picos de ruido (outliers).
* **Frecuencia de Muestreo:** 2 Hz (1 lectura cada 500 ms).
* **Gestión de Alertas:** Detección automática cuando el nivel de agua cae por debajo del 20%.
* **Arquitectura Modular:** Separación de la lógica matemática (`filter_logic.cpp`) de la lectura de hardware (`main.cpp`).

## 🛠️ Requisitos de Hardware

* Placa de desarrollo **ESP32** (o compatible con Arduino).
* Sensor Ultrasónico **HC-SR04**.
* Fuente de alimentación de 5V/1A.
* Cables jumper.

### Conexión de Pines (Pinout)

| Componente | Pin HC-SR04 | Pin ESP32 |
| :--- | :--- | :--- |
| Alimentación | VCC | 5V / VIN |
| Tierra | GND | GND |
| Pulso de Emisión | TRIG | GPIO 5 |
| Pulso de Recepción | ECHO | GPIO 18 |

*(Nota: Los pines TRIG y ECHO pueden ser modificados en las constantes de `main.cpp`).*

## ⚙️ Instalación y Flasheo

1.  Clona este repositorio en tu máquina local:
    ```bash
    git clone [https://github.com/Shinra3245/nombre-del-repo.git](https://github.com/Shinra3245/nombre-del-repo.git)
    ```
2.  Abre el proyecto en tu entorno de desarrollo (Arduino IDE o PlatformIO).
3.  Verifica que la placa seleccionada sea el **ESP32 Dev Module**.
4.  Compila el código para verificar que no haya errores de sintaxis.
5.  Conecta el ESP32 por USB y realiza el **Flasheo** (Upload).
6.  Abre el Monitor Serie a `115200 baudios` para verificar las lecturas filtradas en tiempo real.

## 📂 Estructura del Código

* `main.cpp` / `*.ino`: Bucle principal, control de pines y tiempos.
* `filter_logic.h`: Definición de la clase `KalmanFilter` y sus variables de estado.
* `filter_logic.cpp`: Implementación de la predicción, cálculo de ganancia y corrección de la distancia medida.

## 👥 Equipo 3A (Autores)

* **Omar Gadiel Bolaños García** - [GitHub (@Shinra3245)](https://github.com/Shinra3245) | [Sitio Web](https://shinradev.site)
* **Diego Emilio Ortiz Vilchez**
* **Jorge Luis Perez Manriques**
* **Emilio Sebastian Chavez Vega**

Ingeniería en Sistemas Computacionales - Tecnológico Nacional de México en Celaya.
