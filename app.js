/**
 * Plataforma Inteligente de Apoyo al Estudio
 * Etapa 1: Registro, Entrevista Inicial y Perfil Adaptativo
 */

// Application State Store
const state = {
  currentStep: 0, // 0 = Welcome, 1-5 = Steps, 6 = Final Profile
  formData: {
    // 1. Datos Académicos
    name: '',
    edu_level: '',
    subject: '',
    career: '',
    target_date: '',

    // 2. Tiempo y Organización
    daily_time: '1-2h',
    study_days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    peak_hour: 'Mañana',
    session_format: 'Sesiones cortas con pausas',
    main_difficulty: '',

    // 3. Preferencias de Estudio
    modalities: ['Leer textos y apuntes', 'Ejemplos gráficos y diagramas'],
    social_pref: 'Individual',
    explanation_depth: 'Intermedia con ejemplos',
    interaction_mode: 'Texto',

    // 4. Conocimiento Previo & Diagnóstico
    first_topic: '',
    knowledge_level: '',
    diagnostic_quiz_completed: false,
    diagnostic_score: null,

    // 5. Contenido y Privacidad
    use_own_notes: true, // Default: estudiar con apuntes propios
    allow_ai: 'si',
    sharing_pref: 'Privado 100%'
  },
  savedProfile: null
};

// Storage Keys
const DRAFT_STORAGE_KEY = 'estudio_adaptativo_draft_v1';
const PROFILE_STORAGE_KEY = 'estudio_adaptativo_profile_v1';

// Step titles for header and progress bar
const STEP_TITLES = {
  1: 'Datos académicos',
  2: 'Tiempo y organización',
  3: 'Preferencias de estudio',
  4: 'Conocimiento previo y diagnóstico',
  5: 'Contenido y privacidad'
};

// Initial setup on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupDateChips();
  setupFormListeners();
  setupMethodsLibrary();
  checkSavedData();
});

// Methods Library: lightweight category filter for the profile screen
function setupMethodsLibrary() {
  const filters = document.querySelectorAll('[data-method-filter]');
  const cards = document.querySelectorAll('[data-method-category]');
  const emptyState = document.getElementById('methods-empty-state');

  filters.forEach(filter => {
    filter.addEventListener('click', () => {
      const category = filter.dataset.methodFilter;
      let visibleCount = 0;

      filters.forEach(button => button.classList.toggle('active', button === filter));
      cards.forEach(card => {
        const shouldShow = category === 'all' || card.dataset.methodCategory === category;
        card.classList.toggle('hidden', !shouldShow);
        if (shouldShow) visibleCount += 1;
      });

      if (emptyState) emptyState.classList.toggle('hidden', visibleCount > 0);
    });
  });
}

// Configure Date Shortcuts (e.g. "En 1 semana", "En 15 días")
function setupDateChips() {
  const chips = document.querySelectorAll('.date-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      const days = parseInt(e.target.getAttribute('data-days'), 10);
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + days);
      const formatted = targetDate.toISOString().split('T')[0];
      const dateInput = document.getElementById('target-date');
      if (dateInput) {
        dateInput.value = formatted;
        state.formData.target_date = formatted;
        saveDraft();
        showToast(`Fecha fijada para el ${formatReadableDate(formatted)}`);
      }
    });
  });
}

// Track input changes to auto-save drafts
function setupFormListeners() {
  const form = document.getElementById('interview-form');
  if (!form) return;

  form.addEventListener('input', () => {
    syncFormToState();
    saveDraft();
  });

  form.addEventListener('change', () => {
    syncFormToState();
    saveDraft();
  });

  const resumeBtn = document.getElementById('btn-resume-data');
  if (resumeBtn) {
    resumeBtn.addEventListener('click', () => {
      resumeDraft();
    });
  }

  const startBtn = document.getElementById('btn-start-interview');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startInterview();
    });
  }
}

