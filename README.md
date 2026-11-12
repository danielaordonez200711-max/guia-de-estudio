# Plataforma Inteligente de Apoyo al Estudio
## Etapa 1: Registro, Entrevista Inicial y Perfil de Estudio Adaptativo

Esta aplicación constituye la **primera etapa** de una plataforma inteligente de apoyo al estudio orientada a estudiantes de nivel **secundario, terciario y universitario**.

Su objetivo central es **conocer al estudiante antes de recomendarle un plan o método de estudio**, garantizando una experiencia clara, cálida, sin sobrecarga cognitiva y basada en la evidencia del aprendizaje activo.

---

### 🌟 Características Principales

1. **Pantalla Inicial Cálida y Transparente:**
   - Explica con claridad que el sistema ayuda a organizar tiempos, seleccionar métodos de estudio y adaptar el acompañamiento.
   - Enfatiza que el estudiante comienza con sus **propios apuntes y resúmenes**, con la libertad de decidir más adelante si desea incorporar asistencia de IA complementaria.
   - Filosofía de **cero etiquetas permanentes**: no encasilla al alumno en fórmulas rígidas.

2. **Entrevista Interactiva de 5 Pasos con Barra de Progreso:**
   - **Paso 1: Datos académicos:** Nombre o apodo, nivel educativo (Secundario, Terciario, Universitario, Preparación de ingreso, Examen/Certificación), materia prioritaria, carrera/curso (opcional) y fecha límite o examen (con atajos interactivos: *En 1 semana*, *En 15 días*, *En 1 mes*).
   - **Paso 2: Tiempo y organización:** Tiempo diario disponible, días de la semana asignados, horario pico de concentración, formato de sesión (Pomodoro 25m, sesiones medias 45-50m o bloques de 90m) y dificultad organizativa principal (*empezar*, *mantener concentración*, *organizar tiempos*, *comprender*, *recordar*, *practicar*).
   - **Paso 3: Preferencias de estudio:** Selección de modalidades favoritas (lectura, audio, diagramas visuales, videos, ejercicios, flashcards, técnica Feynman), dinámica de estudio (individual, grupal o mixta), nivel de profundidad de explicaciones y modo de interacción (texto, audio o mixto).
   - **Paso 4: Conocimiento previo y diagnóstico breve:** Tema o capítulo de partida, nivel autopercibido (5 opciones graduadas del 0% al 100%) y **diagnóstico metacognitivo opcional de 5 preguntas** para calibrar con mayor precisión el punto de partida.
   - **Paso 5: Contenido y privacidad:** Opción predeterminada activa para estudiar con apuntes propios, selector para habilitar o no IA complementaria futura y control de privacidad (100% privado vs. compartir en grupos colaborativos más adelante), recordando que todo es editable posteriormente.

3. **Generación del Perfil de Estudio Adaptativo:**
   - **Bienvenida personalizada:**
     > *“¡Perfecto, [nombre]! Empezaremos con [tema] mediante sesiones de [duración] y [método recomendado]. A medida que estudies, ajustaremos el plan para encontrar la estrategia que mejor te ayude.”*
   - **Motor de recomendación inicial:** Asigna un método pedagógico fundamentado (Feynman, Pomodoro estricto, Active Recall espaciado, Time-blocking, Práctica deliberada, etc.) y un primer paso de acción concreto.
   - **Compromiso de adaptabilidad:** Recuerda que las preferencias son una guía inicial y que el sistema evolucionará según el rendimiento real en comprensión, retención y tiempo.
   - **Exportación y persistencia:**
     - Guarda automáticamente el estado y borrador en `localStorage`.
     - Descarga del perfil completo en formato estructurado `.json` (`perfil_estudio_[nombre].json`).
     - Botón para copiar el resumen al portapapeles.
     - Botón para modificar respuestas o reiniciar la entrevista.

---

### 📁 Estructura del Proyecto

```
plataforma-estudio/
├── index.html        # Estructura semántica, accesible y modular de la aplicación
├── styles.css        # Sistema de diseño con variables, tarjetas reactivas y animaciones
├── app.js            # Motor reactivo, validaciones, test diagnóstico y algoritmo adaptativo
├── server.js         # Servidor local Node.js sin dependencias externas (opcional)
├── package.json      # Metadatos del proyecto
└── README.md         # Documentación técnica y pedagógica
```

---

### 🚀 Cómo Ejecutar la Aplicación

Tienes dos formas directas y sencillas de abrir la plataforma:

#### Opción A: Abrir directamente en el navegador (Sin servidor)
Haz doble clic sobre el archivo [index.html](file:///c:/Users/Alumnos/Documents/daniela%20ordoñez/plataforma-estudio/index.html) o arrástralo a tu navegador web favorito (Google Chrome, Edge, Firefox, Brave, etc.). No requiere configuración adicional.

#### Opción B: Ejecutar con el servidor local Node.js
Si prefieres servirlo a través de un servidor HTTP local:
1. Abre tu terminal en la carpeta `plataforma-estudio`.
2. Ejecuta:
   ```bash
   node server.js
   ```
3. Accede en tu navegador a:
   ```
   http://localhost:3000
   ```

---

### 🛡️ Preparación para las Siguientes Etapas

El modelo de datos y el perfil exportado en formato JSON contienen todos los identificadores listos para consumir en las fases posteriores:
- **Etapa 2 (Biblioteca de apuntes):** Se vincularán directamente a la materia (`subject`) y primer tema (`first_topic`) definidos aquí.
- **Etapa 3 (Chatbot / Asistente pedagógico):** Podrá calibrar el tono según el nivel educativo (`edu_level`), el estilo de explicación (`explanation_depth`) y la dificultad del alumno (`main_difficulty`).
- **Etapa 4 (Colaboración):** Respetará la preferencia de privacidad (`sharing_pref`) configurada por el estudiante.
