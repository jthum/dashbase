/*
 * Dashbase — Carousel behavior
 *
 * Enhances <carousel> roots with:
 * - previous / next button controls
 * - dot navigation
 * - active slide and control-state sync
 * - basic keyboard navigation
 */

const CAROUSEL_ROOT_SELECTOR = "carousel";
const CAROUSEL_TRACK_SELECTOR = "carousel-track";
const CAROUSEL_SLIDE_SELECTOR = "carousel-slide";
const CAROUSEL_PREV_SELECTOR = "[data-carousel-prev]";
const CAROUSEL_NEXT_SELECTOR = "[data-carousel-next]";
const CAROUSEL_DOTS_SELECTOR = "carousel-dots";
const CAROUSEL_DOT_SELECTOR = "[data-carousel-dot]";
let carouselCount = 0;

function isCarouselRoot(value) {
  return value instanceof HTMLElement && value.matches(CAROUSEL_ROOT_SELECTOR);
}

function getCarouselTrack(root) {
  const track = root.querySelector(`:scope > ${CAROUSEL_TRACK_SELECTOR}`);
  return track instanceof HTMLElement ? track : null;
}

function getCarouselSlides(root) {
  const track = getCarouselTrack(root);
  return track
    ? [...track.querySelectorAll(`:scope > ${CAROUSEL_SLIDE_SELECTOR}`)].filter((slide) => slide instanceof HTMLElement)
    : [];
}

function getCarouselPrevButton(root) {
  const button = root.querySelector(CAROUSEL_PREV_SELECTOR);
  return button instanceof HTMLButtonElement ? button : null;
}

function getCarouselNextButton(root) {
  const button = root.querySelector(CAROUSEL_NEXT_SELECTOR);
  return button instanceof HTMLButtonElement ? button : null;
}

function getCarouselDots(root) {
  const dots = root.querySelector(`:scope > ${CAROUSEL_DOTS_SELECTOR}`);
  return dots instanceof HTMLElement ? dots : null;
}

