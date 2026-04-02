/*
 * Dashbase — Calendar behavior
 *
 * Renders and enhances <calendar-view> with:
 * - month navigation
 * - month and year selectors
 * - single-date or range selection
 * - keyboard navigation across day buttons
 * - optional time controls
 * - optional disabled dates through data-disabled, data-min, and data-max
 */

const CALENDAR_ROOT_SELECTOR = "calendar-view";
const CALENDAR_PREV_SELECTOR = '[data-calendar-action="prev"]';
const CALENDAR_NEXT_SELECTOR = '[data-calendar-action="next"]';
const CALENDAR_MONTH_SELECTOR = '[data-calendar-month-select]';
const CALENDAR_YEAR_SELECTOR = '[data-calendar-year-select]';
const CALENDAR_DAY_SELECTOR = '[data-calendar-date]';
const CALENDAR_TIME_SINGLE_SELECTOR = '[data-calendar-time="single"]';
const CALENDAR_TIME_START_SELECTOR = '[data-calendar-time="start"]';
const CALENDAR_TIME_END_SELECTOR = '[data-calendar-time="end"]';
let calendarCount = 0;

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
});

const monthLabelFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
});

const weekdayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
});

const dayLabelFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function isCalendarRoot(value) {
  return value instanceof HTMLElement && value.matches(CALENDAR_ROOT_SELECTOR);
}

function parseMonthString(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return new Date(year, month - 1, 1);
}

