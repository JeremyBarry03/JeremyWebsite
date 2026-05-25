const root = document.documentElement;
const themeToggle = document.getElementById("themeToggle");
const THEME_STORAGE_KEY = "jeremy-site-theme";
const ROUTE_REDIRECT_KEY = "jeremy-site-route-redirect";
const SECTION_PATHS = {
  about: "/about",
  skills: "/skills",
  work: "/work"
};
const PATH_SECTIONS = new Map(Object.entries(SECTION_PATHS).map(([section, path]) => [path, section]));

try {
  const redirectedPath = sessionStorage.getItem(ROUTE_REDIRECT_KEY);
  if (redirectedPath) {
    sessionStorage.removeItem(ROUTE_REDIRECT_KEY);
    window.history.replaceState(null, "", redirectedPath);
  }
} catch {
  // sessionStorage can be blocked in strict privacy modes.
}

function normalizedTheme(theme) {
  return theme === "light" ? "light" : "dark";
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage can be blocked in strict privacy modes.
  }
}

function applyTheme(theme, options = {}) {
  const nextTheme = normalizedTheme(theme);
  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;

  if (themeToggle) {
    const isLight = nextTheme === "light";
    themeToggle.setAttribute("aria-checked", String(isLight));
    themeToggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    themeToggle.title = isLight ? "Switch to dark mode" : "Switch to light mode";
  }

  if (options.persist) {
    storeTheme(nextTheme);
  }

  if (options.notify !== false) {
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme: nextTheme } }));
  }
}

applyTheme(root.dataset.theme, { notify: false });

themeToggle?.addEventListener("click", (event) => {
  applyTheme(root.dataset.theme === "light" ? "dark" : "light", { persist: true });
  if (event.detail > 0) {
    themeToggle.blur();
  }
});

window.particleConcept = new window.ParticleConcept(document.getElementById("particleCanvas"));
window.introParticles = new window.ParticleConcept(document.getElementById("introParticleCanvas"), {
  bindControls: false,
  interactive: false,
  setDataset: false
});

const introOverlay = document.getElementById("introOverlay");
const introPrompt = document.getElementById("introPrompt");
const introButton = document.getElementById("introButton");
const introType = document.getElementById("introType");
let introStarted = false;
let introComplete = false;

const wait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));

async function typeIntroText(text, speed = 8) {
  introType.textContent = "";
  for (let index = 0; index < text.length; index += 1) {
    introType.textContent = `${text.slice(0, index + 1)}|`;
    await wait(speed + Math.random() * 4);
  }
  introType.textContent = text;
}

async function eraseIntroText(speed = 5) {
  let current = introType.textContent;
  while (current.length > 0) {
    current = current.slice(0, -1);
    introType.textContent = current ? `${current}|` : "|";
    await wait(speed);
  }
  introType.textContent = "";
}

function finishIntro() {
  introComplete = true;
  introOverlay.classList.add("is-hidden");
  document.body.classList.remove("intro-active");
  introOverlay.setAttribute("aria-hidden", "true");
  window.setTimeout(() => {
    window.introParticles?.stop();
    introOverlay.hidden = true;
  }, 840);
}

async function startIntro() {
  if (introStarted || introComplete) return;
  introStarted = true;
  introPrompt.classList.add("is-hidden");
  introButton.disabled = true;
  introType.classList.add("is-typing");

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    introType.textContent = "Welcome to my Website:)";
    await wait(180);
    finishIntro();
    return;
  }

  await typeIntroText("Hello, I'm Jeremy...");
  await wait(1080);
  await eraseIntroText();
  await wait(80);
  await typeIntroText("Welcome to my Website:)");
  await wait(780);
  finishIntro();
}

introButton.addEventListener("click", startIntro);

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || introComplete) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest("input, textarea, select")) return;
  event.preventDefault();
  startIntro();
});

introButton.focus({ preventScroll: true });

const observer = new IntersectionObserver((entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    }
  }
}, { threshold: 0.16 });

document.querySelectorAll(".reveal").forEach((node) => {
  observer.observe(node);
});

document.querySelectorAll(".project-card[data-project-href]").forEach((card) => {
  card.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target?.closest("a, button, input, textarea, select, video, audio, iframe")) return;

    const href = card.dataset.projectHref;
    if (!href) return;

    window.location.href = href;
  });
});

if ("scrollRestoration" in window.history) {
  window.history.scrollRestoration = "manual";
}

function sectionFromLocation() {
  const hashSection = window.location.hash ? window.location.hash.slice(1) : "";
  if (SECTION_PATHS[hashSection]) return hashSection;

  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";
  return PATH_SECTIONS.get(normalizedPath) || null;
}

function sectionPath(sectionId) {
  return SECTION_PATHS[sectionId] || "/";
}

function scrollToSection(sectionId, behavior = "smooth") {
  const target = document.getElementById(sectionId);
  if (!target) return;
  target.scrollIntoView({ behavior, block: "start" });
}

function navigateToSection(sectionId, options = {}) {
  const path = sectionPath(sectionId);
  if (window.location.pathname !== path || window.location.hash) {
    window.history.pushState({ sectionId }, "", path);
  }
  scrollToSection(sectionId, options.behavior);
}

document.querySelectorAll("[data-section-link]").forEach((link) => {
  link.addEventListener("click", (event) => {
    const sectionId = link.dataset.sectionLink;
    if (!sectionId) return;
    event.preventDefault();
    navigateToSection(sectionId);
  });
});

window.addEventListener("popstate", () => {
  const sectionId = sectionFromLocation();
  if (sectionId) {
    scrollToSection(sectionId);
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

window.requestAnimationFrame(() => {
  const sectionId = sectionFromLocation();
  if (sectionId) {
    if (window.location.hash) {
      window.history.replaceState({ sectionId }, "", sectionPath(sectionId));
    }
    scrollToSection(sectionId, "auto");
    return;
  }

  window.scrollTo({ top: 0, behavior: "auto" });
});
