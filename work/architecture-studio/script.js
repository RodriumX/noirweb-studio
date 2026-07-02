const header = document.querySelector("[data-header]");
const menuToggle = document.querySelector("[data-menu-toggle]");
const mobileMenu = document.querySelector("[data-mobile-menu]");
const mobileLinks = document.querySelectorAll("[data-mobile-menu] a");
const sectionIds = ["studio", "projects", "services", "contact"];
const sectionLinks = sectionIds.reduce((links, sectionId) => {
  links[sectionId] = document.querySelectorAll(`a[href="#${sectionId}"]`);
  return links;
}, {});
const trackedSections = Array.from(
  document.querySelectorAll("[data-nav-section]"),
);
const visibleSections = new Map();
const revealSections = document.querySelectorAll(".reveal-section");
const parallaxImages = document.querySelectorAll("[data-parallax-image]");
const recognitionNumbers = document.querySelectorAll("[data-count-to]");
const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const cursorDeviceQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
let parallaxFrame = null;
let cursorFollower = null;
let cursorFrame = null;
let cursorX = 0;
let cursorY = 0;
let cursorFollowerX = 0;
let cursorFollowerY = 0;

const setHeaderState = () => {
  header.classList.toggle("is-scrolled", window.scrollY > 8);
};

const isNearPageBottom = () =>
  window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;

const closeMenu = () => {
  menuToggle.classList.remove("is-open");
  mobileMenu.classList.remove("is-open");
  document.body.classList.remove("is-menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
};

const toggleMenu = () => {
  const isOpen = menuToggle.classList.toggle("is-open");

  mobileMenu.classList.toggle("is-open", isOpen);
  document.body.classList.toggle("is-menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute(
    "aria-label",
    isOpen ? "Close navigation menu" : "Open navigation menu",
  );
};

const setActiveSection = (sectionId) => {
  Object.entries(sectionLinks).forEach(([linkSectionId, links]) => {
    const isActive = linkSectionId === sectionId;

    links.forEach((link) => {
      link.classList.toggle("is-active", isActive);

      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  });
};

const updateActiveSection = () => {
  if (isNearPageBottom()) {
    setActiveSection("contact");
    return;
  }

  if (!visibleSections.size) {
    setActiveSection(null);
    return;
  }

  const activeSection = Array.from(visibleSections.values()).sort(
    (firstSection, secondSection) =>
      firstSection.top - secondSection.top ||
      secondSection.ratio - firstSection.ratio,
  )[0];

  setActiveSection(activeSection.id);
};

const revealStaticSections = () => {
  revealSections.forEach((section) => section.classList.add("is-visible"));
};

const setRecognitionNumbersFinal = () => {
  recognitionNumbers.forEach((number) => {
    number.textContent = `${number.dataset.countTo}${number.dataset.countSuffix || ""}`;
    number.dataset.counted = "true";
  });
};

const animateRecognitionNumbers = () => {
  if (reduceMotionQuery.matches) {
    setRecognitionNumbersFinal();
    return;
  }

  recognitionNumbers.forEach((number) => {
    if (number.dataset.counted === "true") {
      return;
    }

    number.dataset.counted = "true";

    const target = Number(number.dataset.countTo);
    const suffix = number.dataset.countSuffix || "";
    const duration = 1100;
    const start = performance.now();

    const updateNumber = (timestamp) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(target * easedProgress);

      number.textContent = `${current}${suffix}`;

      if (progress < 1) {
        window.requestAnimationFrame(updateNumber);
      }
    };

    window.requestAnimationFrame(updateNumber);
  });
};

const updateImageParallax = () => {
  parallaxFrame = null;

  if (reduceMotionQuery.matches) {
    parallaxImages.forEach((image) =>
      image.style.setProperty("--parallax-y", "0px"),
    );
    return;
  }

  const viewportHeight = window.innerHeight;
  const maxOffset = window.innerWidth <= 760 ? 10 : 18;

  parallaxImages.forEach((image) => {
    const rect = image.parentElement.getBoundingClientRect();
    const distanceFromCenter =
      rect.top + rect.height / 2 - viewportHeight / 2;
    const progress = distanceFromCenter / (viewportHeight / 2);
    const offset = Math.max(-maxOffset, Math.min(maxOffset, -progress * 6));

    image.style.setProperty("--parallax-y", `${offset.toFixed(2)}px`);
  });
};

const requestImageParallaxUpdate = () => {
  if (!parallaxFrame) {
    parallaxFrame = window.requestAnimationFrame(updateImageParallax);
  }
};

const canUseCursorFollower = () =>
  cursorDeviceQuery.matches && !reduceMotionQuery.matches;

const updateCursorFollower = () => {
  if (!cursorFollower) {
    cursorFrame = null;
    return;
  }

  cursorFollowerX += (cursorX - cursorFollowerX) * 0.16;
  cursorFollowerY += (cursorY - cursorFollowerY) * 0.16;

  const scale = cursorFollower.classList.contains("is-interactive")
    ? 1.32
    : 0.82;

  cursorFollower.style.transform = `translate3d(${cursorFollowerX}px, ${cursorFollowerY}px, 0) translate(-50%, -50%) scale(${scale})`;
  cursorFrame = window.requestAnimationFrame(updateCursorFollower);
};

const startCursorFollower = () => {
  if (!canUseCursorFollower() || cursorFollower) {
    return;
  }

  cursorFollower = document.createElement("span");
  cursorFollower.className = "cursor-follower";
  cursorFollower.setAttribute("aria-hidden", "true");
  document.body.appendChild(cursorFollower);
};

const stopCursorFollower = () => {
  if (cursorFrame) {
    window.cancelAnimationFrame(cursorFrame);
    cursorFrame = null;
  }

  if (cursorFollower) {
    cursorFollower.remove();
    cursorFollower = null;
  }
};

const refreshCursorFollower = () => {
  if (canUseCursorFollower()) {
    startCursorFollower();
  } else {
    stopCursorFollower();
  }
};

const setCursorInteractiveState = (target) => {
  if (!cursorFollower) {
    return;
  }

  const isInteractive = Boolean(
    target.closest("a, button, .project-entry, .project-image-placeholder"),
  );

  cursorFollower.classList.toggle("is-interactive", isInteractive);
};

setHeaderState();
updateActiveSection();
refreshCursorFollower();
window.addEventListener(
  "scroll",
  () => {
    setHeaderState();
    updateActiveSection();
    requestImageParallaxUpdate();
  },
  { passive: true },
);
window.addEventListener(
  "pointermove",
  (event) => {
    if (!cursorFollower) {
      return;
    }

    cursorX = event.clientX;
    cursorY = event.clientY;
    cursorFollower.classList.add("is-visible");
    setCursorInteractiveState(event.target);

    if (!cursorFrame) {
      cursorFollowerX = cursorX;
      cursorFollowerY = cursorY;
      cursorFrame = window.requestAnimationFrame(updateCursorFollower);
    }
  },
  { passive: true },
);
window.addEventListener("pointerleave", () => {
  cursorFollower?.classList.remove("is-visible");
});
menuToggle.addEventListener("click", toggleMenu);
mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && mobileMenu.classList.contains("is-open")) {
    closeMenu();
    menuToggle.focus();
  }
});
window.addEventListener("resize", () => {
  if (window.innerWidth > 760) {
    closeMenu();
  }

  refreshCursorFollower();
  requestImageParallaxUpdate();
});

