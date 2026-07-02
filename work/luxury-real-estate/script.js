"use strict";

const initApp = () => {
  const root = document.documentElement;
  const header = document.querySelector(".site-header");
  const navMenu = document.querySelector(".nav-menu");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll(".nav-panel a");
  const activeNavLinks = document.querySelectorAll(".nav-links a");
  const anchorLinks = document.querySelectorAll('a[href^="#"]:not([href="#"])');
  const marketPresence = document.querySelector(".market-presence");
  const marketCounters = document.querySelectorAll("[data-count]");
  const desktopBreakpoint = window.matchMedia("(min-width: 64rem)");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const navSections = [
    { hash: "#home", element: document.getElementById("home") },
    {
      hash: "#properties",
      element: document.querySelector(".featured-properties"),
    },
    { hash: "#about", element: document.querySelector(".about-estates") },
    { hash: "#market", element: document.querySelector(".market-presence") },
    { hash: "#stories", element: document.querySelector(".client-stories") },
  ].filter(({ element }) => element);

  root.classList.add("js");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => root.classList.add("is-ready"));
  });

  const closeMenu = () => {
    if (!desktopBreakpoint.matches && navMenu?.classList.contains("is-open")) {
      navMenu.classList.remove("is-open");
      navToggle?.setAttribute("aria-label", "Abrir menu de navegacion");
      navToggle?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    }
  };

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 24);
  };

  const setActiveNavLink = (hash) => {
    activeNavLinks.forEach((link) => {
      if (link.getAttribute("href") === hash) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };

  const updateActiveNavigation = () => {
    const headerHeight = header?.offsetHeight ?? 0;
    const activationPoint = headerHeight + window.innerHeight * 0.34;
    const activeSection = navSections.find(({ element }) => {
      const rect = element.getBoundingClientRect();

      return rect.top <= activationPoint && rect.bottom > activationPoint;
    });

    setActiveNavLink(activeSection?.hash);
  };

  let activeNavigationFrame;

  const requestActiveNavigationUpdate = () => {
    if (activeNavigationFrame) {
      return;
    }

    activeNavigationFrame = requestAnimationFrame(() => {
      activeNavigationFrame = undefined;
      updateActiveNavigation();
    });
  };

  let scrollAnimationFrame;

  const stopAnimatedScroll = () => {
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = undefined;
    }
  };

  const scrollToTarget = (target, hash) => {
    const startPosition = window.scrollY;
    let targetPosition =
      target === document.getElementById("home")
        ? 0
        : target.getBoundingClientRect().top + startPosition;

    if (hash === "#consultation") {
      const consultationContent = document.querySelector(
        ".private-consultation__inner"
      );
      const headerHeight = header?.offsetHeight ?? 0;

      if (consultationContent) {
        const contentRect = consultationContent.getBoundingClientRect();
        const contentCenter =
          contentRect.top + startPosition + contentRect.height / 2;
        const viewportCenter = (window.innerHeight + headerHeight) / 2;

        targetPosition = contentCenter - viewportCenter;
      }
    }

    const distance = targetPosition - startPosition;

    if (reduceMotion.matches || Math.abs(distance) < 2) {
      window.scrollTo(0, targetPosition);
      history.pushState(null, "", hash);
      return;
    }

    stopAnimatedScroll();

    const duration = Math.min(1200, Math.max(850, Math.abs(distance) * 0.45));
    const startTime = performance.now();

    const animateScroll = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo(0, startPosition + distance * easedProgress);

      if (progress < 1) {
        scrollAnimationFrame = requestAnimationFrame(animateScroll);
      } else {
        scrollAnimationFrame = undefined;
        updateActiveNavigation();
        history.pushState(null, "", hash);
      }
    };

    scrollAnimationFrame = requestAnimationFrame(animateScroll);
  };

  const animateCounter = (counter) => {
    const target = Number(counter.dataset.count);
    const prefix = counter.dataset.prefix ?? "";
    const suffix = counter.dataset.suffix ?? "";
    const duration = 1800;
    const startTime = performance.now();

    const updateCounter = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 4);
      const currentValue = Math.round(target * easedProgress);

      counter.textContent = `${prefix}${currentValue}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  const revealMarketPresence = () => {
    marketPresence?.classList.add("is-visible");

    if (!reduceMotion.matches) {
      marketCounters.forEach((counter) => animateCounter(counter));
    }
  };

  if (marketPresence) {
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      revealMarketPresence();
    } else {
      const marketObserver = new IntersectionObserver(
        (entries, observer) => {
          if (entries[0].isIntersecting) {
            revealMarketPresence();
            observer.disconnect();
          }
        },
        { threshold: 0.25 }
      );

      marketObserver.observe(marketPresence);
    }
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = navMenu?.classList.toggle("is-open") ?? false;

    navToggle?.setAttribute(
      "aria-label",
      isOpen ? "Cerrar menu de navegacion" : "Abrir menu de navegacion"
    );
    navToggle?.setAttribute("aria-expanded", String(isOpen));
    document.body.classList.toggle(
      "menu-open",
      isOpen && !desktopBreakpoint.matches
    );
  });

  navLinks.forEach((link) => link.addEventListener("click", closeMenu));

  anchorLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      const target = hash ? document.querySelector(hash) : null;

      if (!target) {
        return;
      }

      event.preventDefault();
      closeMenu();
      setActiveNavLink(hash);
      scrollToTarget(target, hash);
    });
  });

  ["wheel", "touchstart"].forEach((eventName) => {
    window.addEventListener(eventName, stopAnimatedScroll, { passive: true });
  });

  document.addEventListener("keydown", (event) => {
    if (
      ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(
        event.key
      )
    ) {
      stopAnimatedScroll();
    }
  });

  desktopBreakpoint.addEventListener("change", () => {
    document.body.classList.remove("menu-open");
    navMenu?.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Abrir menu de navegacion");
    updateActiveNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navMenu?.classList.contains("is-open")) {
      closeMenu();
      navToggle?.focus();
    }
  });

  window.addEventListener(
    "scroll",
    () => {
      updateHeader();
      requestActiveNavigationUpdate();
    },
    { passive: true }
  );
  window.addEventListener("resize", requestActiveNavigationUpdate);
  navToggle?.setAttribute("aria-expanded", "false");
  updateHeader();
  updateActiveNavigation();
};

document.addEventListener("DOMContentLoaded", initApp);