// Check if draft or existing profile exists in localStorage
function checkSavedData() {
  try {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);

    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      state.savedProfile = profile;
      state.formData = { ...state.formData, ...profile };
      const resumeBtn = document.getElementById('btn-resume-data');
      if (resumeBtn) {
        resumeBtn.textContent = `Ver perfil de ${profile.name || 'estudio'}`;
        resumeBtn.classList.remove('hidden');
      }
    } else if (savedDraft) {
      const draft = JSON.parse(savedDraft);
      state.formData = { ...state.formData, ...draft };
      const resumeBtn = document.getElementById('btn-resume-data');
      if (resumeBtn) {
        resumeBtn.textContent = 'Reanudar entrevista guardada';
        resumeBtn.classList.remove('hidden');
      }
    }
  } catch (err) {
    console.warn('Error reading localStorage:', err);
  }
}

// Navigation Functions
function showWelcome() {
  state.currentStep = 0;
  document.getElementById('view-welcome').classList.remove('hidden');
  document.getElementById('interview-form').classList.add('hidden');
  document.getElementById('view-profile').classList.add('hidden');
  document.getElementById('interview-progress-wrapper').classList.add('hidden');
  document.getElementById('header-context').textContent = 'Registro y perfil inicial';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startInterview() {
  goToStep(1);
}

function resumeDraft() {
  populateFormFromState();
  if (state.savedProfile) {
    renderProfileView(state.savedProfile);
  } else {
    goToStep(1);
  }
}

function goToStep(stepNumber) {
  if (stepNumber < 1 || stepNumber > 5) return;

  // Sync state first
  syncFormToState();

  // Validate previous steps if jumping ahead
  if (stepNumber > 1 && !state.formData.name.trim()) {
    showToast('Por favor escribe tu nombre primero.');
    goToStep(1);
    return;
  }

  state.currentStep = stepNumber;

  // Toggle views
  document.getElementById('view-welcome').classList.add('hidden');
  document.getElementById('interview-form').classList.remove('hidden');
  document.getElementById('view-profile').classList.add('hidden');
  document.getElementById('interview-progress-wrapper').classList.remove('hidden');

  // Show only current step pane
  for (let i = 1; i <= 5; i++) {
    const pane = document.getElementById(`step-${i}`);
    if (pane) {
      if (i === stepNumber) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    }
  }

  // Update Progress Bar
  const progressPercent = Math.round((stepNumber / 5) * 100);
  document.getElementById('progress-percentage').textContent = `${progressPercent}%`;
  document.getElementById('progress-bar-fill').style.width = `${progressPercent}%`;
  document.getElementById('progress-step-badge').textContent = `Paso ${stepNumber} de 5`;
  document.getElementById('progress-step-name').textContent = STEP_TITLES[stepNumber] || '';
  document.getElementById('header-context').textContent = `Paso ${stepNumber}: ${STEP_TITLES[stepNumber]}`;

  // Update step navigation buttons styling
  const stepDots = document.querySelectorAll('.step-dot-btn');
  stepDots.forEach((btn, idx) => {
    if (idx + 1 === stepNumber) {
      btn.classList.add('active-step', 'text-brand-600', 'font-bold');
      btn.classList.remove('text-slate-400');
    } else {
      btn.classList.remove('active-step', 'text-brand-600', 'font-bold');
      btn.classList.add('text-slate-400');
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Validate fields of current step before moving forward
function validateAndNext(stepNumber) {
  syncFormToState();

  if (stepNumber === 1) {
    let hasError = false;
    const nameInput = document.getElementById('student-name');
    const nameError = document.getElementById('name-error');
    if (!state.formData.name || !state.formData.name.trim()) {
      nameError.classList.remove('hidden');
      nameInput.focus();
      hasError = true;
    } else {
      nameError.classList.add('hidden');
    }

    const eduError = document.getElementById('edu-error');
    if (!state.formData.edu_level) {
      eduError.classList.remove('hidden');
      hasError = true;
    } else {
      eduError.classList.add('hidden');
    }

    const subjectInput = document.getElementById('study-subject');
    const subjectError = document.getElementById('subject-error');
    if (!state.formData.subject || !state.formData.subject.trim()) {
      subjectError.classList.remove('hidden');
      if (!hasError) subjectInput.focus();
      hasError = true;
    } else {
      subjectError.classList.add('hidden');
    }

    if (hasError) return;
    goToStep(2);
  } else if (stepNumber === 2) {
    const diffError = document.getElementById('diff-error');
    if (!state.formData.main_difficulty) {
      diffError.classList.remove('hidden');
      return;
    }
    diffError.classList.add('hidden');
    goToStep(3);
  } else if (stepNumber === 3) {
    // If no modalities selected, set default
    if (!state.formData.modalities || state.formData.modalities.length === 0) {
      state.formData.modalities = ['Leer textos y apuntes'];
    }
    goToStep(4);
  } else if (stepNumber === 4) {
    let hasError = false;
    const topicInput = document.getElementById('first-topic');
    const topicError = document.getElementById('topic-error');
    if (!state.formData.first_topic || !state.formData.first_topic.trim()) {
      topicError.classList.remove('hidden');
      topicInput.focus();
      hasError = true;
    } else {
      topicError.classList.add('hidden');
    }

    const knowError = document.getElementById('know-error');
    if (!state.formData.knowledge_level) {
      knowError.classList.remove('hidden');
      hasError = true;
    } else {
      knowError.classList.add('hidden');
    }

    if (hasError) return;
    goToStep(5);
  }
}

// Read inputs from DOM and update state.formData
function syncFormToState() {
  const form = document.getElementById('interview-form');
  if (!form) return;

  const data = new FormData(form);

  state.formData.name = (data.get('name') || '').toString().trim();
  state.formData.edu_level = (data.get('edu_level') || '').toString();
  state.formData.subject = (data.get('subject') || '').toString().trim();
  state.formData.career = (data.get('career') || '').toString().trim();
  state.formData.target_date = (data.get('target_date') || '').toString();

  state.formData.daily_time = (data.get('daily_time') || '1-2h').toString();
  state.formData.peak_hour = (data.get('peak_hour') || 'Mañana').toString();
  state.formData.session_format = (data.get('session_format') || 'Sesiones cortas con pausas').toString();
  state.formData.main_difficulty = (data.get('main_difficulty') || '').toString();

  // Multi-select days
  const checkedDays = [];
  form.querySelectorAll('input[name="study_days"]:checked').forEach(el => checkedDays.push(el.value));
  state.formData.study_days = checkedDays.length > 0 ? checkedDays : ['Lun', 'Mié', 'Vie'];

  // Multi-select modalities
  const checkedModalities = [];
  form.querySelectorAll('input[name="modalities"]:checked').forEach(el => checkedModalities.push(el.value));
  state.formData.modalities = checkedModalities;

  state.formData.social_pref = (data.get('social_pref') || 'Individual').toString();
  state.formData.explanation_depth = (data.get('explanation_depth') || 'Intermedia con ejemplos').toString();
  state.formData.interaction_mode = (data.get('interaction_mode') || 'Texto').toString();

  state.formData.first_topic = (data.get('first_topic') || '').toString().trim();
  state.formData.knowledge_level = (data.get('knowledge_level') || '').toString();

  state.formData.allow_ai = (data.get('allow_ai') || 'si').toString();
  state.formData.sharing_pref = (data.get('sharing_pref') || 'Privado 100%').toString();
}

// Populate UI form inputs from state
function populateFormFromState() {
  const f = state.formData;
  setInputValue('student-name', f.name);
  setRadioValue('edu_level', f.edu_level);
  setInputValue('study-subject', f.subject);
  setInputValue('career-name', f.career);
  setInputValue('target-date', f.target_date);

  setRadioValue('daily_time', f.daily_time);
  setRadioValue('peak_hour', f.peak_hour);
  setRadioValue('session_format', f.session_format);
  setRadioValue('main_difficulty', f.main_difficulty);

  // Days
  document.querySelectorAll('input[name="study_days"]').forEach(box => {
    box.checked = f.study_days.includes(box.value);
  });

  // Modalities
  document.querySelectorAll('input[name="modalities"]').forEach(box => {
    box.checked = f.modalities.includes(box.value);
  });

  setRadioValue('social_pref', f.social_pref);
  setRadioValue('explanation_depth', f.explanation_depth);
  setRadioValue('interaction_mode', f.interaction_mode);

  setInputValue('first-topic', f.first_topic);
  setRadioValue('knowledge_level', f.knowledge_level);

  setRadioValue('allow_ai', f.allow_ai);
  setRadioValue('sharing_pref', f.sharing_pref);
}

function setInputValue(id, val) {
  const el = document.getElementById(id);
  if (el && val !== undefined) el.value = val;
}

function setRadioValue(name, val) {
  if (!val) return;
  const radio = document.querySelector(`input[name="${name}"][value="${val}"]`);
  if (radio) radio.checked = true;
}

function saveDraft() {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(state.formData));
  } catch (err) {
    console.warn('Could not save draft:', err);
  }
}

// Diagnostic Quiz Logic (5 questions)
function toggleQuizModal() {
  const container = document.getElementById('quiz-interactive-container');
  const btn = document.getElementById('btn-open-quiz');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    btn.innerHTML = '<span>✕ Cerrar diagnóstico</span>';
    buildDiagnosticQuestions();
  } else {
    container.classList.add('hidden');
    btn.innerHTML = '<span>📝 Realizar diagnóstico breve ahora</span>';
  }
}

function buildDiagnosticQuestions() {
  const list = document.getElementById('quiz-questions-list');
  const topic = state.formData.first_topic || 'tu tema seleccionado';

  const questions = [
    {
      q: `1. ¿Cómo describirías la definición o idea central de "${topic}"?`,
      options: [
        'Aún no sabría cómo definirlo con precisión.',
        'Conozco palabras sueltas pero me cuesta armar el concepto.',
        'Puedo explicarlo con mis propias palabras de manera clara.',
        'Lo domino y puedo relacionarlo con otros temas complejos.'
      ]
    },
    {
      q: '2. Si tuvieras que dar un ejemplo real o práctico de este tema:',
      options: [
        'No se me ocurre ningún ejemplo en este momento.',
        'Se me ocurre uno sencillo que vi en clase o leí.',
        'Puedo pensar en varios ejemplos y comparar diferencias.',
        'Puedo diseñar ejercicios o casos aplicados sobre él.'
      ]
    },
    {
      q: '3. Al enfrentarte a un ejercicio o pregunta tipo examen:',
      options: [
        'Me siento en blanco y no sé por dónde empezar.',
        'Necesito tener la fórmula o la resolución de guía al lado.',
        'Puedo resolver los casos estándar sin ayuda.',
        'Resuelvo con soltura y detecto trampas en las consignas.'
      ]
    },
    {
      q: '4. Respecto a la terminología, fórmulas o vocabulario clave del tema:',
      options: [
        'Me confunden o me resultan muy abstractos.',
        'Reconozco los términos pero a veces mezclo definiciones.',
        'Los recuerdo bien y los aplico correctamente.',
        'Manejo el vocabulario técnico con fluidez total.'
      ]
    },
    {
      q: '5. ¿Cuánto tiempo hace que no repasas este contenido?',
      options: [
        'Es la primera vez que lo veo / nunca lo estudié.',
        'Hace más de un mes o un año.',
        'Hace dos o tres semanas.',
        'En los últimos días o está muy fresco en mi memoria.'
      ]
    }
  ];

  list.innerHTML = questions.map((item, qIdx) => `
    <div class="p-3 bg-white rounded-xl border border-slate-200">
      <p class="text-xs font-bold text-slate-800 mb-2">${item.q}</p>
      <div class="space-y-1.5">
        ${item.options.map((opt, oIdx) => `
          <label class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs text-slate-700">
            <input type="radio" name="diag_q_${qIdx}" value="${oIdx}" class="text-brand-600 focus:ring-brand-500" ${oIdx === 1 ? 'checked' : ''}>
            <span>${opt}</span>
          </label>
        `).join('')}
      </div>
    </div>
  `).join('');
}

function submitDiagnosticQuiz() {
  const container = document.getElementById('quiz-interactive-container');
  let totalScore = 0;
  for (let i = 0; i < 5; i++) {
    const selected = document.querySelector(`input[name="diag_q_${i}"]:checked`);
    if (selected) {
      totalScore += parseInt(selected.value, 10);
    }
  }

  state.formData.diagnostic_quiz_completed = true;
  state.formData.diagnostic_score = totalScore;

  // Calibrate suggested knowledge level
  let calibratedLevel = 'Conozco conceptos básicos';
  if (totalScore <= 3) {
    calibratedLevel = 'No conozco nada';
  } else if (totalScore <= 6) {
    calibratedLevel = 'Conozco conceptos básicos';
  } else if (totalScore <= 9) {
    calibratedLevel = 'Conozco una parte, pero tengo dudas';
  } else if (totalScore <= 12) {
    calibratedLevel = 'Ya lo estudié y necesito repasar o practicar';
  } else {
    calibratedLevel = 'Lo domino y quiero profundizar';
  }

  setRadioValue('knowledge_level', calibratedLevel);
  state.formData.knowledge_level = calibratedLevel;

  const statusPill = document.getElementById('quiz-status-pill');
  statusPill.textContent = `✓ Diagnóstico completado (Nivel calibrado: ${calibratedLevel})`;
  statusPill.className = 'text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200';

  container.classList.add('hidden');
  document.getElementById('btn-open-quiz').innerHTML = '<span>✓ Diagnóstico realizado</span>';
  showToast('Diagnóstico guardado. Nivel calibrado automáticamente.');
  saveDraft();
}

// Intelligent Method Recommendation Engine
function computeStudyRecommendation(data) {
  const {
    session_format,
    main_difficulty,
    knowledge_level,
    modalities,
    explanation_depth
  } = data;

  let methodName = 'Técnica Pomodoro Adaptativo + Repaso Espaciado';
  let methodDescription = '';
  let sessionDurationText = '25 minutos con 5 de descanso';
  let firstActionStep = 'Crear un esquema base con tus apuntes';

  // Duration mapping
  if (session_format.includes('medias')) {
    sessionDurationText = '50 minutos de foco y 10 de pausa (Regla 50/10)';
  } else if (session_format.includes('largos')) {
    sessionDurationText = '90 minutos en foco y 20 de descanso total (Ritmos Ultradianos)';
  }

  // Recommendation matrix combining difficulty, starting knowledge and formats
  if (main_difficulty.includes('Empezar')) {
    methodName = 'Regla de los 5 Minutos + Pomodoro Inicial';
    methodDescription = 'Tu mayor fricción es romper la inercia de arranque. Empezaremos con el compromiso psicológico de solo 5 minutos sin presión. Una vez que tu mente esté en movimiento, fluirás naturalmente hacia sesiones de ' + sessionDurationText + '.';
    firstActionStep = 'Abrir tus apuntes, elegir un solo subtítulo y leerlo durante exactamente 5 minutos con alarma.';
  } else if (main_difficulty.includes('concentración')) {
    if (session_format.includes('largos')) {
      methodName = 'Ritmos Ultradianos (90/20) + Monotarea Estricta';
      methodDescription = 'Aprovecharemos tus picos de energía biológica para sumergirte en bloques de 90 minutos de concentración sin interrupciones, seguidos de 20 minutos de descanso activo obligatorio sin pantallas.';
      firstActionStep = 'Poner el teléfono en otra habitación y fijar un temporizador de 90 minutos para un bloque exclusivo.';
    } else {
      methodName = 'Sesiones Pomodoro de Foco Profundo (25/5)';
      methodDescription = 'Combatiremos las distracciones con bloques de 25 minutos de atención total y una libreta al lado para anotar ideas intrusivas sin salirte del foco. Cada cuatro bloques, tendrás un descanso regenerativo de 25 minutos.';
      firstActionStep = 'Silenciar notificaciones y completar un primer bloque Pomodoro de 25 minutos en tu tema.';
    }
  } else if (main_difficulty.includes('Organizar tiempos')) {
    methodName = 'Time-Blocking Progresivo + The Third Time Rule';
    methodDescription = 'Agendaremos bloques fijos en tus días de estudio (' + (data.study_days.join(', ')) + '). Aplicaremos la Regla del Tercer Tercio: los dos primeros tercios del bloque serán para procesar notas y el último tercio se dedicará exclusivamente a autoevaluarte.';
    firstActionStep = 'Bloquear en tu calendario las franjas horarias de esta semana y dividir el tema en 3 metas concretas.';
  } else if (main_difficulty.includes('Comprender')) {
    if (modalities.includes('Ejemplos gráficos y diagramas') || modalities.includes('Mirar videos y animaciones')) {
      methodName = 'Codificación Dual (Técnica Feynman + Esquemas Visuales)';
      methodDescription = 'Para fijar la teoría sin memorizar de memoria, procesarás cada concepto en dos canales simultáneos: explicándolo en voz alta con tus propias palabras (Feynman) y traduciéndolo a un esquema o diagrama visual.';
      firstActionStep = 'Elegir el concepto más difícil de tus apuntes y dibujarlo en una hoja mientras lo explicás en voz alta.';
    } else {
      methodName = 'Método SQ3R / EPL2R + Técnica Feynman';
      methodDescription = 'Convertiremos la lectura pasiva en una investigación activa: Explorar el tema, Preguntar, Leer buscando respuestas, Recitar en voz alta y Repasar. Esto revela de inmediato cualquier laguna conceptual.';
      firstActionStep = 'Convertir los títulos de tus apuntes en 3 preguntas clave y responder la primera con tus palabras.';
    }
  } else if (main_difficulty.includes('Recordar')) {
    if (knowledge_level.includes('Ya lo estudié') || knowledge_level.includes('domino')) {
      methodName = 'Método Blurting + Sistema Leitner de Flashcards';
      methodDescription = 'Tenés una base previa, por lo que releer sería una pérdida de tiempo. Haremos un "Blurting" (escribir a toda velocidad en 5 minutos todo lo que recuerdes del tema sin mirar los apuntes, corrigiendo en rojo los vacíos) y fichas Leitner para lo que más te cuesta.';
      firstActionStep = 'Cerrar tus apuntes, poner un reloj en 5 minutos y hacer un vaciado mental (Blurting) en una hoja en blanco.';
    } else {
      methodName = 'Recuperación Activa (Active Recall) y Repetición Espaciada';
      methodDescription = 'Entrenaremos tu memoria a largo plazo obligando al cerebro a recuperar la información sin mirar el apunte. Con repasos en intervalos crecientes (1 día, 3 días, 1 semana), evitarás olvidar los temas antes del examen.';
      firstActionStep = 'Escribir 5 preguntas tipo examen sobre el tema y responderlas con el apunte cerrado.';
    }
  } else if (main_difficulty.includes('Practicar')) {
    methodName = 'Estudio Intercalado (Interleaving) + Práctica Deliberada';
    methodDescription = 'En lugar de hacer 20 ejercicios idénticos seguidos, alternaremos tipos de problemas distintos en la misma sesión. Esto entrena a tu cerebro para reconocer qué fórmula o regla aplicar frente a consignas nuevas.';
    firstActionStep = 'Seleccionar 3 ejercicios de distinta tipología y resolverlos alternando uno de cada clase.';
  }

  // Tailor if modalities include flashcards, cheat sheet or visual synthesis
  if (modalities.includes('Fichas de preguntas (flashcards)')) {
    methodDescription += ' Incorporaremos el Sistema Leitner con cajas de repaso espaciado.';
  }
  if (modalities.includes('Ejemplos gráficos y diagramas') && !methodDescription.includes('esquema')) {
    methodDescription += ' Apoyaremos cada sesión con mapas conceptuales y notas visuales (Sketchnoting).';
  }

  return {
    methodName,
    methodDescription,
    sessionDurationText,
    firstActionStep
  };
}

// Generate the Final Study Profile
function generateFinalProfile() {
  syncFormToState();

  const recommendation = computeStudyRecommendation(state.formData);

  const profileData = {
    ...state.formData,
    recommendation,
    createdAt: new Date().toISOString()
  };

  // Persist Profile
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profileData));
    state.savedProfile = profileData;
  } catch (err) {
    console.warn('Could not save profile:', err);
  }

  renderProfileView(profileData);
}

