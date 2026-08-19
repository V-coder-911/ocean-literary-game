// ============================================================
// OCEANQUEST — MAIN APPLICATION LOGIC
// Smart India Hackathon 2026 — SIH1660
// ============================================================

'use strict';

// ── STATE ──────────────────────────────────────────────────
const state = {
  currentPage: 'landing',
  selectedRole: null,
  missionIndex: 0,
  missionAnswered: false,
  gameTimer: null,
  timerValue: 60,
  quizDifficulty: null,
  quizIndex: 0,
  quizScore: 0,
  quizTimer: null,
  quizActive: false,
  tutorialStep: 0,
  loggedIn: false,
  countdownTimer: null,
};

const tutorialSteps = [
  {
    title: "Welcome to OceanQuest! 🌊",
    body: "OceanQuest teaches ocean literacy through real decisions. The ocean gives you information — your job is to decide what to do. Every right decision earns you XP and points. Wrong decisions teach you why through detailed explanations.",
  },
  {
    title: "How Missions Work 🎮",
    body: "Each mission gives you a real-world ocean scenario. You'll see current ocean conditions like wave height, wind speed, and alerts. Read them carefully before making your decision — they contain the clues to the correct answer.",
  },
  {
    title: "Ocean Advisory Data 📊",
    body: "The right panel shows simulated ocean advisory data. Just like the real INCOIS advisory system, it tells you wave heights, wind speeds, sea temperatures, and active warnings. Learning to read this data is the core skill of ocean literacy.",
  },
  {
    title: "Scoring & Levels ⭐",
    body: "Correct decisions earn +100 points and +50 XP. Excellent decisions earn +150/+75. Wrong decisions cost -50 points. Chain correct decisions for streak bonuses! You progress from Ocean Rookie all the way to Ocean Master.",
  },
  {
    title: "Ready to Be an Ocean Guardian? 🏆",
    body: "Your choices matter. In the real world, ocean-literate decisions save lives. The fisherman who reads wave forecasts comes home safely. The captain who uses storm data saves their crew. The tourism operator who understands ocean conditions protects their guests. Let's begin!",
  },
];

const roleData = [
  {
    id: "Fisherman",
    emoji: "🎣",
    desc: "Find productive fishing zones while staying alert to changing sea conditions.",
    difficulty: "Beginner",
    diffClass: "diff-easy",
    stats: [
      { label: "Fishing Knowledge", pct: 85 },
      { label: "Safety Awareness", pct: 70 },
      { label: "Navigation", pct: 60 },
    ],
  },
  {
    id: "Ship Captain",
    emoji: "🚢",
    desc: "Navigate safely through changing ocean and weather conditions.",
    difficulty: "Advanced",
    diffClass: "diff-hard",
    stats: [
      { label: "Navigation", pct: 90 },
      { label: "Safety", pct: 85 },
      { label: "Decision Making", pct: 80 },
    ],
  },
  {
    id: "Tourism Operator",
    emoji: "🤿",
    desc: "Protect tourists while planning safe marine activities.",
    difficulty: "Intermediate",
    diffClass: "diff-medium",
    stats: [
      { label: "Safety", pct: 80 },
      { label: "Weather Awareness", pct: 75 },
      { label: "Environmental Knowledge", pct: 85 },
    ],
  },
  {
    id: "Ocean Explorer",
    emoji: "🔭",
    desc: "Explore the ocean while learning about marine ecosystems.",
    difficulty: "Intermediate",
    diffClass: "diff-medium",
    stats: [
      { label: "Ocean Science", pct: 90 },
      { label: "Marine Life", pct: 85 },
      { label: "Sustainability", pct: 80 },
    ],
  },
];

const emergencyScenarios = {
  tsunami: {
    icon: "🌊",
    title: "TSUNAMI ALERT",
    desc: "A magnitude 7.8 earthquake was detected 180km offshore. A TSUNAMI WARNING has been issued for coastal areas. You are standing on the beach at Kochi. Wave height: Normal now. Time to impact: ~25 minutes.",
    timer: 30,
    correct: 0,
    actions: [
      "Move to HIGH GROUND inland immediately — at least 30m elevation",
      "Go to the beach to see the tsunami wave approaching",
      "Stay in your hotel room and lock the doors",
      "Call friends to warn them and then decide what to do",
    ],
    explanations: [
      "CORRECT! When a tsunami warning is issued, move immediately to high ground inland. 25 minutes is enough time to evacuate if you act immediately. Do NOT wait to see the wave.",
      "FATAL MISTAKE! Going to the beach to 'see' a tsunami is one of the most common and deadly mistakes. The wave will arrive with enormous force and you will have no chance of survival.",
      "WRONG! Buildings near the coast are not safe during a tsunami. The wave force will destroy structures at sea level. You must reach high ground.",
      "TOO SLOW! Calling friends is noble but costs precious time. Move first — warn others as you go. Every second counts with a 25-minute warning.",
    ],
  },
  cyclone: {
    icon: "🌪",
    title: "CYCLONE WARNING",
    desc: "Cyclone 'Vayu' — Category 3 — is approaching the Gujarat coast. Expected landfall in 18 hours. Wind speeds: 180 km/h. Storm surge: 3–5m above normal tide. You are a coastal resident.",
    timer: 30,
    correct: 0,
    actions: [
      "Evacuate to a designated cyclone shelter immediately",
      "Stay home — the walls of your house will protect you",
      "Move to a boat in the harbor to ride out the storm at sea",
      "Go to the beach to photograph the storm — it will be impressive",
    ],
    explanations: [
      "CORRECT! Evacuation to a designated cyclone shelter is the right decision. Category 3 cyclones with 3-5m storm surge destroy coastal structures. Shelters are designed and located to withstand these forces.",
      "DANGEROUS! A Category 3 cyclone with 3-5m storm surge will destroy most coastal buildings. Staying home in a storm surge zone is life-threatening.",
      "EXTREMELY DANGEROUS! Never go to sea during a cyclone. Harbors are destroyed by storm surge. Open water during a cyclone is near-certain death for small vessels.",
      "FATAL! Going to the beach during a cyclone is suicidal. Storm surge arrives as a wall of water that can travel hundreds of meters inland in seconds.",
    ],
  },
  highwave: {
    icon: "🌊",
    title: "HIGH WAVE WARNING",
    desc: "A HIGH WAVE WARNING is active for the Kerala coast. Current wave height: 3.8m, expected to reach 5m. Wind speed: 55 km/h. You are a small boat fisherman 15km from shore.",
    timer: 25,
    correct: 0,
    actions: [
      "Return to port immediately via the shortest safe route",
      "Stay in position — the waves might calm down soon",
      "Move further offshore to find calmer water",
      "Continue fishing — you have caught a lot today",
    ],
    explanations: [
      "CORRECT! Return to port immediately. With 3.8m waves and a warning of 5m, conditions will worsen. A small fishing boat cannot safely handle 4-5m waves. Return while conditions are still manageable.",
      "WRONG! Waiting for conditions to improve during an active HIGH WAVE WARNING is dangerous. Waves are forecast to increase to 5m — they will not calm down.",
      "INCORRECT! Moving further offshore during rising waves and a HIGH WAVE WARNING increases your exposure and distance from safety. Return to port is always the correct action.",
      "WRONG! No catch is worth your life or your crew's lives. An active HIGH WAVE WARNING means conditions are hazardous. Safety always takes priority.",
    ],
  },
  mayday: {
    icon: "🚨",
    title: "MAYDAY RECEIVED",
    desc: "You are the captain of a vessel 25km offshore. Your radio receives: 'MAYDAY MAYDAY MAYDAY — Fishing vessel Amara is sinking 8km to your northeast. 4 people aboard.' Current conditions: 2m waves, 22 km/h winds.",
    timer: 20,
    correct: 0,
    actions: [
      "Alert Coast Guard immediately and head toward the vessel",
      "Ignore the call — it's not your responsibility",
      "Alert Coast Guard only and continue your journey",
      "Wait for Coast Guard — conditions may be too dangerous",
    ],
    explanations: [
      "CORRECT! Alert Coast Guard first (so they can coordinate), then head to the distressed vessel. International maritime law (SOLAS) requires vessels to render assistance to those in distress. 2m waves and 22 km/h winds are manageable conditions.",
      "ILLEGAL! Ignoring a MAYDAY call when you are the nearest vessel is a criminal offense under international maritime law. Four lives depend on your response.",
      "INCOMPLETE. Alerting Coast Guard is correct, but maritime law requires you to also respond directly when you are the nearest vessel and conditions allow. 2m waves do not prevent rescue.",
      "WRONG. 2m waves and 22 km/h winds are CAUTION conditions — not preventing rescue. The vessel is sinking with 4 people aboard. Waiting for Coast Guard when you are nearest delays help fatally.",
    ],
  },
  fog: {
    icon: "🌫",
    title: "POOR VISIBILITY — DENSE FOG",
    desc: "Dense fog has reduced visibility to less than 200m. You are navigating a cargo vessel in a busy shipping lane near Mumbai. Radar shows a vessel 1km ahead. What action do you take?",
    timer: 20,
    correct: 1,
    actions: [
      "Maintain speed — radar shows the other vessel is far enough away",
      "Reduce speed significantly and sound fog signals every 2 minutes",
      "Increase speed to clear the fog zone faster",
      "Anchor in place and wait for fog to clear",
    ],
    explanations: [
      "WRONG. In fog, distances are deceptive and collisions happen fast. Maintaining speed with 200m visibility and another vessel 1km ahead in a shipping lane is reckless and violates maritime rules.",
      "CORRECT! International Regulations for Preventing Collisions at Sea (COLREGS) require vessels to reduce speed to minimum safe speed in restricted visibility and to sound fog signals every 2 minutes on a power-driven vessel underway.",
      "EXTREMELY DANGEROUS! Increasing speed in dense fog is one of the most dangerous decisions a captain can make. Stopping distances increase dramatically while visibility is minimal.",
      "PARTIALLY CORRECT as a last resort. Anchoring is sometimes appropriate, but in a busy shipping lane it creates additional hazard. The primary action should be speed reduction and fog signals.",
    ],
  },
};

