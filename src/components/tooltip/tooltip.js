/*
 * Dashbase — Tooltip behavior shim
 *
 * Upgrades native `title` attributes into styled Dashbase tooltips and mirrors
 * the tooltip text into accessible names or descriptions.
 */

const DESCRIPTION_ATTR = "data-tooltip-description-id";
const TOOLTIP_SELECTOR = "[title], [data-tooltip]";
let tooltipCount = 0;

function nextTooltipId() {
  tooltipCount += 1;
  return `db-tooltip-${tooltipCount}`;
}

function getTooltipText(element) {
  const explicit = element.getAttribute("data-tooltip")?.trim();
  if (explicit) {
    return explicit;
  }

  const title = element.getAttribute("title")?.trim();
  if (title) {
    return title;
  }

  return "";
}

function hasAccessibleName(element) {
  if (element.getAttribute("aria-label")?.trim()) {
    return true;
  }

  if (element.getAttribute("aria-labelledby")?.trim()) {
    return true;
  }

  if ("labels" in element && element.labels?.length) {
    return true;
  }

  if (element instanceof HTMLImageElement) {
    return Boolean(element.getAttribute("alt")?.trim());
  }

  if (
    element instanceof HTMLInputElement
    && ["button", "submit", "reset"].includes(element.type)
  ) {
    return Boolean(element.value.trim());
  }

  return Boolean(element.textContent?.trim());
}

function appendTokenListAttribute(element, name, value) {
  const values = new Set(
    (element.getAttribute(name) ?? "")
      .split(/\s+/)
      .filter(Boolean),
  );

  values.add(value);
  element.setAttribute(name, [...values].join(" "));
}

function ensureTooltipDescription(element, text) {
  const existingId = element.getAttribute(DESCRIPTION_ATTR);
  const existingNode = existingId ? document.getElementById(existingId) : null;

  if (existingNode) {
    existingNode.textContent = text;
    appendTokenListAttribute(element, "aria-describedby", existingNode.id);
    return;
  }

  const description = document.createElement("span");
  description.id = nextTooltipId();
  description.setAttribute("data-tooltip-content", "");
  description.textContent = text;

  element.after(description);
  element.setAttribute(DESCRIPTION_ATTR, description.id);
  appendTokenListAttribute(element, "aria-describedby", description.id);
}

function upgradeTooltip(element) {
  if (!(element instanceof HTMLElement)) {
    return;
  }

  const text = getTooltipText(element);
  if (!text) {
    return;
  }

  element.setAttribute("data-tooltip", text);
  element.removeAttribute("title");

  if (!hasAccessibleName(element)) {
    element.setAttribute("aria-label", text);
    return;
  }

  ensureTooltipDescription(element, text);
}

function collectTargets(root) {
  const targets = [];

  if (root instanceof Element && root.matches(TOOLTIP_SELECTOR)) {
    targets.push(root);
  }

  if ("querySelectorAll" in root && typeof root.querySelectorAll === "function") {
    targets.push(...root.querySelectorAll(TOOLTIP_SELECTOR));
  }

  return targets;
}

function initTooltips(root = document) {
  collectTargets(root).forEach(upgradeTooltip);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initTooltips(), { once: true });
} else {
  initTooltips();
}

window.Dashbase ??= {};
window.Dashbase.initTooltips = initTooltips;
