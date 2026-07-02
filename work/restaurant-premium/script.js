const header = document.querySelector(".site-header");
const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

function updateHeader() {
  header.classList.toggle("is-scrolled", window.scrollY > 24);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.getAttribute("href");
    const target = document.querySelector(targetId);

    if (!target) {
      return;
    }

    event.preventDefault();
    target.scrollIntoView({
      behavior: motionQuery.matches ? "auto" : "smooth",
      block: "start"
    });
    history.pushState(null, "", targetId);
  });
});

const familyLightboxTrigger = document.querySelector(".family-lightbox-trigger");
const familyLightbox = document.querySelector(".family-lightbox");
const familyLightboxClose = document.querySelector(".family-lightbox-close");

function openFamilyLightbox() {
  if (!familyLightbox || !familyLightboxClose) {
    return;
  }

  familyLightbox.classList.add("is-open");
  familyLightbox.setAttribute("aria-hidden", "false");
  familyLightboxClose.focus();
}

function closeFamilyLightbox() {
  if (!familyLightbox || !familyLightboxTrigger) {
    return;
  }

  familyLightbox.classList.remove("is-open");
  familyLightbox.setAttribute("aria-hidden", "true");
  familyLightboxTrigger.focus();
}

if (familyLightboxTrigger && familyLightbox && familyLightboxClose) {
  familyLightboxTrigger.addEventListener("click", openFamilyLightbox);
  familyLightboxClose.addEventListener("click", closeFamilyLightbox);

  familyLightbox.addEventListener("click", (event) => {
    if (event.target === familyLightbox) {
      closeFamilyLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && familyLightbox.classList.contains("is-open")) {
      closeFamilyLightbox();
    }
  });
}

const revealItems = document.querySelectorAll(
  ".section, .feature, .dish-card, .gallery-experience-image, .guest-experience-card, .premium-footer-column"
);

revealItems.forEach((item, index) => {
  item.classList.add("reveal");
  item.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
});

if (motionQuery.matches) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -12% 0px",
    threshold: 0.12
  });

  revealItems.forEach((item) => revealObserver.observe(item));
}
