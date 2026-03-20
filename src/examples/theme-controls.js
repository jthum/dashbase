const STORAGE_KEYS = {
  theme: "dashbase-example-theme",
  mode: "dashbase-example-mode",
};

const THEMES = [
  { value: "default", label: "Default" },
  { value: "none", label: "Baseline only" },
  { value: "minimal", label: "Minimal" },
  { value: "soft", label: "Soft" },
  { value: "earthy", label: "Earthy" },
  { value: "high-contrast", label: "High Contrast" },
  { value: "cyber", label: "Cyber" },
  { value: "monokai", label: "Monokai" },
];

const ICONS = {
  moon: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a9 9 0 1 0 10.5 10.5Z"></path>
    </svg>
  `,
  sun: `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2.5v2.5M12 19v2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M2.5 12H5M19 12h2.5M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"></path>
    </svg>
  `,
};

function readStoredValue(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStoredValue(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in restrictive browsing modes.
  }
}

function buildOptions(options, selectedValue) {
  return options.map(({ value, label }) =>
    `<option value="${value}"${value === selectedValue ? " selected" : ""}>${label}</option>`,
  ).join("");
}

function applyTheme(themeLink, themeName) {
  if (themeName === "none") {
    themeLink.disabled = true;
    themeLink.dataset.activeTheme = "none";
    return;
  }

  themeLink.disabled = false;
  themeLink.href = `../../themes/${themeName}.css`;
  themeLink.dataset.activeTheme = themeName;
}

function getSystemMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getResolvedMode() {
  return document.documentElement.getAttribute("data-theme") ?? getSystemMode();
}

function applyMode(mode) {
  document.documentElement.setAttribute("data-theme", mode);
}

function syncModeToggle(button) {
  const isDark = getResolvedMode() === "dark";
  button.setAttribute("aria-pressed", String(isDark));
  button.innerHTML = isDark ? ICONS.sun : ICONS.moon;
  button.title = isDark ? "Switch to Light Mode" : "Switch to Dark Mode";
  button.setAttribute("aria-label", isDark ? "Switch to Light Mode" : "Switch to Dark Mode");
}

function syncResolvedMode(button) {
  const storedMode = readStoredValue(STORAGE_KEYS.mode, "");
  const resolvedMode = storedMode === "light" || storedMode === "dark"
    ? storedMode
    : getSystemMode();

  applyMode(resolvedMode);
  syncModeToggle(button);
}

function mountThemeControls() {
  const themeLink = document.getElementById("theme-stylesheet");
  if (!themeLink) return;

  const initialTheme = readStoredValue(STORAGE_KEYS.theme, "default");
  const storedMode = readStoredValue(STORAGE_KEYS.mode, "");

  const controls = document.createElement("form");
  controls.id = "theme-controls";
  controls.innerHTML = `
    <select id="theme-select" name="theme" aria-label="Choose theme" title="Choose theme">
      ${buildOptions(THEMES, initialTheme)}
    </select>
    <button id="mode-toggle" type="button" aria-pressed="false">Dark</button>
  `;

  document.body.prepend(controls);

  const themeSelect = controls.querySelector("#theme-select");
  const modeToggle = controls.querySelector("#mode-toggle");

  applyTheme(themeLink, initialTheme);
  if (storedMode !== "light" && storedMode !== "dark") {
    writeStoredValue(STORAGE_KEYS.mode, "");
  }
  syncResolvedMode(modeToggle);

  themeSelect.addEventListener("change", () => {
    applyTheme(themeLink, themeSelect.value);
    writeStoredValue(STORAGE_KEYS.theme, themeSelect.value);
  });

  modeToggle.addEventListener("click", () => {
    const nextMode = getResolvedMode() === "dark" ? "light" : "dark";
    applyMode(nextMode);
    writeStoredValue(STORAGE_KEYS.mode, nextMode);
    syncModeToggle(modeToggle);
  });

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", () => {
    if (!readStoredValue(STORAGE_KEYS.mode, "")) {
      syncResolvedMode(modeToggle);
    }
  });
}

mountThemeControls();
