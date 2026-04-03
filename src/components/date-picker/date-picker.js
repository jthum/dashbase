/*
 * Dashbase — Date Picker behavior
 *
 * Enhances <date-picker> roots with:
 * - anchored popover positioning
 * - input/display value sync from nested <calendar-view>
 * - open / close coordination between input, trigger, and panel
 * - optional clear and done actions
 */

const DATE_PICKER_ROOT_SELECTOR = "date-picker";
const DATE_PICKER_INPUT_SELECTOR = 'input[type="text"]';
const DATE_PICKER_TRIGGER_SELECTOR = 'button[type="button"]';
const DATE_PICKER_PANEL_SELECTOR = "popover-panel[popover]";
const DATE_PICKER_CALENDAR_SELECTOR = "calendar-view";
const DATE_PICKER_CLEAR_SELECTOR = "[data-date-picker-clear]";
const DATE_PICKER_CLOSE_SELECTOR = "[data-date-picker-close]";
const DATE_PICKER_MARGIN = 16;
let datePickerCount = 0;

const singleDateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

const singleDateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

function isDatePickerRoot(value) {
  return value instanceof HTMLElement && value.matches(DATE_PICKER_ROOT_SELECTOR);
}

function getDatePickerInput(root) {
  const input = root.querySelector(`:scope > ${DATE_PICKER_INPUT_SELECTOR}`);
  return input instanceof HTMLInputElement ? input : null;
}

function getDatePickerTrigger(root) {
  const trigger = root.querySelector(`:scope > ${DATE_PICKER_TRIGGER_SELECTOR}`);
  return trigger instanceof HTMLButtonElement ? trigger : null;
}

function getDatePickerPanel(root) {
  const panel = root.querySelector(`:scope > ${DATE_PICKER_PANEL_SELECTOR}`);
  return panel instanceof HTMLElement ? panel : null;
}

function getDatePickerCalendar(root) {
  const calendar = root.querySelector(`:scope > ${DATE_PICKER_PANEL_SELECTOR} > ${DATE_PICKER_CALENDAR_SELECTOR}`);
  return calendar instanceof HTMLElement ? calendar : null;
}

function parseDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function combineDateAndTime(dateString, timeString) {
  const date = parseDateString(dateString);
  if (!date) {
    return null;
  }

  if (!timeString) {
    return date;
  }

  const timeMatch = /^(\d{2}):(\d{2})$/.exec(timeString);
  if (!timeMatch) {
    return date;
  }

  date.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
  return date;
}

function ensureDatePickerIds(root) {
  const input = getDatePickerInput(root);
  const panel = getDatePickerPanel(root);
  if (!input || !panel) {
    return;
  }

  if (!panel.id) {
    datePickerCount += 1;
    panel.id = `dashbase-date-picker-panel-${datePickerCount}`;
  }

  input.setAttribute("aria-controls", panel.id);
}

function isRangeMode(root) {
  return getDatePickerCalendar(root)?.getAttribute("data-mode") === "range";
}

function hasTime(root) {
  return getDatePickerCalendar(root)?.hasAttribute("data-time") ?? false;
}

function getPickerValue(root) {
  const calendar = getDatePickerCalendar(root);
  if (!calendar) {
    return null;
  }

  if (isRangeMode(root)) {
    return {
      mode: "range",
      start: calendar.getAttribute("data-range-start") ?? "",
      end: calendar.getAttribute("data-range-end") ?? "",
      startTime: calendar.getAttribute("data-time-start") ?? "",
      endTime: calendar.getAttribute("data-time-end") ?? "",
    };
  }

  return {
    mode: "single",
    value: calendar.getAttribute("data-selected") ?? "",
    time: calendar.getAttribute("data-time-value") ?? "",
  };
}

function formatPickerValue(root) {
  const value = getPickerValue(root);
  if (!value) {
    return "";
  }

  if (value.mode === "range") {
    if (!value.start) {
      return "";
    }

    const start = combineDateAndTime(value.start, value.startTime);
    const end = value.end ? combineDateAndTime(value.end, value.endTime) : null;
    const startLabel = start
      ? (value.startTime ? singleDateTimeFormatter.format(start) : singleDateFormatter.format(start))
      : value.start;

    if (!end) {
      return startLabel;
    }

    const endLabel = value.endTime
      ? singleDateTimeFormatter.format(end)
      : singleDateFormatter.format(end);
    return `${startLabel} – ${endLabel}`;
  }

  if (!value.value) {
    return "";
  }

  const date = combineDateAndTime(value.value, value.time);
  if (!date) {
    return value.value;
  }

  return value.time
    ? singleDateTimeFormatter.format(date)
    : singleDateFormatter.format(date);
}

