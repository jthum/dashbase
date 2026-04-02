/*
 * Dashbase — Calendar behavior
 *
 * Renders and enhances <calendar-view> with:
 * - month navigation
 * - single-date selection
 * - keyboard navigation across day buttons
 * - optional disabled dates through data-disabled, data-min, and data-max
 */

const CALENDAR_ROOT_SELECTOR = "calendar-view";
const CALENDAR_PREV_SELECTOR = '[data-calendar-action="prev"]';
const CALENDAR_NEXT_SELECTOR = '[data-calendar-action="next"]';
const CALENDAR_DAY_SELECTOR = '[data-calendar-date]';
let calendarCount = 0;

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  year: "numeric",
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
  if (min && date < new Date(min.getFullYear(), min.getMonth(), min.getDate())) {
    return true;
  }

  const max = parseDateString(root.getAttribute("data-max"));
  if (max && date > new Date(max.getFullYear(), max.getMonth(), max.getDate())) {
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

function getCalendarMonth(root) {
  return (
    parseMonthString(root.getAttribute("data-month")) ||
    parseDateString(root.getAttribute("data-selected")) ||
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
}

function getCalendarSelectedDate(root) {
  return parseDateString(root.getAttribute("data-selected"));
}

function getCalendarActiveDate(root, monthDate) {
  const active = parseDateString(root.getAttribute("data-active"));
  if (active && !isDateDisabled(root, active)) {
    return active;
  }

  const selected = getCalendarSelectedDate(root);
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

function setSelectedDate(root, date) {
  root.setAttribute("data-selected", formatDateString(date));
}

function renderCalendar(root) {
  const rootId = ensureCalendarId(root);
  const monthDate = getCalendarMonth(root);
  const weekStart = clampWeekStart(root.getAttribute("data-week-start"));
  const selectedDate = getCalendarSelectedDate(root);
  const activeDate = getCalendarActiveDate(root, monthDate);
  const today = new Date();
  const titleId = `${rootId}-title`;

  setMonth(root, monthDate);
  setActiveDate(root, activeDate);

  const weekdays = getWeekdayLabels(weekStart);
  const weeks = [];
  const visibleDates = getVisibleMonthDates(monthDate, weekStart);

  for (let index = 0; index < visibleDates.length; index += 7) {
    weeks.push(visibleDates.slice(index, index + 7));
  }

  root.innerHTML = `
    <calendar-header>
      <button type="button" data-calendar-action="prev" aria-label="Previous month">‹</button>
      <strong id="${titleId}" data-calendar-title aria-live="polite">${monthFormatter.format(monthDate)}</strong>
      <button type="button" data-calendar-action="next" aria-label="Next month">›</button>
    </calendar-header>
    <table role="grid" aria-labelledby="${titleId}">
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
              const selected = selectedDate ? isSameDate(date, selectedDate) : false;
              const current = isSameDate(date, today);
              const active = isSameDate(date, activeDate);
              const disabled = isDateDisabled(root, date);

              return `
                <td role="gridcell" aria-selected="${selected ? "true" : "false"}">
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
  `;
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
      value: root.getAttribute("data-selected"),
    },
  }));
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
      const currentActive = getCalendarActiveDate(root, month);
      const nextMonth = action.matches(CALENDAR_PREV_SELECTOR)
        ? addMonths(currentActive, -1)
        : addMonths(currentActive, 1);

      setMonth(root, nextMonth);
      setActiveDate(root, nextMonth);
      renderCalendar(root);
      focusCalendarDate(root, formatDateString(getCalendarActiveDate(root, getCalendarMonth(root))));
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

    setMonth(root, selected);
    setActiveDate(root, selected);
    setSelectedDate(root, selected);
    renderCalendar(root);
    focusCalendarDate(root, formatDateString(selected));
    emitCalendarChange(root);
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
