/*
 * Dashbase — Tabs behavior
 *
 * Keeps aria-selected, tabindex, hidden panels, and keyboard navigation in
 * sync for the tab-list / tab-panel pattern. The markup stays declarative and
 * uses ARIA roles directly.
 */

let tabListCount = 0;

function getTabs(tabList) {
  return [...tabList.querySelectorAll('[role="tab"]')].filter(
    (tab) => tab instanceof HTMLElement,
  );
}

function getEnabledTabs(tabList) {
  return getTabs(tabList).filter(
    (tab) => !tab.hasAttribute("disabled") && tab.getAttribute("aria-disabled") !== "true",
  );
}

function resolvePanel(tabList, tab) {
  const panelId = tab.getAttribute("aria-controls");
  if (!panelId) {
    return null;
  }

  const root = tabList.getRootNode?.();
  if (root && "getElementById" in root && typeof root.getElementById === "function") {
    const panel = root.getElementById(panelId);
    return panel instanceof HTMLElement ? panel : null;
  }

  const panel = document.getElementById(panelId);
  return panel instanceof HTMLElement ? panel : null;
}

function ensureTabMetadata(tabList) {
  const tabs = getTabs(tabList);
  if (tabs.length === 0) {
    return tabs;
  }

  if (!tabList.id) {
    tabListCount += 1;
    tabList.id = `tab-list-${tabListCount}`;
  }

  tabs.forEach((tab, index) => {
    if (tab instanceof HTMLButtonElement && !tab.hasAttribute("type")) {
      tab.type = "button";
    }

    if (!tab.id) {
      tab.id = `${tabList.id}-tab-${index + 1}`;
    }

    const panel = resolvePanel(tabList, tab);
    if (panel && !panel.hasAttribute("aria-labelledby")) {
      panel.setAttribute("aria-labelledby", tab.id);
    }
  });

  return tabs;
}

function activateTab(tabList, nextTab, { focus = true } = {}) {
  const tabs = ensureTabMetadata(tabList);
  if (!tabs.includes(nextTab)) {
    return;
  }

  tabs.forEach((tab) => {
    const isSelected = tab === nextTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;

    const panel = resolvePanel(tabList, tab);
    if (panel) {
      panel.hidden = !isSelected;
    }
  });

  if (focus) {
    nextTab.focus();
  }
}

function initializeTabList(tabList) {
  const tabs = ensureTabMetadata(tabList);
  const selectedTab =
    tabs.find(
      (tab) =>
        tab.getAttribute("aria-selected") === "true" &&
        !tab.hasAttribute("disabled") &&
        tab.getAttribute("aria-disabled") !== "true",
    ) ?? getEnabledTabs(tabList)[0];

  if (selectedTab) {
    activateTab(tabList, selectedTab, { focus: false });
  }
}

function moveFocus(tabList, currentTab, key) {
  const tabs = getEnabledTabs(tabList);
  const currentIndex = tabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return;
  }

  const isVertical = tabList.getAttribute("aria-orientation") === "vertical";
  let nextIndex = null;

  if (key === "Home") {
    nextIndex = 0;
  } else if (key === "End") {
    nextIndex = tabs.length - 1;
  } else if (!isVertical && key === "ArrowRight") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (!isVertical && key === "ArrowLeft") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (isVertical && key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (isVertical && key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  }

  if (nextIndex == null) {
    return;
  }

  activateTab(tabList, tabs[nextIndex]);
}

for (const tabList of document.querySelectorAll('tab-list[role="tablist"]')) {
  if (tabList instanceof HTMLElement) {
    initializeTabList(tabList);
  }
}

document.addEventListener("click", (event) => {
  const tab = event.target instanceof Element
    ? event.target.closest('tab-list [role="tab"]')
    : null;

  if (!(tab instanceof HTMLElement)) {
    return;
  }

  const tabList = tab.closest('tab-list[role="tablist"]');
  if (!(tabList instanceof HTMLElement)) {
    return;
  }

  if (tab.hasAttribute("disabled") || tab.getAttribute("aria-disabled") === "true") {
    return;
  }

  activateTab(tabList, tab);
});

document.addEventListener("keydown", (event) => {
  const tab = event.target instanceof HTMLElement && event.target.getAttribute("role") === "tab"
    ? event.target
    : null;

  if (!(tab instanceof HTMLElement)) {
    return;
  }

  const tabList = tab.closest('tab-list[role="tablist"]');
  if (!(tabList instanceof HTMLElement)) {
    return;
  }

  if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
    return;
  }

  event.preventDefault();
  moveFocus(tabList, tab, event.key);
});