// ── INITIALIZATION ─────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createParticles();
  renderRoles();
  renderAchievements();
  renderLessons('all');
  renderLeaderboard();
  renderAdvisoryDashboard();
  renderMapMarkers();
  renderProfileHistory();
  renderDashboardAchievements();
  renderDailyOptions();
  updateDashboard();
  initCountdown();

  // Keyboard accessibility — enter to click links
  document.querySelectorAll('[role="menuitem"], [role="tab"]').forEach(el => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
  });
});

// ── PARTICLES ──────────────────────────────────────────────
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.animationDuration = (Math.random() * 15 + 8) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.width = p.style.height = (Math.random() * 3 + 1) + 'px';
    p.style.opacity = Math.random() * 0.5 + 0.1;
    container.appendChild(p);
  }
}

// ── PAGE NAVIGATION ────────────────────────────────────────
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + pageId);
  if (target) {
    target.classList.add('active');
    state.currentPage = pageId;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update nav active state
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = {
    landing: 'nav-home', learn: 'nav-learn', map: 'nav-map',
    leaderboard: 'nav-lb', achievements: 'nav-ach', about: 'nav-about',
  };
  if (navMap[pageId]) {
    const navEl = document.getElementById(navMap[pageId]);
    if (navEl) navEl.classList.add('active');
  }

  // Page-specific actions
  if (pageId === 'game') {
    loadMission(state.missionIndex);
    renderMissionProgress();
  }
  if (pageId === 'quiz') {
    state.quizDifficulty = null;
    document.getElementById('quiz-setup').style.display = 'block';
    document.getElementById('quiz-game').style.display = 'none';
    document.getElementById('quiz-result').classList.remove('show');
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
    document.getElementById('start-quiz-btn').disabled = true;
  }
}

// ── MOBILE MENU ────────────────────────────────────────────
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  const btn  = document.getElementById('hamburger');
  const isOpen = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', isOpen);
  menu.setAttribute('aria-hidden', !isOpen);
}
function closeMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.remove('open');
  document.getElementById('hamburger').setAttribute('aria-expanded', 'false');
  menu.setAttribute('aria-hidden', 'true');
}

// ── AUTH ───────────────────────────────────────────────────
function openAuth(tab) {
  const modal = document.getElementById('auth-modal');
  modal.classList.add('open');
  switchAuthTab(tab || 'login');
  document.body.style.overflow = 'hidden';
}
function closeAuth() {
  document.getElementById('auth-modal').classList.remove('open');
  document.body.style.overflow = '';
}
function switchAuthTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-register').classList.toggle('active', tab === 'register');
  document.getElementById('tab-login').setAttribute('aria-selected', tab === 'login');
  document.getElementById('tab-register').setAttribute('aria-selected', tab === 'register');
}
document.getElementById('auth-modal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAuth();
});

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value.trim();
  if (!user || !pass) { showToast('error', 'Missing Fields', 'Please enter your username and password.'); return; }
  // Simulate login
  state.loggedIn = true;
  PLAYER_STATE.isGuest = false;
  closeAuth();
  updateNavForLogin();
  showToast('success', 'Welcome Back!', 'You have logged in as ' + (user || 'Ocean Guardian'));
  showPage('dashboard');
  updateDashboard();
}

function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById('reg-name').value.trim();
  const user = document.getElementById('reg-user').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const pass = document.getElementById('reg-pass').value.trim();
  if (!name || !user || !email || !pass) { showToast('error', 'Missing Fields', 'Please fill in all required fields.'); return; }
  state.loggedIn = true;
  PLAYER_STATE.isGuest = false;
  PLAYER_STATE.name = name;
  PLAYER_STATE.username = user;
  closeAuth();
  updateNavForLogin();
  showToast('success', 'Account Created!', 'Welcome to OceanQuest, ' + name + '! Start your ocean journey.');
  showPage('roles');
}

function playAsGuest() {
  PLAYER_STATE.isGuest = true;
  state.loggedIn = true;
  closeAuth();
  updateNavForLogin();
  showToast('info', 'Guest Mode', 'Playing as guest. Complete missions but leaderboard progress won\'t be saved.');
  startGameFlow();
}

function updateNavForLogin() {
  const btn = document.getElementById('nav-login-btn');
  btn.textContent = '👤 ' + (PLAYER_STATE.isGuest ? 'Guest' : PLAYER_STATE.name);
  btn.onclick = () => showPage('profile');
}

// ── GAME FLOW ──────────────────────────────────────────────
function startGameFlow() {
  if (!state.loggedIn) { openAuth('login'); return; }
  if (!PLAYER_STATE.role) {
    showPage('roles');
    return;
  }
  showPage('dashboard');
}