function syncDatePickerState(root) {
  const input = getDatePickerInput(root);
  const trigger = getDatePickerTrigger(root);
  const panel = getDatePickerPanel(root);
  if (!input || !panel) {
    return;
  }

  const open = panel.matches(":popover-open");
  input.setAttribute("aria-expanded", String(open));
  input.readOnly = true;

  if (trigger) {
    trigger.setAttribute("aria-expanded", String(open));
    trigger.setAttribute("aria-controls", panel.id);
  }

  const display = formatPickerValue(root);
  input.value = display;
  input.setAttribute("data-value", display);
}

function syncHiddenInputs(root) {
  const hiddenInputs = [...root.querySelectorAll(':scope > input[type="hidden"]')]
    .filter((input) => input instanceof HTMLInputElement);
  if (hiddenInputs.length === 0) {
    return;
  }

  const value = getPickerValue(root);
  if (!value) {
    return;
  }

  if (value.mode === "range") {
    for (const input of hiddenInputs) {
      const kind = input.getAttribute("data-date-picker-hidden");
      if (kind === "start") {
        input.value = value.start;
      } else if (kind === "end") {
        input.value = value.end;
      }
    }
    return;
  }

  for (const input of hiddenInputs) {
    input.value = value.value;
  }
}

function positionDatePickerPanel(root) {
  const input = getDatePickerInput(root);
  const panel = getDatePickerPanel(root);
  if (!input || !panel) {
    return;
  }

  const rect = input.getBoundingClientRect();
  let inlineStart = rect.left;
  const inlineSize = rect.width;
  let blockStart = rect.bottom + 4;

  panel.style.setProperty("--datepicker-inline-size", `${inlineSize}px`);
  panel.style.setProperty("--datepicker-inline-start", `${inlineStart}px`);
  panel.style.setProperty("--datepicker-block-start", `${blockStart}px`);

  requestAnimationFrame(() => {
    const panelRect = panel.getBoundingClientRect();
    let nextInlineStart = inlineStart;
    let nextBlockStart = blockStart;

    if (panelRect.right > window.innerWidth - DATE_PICKER_MARGIN) {
      nextInlineStart = Math.max(
        DATE_PICKER_MARGIN,
        inlineStart - (panelRect.right - (window.innerWidth - DATE_PICKER_MARGIN)),
      );
    }

    if (panelRect.bottom > window.innerHeight - DATE_PICKER_MARGIN) {
      const above = rect.top - panelRect.height - 4;
      if (above >= DATE_PICKER_MARGIN) {
        nextBlockStart = above;
      } else {
        nextBlockStart = Math.max(
          DATE_PICKER_MARGIN,
          blockStart - (panelRect.bottom - (window.innerHeight - DATE_PICKER_MARGIN)),
        );
      }
    }

    panel.style.setProperty("--datepicker-inline-start", `${nextInlineStart}px`);
    panel.style.setProperty("--datepicker-block-start", `${nextBlockStart}px`);
  });
}

function openDatePicker(root) {
  const panel = getDatePickerPanel(root);
  if (!panel) {
    return;
  }

  closeOpenDatePickers(root);
  positionDatePickerPanel(root);

  if (!panel.matches(":popover-open")) {
    panel.showPopover();
  }

  syncDatePickerState(root);
}

function closeDatePicker(root) {
  const panel = getDatePickerPanel(root);
  if (!panel) {
    return;
  }

  if (panel.matches(":popover-open")) {
    panel.hidePopover();
  }

  syncDatePickerState(root);
}

function closeOpenDatePickers(except = null) {
  for (const root of document.querySelectorAll(DATE_PICKER_ROOT_SELECTOR)) {
    if (!isDatePickerRoot(root) || root === except) {
      continue;
    }

    closeDatePicker(root);
  }
}