// Render Profile in DOM
function renderProfileView(profile) {
  const f = profile;
  const rec = profile.recommendation || computeStudyRecommendation(f);

  // Personalized Welcome Banner
  const name = f.name || 'Estudiante';
  const topic = f.first_topic || 'tu tema inicial';
  const duration = rec.sessionDurationText;
  const method = rec.methodName;

  document.getElementById('welcome-header').textContent =
    `¡Perfecto, ${name}! Empezaremos con ${topic} mediante sesiones de ${duration} y ${method}.`;

  document.getElementById('welcome-subtext').textContent =
    `A medida que estudies, ajustaremos el plan para encontrar la estrategia que mejor te ayude. Tus materiales y tus tiempos son el corazón de esta experiencia.`;

  // Recommended Method Card
  document.getElementById('rec-method-title').textContent = rec.methodName;
  document.getElementById('rec-method-desc').textContent = rec.methodDescription;
  document.getElementById('rec-session-badge').textContent = `⏱️ Ritmo: ${rec.sessionDurationText}`;
  document.getElementById('rec-first-step-badge').textContent = `🚀 Primer paso sugerido: ${rec.firstActionStep}`;

  // Academic Matrix
  document.getElementById('prof-edu-level').textContent = f.edu_level || 'No especificado';
  document.getElementById('prof-subject').textContent = f.subject || 'General';
  document.getElementById('prof-career').textContent = f.career || 'Sin especificar';
  document.getElementById('prof-target-date').textContent = f.target_date ? formatReadableDate(f.target_date) : 'Sin fecha fija';

  // Times Matrix
  const weeklyHours = calculateWeeklyHours(f.daily_time, f.study_days);
  document.getElementById('prof-weekly-time').textContent = weeklyHours;
  document.getElementById('prof-study-days').textContent = f.study_days && f.study_days.length > 0 ? f.study_days.join(', ') : 'Flexibles';
  document.getElementById('prof-peak-hour').textContent = f.peak_hour || 'Variable';
  document.getElementById('prof-session-format').textContent = f.session_format || 'Sesiones cortas';

  // Topic & Difficulty Matrix
  document.getElementById('prof-first-topic').textContent = f.first_topic || 'Tema 1';
  document.getElementById('prof-knowledge-level').textContent = f.knowledge_level || 'Conceptos básicos';
  document.getElementById('prof-difficulty').textContent = f.main_difficulty || 'Concentración';

  // Preferences & Privacy Matrix
  document.getElementById('prof-modalities').textContent = f.modalities && f.modalities.length > 0 ? f.modalities.join(' • ') : 'Lectura y esquemas';
  document.getElementById('prof-explanation-depth').textContent = f.explanation_depth || 'Intermedia';
  document.getElementById('prof-ai-pref').textContent = f.allow_ai === 'si' ? 'Habilitada (Opcional)' : 'Solo apuntes propios';
  document.getElementById('prof-privacy').textContent = f.sharing_pref || 'Privado 100%';

  // Switch view
  document.getElementById('view-welcome').classList.add('hidden');
  document.getElementById('interview-form').classList.add('hidden');
  document.getElementById('interview-progress-wrapper').classList.add('hidden');
  document.getElementById('view-profile').classList.remove('hidden');
  document.getElementById('header-context').textContent = `Perfil de ${name}`;

  window.scrollTo({ top: 0, behavior: 'smooth' });
  showToast('¡Perfil de estudio adaptativo generado con éxito!');
}