// ── TUTORIAL ───────────────────────────────────────────────
function showTutorial() {
  state.tutorialStep = 0;
  renderTutorialStep();
  document.getElementById('tutorial-overlay').classList.add('show');
  document.body.style.overflow = 'hidden';
}
function renderTutorialStep() {
  const step = tutorialSteps[state.tutorialStep];
  const dots = tutorialSteps.map((_, i) => `<div class="tutorial-step-dot ${i <= state.tutorialStep ? 'active' : ''}"></div>`).join('');
  document.getElementById('tutorial-dots').innerHTML = dots;
  document.getElementById('tutorial-title').textContent = step.title;
  document.getElementById('tutorial-body').textContent = step.body;
  document.getElementById('tutorial-next').textContent =
    state.tutorialStep === tutorialSteps.length - 1 ? 'START MISSION! 🌊' : 'Next →';
}
function nextTutorialStep() {
  if (state.tutorialStep < tutorialSteps.length - 1) {
    state.tutorialStep++;
    renderTutorialStep();
  } else {
    skipTutorial();
    showPage('game');
  }
}
function skipTutorial() {
  document.getElementById('tutorial-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ── ROLES ──────────────────────────────────────────────────
function renderRoles() {
  const grid = document.getElementById('roles-grid');
  if (!grid) return;
  grid.innerHTML = roleData.map(role => `
    <div class="role-card" data-role="${role.id}" onclick="selectRole('${role.id}')"
         role="button" tabindex="0" aria-pressed="false" aria-label="Select ${role.id} role">
      <div class="role-banner">
        <span style="position:relative;z-index:1;font-size:5rem;" aria-hidden="true">${role.emoji}</span>
      </div>
      <div class="role-selected-badge" aria-hidden="true">✓</div>
      <div class="role-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.5rem;">
          <div class="role-name">${role.id.toUpperCase()}</div>
          <span class="difficulty-tag ${role.diffClass}">${role.difficulty}</span>
        </div>
        <div class="role-desc">${role.desc}</div>
        <div class="role-stats">
          ${role.stats.map(s => `
            <div class="role-stat-row">
              <span class="role-stat-label">${s.label}</span>
              <div class="role-stat-bar"><div class="role-stat-fill" style="width:${s.pct}%"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');

  // Keyboard support for role cards
  grid.querySelectorAll('.role-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.click();
      }
    });
  });
}

function selectRole(roleId) {
  state.selectedRole = roleId;
  document.querySelectorAll('.role-card').forEach(c => {
    const isSelected = c.dataset.role === roleId;
    c.classList.toggle('selected', isSelected);
    c.setAttribute('aria-pressed', isSelected);
  });
  document.getElementById('confirm-role-btn').disabled = false;
}

function confirmRole() {
  if (!state.selectedRole) return;
  PLAYER_STATE.role = state.selectedRole;
  const role = roleData.find(r => r.id === state.selectedRole);
  updateDashboard();
  showToast('success', 'Role Selected!', `You are now a ${state.selectedRole}! Your journey begins.`);
  showTutorial();
}

// ── DASHBOARD ──────────────────────────────────────────────
function updateDashboard() {
  const p = PLAYER_STATE;
  const pct = Math.round((p.xp / p.xpMax) * 100);
  const levelName = OCEAN_DATA.levelNames[p.level] || 'Ocean Master';

  document.getElementById('dash-level')?.setAttribute && null;
  setText('dash-level', p.level.toString().padStart(2,'0'));
  setText('dash-streak', p.streak);
  setText('xp-title', `LEVEL ${p.level.toString().padStart(2,'0')} — ${levelName}`);
  setText('xp-current', p.xp.toLocaleString());
  setText('xp-max', p.xpMax.toLocaleString());
  setText('xp-pct', pct + '%');
  setText('dash-points', p.points.toLocaleString());
  setText('dash-rank', '#' + p.globalRank);
  setText('stat-missions', p.missionsCompleted);
  setText('stat-correct', p.correctDecisions);
  setText('stat-iq', p.oceanIQ + '%');
  setText('stat-streak', '🔥 ' + p.streak);

  const xpBar = document.getElementById('xp-bar');
  if (xpBar) xpBar.style.width = pct + '%';

  const xpRing = document.querySelector('.xp-ring-fill');
  if (xpRing) xpRing.style.cssText += `;--pct:${pct}`;

  const role = roleData.find(r => r.id === p.role);
  setText('dash-role', p.role || '—');
  setText('dash-level-name', levelName);
  if (role) {
    setText('dash-role-emoji', role.emoji);
    setText('dash-role-display', p.role);
    setText('dash-role-desc', role.desc);
  }
  setText('dash-role-text', `You are a `);
}

function renderDashboardAchievements() {
  const container = document.getElementById('recent-achievements');
  if (!container) return;
  const unlocked = OCEAN_DATA.achievements.filter(a => a.unlocked).slice(0,3);
  container.innerHTML = unlocked.map(a => `
    <div style="display:flex;align-items:center;gap:0.8rem;padding:0.6rem;border-radius:var(--border-sm);margin-bottom:0.5rem;background:var(--glass);border:1px solid rgba(255,215,0,0.15);">
      <span class="material-icons" style="color:var(--gold);font-size:1.3rem;">${a.icon}</span>
      <div>
        <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary);">${a.name}</div>
        <div style="font-size:0.75rem;color:var(--text-muted);">${a.desc}</div>
      </div>
      <span style="margin-left:auto;font-family:var(--font-mono);font-size:0.75rem;color:var(--gold);">+${a.xp} XP</span>
    </div>
  `).join('');
}

// ── GAME ───────────────────────────────────────────────────
function renderMissionProgress() {
  const list = document.getElementById('mission-progress-list');
  if (!list) return;
  list.innerHTML = OCEAN_DATA.missions.map((m, i) => {
    let cls = '';
    if (i < state.missionIndex) cls = 'completed';
    else if (i === state.missionIndex) cls = 'current';
    const icon = i < state.missionIndex ? '✓' : (i + 1).toString();
    return `
      <div class="mission-progress-item ${cls}" onclick="state.missionIndex=${i};loadMission(${i})" 
           role="button" tabindex="0" aria-label="Mission ${i+1}: ${m.title}">
        <div class="m-icon">${icon}</div>
        <span>${m.title}</span>
      </div>
    `;
  }).join('');
}

function loadMission(idx) {
  const mission = OCEAN_DATA.missions[idx];
  if (!mission) { showMissionComplete(); return; }

  state.missionAnswered = false;
  clearMissionTimer();

  setText('mission-subtitle', mission.subtitle);
  setText('mission-title', mission.title);
  setText('mission-desc', mission.description);
  setText('question-text', mission.question);
  setText('g-mission-num', `${idx + 1} / ${OCEAN_DATA.missions.length}`);

  // Ocean conditions panel
  const condPanel = document.getElementById('ocean-conditions-panel');
  if (condPanel) {
    const cond = mission.conditions;
    condPanel.innerHTML = Object.entries(cond).map(([key, val]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toUpperCase();
      const isAlert = String(val).includes('WARNING') || String(val).includes('ALERT') || String(val).includes('DANGER');
      const isCaution = String(val).includes('CAUTION') || String(val).includes('Rising') || String(val).includes('→');
      const cls = isAlert ? 'danger' : isCaution ? 'warning' : '';
      const icon = getConditionIcon(key);
      return `<div class="ocean-data-item">
        <span class="od-label">${icon} ${label}</span>
        <span class="od-value ${cls}">${val}</span>
      </div>`;
    }).join('');
  }

  // Alerts panel
  const alertsPanel = document.getElementById('alerts-panel');
  if (alertsPanel) {
    const hasAlert = mission.conditions.alert && mission.conditions.alert !== 'None';
    alertsPanel.innerHTML = hasAlert
      ? `<div style="background:rgba(255,51,102,0.1);border:1px solid rgba(255,51,102,0.3);border-radius:var(--border-sm);padding:0.8rem;font-size:0.8rem;color:var(--danger);font-weight:600;animation:alert-pulse 2s infinite;">⚠ ${mission.conditions.alert}</div>`
      : `<div style="background:rgba(0,230,118,0.06);border:1px solid rgba(0,230,118,0.2);border-radius:var(--border-sm);padding:0.8rem;font-size:0.8rem;color:var(--success);">✅ No active alerts</div>`;
  }

  // Role-specific zone
  setText('zone-info', mission.conditions.fishZone ? `Fish Zone: ${mission.conditions.fishZone}` : 'Open Ocean');

  // Render options
  const optContainer = document.getElementById('options-container');
  if (optContainer) {
    optContainer.innerHTML = mission.options.map(opt => `
      <button class="option-btn" id="opt-${opt.id}" onclick="selectAnswer('${opt.id}', ${mission.id})"
              aria-label="Option ${opt.id}: ${opt.text}">
        <span class="option-letter">${opt.id}</span>
        <span>${opt.text}</span>
      </button>
    `).join('');
  }

  // Hide result panel
  const resultPanel = document.getElementById('result-panel');
  if (resultPanel) resultPanel.classList.remove('show');

  // HUD
  const role = roleData.find(r => r.id === PLAYER_STATE.role);
  setText('sidebar-role-emoji', role ? role.emoji : '🌊');
  setText('sidebar-role-name', PLAYER_STATE.role || 'Ocean Explorer');
  setText('g-level', PLAYER_STATE.level.toString().padStart(2,'0'));
  setText('g-xp', PLAYER_STATE.xp.toLocaleString());
  setText('g-score', PLAYER_STATE.points.toLocaleString());
  setText('g-streak', '🔥 ' + PLAYER_STATE.streak);

  // Start timer
  startMissionTimer();
}

