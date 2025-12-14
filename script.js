const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
const body = document.body;
const themeToggle = document.querySelector('.theme-toggle');
const languageToggle = document.querySelector('.language-toggle');
const yearEl = document.getElementById('year');

// ---------- i18n ----------

const translations = [];
let currentLang = 'en';

function translateKey(key, lang) {
  return key.split('.').reduce((obj, part) => obj?.[part], translations[lang]) || key;
}

function formatString(str, vars = {}) {
  return Object.entries(vars).reduce((s, [k, v]) => s.replace(new RegExp(`{${k}}`, 'g'), v), str);
}

function t(key, vars = {}) {
  const raw = translateKey(key, currentLang);
  return formatString(raw, vars);
}

function getLastUpdatedDate(lang) {
  const source = window.BUILD_META?.lastUpdated || document.lastModified;
  const dt = new Date(source);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toLocaleDateString(lang, { year: 'numeric', month: 'long', day: 'numeric' });
}

let typeTimer;
let dotTimer;

function typeWithDots(el, text, speed = 100, dotSpeed = 500) {
  if (!el) return;
  if (typeTimer) clearTimeout(typeTimer);
  if (dotTimer) clearInterval(dotTimer);

  el.textContent = '';
  let i = 0;

  const startDots = () => {
    let dots = 0;
    dotTimer = setInterval(() => {
      dots = (dots % 3) + 1;
      el.textContent = text + '.'.repeat(dots);
    }, dotSpeed);
  };

  const step = () => {
    el.textContent = text.slice(0, i);
    i += 1;
    if (i <= text.length) {
      typeTimer = setTimeout(step, speed);
    } else {
      startDots();
    }
  };

  step();
}

async function loadTranslations() {
  const [en, lt] = await Promise.all([
    fetch('translations/en.json').then(res => res.json()),
    fetch('translations/lt.json').then(res => res.json()),
  ]);
  translations.en = en;
  translations.lt = lt;
}

function applyTranslations(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.documentElement.lang = lang;
  updateLanguageToggle(lang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const value = translateKey(key, lang);

    if (el.placeholder !== undefined && el.tagName === 'INPUT') {
      el.placeholder = value;
      return;
    }

    if (key === 'hero.greeting') {
      typeWithDots(el, value);
      return;
    }

    if (key === 'footer.lastUpdated') {
      const formattedDate = getLastUpdatedDate(lang);
      el.textContent = t(key, { date: formattedDate || '' });
      return;
    }

    el.textContent = value;
  });
}

function initI18n() {
  const saved = localStorage.getItem('lang');
  const browserLang = navigator.language?.toLowerCase().startsWith('lt') ? 'lt' : 'en';
  const lang = saved === 'lt' || saved === 'en' ? saved : browserLang;
  applyTranslations(lang);
}

function toggleLanguage() {
  const next = currentLang === 'en' ? 'lt' : 'en';
  applyTranslations(next);
}

function updateLanguageToggle(lang) {
  if (!languageToggle) return;
  const isEn = lang === 'en';
  languageToggle.setAttribute('data-lang', lang);
  languageToggle.querySelector('.en')?.classList.toggle('active', isEn);
  languageToggle.querySelector('.lt')?.classList.toggle('active', !isEn);
}

if (languageToggle) {
  languageToggle.addEventListener('click', toggleLanguage);
  languageToggle.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleLanguage();
    }
  });
}

loadTranslations().then(initI18n);

// ---------- Theme + year ----------

function setTheme(isDark) {
  body.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  setTheme(savedTheme === 'dark');
} else {
  setTheme(prefersDark.matches);
}

prefersDark.addEventListener('change', (event) => {
  if (!localStorage.getItem('theme')) {
    setTheme(event.matches);
  }
});

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const isDark = body.dataset.theme === 'dark';
    setTheme(!isDark);
  });
}

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// ---------- Projects slider (Splide) ----------

document.addEventListener('DOMContentLoaded', () => {
  const splide = new Splide('.splide', {
    type: 'loop',
    padding: '10rem',
    focus: 'center',
    perPage: 2,
    perMove: 1,
    autoWidth: false,
    gap: '10rem',
    speed: 320,
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
    flickMaxPages: 1,
    updateOnMove: true,
    breakpoints: {
      1024: { perPage: 2, padding: '3rem' },
      768: { perPage: 1, padding: '2rem' },
      540: { perPage: 1, padding: '1.5rem' },
    },
  });

  splide.mount();
});

// ---------- Modal slider + modal handling ----------

function initModalSplide(modal) {
  if (!modal) return;
  const slider = modal.querySelector('.modal-splide');
  if (!slider || slider.dataset.mounted === 'true') return;
  const instance = new Splide(slider, {
    type: 'loop',
    perPage: 1,
    autoplay: true,
    interval: 5000,
    pauseOnHover: true,
    arrows: false,
    pagination: false,
    speed: 750,
    easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
  });
  instance.mount();
  slider.dataset.mounted = 'true';
}

document.addEventListener('DOMContentLoaded', () => {
  const modalTriggers = document.querySelectorAll('[data-modal-target]');
  const modals = document.querySelectorAll('.modal');
  const closeButtons = document.querySelectorAll('.modal-close');
  const overlays = document.querySelectorAll('.modal-overlay');

  const openModal = (selector) => {
    const target = selector ? document.querySelector(selector) : null;
    if (target) {
      target.classList.add('active');
      initModalSplide(target);
    }
  };

  const closeModal = (modal) => {
    if (modal) modal.classList.remove('active');
  };

  modalTriggers.forEach((trigger) => {
    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      openModal(trigger.dataset.modalTarget);
    });
  });

  closeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const modal = btn.closest('.modal');
      closeModal(modal);
    });
  });

  overlays.forEach((overlay) => {
    overlay.addEventListener('click', () => {
      const modal = overlay.closest('.modal');
      closeModal(modal);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modals.forEach((modal) => modal.classList.remove('active'));
    }
  });
});

// ---------- Easter egg (logo confetti) ----------

(function () {
  const nameEl = document.getElementById('logo');
  if (!nameEl) return;
  let clicks = 0;
  let timer = null;

  nameEl.addEventListener('click', () => {
    clicks += 1;
    if (!timer) timer = setTimeout(reset, 3000);
    if (clicks === 5) {
      triggerEasterEgg();
      reset();
    }
  });

  function reset() {
    clicks = 0;
    clearTimeout(timer);
    timer = null;
  }

  function triggerEasterEgg() {
    confetti();
  }
})();

// ---------- Scroll progress bar ----------

(function () {
  const bar = document.getElementById('scroll-progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / docHeight) * 100;
    bar.style.width = `${progress}%`;
  });
})();