// Calculate approximate weekly time
function calculateWeeklyHours(dailyTimeStr, daysArray) {
  const daysCount = daysArray && daysArray.length > 0 ? daysArray.length : 3;
  let hoursPerDay = 1.5;
  if (dailyTimeStr === '30-45m') hoursPerDay = 0.65;
  else if (dailyTimeStr === '1-2h') hoursPerDay = 1.5;
  else if (dailyTimeStr === '2-4h') hoursPerDay = 3;
  else if (dailyTimeStr === '4h+') hoursPerDay = 4.5;

  const total = Math.round(hoursPerDay * daysCount * 10) / 10;
  return `Aprox. ${total} horas / semana (${daysCount} días)`;
}

// Date formatter
function formatReadableDate(isoString) {
  if (!isoString) return 'Sin fecha';
  try {
    const parts = isoString.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      return `${day}/${month}/${year}`;
    }
    const d = new Date(isoString);
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    return isoString;
  }
}

// Edit Profile Button (returns to step 1 with all prefilled answers)
function editProfile() {
  populateFormFromState();
  goToStep(1);
}

// Reset Interview
function resetInterview() {
  if (confirm('¿Deseas reiniciar la entrevista? Se borrarán las respuestas actuales.')) {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    location.reload();
  }
}

// Export Profile as JSON
function exportProfileJSON() {
  const data = state.savedProfile || state.formData;
  const jsonStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const dlAnchor = document.createElement('a');
  const studentSafeName = (data.name || 'estudiante').toLowerCase().replace(/\s+/g, '_');
  dlAnchor.setAttribute('href', jsonStr);
  dlAnchor.setAttribute('download', `perfil_estudio_${studentSafeName}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
  showToast('Archivo JSON descargado');
}

// Copy Profile Summary to Clipboard
function copyProfileSummary() {
  const f = state.savedProfile || state.formData;
  const rec = f.recommendation || computeStudyRecommendation(f);

  const text = `📋 PERFIL DE ESTUDIO ADAPTATIVO
• Estudiante: ${f.name}
• Nivel: ${f.edu_level} (${f.career || 'General'})
• Materia: ${f.subject}
• Primer tema: ${f.first_topic} (Nivel: ${f.knowledge_level})
• Meta: ${f.target_date || 'Sin fecha fija'}
• Dedicación: ${calculateWeeklyHours(f.daily_time, f.study_days)}
• Dificultad principal: ${f.main_difficulty}
• Método inicial recomendado: ${rec.methodName}
• Formato de sesión: ${rec.sessionDurationText}
• Privacidad: ${f.sharing_pref}
(Generado en Plataforma Inteligente de Apoyo al Estudio - Etapa 1)`;

  navigator.clipboard.writeText(text).then(() => {
    const copyBtnText = document.getElementById('copy-btn-text');
    if (copyBtnText) copyBtnText.textContent = '¡Copiado!';
    setTimeout(() => {
      if (copyBtnText) copyBtnText.textContent = 'Copiar resumen';
    }, 2500);
    showToast('Resumen copiado al portapapeles');
  }).catch(() => {
    showToast('No se pudo copiar automáticamente.');
  });
}

// Toast notification helper
function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-3');
  toast.classList.add('opacity-100', 'translate-y-0');

  setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none', 'translate-y-3');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 3200);
}