function getConditionIcon(key) {
  const icons = {
    waveHeight: '🌊', windSpeed: '💨', windDir: '🧭', sst: '🌡',
    fishZone: '🐟', weather: '☁', safety: '🛡', alert: '⚠',
    current: '🌀', visibility: '👁', routeA: '🔴', routeB: '🟢',
  };
  return icons[key] || '📊';
}

function selectAnswer(optId, missionId) {
  if (state.missionAnswered) return;
  state.missionAnswered = true;
  clearMissionTimer();

  const mission = OCEAN_DATA.missions.find(m => m.id === missionId);
  if (!mission) return;

  const chosen = mission.options.find(o => o.id === optId);
  const correct = mission.options.find(o => o.correct);

  // Disable all options + highlight
  mission.options.forEach(opt => {
    const btn = document.getElementById('opt-' + opt.id);
    if (!btn) return;
    btn.disabled = true;
    if (opt.correct) btn.classList.add('correct');
    else if (opt.id === optId && !opt.correct) btn.classList.add('wrong');
  });

  // Update player state
  const pts = chosen.points;
  const xpGain = chosen.xp || 0;
  PLAYER_STATE.points = Math.max(0, PLAYER_STATE.points + pts);
  PLAYER_STATE.xp += xpGain;

  if (chosen.correct) {
    PLAYER_STATE.correctDecisions++;
    PLAYER_STATE.consecutiveCorrect++;
    PLAYER_STATE.missionsCompleted++;

    // Streak bonuses
    let bonusMsg = '';
    if (PLAYER_STATE.consecutiveCorrect === 3) {
      PLAYER_STATE.points += 100; PLAYER_STATE.xp += 50;
      bonusMsg = ' +100 STREAK BONUS!';
    } else if (PLAYER_STATE.consecutiveCorrect === 5) {
      PLAYER_STATE.points += 250; PLAYER_STATE.xp += 100;
      bonusMsg = ' +250 STREAK BONUS!';
    } else if (PLAYER_STATE.consecutiveCorrect === 10) {
      PLAYER_STATE.points += 500; PLAYER_STATE.xp += 200;
      bonusMsg = ' +500 STREAK BONUS!';
    }
    PLAYER_STATE.streak = Math.max(PLAYER_STATE.streak, PLAYER_STATE.consecutiveCorrect);
  } else {
    PLAYER_STATE.consecutiveCorrect = 0;
  }

  // Level up check
  const prevLevel = PLAYER_STATE.level;
  if (PLAYER_STATE.xp >= PLAYER_STATE.xpMax) {
    PLAYER_STATE.xp -= PLAYER_STATE.xpMax;
    PLAYER_STATE.level++;
    PLAYER_STATE.xpMax = Math.round(PLAYER_STATE.xpMax * 1.3);
    if (PLAYER_STATE.level > prevLevel) {
      setTimeout(() => showLevelUp(PLAYER_STATE.level), 800);
    }
  }

  // Result panel
  const resultPanel = document.getElementById('result-panel');
  if (resultPanel) {
    resultPanel.className = 'result-panel show ' + (chosen.correct ? 'correct' : 'wrong');
    const heading = chosen.excellent ? '✅ EXCELLENT DECISION!' : chosen.correct ? '✅ CORRECT DECISION!' : chosen.dangerous ? '🚨 DANGEROUS DECISION!' : '❌ WRONG DECISION';
    setText('result-heading', heading);
    setText('result-feedback', chosen.feedback);
    setText('result-explanation', '📘 LEARNING: ' + mission.explanation);

    const ptsEl = document.getElementById('result-points');
    const xpEl  = document.getElementById('result-xp');
    if (ptsEl) {
      ptsEl.className = 'points-pop ' + (pts >= 0 ? 'positive' : 'negative');
      ptsEl.textContent = (pts >= 0 ? '+' : '') + pts + ' pts';
    }
    if (xpEl) {
      xpEl.className = 'points-pop ' + (xpGain > 0 ? 'positive' : 'negative');
      xpEl.textContent = (xpGain > 0 ? '+' : '') + xpGain + ' XP';
    }
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // Update HUD
  setText('g-xp', PLAYER_STATE.xp.toLocaleString());
  setText('g-score', PLAYER_STATE.points.toLocaleString());
  setText('g-streak', '🔥 ' + PLAYER_STATE.consecutiveCorrect);

  // Toast
  if (chosen.correct) {
    showToast('success', chosen.excellent ? 'Excellent Decision! 🌟' : 'Correct! ✅', `+${pts} points, +${xpGain} XP earned`);
    if (chosen.excellent) launchConfetti();
  } else {
    showToast('error', chosen.dangerous ? 'Dangerous Decision! 🚨' : 'Wrong Decision ❌', `${pts} points`);
  }
}

function nextMission() {
  state.missionIndex++;
  if (state.missionIndex >= OCEAN_DATA.missions.length) {
    showMissionComplete();
    return;
  }
  loadMission(state.missionIndex);
  renderMissionProgress();
}

function showMissionComplete() {
  clearMissionTimer();
  const main = document.querySelector('.game-main');
  if (!main) return;
  main.innerHTML = `
    <div style="text-align:center;padding:3rem;">
      <div style="font-size:5rem;margin-bottom:1rem;">🏆</div>
      <h2 style="font-family:var(--font-mono);font-size:2rem;color:var(--gold);margin-bottom:1rem;">ALL MISSIONS COMPLETE!</h2>
      <p style="color:var(--text-secondary);margin-bottom:2rem;">You have completed all 8 missions in this session. Your ocean knowledge is growing!</p>
      <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
        <div class="stat-card" style="min-width:120px;"><div class="label">Session Points</div><div class="value">${PLAYER_STATE.points.toLocaleString()}</div></div>
        <div class="stat-card" style="min-width:120px;"><div class="label">XP Earned</div><div class="value">${PLAYER_STATE.xp.toLocaleString()}</div></div>
        <div class="stat-card" style="min-width:120px;"><div class="label">Best Streak</div><div class="value">🔥${PLAYER_STATE.streak}</div></div>
      </div>
      <div style="margin-top:2rem;display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary btn-lg" onclick="restartAllMissions()">PLAY AGAIN 🎮</button>
        <button class="btn btn-secondary" onclick="showPage('leaderboard')">VIEW LEADERBOARD 🏆</button>
        <button class="btn btn-glass" onclick="showPage('dashboard')">DASHBOARD</button>
      </div>
    </div>
  `;
  launchConfetti();
  updateDashboard();
}

function restartAllMissions() {
  state.missionIndex = 0;
  state.missionAnswered = false;
  showPage('game');
}

// Mission Timer
function startMissionTimer() {
  state.timerValue = 60;
  setText('g-timer', state.timerValue);
  state.gameTimer = setInterval(() => {
    state.timerValue--;
    setText('g-timer', state.timerValue);
    const el = document.getElementById('g-timer');
    if (el) {
      el.style.color = state.timerValue < 15 ? 'var(--danger)' : state.timerValue < 30 ? 'var(--warning)' : 'var(--warning)';
    }
    if (state.timerValue <= 0) {
      clearMissionTimer();
      if (!state.missionAnswered) {
        showToast('warning', 'Time Up! ⏱', 'You ran out of time! -50 points');
        PLAYER_STATE.points = Math.max(0, PLAYER_STATE.points - 50);
        state.missionAnswered = true;
        document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
        const mission = OCEAN_DATA.missions[state.missionIndex];
        const correct = mission?.options.find(o => o.correct);
        if (correct) document.getElementById('opt-' + correct.id)?.classList.add('correct');
      }
    }
  }, 1000);
}
function clearMissionTimer() {
  if (state.gameTimer) { clearInterval(state.gameTimer); state.gameTimer = null; }
}

// ── LEADERBOARD ────────────────────────────────────────────
function renderLeaderboard() {
  renderPodium();
  renderLbTable();
}

function renderPodium() {
  const podium = document.getElementById('podium');
  if (!podium) return;
  const top3 = OCEAN_DATA.leaderboard.slice(0, 3);
  const order = [1, 0, 2]; // 2nd, 1st, 3rd visually
  podium.innerHTML = order.map(i => {
    const p = top3[i];
    const medals = ['🥇', '🥈', '🥉'];
    return `
      <div class="podium-block rank-${p.rank}" aria-label="Rank ${p.rank}: ${p.name}">
        <div class="podium-rank">${medals[p.rank - 1]}</div>
        <div class="podium-avatar">🌊</div>
        <div class="podium-name">${p.name}</div>
        <div class="podium-pts">${p.points.toLocaleString()} pts</div>
      </div>
    `;
  }).join('');
}

function setLbTab(period) {
  document.querySelectorAll('.lb-tab').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected', 'false');
  });
  const tab = document.getElementById('lb-tab-' + period);
  if (tab) { tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); }
  renderLbTable(period);
}