function getActiveIndex(root) {
  const value = Number(root.dataset.activeIndex ?? "0");
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

function setActiveIndex(root, index) {
  root.dataset.activeIndex = String(index);
}

function isLooping(root) {
  return root.hasAttribute("data-loop");
}

function ensureCarouselId(root) {
  if (root.id) {
    return root.id;
  }

  carouselCount += 1;
  root.id = `dashbase-carousel-${carouselCount}`;
  return root.id;
}

function ensureSlideIds(root) {
  const slides = getCarouselSlides(root);
  const rootId = ensureCarouselId(root);
  slides.forEach((slide, index) => {
    if (!slide.id) {
      slide.id = `${rootId}-slide-${index + 1}`;
    }

    slide.setAttribute("role", slide.getAttribute("role") || "group");
    slide.setAttribute("aria-roledescription", slide.getAttribute("aria-roledescription") || "slide");
    slide.setAttribute("aria-label", slide.getAttribute("aria-label") || `${index + 1} of ${slides.length}`);
  });
}

function ensureDots(root) {
  const dots = getCarouselDots(root);
  if (!dots) {
    return;
  }

  const slides = getCarouselSlides(root);
  dots.innerHTML = slides.map((slide, index) => {
    return `<button type="button" data-carousel-dot aria-label="Go to slide ${index + 1}" aria-controls="${slide.id}"></button>`;
  }).join("");
}

function scrollCarouselToIndex(root, index, behavior = "smooth") {
  const slides = getCarouselSlides(root);
  const slide = slides[index];
  if (!slide) {
    return;
  }

  slide.scrollIntoView({
    behavior,
    block: "nearest",
    inline: "start",
  });
}

function getNearestSlideIndex(root) {
  const track = getCarouselTrack(root);
  const slides = getCarouselSlides(root);
  if (!track || slides.length === 0) {
    return 0;
  }

  const trackRect = track.getBoundingClientRect();
  const targetOffset = trackRect.left + (trackRect.width / 2);

  let nearestIndex = 0;
  let nearestDistance = Number.POSITIVE_INFINITY;

  slides.forEach((slide, index) => {
    const rect = slide.getBoundingClientRect();
    const slideOffset = rect.left + (rect.width / 2);
    const distance = Math.abs(slideOffset - targetOffset);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });

  return nearestIndex;
}

function syncCarouselState(root) {
  const slides = getCarouselSlides(root);
  const prev = getCarouselPrevButton(root);
  const next = getCarouselNextButton(root);
  const dots = getCarouselDots(root);
  const activeIndex = Math.min(getActiveIndex(root), Math.max(slides.length - 1, 0));
  const looping = isLooping(root);

  setActiveIndex(root, activeIndex);

  slides.forEach((slide, index) => {
    slide.toggleAttribute("data-active", index === activeIndex);
  });

  if (dots) {
    const buttons = [...dots.querySelectorAll(CAROUSEL_DOT_SELECTOR)].filter((button) => button instanceof HTMLButtonElement);
    buttons.forEach((button, index) => {
      if (index === activeIndex) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    });
  }

  if (prev) {
    prev.disabled = !looping && activeIndex === 0;
  }

  if (next) {
    next.disabled = !looping && activeIndex === slides.length - 1;
  }
}

function moveCarousel(root, delta) {
  const slides = getCarouselSlides(root);
  if (slides.length === 0) {
    return;
  }

  const looping = isLooping(root);
  let nextIndex = getActiveIndex(root) + delta;

  if (looping) {
    nextIndex = (nextIndex + slides.length) % slides.length;
  } else {
    nextIndex = Math.max(0, Math.min(slides.length - 1, nextIndex));
  }

  setActiveIndex(root, nextIndex);
  syncCarouselState(root);
  scrollCarouselToIndex(root, nextIndex);
}

function initializeCarousel(root) {
  if (root.dataset.carouselInitialized === "true") {
    return;
  }

  const track = getCarouselTrack(root);
  const slides = getCarouselSlides(root);
  if (!track || slides.length === 0) {
    return;
  }

  root.dataset.carouselInitialized = "true";
  ensureSlideIds(root);
  ensureDots(root);
  syncCarouselState(root);

  let frame = 0;
  track.addEventListener("scroll", () => {
    if (frame) {
      cancelAnimationFrame(frame);
    }

    frame = requestAnimationFrame(() => {
      setActiveIndex(root, getNearestSlideIndex(root));
      syncCarouselState(root);
    });
  }, { passive: true });

  getCarouselPrevButton(root)?.addEventListener("click", (event) => {
    event.preventDefault();
    moveCarousel(root, -1);
  });

  getCarouselNextButton(root)?.addEventListener("click", (event) => {
    event.preventDefault();
    moveCarousel(root, 1);
  });

  getCarouselDots(root)?.addEventListener("click", (event) => {
    const button = event.target instanceof Element ? event.target.closest(CAROUSEL_DOT_SELECTOR) : null;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const buttons = [...button.parentElement.querySelectorAll(CAROUSEL_DOT_SELECTOR)];
    const index = buttons.indexOf(button);
    if (index < 0) {
      return;
    }

    setActiveIndex(root, index);
    syncCarouselState(root);
    scrollCarouselToIndex(root, index);
  });

  root.addEventListener("keydown", (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (!target || !root.contains(target)) {
      return;
    }

    if (
      target.matches('input, textarea, select, [contenteditable="true"]') ||
      target.isContentEditable
    ) {
      return;
    }

    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        moveCarousel(root, -1);
        break;
      case "ArrowRight":
        event.preventDefault();
        moveCarousel(root, 1);
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(root, 0);
        syncCarouselState(root);
        scrollCarouselToIndex(root, 0);
        break;
      case "End": {
        event.preventDefault();
        const lastIndex = getCarouselSlides(root).length - 1;
        setActiveIndex(root, lastIndex);
        syncCarouselState(root);
        scrollCarouselToIndex(root, lastIndex);
        break;
      }
      default:
        break;
    }
  });

  window.addEventListener("resize", () => {
    setActiveIndex(root, getNearestSlideIndex(root));
    syncCarouselState(root);
  });
}

for (const root of document.querySelectorAll(CAROUSEL_ROOT_SELECTOR)) {
  if (isCarouselRoot(root)) {
    initializeCarousel(root);
  }
}