function clearDatePicker(root) {
  const calendar = getDatePickerCalendar(root);
  if (!calendar) {
    return;
  }

  calendar.removeAttribute("data-selected");
  calendar.removeAttribute("data-range-start");
  calendar.removeAttribute("data-range-end");
  calendar.removeAttribute("data-time-value");
  calendar.removeAttribute("data-time-start");
  calendar.removeAttribute("data-time-end");

  calendar.dispatchEvent(new CustomEvent("calendar-refresh"));
  calendar.dispatchEvent(new Event("change", { bubbles: true }));
}

function shouldCloseOnCalendarChange(root) {
  const value = getPickerValue(root);
  if (!value) {
    return false;
  }

  if (value.mode === "range") {
    if (!value.start || !value.end) {
      return false;
    }

    return !hasTime(root);
  }

  if (!value.value) {
    return false;
  }

  return !hasTime(root);
}

function emitDatePickerChange(root) {
  syncDatePickerState(root);
  syncHiddenInputs(root);
  root.dispatchEvent(new Event("change", { bubbles: true }));
  root.dispatchEvent(new CustomEvent("date-picker-change", {
    bubbles: true,
    detail: getPickerValue(root),
  }));
}

function initializeDatePicker(root) {
  if (root.dataset.datePickerInitialized === "true") {
    return;
  }

  const input = getDatePickerInput(root);
  const panel = getDatePickerPanel(root);
  const calendar = getDatePickerCalendar(root);
  if (!input || !panel || !calendar) {
    return;
  }

  root.dataset.datePickerInitialized = "true";
  ensureDatePickerIds(root);
  syncDatePickerState(root);
  syncHiddenInputs(root);

  input.addEventListener("focus", () => {
    openDatePicker(root);
  });

  input.addEventListener("click", () => {
    openDatePicker(root);
  });

  input.addEventListener("keydown", (event) => {
    switch (event.key) {
      case "ArrowDown":
      case "Enter":
      case " ":
        event.preventDefault();
        openDatePicker(root);
        break;
      case "Escape":
        if (panel.matches(":popover-open")) {
          event.preventDefault();
          closeDatePicker(root);
        }
        break;
      default:
        break;
    }
  });

  const trigger = getDatePickerTrigger(root);
  trigger?.addEventListener("click", (event) => {
    event.preventDefault();
    if (panel.matches(":popover-open")) {
      closeDatePicker(root);
    } else {
      openDatePicker(root);
    }
  });

  panel.addEventListener("toggle", () => {
    syncDatePickerState(root);
    if (panel.matches(":popover-open")) {
      positionDatePickerPanel(root);
    }
  });

  calendar.addEventListener("change", () => {
    emitDatePickerChange(root);
    if (shouldCloseOnCalendarChange(root)) {
      closeDatePicker(root);
    }
  });

  panel.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.closest(DATE_PICKER_CLEAR_SELECTOR)) {
      event.preventDefault();
      clearDatePicker(root);
      return;
    }

    if (target.closest(DATE_PICKER_CLOSE_SELECTOR)) {
      event.preventDefault();
      closeDatePicker(root);
      input.focus();
    }
  });
}

for (const root of document.querySelectorAll(DATE_PICKER_ROOT_SELECTOR)) {
  if (isDatePickerRoot(root)) {
    initializeDatePicker(root);
  }
}

document.addEventListener("pointerdown", (event) => {
  const target = event.target instanceof Element ? event.target : null;

  for (const root of document.querySelectorAll(DATE_PICKER_ROOT_SELECTOR)) {
    if (!isDatePickerRoot(root)) {
      continue;
    }

    const panel = getDatePickerPanel(root);
    if (!panel?.matches(":popover-open")) {
      continue;
    }

    if (target && (root.contains(target) || panel.contains(target))) {
      continue;
    }

    closeDatePicker(root);
  }
});

window.addEventListener("resize", () => {
  for (const root of document.querySelectorAll(DATE_PICKER_ROOT_SELECTOR)) {
    if (!isDatePickerRoot(root)) {
      continue;
    }

    const panel = getDatePickerPanel(root);
    if (panel?.matches(":popover-open")) {
      positionDatePickerPanel(root);
    }
  }
});

window.addEventListener("scroll", () => {
  for (const root of document.querySelectorAll(DATE_PICKER_ROOT_SELECTOR)) {
    if (!isDatePickerRoot(root)) {
      continue;
    }

    const panel = getDatePickerPanel(root);
    if (panel?.matches(":popover-open")) {
      positionDatePickerPanel(root);
    }
  }
}, true);