function parseDateString(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

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

function formatDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMonthString(date) {
  return formatDateString(new Date(date.getFullYear(), date.getMonth(), 1)).slice(0, 7);
}

function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function addMonths(date, months) {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function addYears(date, years) {
  return new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
}

function isSameDate(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isDateInRange(date, start, end) {
  if (!start || !end) {
    return false;
  }

  const value = normalizeDate(date).getTime();
  return value >= normalizeDate(start).getTime() && value <= normalizeDate(end).getTime();
}

function getStartOfWeek(date, weekStart) {
  const diff = (date.getDay() - weekStart + 7) % 7;
  return addDays(date, -diff);
}

function getEndOfWeek(date, weekStart) {
  return addDays(getStartOfWeek(date, weekStart), 6);
}

function getWeekdayLabels(weekStart) {
  const baseSunday = new Date(2026, 0, 4);
  return Array.from({ length: 7 }, (_, index) => {
    return weekdayFormatter.format(addDays(baseSunday, (weekStart + index) % 7));
  });
}

function getVisibleMonthDates(monthDate, weekStart) {
  const firstOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = getStartOfWeek(firstOfMonth, weekStart);
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function clampWeekStart(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 6) {
    return 0;
  }

  return parsed;
}

function isRangeMode(root) {
  return (root.getAttribute("data-mode") ?? "").toLowerCase() === "range";
}

function hasTimeControls(root) {
  return root.hasAttribute("data-time");
}

function getDisabledDateSet(root) {
  return new Set(
    (root.getAttribute("data-disabled") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function isDateDisabled(root, date) {
  const dateString = formatDateString(date);
  const disabled = getDisabledDateSet(root);
  if (disabled.has(dateString)) {
    return true;
  }

  const min = parseDateString(root.getAttribute("data-min"));
  if (min && normalizeDate(date) < normalizeDate(min)) {
    return true;
  }

  const max = parseDateString(root.getAttribute("data-max"));
  if (max && normalizeDate(date) > normalizeDate(max)) {
    return true;
  }

  return false;
}

function ensureCalendarId(root) {
  if (root.id) {
    return root.id;
  }

  calendarCount += 1;
  root.id = `dashbase-calendar-${calendarCount}`;
  return root.id;
}

function getSingleSelectedDate(root) {
  return parseDateString(root.getAttribute("data-selected"));
}

function getRangeStartDate(root) {
  return parseDateString(root.getAttribute("data-range-start"));
}

function getRangeEndDate(root) {
  return parseDateString(root.getAttribute("data-range-end"));
}

function getCalendarMonth(root) {
  return (
    parseMonthString(root.getAttribute("data-month")) ||
    getRangeStartDate(root) ||
    getSingleSelectedDate(root) ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
}

function getCalendarAnchorDate(root, monthDate) {
  const active = parseDateString(root.getAttribute("data-active"));
  if (active && !isDateDisabled(root, active)) {
    return active;
  }

  const rangeEnd = getRangeEndDate(root);
  if (rangeEnd && !isDateDisabled(root, rangeEnd)) {
    return rangeEnd;
  }

  const rangeStart = getRangeStartDate(root);
  if (rangeStart && !isDateDisabled(root, rangeStart)) {
    return rangeStart;
  }

  const selected = getSingleSelectedDate(root);
  if (selected && !isDateDisabled(root, selected)) {
    return selected;
  }

  const today = new Date();
  if (isSameMonth(today, monthDate) && !isDateDisabled(root, today)) {
    return today;
  }

  const currentMonthDates = getVisibleMonthDates(monthDate, clampWeekStart(root.getAttribute("data-week-start")))
    .filter((date) => isSameMonth(date, monthDate) && !isDateDisabled(root, date));
  return currentMonthDates[0] ?? monthDate;
}

function moveToEnabledDate(root, startDate, delta) {
  let candidate = startDate;

  for (let attempts = 0; attempts < 62; attempts += 1) {
    candidate = addDays(candidate, delta);
    if (!isDateDisabled(root, candidate)) {
      return candidate;
    }
  }

  return startDate;
}

function setMonth(root, date) {
  root.setAttribute("data-month", formatMonthString(date));
}

function setActiveDate(root, date) {
  root.setAttribute("data-active", formatDateString(date));
}

function setSingleSelectedDate(root, date) {
  root.setAttribute("data-selected", formatDateString(date));
}

function clearSingleSelectedDate(root) {
  root.removeAttribute("data-selected");
}

function setRange(root, start, end = null) {
  root.setAttribute("data-range-start", formatDateString(start));
  if (end) {
    root.setAttribute("data-range-end", formatDateString(end));
  } else {
    root.removeAttribute("data-range-end");
  }
}

function getCalendarTimeValue(root) {
  return root.getAttribute("data-time-value") ?? "";
}

function getCalendarTimeStart(root) {
  return root.getAttribute("data-time-start") ?? "";
}

function getCalendarTimeEnd(root) {
  return root.getAttribute("data-time-end") ?? "";
}

function getYearOptions(root, monthDate) {
  const min = parseDateString(root.getAttribute("data-min"));
  const max = parseDateString(root.getAttribute("data-max"));
  const baseYear = monthDate.getFullYear();
  const startYear = min ? min.getFullYear() : baseYear - 12;
  const endYear = max ? max.getFullYear() : baseYear + 12;
  const years = [];

  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }

  return years;
}

function getRangeState(date, root) {
  const start = getRangeStartDate(root);
  const end = getRangeEndDate(root);

  if (!start) {
    return null;
  }

  if (!end) {
    return isSameDate(date, start) ? "single" : null;
  }

  if (isSameDate(date, start) && isSameDate(date, end)) {
    return "single";
  }

  if (isSameDate(date, start)) {
    return "start";
  }

  if (isSameDate(date, end)) {
    return "end";
  }

  if (isDateInRange(date, start, end)) {
    return "middle";
  }

  return null;
}

function renderTimeSection(root) {
  if (!hasTimeControls(root)) {
    return "";
  }

  if (isRangeMode(root)) {
    return `
      <calendar-time data-mode="range">
        <calendar-field>
          <label for="${ensureCalendarId(root)}-time-start">Start time</label>
          <input id="${ensureCalendarId(root)}-time-start" type="time" value="${getCalendarTimeStart(root)}" data-calendar-time="start" />
        </calendar-field>
        <calendar-field>
          <label for="${ensureCalendarId(root)}-time-end">End time</label>
          <input id="${ensureCalendarId(root)}-time-end" type="time" value="${getCalendarTimeEnd(root)}" data-calendar-time="end" />
        </calendar-field>
      </calendar-time>
    `;
  }

  return `
    <calendar-time>
      <calendar-field>
        <label for="${ensureCalendarId(root)}-time-value">Time</label>
        <input id="${ensureCalendarId(root)}-time-value" type="time" value="${getCalendarTimeValue(root)}" data-calendar-time="single" />
      </calendar-field>
    </calendar-time>
  `;
}

function renderCalendar(root) {
  const rootId = ensureCalendarId(root);
  const monthDate = getCalendarMonth(root);
  const weekStart = clampWeekStart(root.getAttribute("data-week-start"));
  const selectedDate = getSingleSelectedDate(root);
  const activeDate = getCalendarAnchorDate(root, monthDate);
  const today = new Date();

  setMonth(root, monthDate);
  setActiveDate(root, activeDate);

  const weekdays = getWeekdayLabels(weekStart);
  const weeks = [];
  const visibleDates = getVisibleMonthDates(monthDate, weekStart);
  const yearOptions = getYearOptions(root, monthDate);

  for (let index = 0; index < visibleDates.length; index += 7) {
    weeks.push(visibleDates.slice(index, index + 7));
  }

  root.innerHTML = `
    <calendar-header>
      <button type="button" data-calendar-action="prev" aria-label="Previous month">‹</button>
      <calendar-controls>
        <select data-calendar-month-select aria-label="Month">
          ${Array.from({ length: 12 }, (_, monthIndex) => {
            const value = String(monthIndex + 1).padStart(2, "0");
            const selected = monthIndex === monthDate.getMonth() ? " selected" : "";
            return `<option value="${value}"${selected}>${monthLabelFormatter.format(new Date(2026, monthIndex, 1))}</option>`;
          }).join("")}
        </select>
        <select data-calendar-year-select aria-label="Year">
          ${yearOptions.map((year) => {
            const selected = year === monthDate.getFullYear() ? " selected" : "";
            return `<option value="${year}"${selected}>${year}</option>`;
          }).join("")}
        </select>
      </calendar-controls>
      <button type="button" data-calendar-action="next" aria-label="Next month">›</button>
    </calendar-header>
    <table role="grid" aria-label="${(root.getAttribute("aria-label") ?? "Calendar")} — ${monthFormatter.format(monthDate)}">
      <thead>
        <tr>
          ${weekdays.map((label) => `<th scope="col">${label}</th>`).join("")}
        </tr>
      </thead>
      <tbody>
        ${weeks.map((week) => `
          <tr>
            ${week.map((date) => {
              const dateString = formatDateString(date);
              const outsideMonth = !isSameMonth(date, monthDate);
              const rangeState = isRangeMode(root) ? getRangeState(date, root) : null;
              const selected = isRangeMode(root)
                ? rangeState !== null
                : (selectedDate ? isSameDate(date, selectedDate) : false);
              const current = isSameDate(date, today);
              const active = isSameDate(date, activeDate);
              const disabled = isDateDisabled(root, date);

              return `
                <td
                  role="gridcell"
                  aria-selected="${selected ? "true" : "false"}"
                  ${rangeState ? `data-range-state="${rangeState}"` : ""}
                >
                  <button
                    type="button"
                    data-calendar-date="${dateString}"
                    aria-label="${dayLabelFormatter.format(date)}"
                    ${current ? 'aria-current="date"' : ""}
                    ${outsideMonth ? "data-outside-month" : ""}
                    ${active && !disabled ? 'tabindex="0"' : 'tabindex="-1"'}
                    ${disabled ? "disabled" : ""}
                  >
                    ${date.getDate()}
                  </button>
                </td>
              `;
            }).join("")}
          </tr>
        `).join("")}
      </tbody>
    </table>
    ${renderTimeSection(root)}
  `;

  root.dataset.calendarTitle = `${root.getAttribute("aria-label") ?? "Calendar"} — ${monthFormatter.format(monthDate)}`;
  root.setAttribute("aria-label", root.getAttribute("aria-label") ?? "Calendar");
}

function focusCalendarDate(root, dateString) {
  const button = root.querySelector(`${CALENDAR_DAY_SELECTOR}[data-calendar-date="${CSS.escape(dateString)}"]`);
  if (button instanceof HTMLButtonElement) {
    button.focus();
  }
}

function emitCalendarChange(root) {
  root.dispatchEvent(new Event("change", { bubbles: true }));
  root.dispatchEvent(new CustomEvent("calendar-change", {
    bubbles: true,
    detail: {
      mode: isRangeMode(root) ? "range" : "single",
      selected: root.getAttribute("data-selected"),
      rangeStart: root.getAttribute("data-range-start"),
      rangeEnd: root.getAttribute("data-range-end"),
      timeValue: root.getAttribute("data-time-value"),
      timeStart: root.getAttribute("data-time-start"),
      timeEnd: root.getAttribute("data-time-end"),
    },
  }));
}

function selectCalendarDate(root, date) {
  setMonth(root, date);
  setActiveDate(root, date);

  if (isRangeMode(root)) {
    clearSingleSelectedDate(root);
    const start = getRangeStartDate(root);
    const end = getRangeEndDate(root);

    if (!start || end) {
      setRange(root, date);
    } else if (normalizeDate(date).getTime() < normalizeDate(start).getTime()) {
      setRange(root, date, start);
    } else {
      setRange(root, start, date);
    }
  } else {
    root.removeAttribute("data-range-start");
    root.removeAttribute("data-range-end");
    setSingleSelectedDate(root, date);
  }

  renderCalendar(root);
  focusCalendarDate(root, formatDateString(date));
  emitCalendarChange(root);
}

function initializeCalendar(root) {
  if (root.dataset.calendarInitialized === "true") {
    return;
  }

  root.dataset.calendarInitialized = "true";
  root.setAttribute("role", root.getAttribute("role") || "group");
  renderCalendar(root);

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    const action = target.closest("[data-calendar-action]");
    if (action instanceof HTMLButtonElement) {
      const month = getCalendarMonth(root);
      const currentActive = getCalendarAnchorDate(root, month);
      const nextMonth = action.matches(CALENDAR_PREV_SELECTOR)
        ? addMonths(currentActive, -1)
        : addMonths(currentActive, 1);

      setMonth(root, nextMonth);
      setActiveDate(root, nextMonth);
      renderCalendar(root);
      focusCalendarDate(root, formatDateString(getCalendarAnchorDate(root, getCalendarMonth(root))));
      return;
    }

    const dayButton = target.closest(CALENDAR_DAY_SELECTOR);
    if (!(dayButton instanceof HTMLButtonElement) || dayButton.disabled) {
      return;
    }

    const selected = parseDateString(dayButton.getAttribute("data-calendar-date"));
    if (!selected) {
      return;
    }

    selectCalendarDate(root, selected);
  });

  root.addEventListener("change", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.matches(CALENDAR_MONTH_SELECTOR)) {
      const month = Number(target.getAttribute("value") ?? (target instanceof HTMLSelectElement ? target.value : ""));
      const current = getCalendarMonth(root);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        return;
      }

      const next = new Date(current.getFullYear(), month - 1, 1);
      setMonth(root, next);
      setActiveDate(root, next);
      renderCalendar(root);
      focusCalendarDate(root, formatDateString(getCalendarAnchorDate(root, getCalendarMonth(root))));
      return;
    }

    if (target.matches(CALENDAR_YEAR_SELECTOR)) {
      const year = Number(target.getAttribute("value") ?? (target instanceof HTMLSelectElement ? target.value : ""));
      const current = getCalendarMonth(root);
      if (!Number.isInteger(year)) {
        return;
      }

      const next = new Date(year, current.getMonth(), 1);
      setMonth(root, next);
      setActiveDate(root, next);
      renderCalendar(root);
      focusCalendarDate(root, formatDateString(getCalendarAnchorDate(root, getCalendarMonth(root))));
      return;
    }

    if (target.matches(CALENDAR_TIME_SINGLE_SELECTOR) && target instanceof HTMLInputElement) {
      root.setAttribute("data-time-value", target.value);
      emitCalendarChange(root);
      return;
    }

    if (target.matches(CALENDAR_TIME_START_SELECTOR) && target instanceof HTMLInputElement) {
      root.setAttribute("data-time-start", target.value);
      emitCalendarChange(root);
      return;
    }

    if (target.matches(CALENDAR_TIME_END_SELECTOR) && target instanceof HTMLInputElement) {
      root.setAttribute("data-time-end", target.value);
      emitCalendarChange(root);
    }
  });

  root.addEventListener("focusin", (event) => {
    const dayButton = event.target instanceof Element
      ? event.target.closest(CALENDAR_DAY_SELECTOR)
      : null;

    if (!(dayButton instanceof HTMLButtonElement) || dayButton.disabled) {
      return;
    }

    const active = parseDateString(dayButton.getAttribute("data-calendar-date"));
    if (!active) {
      return;
    }

    if (root.getAttribute("data-active") === formatDateString(active)) {
      return;
    }

    setActiveDate(root, active);
    renderCalendar(root);
    focusCalendarDate(root, formatDateString(active));
  });

  root.addEventListener("keydown", (event) => {
    const target = event.target instanceof Element
      ? event.target.closest(CALENDAR_DAY_SELECTOR)
      : null;

    if (!(target instanceof HTMLButtonElement) || target.disabled) {
      return;
    }

    const current = parseDateString(target.getAttribute("data-calendar-date"));
    if (!current) {
      return;
    }

    const weekStart = clampWeekStart(root.getAttribute("data-week-start"));
    let nextDate = null;

    switch (event.key) {
      case "ArrowLeft":
        nextDate = moveToEnabledDate(root, current, -1);
        break;
      case "ArrowRight":
        nextDate = moveToEnabledDate(root, current, 1);
        break;
      case "ArrowUp":
        nextDate = moveToEnabledDate(root, current, -7);
        break;
      case "ArrowDown":
        nextDate = moveToEnabledDate(root, current, 7);
        break;
      case "Home": {
        const start = getStartOfWeek(current, weekStart);
        nextDate = isDateDisabled(root, start) ? moveToEnabledDate(root, start, 1) : start;
        break;
      }
      case "End": {
        const end = getEndOfWeek(current, weekStart);
        nextDate = isDateDisabled(root, end) ? moveToEnabledDate(root, end, -1) : end;
        break;
      }
      case "PageUp":
        nextDate = event.shiftKey ? addYears(current, -1) : addMonths(current, -1);
        if (isDateDisabled(root, nextDate)) {
          nextDate = moveToEnabledDate(root, nextDate, 1);
        }
        break;
      case "PageDown":
        nextDate = event.shiftKey ? addYears(current, 1) : addMonths(current, 1);
        if (isDateDisabled(root, nextDate)) {
          nextDate = moveToEnabledDate(root, nextDate, -1);
        }
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        target.click();
        return;
      default:
        return;
    }

    if (!nextDate) {
      return;
    }

    event.preventDefault();
    setMonth(root, nextDate);
    setActiveDate(root, nextDate);
    renderCalendar(root);
    focusCalendarDate(root, formatDateString(nextDate));
  });
}

for (const root of document.querySelectorAll(CALENDAR_ROOT_SELECTOR)) {
  if (isCalendarRoot(root)) {
    initializeCalendar(root);
  }
}
