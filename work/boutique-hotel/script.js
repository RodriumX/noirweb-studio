const header = document.querySelector(".site-header");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const internalLinks = document.querySelectorAll('a[href^="#"]');
const slides = document.querySelectorAll(".slide");
const slideIndicators = document.querySelectorAll(".slide-indicator");
const travelItems = document.querySelectorAll(".travel-item");
const locationVisual = document.querySelector(".location-visual");
const locationImageCurrent = document.querySelector(".location-image-current");
const locationImageNext = document.querySelector(".location-image-next");
const locationSection = document.querySelector("#location");
const observedSections = document.querySelectorAll(
  "#hero, #house, #rooms, #experiences, #gallery, #location, #reserve"
);
const defaultLocationImage = "assets/location-countryside-1536.webp";
const defaultLocationPosition = "50% center";
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

let activeSlide = 0;
let navTicking = false;
let activeRouteImage = "";
let locationRouteFrame;
const anchorLandingAdjustment = 32;

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

function closeMenu() {
  navToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  header.classList.remove("is-open");
}

function showNextSlide() {
  if (slides.length < 2) return;

  showSlide((activeSlide + 1) % slides.length);
}

function showSlide(nextSlide) {
  slides[activeSlide].classList.remove("is-active");
  slideIndicators[activeSlide]?.classList.remove("is-active");

  activeSlide = nextSlide;

  slides[activeSlide].classList.add("is-active");
  slideIndicators[activeSlide]?.classList.add("is-active");
}

function setActiveNav(sectionId) {
  navItems.forEach((link) => {
    const isActive = link.getAttribute("href") === `#${sectionId}`;

    link.classList.toggle("is-active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "true");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function getScrollOffset() {
  return header.offsetHeight;
}

function scrollToSection(section) {
  const targetTop = Math.max(
    0,
    section.offsetTop - getScrollOffset() + anchorLandingAdjustment
  );

  window.scrollTo({
    top: targetTop,
    behavior: "smooth",
  });
}

function updateActiveNav() {
  const offsetLine =
    window.scrollY + getScrollOffset() - anchorLandingAdjustment + 1;
  let currentSectionId = "hero";

  observedSections.forEach((section) => {
    if (section.offsetTop <= offsetLine) {
      currentSectionId = section.id;
    }
  });

  setActiveNav(currentSectionId);
}

function requestActiveNavUpdate() {
  if (navTicking) return;

  navTicking = true;
  window.requestAnimationFrame(() => {
    updateActiveNav();
    navTicking = false;
  });
}

function showLocationRoute(src, position = defaultLocationPosition) {
  if (!locationVisual || !locationImageCurrent || !locationImageNext) return;
  if (!src) return;

  if (locationImageNext.getAttribute("src") !== src) {
    locationVisual.classList.remove("is-showing-route");
    locationImageNext.src = src;
    locationImageNext.offsetWidth;
  }

  locationImageNext.style.objectPosition = position;

  window.cancelAnimationFrame(locationRouteFrame);
  locationRouteFrame = window.requestAnimationFrame(() => {
    locationVisual.classList.add("is-showing-route");
  });

  activeRouteImage = src;
}

function hideLocationRoute() {
  if (!locationVisual || !locationImageNext) return;

  window.cancelAnimationFrame(locationRouteFrame);
  locationVisual.classList.remove("is-showing-route");
  activeRouteImage = "";

  if (prefersReducedMotion.matches) {
    return;
  }
}

navToggle.addEventListener("click", () => {
  const isOpen = navToggle.getAttribute("aria-expanded") === "true";

  navToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open");
  header.classList.toggle("is-open");
});

internalLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const sectionId = link.getAttribute("href")?.slice(1);
    const section = sectionId ? document.getElementById(sectionId) : null;

    if (!section) return;

    event.preventDefault();
    if (navLinks.contains(link)) closeMenu();

    scrollToSection(section);
    setActiveNav(sectionId);
  });
});

slideIndicators.forEach((indicator, index) => {
  indicator.addEventListener("click", () => showSlide(index));
});

travelItems.forEach((item) => {
  const routeImage = item.dataset.image;
  const routePosition = item.dataset.position || defaultLocationPosition;

  if (routeImage) {
    const preloadImage = new Image();
    preloadImage.src = routeImage;
  }

  item.addEventListener("mouseenter", () => {
    if (routeImage) showLocationRoute(routeImage, routePosition);
  });

  item.addEventListener("focus", () => {
    window.requestAnimationFrame(() => {
      if (routeImage && item.matches(":focus-visible")) {
        showLocationRoute(routeImage, routePosition);
      }
    });
  });

  item.addEventListener("mouseleave", () => {
    hideLocationRoute();
  });

  item.addEventListener("blur", () => {
    hideLocationRoute();
  });
});

locationSection?.addEventListener("mouseleave", hideLocationRoute);

window.addEventListener("scroll", updateHeader, { passive: true });
window.addEventListener("scroll", requestActiveNavUpdate, { passive: true });
window.addEventListener("resize", requestActiveNavUpdate);

updateHeader();
updateActiveNav();
setInterval(showNextSlide, 5200);
