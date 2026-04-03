/*
 * Dashbase — Chart behavior
 *
 * Enhances <chart-view> roots with:
 * - tooltip display for annotated chart points/bars
 * - legend toggles for series visibility
 */

const CHART_ROOT_SELECTOR = "chart-view";
const CHART_TOOLTIP_TARGET_SELECTOR = "[data-chart-value]";
const CHART_TOOLTIP_SELECTOR = "chart-tooltip";
const CHART_TOGGLE_SELECTOR = "[data-chart-toggle]";

function isChartRoot(value) {
  return value instanceof HTMLElement && value.matches(CHART_ROOT_SELECTOR);
}

function getChartTooltip(root) {
  const tooltip = root.querySelector(`:scope > ${CHART_TOOLTIP_SELECTOR}`);
  return tooltip instanceof HTMLElement ? tooltip : null;
}

function getHiddenSeries(root) {
  return new Set((root.getAttribute("data-hidden-series") ?? "").split(/\s+/).filter(Boolean));
}

function setHiddenSeries(root, values) {
  const hidden = [...values];
  if (hidden.length === 0) {
    root.removeAttribute("data-hidden-series");
    return;
  }

  root.setAttribute("data-hidden-series", hidden.join(" "));
}

function syncLegendButtons(root) {
  const hidden = getHiddenSeries(root);
  for (const button of root.querySelectorAll(CHART_TOGGLE_SELECTOR)) {
    if (!(button instanceof HTMLButtonElement)) {
      continue;
    }

    const series = button.getAttribute("data-chart-toggle") ?? "";
    button.setAttribute("aria-pressed", String(!hidden.has(series)));
  }
}

function positionTooltip(root, tooltip, target) {
  const rootRect = root.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let inlineStart = (targetRect.left - rootRect.left) + (targetRect.width / 2);
  let blockStart = targetRect.top - rootRect.top;

  const minInline = (tooltipRect.width / 2) + 12;
  const maxInline = rootRect.width - (tooltipRect.width / 2) - 12;
  inlineStart = Math.min(Math.max(inlineStart, minInline), Math.max(minInline, maxInline));
  blockStart = Math.max(blockStart, tooltipRect.height + 12);

  root.style.setProperty("--chart-tooltip-inline-start", `${inlineStart}px`);
  root.style.setProperty("--chart-tooltip-block-start", `${blockStart}px`);
}

function showTooltip(root, target) {
  const tooltip = getChartTooltip(root);
  if (!tooltip) {
    return;
  }

  const label = target.getAttribute("data-chart-label") ?? "";
  const series = target.getAttribute("data-chart-series") ?? "";
  const value = target.getAttribute("data-chart-value") ?? "";

  tooltip.innerHTML = `
    <small>${label}</small>
    <strong>${value}</strong>
    ${series ? `<span>${series}</span>` : ""}
  `;
  tooltip.hidden = false;
  positionTooltip(root, tooltip, target);
}

function hideTooltip(root) {
  const tooltip = getChartTooltip(root);
  if (!tooltip) {
    return;
  }

  tooltip.hidden = true;
}

function toggleSeries(root, series) {
  if (!series) {
    return;
  }

  const hidden = getHiddenSeries(root);
  if (hidden.has(series)) {
    hidden.delete(series);
  } else {
    hidden.add(series);
  }

  setHiddenSeries(root, hidden);
  syncLegendButtons(root);
}

function initializeChart(root) {
  if (root.dataset.chartInitialized === "true") {
    return;
  }

  root.dataset.chartInitialized = "true";
  syncLegendButtons(root);

  root.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest(CHART_TOGGLE_SELECTOR) : null;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    event.preventDefault();
    toggleSeries(root, button.getAttribute("data-chart-toggle") ?? "");
  });

  root.addEventListener("pointerover", (event) => {
    const target = event.target instanceof Element ? event.target.closest(CHART_TOOLTIP_TARGET_SELECTOR) : null;
    if (!(target instanceof SVGElement || target instanceof HTMLElement)) {
      return;
    }

    showTooltip(root, target);
  });

  root.addEventListener("pointermove", (event) => {
    const target = event.target instanceof Element ? event.target.closest(CHART_TOOLTIP_TARGET_SELECTOR) : null;
    const tooltip = getChartTooltip(root);
    if (!tooltip || !(target instanceof SVGElement || target instanceof HTMLElement) || tooltip.hidden) {
      return;
    }

    positionTooltip(root, tooltip, target);
  });

  root.addEventListener("pointerleave", () => {
    hideTooltip(root);
  });

  root.addEventListener("focusin", (event) => {
    const target = event.target instanceof Element ? event.target.closest(CHART_TOOLTIP_TARGET_SELECTOR) : null;
    if (!(target instanceof SVGElement || target instanceof HTMLElement)) {
      return;
    }

    showTooltip(root, target);
  });

  root.addEventListener("focusout", (event) => {
    const related = event.relatedTarget instanceof Element ? event.relatedTarget : null;
    if (related && root.contains(related)) {
      return;
    }

    hideTooltip(root);
  });
}

for (const root of document.querySelectorAll(CHART_ROOT_SELECTOR)) {
  if (isChartRoot(root)) {
    initializeChart(root);
  }
}
