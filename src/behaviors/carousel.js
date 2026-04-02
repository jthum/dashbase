/*
 * Dashbase — Carousel behavior
 *
 * Enhances <carousel> roots with:
 * - previous / next button controls
 * - authored dot navigation
 * - active slide and control-state sync via IntersectionObserver
 */

const CAROUSEL_ROOT_SELECTOR = "carousel";
const CAROUSEL_TRACK_SELECTOR = "carousel-track";
const CAROUSEL_SLIDE_SELECTOR = "carousel-slide";

function isCarouselRoot(value) {
  return value instanceof HTMLElement && value.matches(CAROUSEL_ROOT_SELECTOR);
}

function getCarouselParts(root) {
  const track = root.querySelector(`:scope > ${CAROUSEL_TRACK_SELECTOR}`);
  if (!(track instanceof HTMLElement)) {
    return null;
  }

  const slides = [...track.querySelectorAll(`:scope > ${CAROUSEL_SLIDE_SELECTOR}`)]
    .filter((slide) => slide instanceof HTMLElement);
  if (slides.length === 0) {
    return null;
  }

  const dots = root.querySelector(":scope > carousel-dots");
  const dotButtons = dots instanceof HTMLElement
    ? [...dots.querySelectorAll(":scope > button")].filter((button) => button instanceof HTMLButtonElement)
    : [];

  return {
    track,
    slides,
    prev: root.querySelector(":scope [data-carousel-prev]"),
    next: root.querySelector(":scope [data-carousel-next]"),
    dotButtons,
  };
}

function getCarouselAxis(root) {
  return root.classList.contains("vertical")
    ? { delta: "top", scroll: "scrollTop" }
    : { delta: "left", scroll: "scrollLeft" };
}

function syncCarousel(parts, activeIndex) {
  parts.slides.forEach((slide, index) => {
    slide.toggleAttribute("data-active", index === activeIndex);
  });

  parts.dotButtons.forEach((button, index) => {
    if (index === activeIndex) {
      button.setAttribute("aria-current", "true");
    } else {
      button.removeAttribute("aria-current");
    }
  });

  if (parts.prev instanceof HTMLButtonElement) {
    parts.prev.disabled = activeIndex === 0;
  }

  if (parts.next instanceof HTMLButtonElement) {
    parts.next.disabled = activeIndex === parts.slides.length - 1;
  }
}

function scrollToSlide(root, parts, index) {
  const slide = parts.slides[index];
  if (!slide) {
    return;
  }

  const axis = getCarouselAxis(root);
  const trackRect = parts.track.getBoundingClientRect();
  const slideRect = slide.getBoundingClientRect();
  const currentOffset = parts.track[axis.scroll];
  const delta = slideRect[axis.delta] - trackRect[axis.delta];

  parts.track.scrollTo({
    [axis.delta]: currentOffset + delta,
  });
}

function moveCarousel(root, parts, activeIndex, direction) {
  const nextIndex = Math.max(0, Math.min(parts.slides.length - 1, activeIndex + direction));

  syncCarousel(parts, nextIndex);
  scrollToSlide(root, parts, nextIndex);
}

function initializeCarousel(root) {
  if (root.dataset.carouselInitialized === "true") {
    return;
  }

  const parts = getCarouselParts(root);
  if (!parts) {
    return;
  }

  root.dataset.carouselInitialized = "true";
  let activeIndex = 0;
  syncCarousel(parts, activeIndex);

  const ratios = new Map(parts.slides.map((slide, index) => [slide, index === 0 ? 1 : 0]));
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      ratios.set(entry.target, entry.intersectionRatio);
    }

    let bestIndex = activeIndex;
    let bestRatio = -1;

    parts.slides.forEach((slide, index) => {
      const ratio = ratios.get(slide) ?? 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        bestIndex = index;
      }
    });

    activeIndex = bestIndex;
    syncCarousel(parts, activeIndex);
  }, {
    root: parts.track,
    threshold: [0.51, 0.66, 0.82],
  });

  parts.slides.forEach((slide) => observer.observe(slide));

  root.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.closest("[data-carousel-prev]")) {
      event.preventDefault();
      moveCarousel(root, parts, activeIndex, -1);
      return;
    }

    if (target.closest("[data-carousel-next]")) {
      event.preventDefault();
      moveCarousel(root, parts, activeIndex, 1);
      return;
    }

    const dotIndex = parts.dotButtons.findIndex((button) => button === target.closest("button"));
    if (dotIndex < 0) {
      return;
    }

    event.preventDefault();
    activeIndex = dotIndex;
    syncCarousel(parts, activeIndex);
    scrollToSlide(root, parts, activeIndex);
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

    const vertical = root.classList.contains("vertical");

    switch (event.key) {
      case vertical ? "ArrowUp" : "ArrowLeft":
        event.preventDefault();
        moveCarousel(root, parts, activeIndex, -1);
        break;
      case vertical ? "ArrowDown" : "ArrowRight":
        event.preventDefault();
        moveCarousel(root, parts, activeIndex, 1);
        break;
      case "Home":
        event.preventDefault();
        activeIndex = 0;
        syncCarousel(parts, activeIndex);
        scrollToSlide(root, parts, activeIndex);
        break;
      case "End":
        event.preventDefault();
        activeIndex = parts.slides.length - 1;
        syncCarousel(parts, activeIndex);
        scrollToSlide(root, parts, activeIndex);
        break;
      default:
        break;
    }
  });
}

for (const root of document.querySelectorAll(CAROUSEL_ROOT_SELECTOR)) {
  if (isCarouselRoot(root)) {
    initializeCarousel(root);
  }
}