function renderLbTable(period) {
  const tbody = document.getElementById('lb-body');
  if (!tbody) return;
  // Shuffle slightly for different tabs to simulate different periods
  const offset = { daily: 0, weekly: 2, monthly: 1, all: 0 }[period] || 0;
  const data = [...OCEAN_DATA.leaderboard].map((p, i) => ({
    ...p,
    points: p.points + (offset * (10 - i) * 50),
  })).sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 }));

  tbody.innerHTML = data.map(p => {
    const rankClass = p.rank <= 3 ? `rank-${p.rank}-txt` : '';
    const rankIcon = p.rank === 1 ? '🥇' : p.rank === 2 ? '🥈' : p.rank === 3 ? '🥉' : `#${p.rank}`;
    const isMe = p.name === 'MarineHero';
    return `
      <tr class="lb-row ${isMe ? 'me' : ''}" aria-label="Rank ${p.rank}: ${p.name}">
        <td class="rank-num ${rankClass}">${rankIcon}</td>
        <td>
          <div class="player-cell">
            <div class="player-avatar-sm">🌊</div>
            <div>
              <div class="player-name">${p.name} ${isMe ? '<span style="color:var(--cyan);font-size:0.75rem;">(You)</span>' : ''}</div>
              <div class="player-role-sm">${p.role}</div>
            </div>
          </div>
        </td>
        <td class="text-muted" style="font-size:0.85rem;">${p.role}</td>
        <td class="pts-cell">${p.points.toLocaleString()}</td>
        <td><span class="level-badge">⭐ ${p.level}</span></td>
        <td style="color:var(--orange);font-family:var(--font-mono);font-size:0.85rem;">🔥${p.streak}</td>
      </tr>
    `;
  }).join('');
}

// ── LEARN ──────────────────────────────────────────────────
function filterLessons(cat) {
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  renderLessons(cat);
}

const lessonBannerMap = {
  'Ocean Basics': 'lesson-banner-ocean',
  'Extreme Events': 'lesson-banner-events',
  'Sustainable Fishing': 'lesson-banner-fishing',
  'Ocean & Weather': 'lesson-banner-weather',
  'Marine Life': 'lesson-banner-life',
  'Maritime Safety': 'lesson-banner-safety',
  'Ocean Conservation': 'lesson-banner-conserv',
  'Climate & Ocean': 'lesson-banner-climate',
};
const lessonIcons = {
  'Ocean Basics': '🌊', 'Extreme Events': '🌪', 'Sustainable Fishing': '🎣',
  'Ocean & Weather': '🌦', 'Marine Life': '🐟', 'Maritime Safety': '🚢',
  'Ocean Conservation': '🌱', 'Climate & Ocean': '🌡',
};
const diffColors = { Easy: '#00e676', Medium: '#ffaa00', Hard: '#ff3366' };

