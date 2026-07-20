const navbar = document.querySelector(".navbar");
const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const mobileBreakpoint = window.matchMedia("(max-width: 768px)");
const focusableSelector = "a[href], button:not([disabled])";
const revealMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const inquiryForm = document.querySelector("[data-inquiry-form]");
const revealGroups = [
  [".hero-content > .eyebrow", ".hero-content > h1", ".hero-content > p"],
  ["#services .section-title", "#services .services-grid"],
  ["#projects .section-title", "#projects .projects-intro", "#projects .case-study"],
  [".process .process-intro", ".process .process-grid", ".process .expectation-block"],
  [".about-noirweb .about-intro", ".about-noirweb .about-principles", ".about-noirweb .about-closing"],
  [
    "#contact .contact-box > .eyebrow",
    "#contact .contact-box > h2",
    "#contact .contact-copy",
    "#contact .inquiry-form .form-note",
    "#contact .inquiry-form .form-field",
    "#contact .contact-note",
  ],
];
const revealItems = revealGroups.flatMap((group) =>
  group.flatMap((selector, index) =>
    [...document.querySelectorAll(selector)].map((element) => ({
      element,
      delay: index * 50,
    })),
  ),
);
let revealObserver = null;

function revealAllItems() {
  revealItems.forEach(({ element }) => {
    element.classList.add("is-revealed");
  });
}

function initializeScrollReveals() {
  if (!revealItems.length) {
    return;
  }

  revealItems.forEach(({ element, delay }) => {
    element.classList.add("reveal-item");
    element.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (revealMotionQuery.matches || !("IntersectionObserver" in window)) {
    revealAllItems();
    return;
  }

  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -12% 0px",
    },
  );

  revealItems.forEach(({ element }) => {
    revealObserver.observe(element);
  });
}

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

initializeScrollReveals();

revealMotionQuery.addEventListener("change", (event) => {
  if (event.matches) {
    revealObserver?.disconnect();
    revealAllItems();
  }
});

if (inquiryForm) {
  const submitButton = inquiryForm.querySelector("[type='submit']");
  const formStatus = inquiryForm.querySelector(".form-status");
  const defaultButtonLabel = submitButton.textContent;
  let isSubmitting = false;

  const setFormStatus = (state, message) => {
    formStatus.className = `form-status${state ? ` is-${state}` : ""}`;
    formStatus.textContent = message;
  };

  inquiryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting || !inquiryForm.reportValidity()) {
      return;
    }

    isSubmitting = true;
    submitButton.disabled = true;
    submitButton.textContent = "Sending Inquiry…";
    inquiryForm.setAttribute("aria-busy", "true");
    setFormStatus("loading", "Sending your inquiry securely…");

    const formData = new FormData(inquiryForm);
    const payload = Object.fromEntries(formData.entries());
    const inquiryId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    try {
      const response = await fetch(inquiryForm.action, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": inquiryId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Inquiry request failed");
      }

      inquiryForm.reset();
      setFormStatus(
        "success",
        "Thank you — your inquiry has been sent. We'll be in touch soon.",
      );
    } catch {
      setFormStatus(
        "error",
        "We couldn't send your inquiry right now. Please try again or email noirwebstudio@gmail.com.",
      );
    } finally {
      isSubmitting = false;
      submitButton.disabled = false;
      submitButton.textContent = defaultButtonLabel;
      inquiryForm.removeAttribute("aria-busy");
    }
  });
}