if ("IntersectionObserver" in window && trackedSections.length) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visibleSections.set(entry.target, {
            id: entry.target.dataset.navSection,
            ratio: entry.intersectionRatio,
            top: Math.abs(entry.boundingClientRect.top),
          });
        } else {
          visibleSections.delete(entry.target);
        }
      });

      updateActiveSection();
    },
    {
      rootMargin: "-30% 0px -45% 0px",
      threshold: [0, 0.2, 0.45, 0.7],
    },
  );

  trackedSections.forEach((section) => sectionObserver.observe(section));
}

if (reduceMotionQuery.matches) {
  revealStaticSections();
} else if ("IntersectionObserver" in window && revealSections.length) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");

          if (entry.target.classList.contains("recognition")) {
            animateRecognitionNumbers();
          }

          observer.unobserve(entry.target);
        }
      });
    },
    {
      rootMargin: "0px 0px -12% 0px",
      threshold: 0.12,
    },
  );

  revealSections.forEach((section) => revealObserver.observe(section));
} else {
  revealStaticSections();
}

reduceMotionQuery.addEventListener("change", () => {
  revealStaticSections();
  setRecognitionNumbersFinal();
  refreshCursorFollower();
  requestImageParallaxUpdate();
});
cursorDeviceQuery.addEventListener("change", refreshCursorFollower);
requestImageParallaxUpdate();