function renderLessons(cat) {
  const grid = document.getElementById('lessons-grid');
  if (!grid) return;
  const lessons = cat === 'all'
    ? OCEAN_DATA.lessons
    : OCEAN_DATA.lessons.filter(l => l.category === cat);

  grid.innerHTML = lessons.map(l => `
    <article class="lesson-card" onclick="openLesson('${l.id}')" role="button" tabindex="0" aria-label="Lesson: ${l.title}">
      <div class="lesson-banner ${lessonBannerMap[l.category] || 'lesson-banner-ocean'}">
        <span aria-hidden="true" style="font-size:3rem;position:relative;z-index:1;">${lessonIcons[l.category] || '📚'}</span>
      </div>
      <div class="lesson-body">
        <div class="lesson-cat">${l.category}</div>
        <div class="lesson-title">${l.title}</div>
        <div class="lesson-desc">${l.desc}</div>
        <div class="lesson-footer">
          <div class="lesson-meta">
            <span>⏱ ${l.duration}</span>
            <span class="diff-pill" style="background:${diffColors[l.difficulty]}20;color:${diffColors[l.difficulty]};">${l.difficulty}</span>
          </div>
          <div class="lesson-xp">+${l.xp} XP</div>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.lesson-card').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

function openLesson(lessonId) {
  const lesson = OCEAN_DATA.lessons.find(l => l.id === lessonId);
  if (!lesson) return;
  showToast('info', lesson.title, `Starting ${lesson.duration} lesson. +${lesson.xp} XP on completion!`);
  // In a full implementation, this would open a modal with lesson content
  setTimeout(() => {
    PLAYER_STATE.xp += lesson.xp;
    showToast('success', 'Lesson Complete! 📚', `You earned +${lesson.xp} XP. Knowledge grows!`);
    updateDashboard();
  }, 2000);
}

// ── QUIZ ───────────────────────────────────────────────────
function selectDifficulty(diff) {
  state.quizDifficulty = diff;
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  const btn = document.getElementById('qd-' + diff);
  if (btn) btn.classList.add('selected');
  document.getElementById('start-quiz-btn').disabled = false;
}

function startQuiz() {
  if (!state.quizDifficulty) return;
  state.quizIndex = 0;
  state.quizScore = 0;
  state.quizActive = true;
  document.getElementById('quiz-setup').style.display = 'none';
  document.getElementById('quiz-game').style.display = 'block';
  document.getElementById('quiz-result').classList.remove('show');
  loadQuizQuestion();
}

function loadQuizQuestion() {
  const questions = OCEAN_DATA.quizQuestions[state.quizDifficulty];
  if (state.quizIndex >= questions.length) { endQuiz(); return; }
  const q = questions[state.quizIndex];

  setText('quiz-q-num', `QUESTION ${state.quizIndex + 1} OF ${questions.length}`);
  setText('quiz-q-text', q.q);

  const pct = (state.quizIndex / questions.length) * 100;
  const prog = document.getElementById('quiz-prog');
  if (prog) prog.style.width = pct + '%';

  const opts = document.getElementById('quiz-options');
  if (opts) {
    opts.innerHTML = q.options.map((opt, i) => `
      <button class="quiz-opt" id="qopt-${i}" onclick="selectQuizAnswer(${i}, ${q.correct}, '${q.exp.replace(/'/g, "\\'")}')"
              aria-label="Option ${String.fromCharCode(65+i)}: ${opt}">
        <span class="opt-num">${String.fromCharCode(65+i)}</span>
        ${opt}
      </button>
    `).join('');
  }

  const expEl = document.getElementById('quiz-explanation');
  if (expEl) expEl.classList.remove('show');
  const nextWrap = document.getElementById('quiz-next-wrap');
  if (nextWrap) nextWrap.style.display = 'none';

  startQuizTimer();
}

function selectQuizAnswer(chosen, correct, explanation) {
  if (!state.quizActive) return;
  clearQuizTimer();
  state.quizActive = false;

  document.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    else if (i === chosen && chosen !== correct) btn.classList.add('wrong');
  });

  if (chosen === correct) state.quizScore++;

  const expEl = document.getElementById('quiz-explanation');
  if (expEl) { expEl.textContent = '📘 ' + explanation; expEl.classList.add('show'); }
  const nextWrap = document.getElementById('quiz-next-wrap');
  if (nextWrap) nextWrap.style.display = 'block';

  if (chosen === correct) {
    PLAYER_STATE.xp += 25;
    showToast('success', 'Correct! ✅', '+25 XP earned');
  }
}

function nextQuizQuestion() {
  state.quizIndex++;
  state.quizActive = true;
  loadQuizQuestion();
}

function endQuiz() {
  clearQuizTimer();
  const questions = OCEAN_DATA.quizQuestions[state.quizDifficulty];
  const pct = Math.round((state.quizScore / questions.length) * 100);

  document.getElementById('quiz-game').style.display = 'none';
  const result = document.getElementById('quiz-result');
  result.classList.add('show');

  setText('iq-score', pct + '%');
  document.getElementById('iq-circle').style.setProperty('--score-pct', pct);

  let grade, msg;
  if (pct >= 90) { grade = 'OCEAN MASTER 🌊'; msg = 'Outstanding! Your ocean knowledge is exceptional.'; }
  else if (pct >= 75) { grade = 'OCEAN GUARDIAN 🏆'; msg = 'Excellent! You are becoming an Ocean Guardian.'; }
  else if (pct >= 60) { grade = 'SEA NAVIGATOR ⭐'; msg = 'Good work! Keep learning to improve your Ocean IQ.'; }
  else if (pct >= 40) { grade = 'WAVE WATCHER 🌊'; msg = 'Good start! Ocean literacy takes practice. Try again!'; }
  else { grade = 'OCEAN ROOKIE 🐟'; msg = 'Keep going! Every question teaches you something new.'; }

  setText('quiz-grade', grade);
  setText('quiz-msg', msg);
  PLAYER_STATE.oceanIQ = Math.max(PLAYER_STATE.oceanIQ, pct);
  updateDashboard();
  showToast('info', 'Quiz Complete! 🎯', `You scored ${pct}% — ${grade}`);
}

function restartQuiz() {
  state.quizDifficulty = null;
  document.getElementById('quiz-result').classList.remove('show');
  document.getElementById('quiz-setup').style.display = 'block';
  document.getElementById('quiz-game').style.display = 'none';
  document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('start-quiz-btn').disabled = true;
}

function startQuizTimer() {
  let t = 30;
  setText('quiz-timer', t + 's');
  state.quizActive = true;
  state.quizTimer = setInterval(() => {
    t--;
    setText('quiz-timer', t + 's');
    const el = document.getElementById('quiz-timer');
    if (el) el.style.color = t < 10 ? 'var(--danger)' : 'var(--warning)';
    if (t <= 0) {
      clearQuizTimer();
      if (state.quizActive) { selectQuizAnswer(-1, -99, 'Time ran out!'); }
    }
  }, 1000);
}
function clearQuizTimer() {
  if (state.quizTimer) { clearInterval(state.quizTimer); state.quizTimer = null; }
}

// ── ACHIEVEMENTS ───────────────────────────────────────────
function renderAchievements() {
  const grid = document.getElementById('ach-grid');
  if (!grid) return;

  let unlockedCount = 0, xpTotal = 0;
  grid.innerHTML = OCEAN_DATA.achievements.map(a => {
    if (a.unlocked || PLAYER_STATE.achievements.includes(a.id)) {
      a.unlocked = true;
      unlockedCount++;
      xpTotal += a.xp;
    }
    return `
      <div class="ach-card ${a.unlocked ? 'unlocked' : 'locked'}" aria-label="${a.name}: ${a.desc} ${a.unlocked ? '(Unlocked)' : '(Locked)'}">
        <div class="ach-icon">
          <span class="material-icons" aria-hidden="true">${a.icon}</span>
        </div>
        <div class="ach-name">${a.name}</div>
        <div class="ach-desc">${a.desc}</div>
        <div class="ach-xp">+${a.xp} XP</div>
      </div>
    `;
  }).join('');

  setText('ach-unlocked-count', unlockedCount);
  setText('ach-xp-total', xpTotal.toLocaleString());
}

// ── OCEAN MAP ──────────────────────────────────────────────
function renderMapMarkers() {
  const markerGroup = document.getElementById('map-markers');
  if (!markerGroup) return;

  // Scale coords to SVG viewBox (900x600)
  const zones = [
    { ...OCEAN_DATA.zones[0], svgX: 145, svgY: 310 }, // Arabian Sea A
    { ...OCEAN_DATA.zones[1], svgX: 100, svgY: 240 }, // Arabian Sea B
    { ...OCEAN_DATA.zones[2], svgX: 640, svgY: 270 }, // Bay of Bengal A
    { ...OCEAN_DATA.zones[3], svgX: 700, svgY: 340 }, // Bay of Bengal B
    { ...OCEAN_DATA.zones[4], svgX: 265, svgY: 400 }, // Kerala Coast
    { ...OCEAN_DATA.zones[5], svgX: 780, svgY: 200 }, // Andaman
  ];

  const colors = { SAFE: '#00e676', CAUTION: '#ffaa00', WARNING: '#ff7b00', DANGER: '#ff3366' };

  markerGroup.innerHTML = zones.map((z, i) => {
    const color = colors[z.safety] || '#00e676';
    const hasFish = z.fishPotential === 'HIGH';
    return `
      <g class="map-marker" onclick="selectZone(${i})" aria-label="${z.name}: ${z.safety}" role="button" tabindex="0">
        <circle cx="${z.svgX}" cy="${z.svgY}" r="14" fill="${color}20" stroke="${color}" stroke-width="1.5" class="marker-pulse" style="animation-delay:${i*0.3}s"/>
        <circle cx="${z.svgX}" cy="${z.svgY}" r="7" fill="${color}" filter="url(#glow)"/>
        ${hasFish ? `<text x="${z.svgX+14}" y="${z.svgY-10}" font-size="14" aria-hidden="true">🐟</text>` : ''}
        ${z.alerts.includes('TSUNAMI_ALERT') ? `<text x="${z.svgX-8}" y="${z.svgY-18}" font-size="14" aria-hidden="true">🚨</text>` : ''}
        ${z.alerts.includes('STORM_WARNING') ? `<text x="${z.svgX+6}" y="${z.svgY-16}" font-size="12" aria-hidden="true">⚠</text>` : ''}
        <text x="${z.svgX}" y="${z.svgY+24}" font-size="9" fill="rgba(255,255,255,0.7)" text-anchor="middle">${z.name.split('—')[0].trim()}</text>
      </g>
    `;
  }).join('');

  // Keyboard support
  markerGroup.querySelectorAll('[role="button"]').forEach((el, i) => {
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectZone(i); }
    });
  });
}

function selectZone(idx) {
  const zone = OCEAN_DATA.zones[idx];
  if (!zone) return;

  document.getElementById('map-zone-default').style.display = 'none';
  const card = document.getElementById('map-zone-card');
  card.classList.add('show');
  setText('mz-name', zone.name);

  const safetyEl = document.getElementById('mz-safety');
  const cls = { SAFE:'safe', CAUTION:'caution', WARNING:'warning', DANGER:'danger' }[zone.safety] || 'safe';
  if (safetyEl) safetyEl.innerHTML = `<span class="status-badge status-${cls}">${zone.safety}</span>`;

  const condEl = document.getElementById('mz-conditions');
  if (condEl) condEl.innerHTML = `
    <div class="ocean-data-item"><span class="od-label">🌊 Wave Height</span><span class="od-value">${zone.waveHeight} m</span></div>
    <div class="ocean-data-item"><span class="od-label">💨 Wind Speed</span><span class="od-value">${zone.windSpeed} km/h</span></div>
    <div class="ocean-data-item"><span class="od-label">🌡 Sea Temp</span><span class="od-value">${zone.sst}°C</span></div>
    <div class="ocean-data-item"><span class="od-label">🐟 Fish Zone</span><span class="od-value">${zone.fishPotential}</span></div>
    <div class="ocean-data-item"><span class="od-label">☁ Weather</span><span class="od-value">${zone.weather}</span></div>
    <div class="ocean-data-item"><span class="od-label">🌀 Current</span><span class="od-value">${zone.current}</span></div>
    <div class="ocean-data-item"><span class="od-label">👁 Visibility</span><span class="od-value">${zone.visibility}</span></div>
  `;

  const alertEl = document.getElementById('mz-alerts');
  if (alertEl) {
    alertEl.innerHTML = zone.alerts.length
      ? zone.alerts.map(a => `<div class="status-badge status-danger" style="margin-bottom:0.4rem;display:flex;">${a.replace(/_/g,' ')}</div>`).join('')
      : '<div class="status-badge status-safe">No Active Alerts</div>';
  }
}

function useZoneInGame() {
  showToast('info', 'Zone Selected!', 'This zone will be used in your next mission.');
  showPage('game');
}

// ── ADVISORY DASHBOARD ──────────────────────────────────────
function renderAdvisoryDashboard() {
  const grid = document.getElementById('advisory-grid');
  if (!grid) return;

  const conditions = [
    { label: 'WAVE HEIGHT', value: '2.8', unit: 'm', pct: 56, level: 'mid' },
    { label: 'WIND SPEED', value: '38', unit: 'km/h', pct: 52, level: 'mid' },
    { label: 'SEA SURFACE TEMP', value: '28.5', unit: '°C', pct: 57, level: 'mid' },
    { label: 'OCEAN CURRENT', value: '1.5', unit: 'knots', pct: 30, level: 'low' },
    { label: 'VISIBILITY', value: '6', unit: 'km', pct: 43, level: 'mid' },
    { label: 'FISH POTENTIAL', value: 'HIGH', unit: '', pct: 85, level: 'low' },
    { label: 'WAVE PERIOD', value: '8', unit: 'seconds', pct: 40, level: 'low' },
    { label: 'SWELL HEIGHT', value: '1.8', unit: 'm', pct: 36, level: 'low' },
  ];

  grid.innerHTML = conditions.map(c => `
    <div class="advisory-card">
      <div class="advisory-card-title">${c.label}</div>
      <div class="advisory-value">${c.value}</div>
      <div class="advisory-unit">${c.unit}</div>
      <div class="advisory-bar">
        <div class="advisory-bar-fill ${c.level}" style="width:${c.pct}%"></div>
      </div>
    </div>
  `).join('');

  const alertGrid = document.getElementById('alert-grid');
  if (alertGrid) {
    alertGrid.innerHTML = `
      <div class="alert-card caution"><div class="alert-icon">🌊</div><h4>HIGH WAVE</h4><p>Arabian Sea Zone B — 2.8m waves</p></div>
      <div class="alert-card danger"><div class="alert-icon">⛈</div><h4>STORM WARNING</h4><p>Bay of Bengal Zone A — Active storm</p></div>
      <div class="alert-card danger"><div class="alert-icon">🚨</div><h4>TSUNAMI ALERT</h4><p>Andaman Deep Water — Active</p></div>
      <div class="alert-card safe"><div class="alert-icon">✅</div><h4>SAFE</h4><p>Arabian Sea Zone A — Clear conditions</p></div>
      <div class="alert-card safe"><div class="alert-icon">🐟</div><h4>FISH ALERT</h4><p>Kerala Coast — High fish potential</p></div>
      <div class="alert-card caution"><div class="alert-icon">💨</div><h4>WIND WARNING</h4><p>Open Sea — Winds above 35 km/h</p></div>
    `;
  }

  const zoneTable = document.getElementById('zone-summary-table');
  if (zoneTable) {
    zoneTable.innerHTML = OCEAN_DATA.zones.map(z => {
      const cls = { SAFE:'success', CAUTION:'warning', WARNING:'orange', DANGER:'danger' }[z.safety] || 'success';
      return `
        <tr class="lb-row">
          <td style="font-weight:600;">${z.name}</td>
          <td class="mono text-${cls}">${z.waveHeight} m</td>
          <td class="mono text-${cls}">${z.windSpeed} km/h</td>
          <td class="text-cyan">${z.fishPotential}</td>
          <td><span class="status-badge status-${z.safety.toLowerCase()}">${z.safety}</span></td>
          <td style="font-size:0.8rem;">${z.alerts.join(', ') || 'None'}</td>
        </tr>
      `;
    }).join('');
  }
}

// ── EMERGENCY SIMULATOR ────────────────────────────────────
function loadEmergency(type) {
  document.querySelectorAll('.emg-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById('emg-' + type);
  if (activeBtn) activeBtn.classList.add('active');

  const scenario = emergencyScenarios[type];
  if (!scenario) return;

  document.getElementById('emg-placeholder').style.display = 'none';
  const container = document.getElementById('emg-scenarios');
  let timerVal = scenario.timer;
  let answered = false;

  container.innerHTML = `
    <div class="emg-scenario show" id="emg-active">
      <div class="emg-alert-box">
        <div class="emg-alert-icon" aria-hidden="true">${scenario.icon}</div>
        <div class="emg-alert-title">${scenario.title}</div>
        <div class="emg-alert-desc">${scenario.desc}</div>
      </div>
      <div class="emg-timer" id="emg-countdown" aria-live="polite" aria-label="Time remaining">${timerVal}s</div>
      <div class="emg-actions" id="emg-action-btns" role="group" aria-label="Emergency response options">
        ${scenario.actions.map((action, i) => `
          <button class="emg-action-btn" id="emg-act-${i}" onclick="selectEmergencyAction(${i}, ${scenario.correct}, ${JSON.stringify(scenario.explanations).replace(/"/g,'&quot;')}, '${type}')" aria-label="${action}">
            ${action}
          </button>
        `).join('')}
      </div>
      <div id="emg-result" style="display:none;margin-top:1.5rem;"></div>
    </div>
  `;

  // Start timer
  const timerEl = document.getElementById('emg-countdown');
  const emgTimer = setInterval(() => {
    timerVal--;
    if (timerEl) {
      timerEl.textContent = timerVal + 's';
      timerEl.style.color = timerVal < 10 ? 'var(--danger)' : 'var(--warning)';
    }
    if (timerVal <= 0 || answered) {
      clearInterval(emgTimer);
      if (!answered) {
        answered = true;
        showToast('warning', 'Too Slow! ⏱', 'Time ran out! In a real emergency, every second counts.');
      }
    }
  }, 1000);
}

function selectEmergencyAction(chosen, correct, explanations, type) {
  document.querySelectorAll('.emg-action-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === correct) btn.classList.add('correct');
    else if (i === chosen && chosen !== correct) btn.classList.add('wrong');
  });

  const resultEl = document.getElementById('emg-result');
  if (resultEl) {
    resultEl.style.display = 'block';
    const isCorrect = chosen === correct;
    resultEl.innerHTML = `
      <div class="result-panel show ${isCorrect ? 'correct' : 'wrong'}">
        <div class="result-heading">${isCorrect ? '✅ CORRECT RESPONSE!' : '❌ WRONG RESPONSE!'}</div>
        <div class="result-feedback">${explanations[chosen]}</div>
        <div style="margin-top:1rem;display:flex;gap:1rem;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" onclick="loadEmergency('${type}')">TRY AGAIN</button>
          <button class="btn btn-glass btn-sm" onclick="showPage('learn')">LEARN MORE</button>
        </div>
      </div>
    `;
    if (isCorrect) {
      PLAYER_STATE.xp += 50;
      showToast('success', 'Correct Emergency Response! 🚨', '+50 XP. You could save lives!');
      launchConfetti();
    } else {
      showToast('error', 'Wrong Response! 🚨', 'Read the explanation carefully. This knowledge saves lives.');
    }
  }
}

// ── DAILY CHALLENGE ────────────────────────────────────────
function renderDailyOptions() {
  const container = document.getElementById('daily-options');
  if (!container) return;
  const options = [
    { id: 'A', text: 'Return to port immediately', correct: true },
    { id: 'B', text: 'Continue fishing — it\'s profitable today', correct: false },
    { id: 'C', text: 'Move further offshore to find calmer water', correct: false },
    { id: 'D', text: 'Anchor in place and wait for conditions to improve', correct: false },
  ];
  container.innerHTML = options.map(opt => `
    <button class="option-btn" id="dopt-${opt.id}" onclick="selectDailyOption('${opt.id}', ${opt.correct})" aria-label="Option ${opt.id}: ${opt.text}">
      <span class="option-letter">${opt.id}</span>
      <span>${opt.text}</span>
    </button>
  `).join('');
}

function selectDailyOption(optId, isCorrect) {
  if (PLAYER_STATE.dailyChallengeCompleted) return;
  PLAYER_STATE.dailyChallengeCompleted = true;

  document.querySelectorAll('#daily-options .option-btn').forEach(btn => {
    btn.disabled = true;
    if (btn.id === 'dopt-A') btn.classList.add('correct');
    else if (btn.id === 'dopt-' + optId && !isCorrect) btn.classList.add('wrong');
  });

  const resultEl = document.getElementById('daily-result');
  if (resultEl) {
    resultEl.className = 'result-panel show ' + (isCorrect ? 'correct' : 'wrong');
    resultEl.innerHTML = `
      <div class="result-heading">${isCorrect ? '✅ CORRECT! Daily Challenge Complete!' : '❌ Wrong — But you learned something!'}</div>
      <div class="result-feedback">${isCorrect ? 'Returning to port is always the correct action under a HIGH WAVE WARNING. Conditions are dangerous and will worsen.' : 'Under a HIGH WAVE WARNING with rising waves, the only safe option is to return to port immediately.'}</div>
      ${isCorrect ? '<div style="display:flex;gap:1rem;margin-top:1rem;flex-wrap:wrap;"><span class="points-pop positive">+250 XP</span><span class="points-pop positive">+100 pts</span><span class="points-pop positive">🔥 Streak +1</span></div>' : ''}
    `;
    if (isCorrect) {
      PLAYER_STATE.xp += 250;
      PLAYER_STATE.points += 100;
      PLAYER_STATE.streak++;
      launchConfetti();
      showToast('success', 'Daily Challenge Complete! 🌊', '+250 XP, +100 points, Streak extended!');
      updateDashboard();
    }
  }
}

// ── PROFILE ────────────────────────────────────────────────
function renderProfileHistory() {
  const container = document.getElementById('mission-history-list');
  if (!container) return;
  const history = [
    { mission: 'Find the Fish', result: 'correct', answer: 'Arabian Sea Zone A', pts: 150 },
    { mission: 'Rising Waves', result: 'correct', answer: 'Return to port', pts: 150 },
    { mission: 'Storm Approaching', result: 'correct', answer: 'Delay voyage 48h', pts: 150 },
    { mission: 'Tsunami Alert', result: 'correct', answer: 'Move to deep water', pts: 150 },
    { mission: 'Safe Tourism', result: 'wrong', answer: 'Conduct tour as planned', pts: -100 },
    { mission: 'Protect Marine Life', result: 'correct', answer: 'Leave MPA immediately', pts: 150 },
  ];
  container.innerHTML = history.map(h => `
    <div class="history-item">
      <span class="history-mission">${h.mission}</span>
      <span style="font-size:0.8rem;color:var(--text-muted);">${h.answer}</span>
      <span class="history-result ${h.result}">${h.result === 'correct' ? '✅' : '❌'}</span>
      <span class="history-pts" style="color:${h.pts > 0 ? 'var(--success)' : 'var(--danger)'};">${h.pts > 0 ? '+' : ''}${h.pts}</span>
    </div>
  `).join('');

  // Profile stats
  setText('prof-name', PLAYER_STATE.name);
  setText('prof-username', '@' + PLAYER_STATE.username);
  setText('prof-points', PLAYER_STATE.points.toLocaleString());
  setText('prof-xp', PLAYER_STATE.xp.toLocaleString());
  setText('prof-missions', PLAYER_STATE.missionsCompleted);
  setText('prof-streak', '🔥 ' + PLAYER_STATE.streak);
  setText('prof-iq', PLAYER_STATE.oceanIQ + '%');
  setText('prof-rank', '#' + PLAYER_STATE.globalRank);
  const role = roleData.find(r => r.id === PLAYER_STATE.role);
  setText('prof-role-tag', role ? role.emoji + ' ' + PLAYER_STATE.role : '🌊 No Role');
  setText('prof-level-tag', '⭐ Level ' + PLAYER_STATE.level);
  setText('prof-iq-tag', '🧠 Ocean IQ: ' + PLAYER_STATE.oceanIQ + '%');
  setText('prof-rank-tag', '🏆 Rank #' + PLAYER_STATE.globalRank);
}

// ── COUNTDOWN TIMER ────────────────────────────────────────
function initCountdown() {
  const update = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setText('cd-hours', h.toString().padStart(2,'0'));
    setText('cd-mins', m.toString().padStart(2,'0'));
    setText('cd-secs', s.toString().padStart(2,'0'));
  };
  update();
  state.countdownTimer = setInterval(update, 1000);
}

// ── LEVEL UP ───────────────────────────────────────────────
function showLevelUp(level) {
  const overlay = document.getElementById('levelup-overlay');
  if (!overlay) return;
  const levelName = OCEAN_DATA.levelNames[level] || 'Ocean Master';
  setText('levelup-num', level);
  setText('levelup-name', levelName);
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
  launchConfetti();
  showToast('success', 'LEVEL UP! 🌊', `You reached Level ${level} — ${levelName}!`);
}
function closeLevelUp() {
  document.getElementById('levelup-overlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ── CONFETTI ───────────────────────────────────────────────
function launchConfetti() {
  const colors = ['#00d4ff', '#00e5cc', '#ffd700', '#ff7b00', '#00e676', '#ffffff'];
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + 'vw';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
      piece.style.width = piece.style.height = (Math.random() * 8 + 6) + 'px';
      piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
      piece.style.animationDelay = (Math.random() * 0.5) + 's';
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 4000);
    }, i * 30);
  }
}

// ── TOAST NOTIFICATIONS ────────────────────────────────────
function showToast(type, title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const icons = { success: '✅', error: '❌', warning: '⚠', info: 'ℹ' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ'}</span>
    <div>
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ── UTILITY ────────────────────────────────────────────────
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
