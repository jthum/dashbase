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
/*
 * Dashbase — Tabs behavior shim
 *
 * Manages selected state, roving focus, and panel visibility for <tab-list>
 * and <tab-panel>.
 */

const TABS_SELECTOR = "tab-list";
let tabCount = 0;

function nextTabId() {
  tabCount += 1;
  return `db-tab-${tabCount}`;
}

function getTabLists(root = document) {
  const tabLists = [];

  if (root instanceof Element && root.matches(TABS_SELECTOR)) {
    tabLists.push(root);
  }

  if ("querySelectorAll" in root && typeof root.querySelectorAll === "function") {
    tabLists.push(...root.querySelectorAll(TABS_SELECTOR));
  }

  return tabLists;
}

function getTabs(tabList) {
  return [...tabList.querySelectorAll('[role="tab"]')];
}

function getPanel(tab) {
  const panelId = tab.getAttribute("aria-controls");
  if (!panelId) {
    return null;
  }

  return document.getElementById(panelId);
}

function syncTabIdentity(tab, panel) {
  if (!tab.id) {
    tab.id = nextTabId();
  }

  if (panel && !panel.getAttribute("aria-labelledby")) {
    panel.setAttribute("aria-labelledby", tab.id);
  }

  if (panel && !panel.getAttribute("role")) {
    panel.setAttribute("role", "tabpanel");
  }
}

function activateTab(tabList, nextTab, { focus = false } = {}) {
  const tabs = getTabs(tabList);

  for (const tab of tabs) {
    const selected = tab === nextTab;
    const panel = getPanel(tab);

    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;

    if (panel) {
      panel.hidden = !selected;
    }
  }

  if (focus) {
    nextTab.focus();
  }
}

function getInitialTab(tabList) {
  const tabs = getTabs(tabList);
  return tabs.find((tab) => tab.getAttribute("aria-selected") === "true") ?? tabs[0] ?? null;
}

function focusAdjacentTab(tabList, currentTab, direction) {
  const tabs = getTabs(tabList);
  const currentIndex = tabs.indexOf(currentTab);
  if (currentIndex === -1) {
    return;
  }

  const nextIndex = (currentIndex + direction + tabs.length) % tabs.length;
  activateTab(tabList, tabs[nextIndex], { focus: true });
}

function initTabList(tabList) {
  if (!(tabList instanceof HTMLElement) || tabList.dataset.tabsInitialized === "true") {
    return;
  }

  if (!tabList.getAttribute("role")) {
    tabList.setAttribute("role", "tablist");
  }

  const tabs = getTabs(tabList);
  for (const tab of tabs) {
    const panel = getPanel(tab);
    syncTabIdentity(tab, panel);
  }

  const initialTab = getInitialTab(tabList);
  if (initialTab) {
    activateTab(tabList, initialTab);
  }

  tabList.addEventListener("click", (event) => {
    const tab = event.target instanceof Element
      ? event.target.closest('[role="tab"]')
      : null;

    if (!(tab instanceof HTMLElement) || !tabList.contains(tab)) {
      return;
    }

    activateTab(tabList, tab, { focus: true });
  });

  tabList.addEventListener("keydown", (event) => {
    const currentTab = event.target instanceof Element
      ? event.target.closest('[role="tab"]')
      : null;

    if (!(currentTab instanceof HTMLElement) || !tabList.contains(currentTab)) {
      return;
    }

    const vertical = tabList.getAttribute("aria-orientation") === "vertical";

    switch (event.key) {
      case "ArrowRight":
        if (!vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, 1);
        }
        break;
      case "ArrowLeft":
        if (!vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, -1);
        }
        break;
      case "ArrowDown":
        if (vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, 1);
        }
        break;
      case "ArrowUp":
        if (vertical) {
          event.preventDefault();
          focusAdjacentTab(tabList, currentTab, -1);
        }
        break;
      case "Home": {
        const tabs = getTabs(tabList);
        if (tabs[0]) {
          event.preventDefault();
          activateTab(tabList, tabs[0], { focus: true });
        }
        break;
      }
      case "End": {
        const tabs = getTabs(tabList);
        const lastTab = tabs.at(-1);
        if (lastTab) {
          event.preventDefault();
          activateTab(tabList, lastTab, { focus: true });
        }
        break;
      }
      default:
        break;
    }
  });

  tabList.dataset.tabsInitialized = "true";
}

function initTabs(root = document) {
  getTabLists(root).forEach(initTabList);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => initTabs(), { once: true });
} else {
  initTabs();
}

window.Dashbase ??= {};
window.Dashbase.initTabs = initTabs;
