const navbar = document.querySelector(".navbar");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");
const focusableSelector = "a[href], button:not([disabled])";

function closeMenu({ restoreFocus = false } = {}) {
  navbar.classList.remove("is-open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open navigation menu");
  document.body.classList.remove("menu-open");

  if (restoreFocus) {
    menuToggle.focus();
  }
}

function openMenu() {
  navbar.classList.add("is-open");
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close navigation menu");
  document.body.classList.add("menu-open");

  const firstMenuLink = navLinks.querySelector("a");
  firstMenuLink.focus();
}

menuToggle.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";

  if (isOpen) {
    closeMenu();
  } else {
    openMenu();
  }
});

navLinks.addEventListener("click", (event) => {
  if (event.target.closest("a")) {
    closeMenu();
  }
});

document.addEventListener("click", (event) => {
  if (
    mobileBreakpoint.matches &&
    navbar.classList.contains("is-open") &&
    !navbar.contains(event.target)
  ) {
    closeMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navbar.classList.contains("is-open")) {
    closeMenu({ restoreFocus: true });
  }

  if (
    event.key === "Tab" &&
    mobileBreakpoint.matches &&
    navbar.classList.contains("is-open")
  ) {
    const focusableElements = [
      ...navbar.querySelectorAll(focusableSelector),
    ].filter((element) => element.offsetParent !== null);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
});

mobileBreakpoint.addEventListener("change", (event) => {
  if (!event.matches) {
    closeMenu();
  }
});
