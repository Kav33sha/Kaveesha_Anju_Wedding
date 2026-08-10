const weddingDate = new Date("2026-10-15T09:30:00");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqpzknvn";
const PETAL_COUNT = 8;
const PETAL_INTERVAL_MS = 900;
const MUSIC_AUTOPLAY_KEY = "weddingMusicAutoplay";
const animatedSections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".details-nav__links a, .details-nav__brand");
const countdownElements = {
  days: document.querySelector("[data-unit='days']"),
  hours: document.querySelector("[data-unit='hours']"),
  minutes: document.querySelector("[data-unit='minutes']"),
  seconds: document.querySelector("[data-unit='seconds']"),
};
const invitationTrigger = document.querySelector(".view-invitation");
const rsvpForm = document.querySelector("#rsvp-form");
const rsvpStatus = document.querySelector("#rsvp-status");
const petalShower = document.querySelector("#petal-shower");
const weddingMusic = document.querySelector("#wedding-music");
const musicToggle = document.querySelector("#music-toggle");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function updateCountdown() {
  if (!countdownElements.days) {
    return;
  }

  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    countdownElements.days.textContent = "00";
    countdownElements.hours.textContent = "00";
    countdownElements.minutes.textContent = "00";
    countdownElements.seconds.textContent = "00";
    return;
  }

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  countdownElements.days.textContent = String(days).padStart(2, "0");
  countdownElements.hours.textContent = String(hours).padStart(2, "0");
  countdownElements.minutes.textContent = String(minutes).padStart(2, "0");
  countdownElements.seconds.textContent = String(remainingSeconds).padStart(2, "0");
}

function setupScrollReveal() {
  if (!animatedSections.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    animatedSections.forEach((section) => section.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -40px 0px",
    }
  );

  animatedSections.forEach((section) => {
    if (!section.classList.contains("is-visible")) {
      observer.observe(section);
    }
  });
}

function setActiveNavLink(id) {
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    const isActive = href === `#${id}`;
    link.classList.toggle("is-active", isActive);
  });
}

function setupNavSpy() {
  const sections = document.querySelectorAll("main section[id], #top");
  if (!sections.length || !("IntersectionObserver" in window)) {
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveNavLink(visibleEntry.target.id);
      }
    },
    {
      threshold: [0.2, 0.45, 0.7],
      rootMargin: "-22% 0px -50% 0px",
    }
  );

  sections.forEach((section) => observer.observe(section));
}

function setupInvitationTransition() {
  if (!invitationTrigger) {
    return;
  }

  invitationTrigger.addEventListener("click", (event) => {
    if (prefersReducedMotion) {
      return;
    }

    event.preventDefault();
    const nextPage = invitationTrigger.getAttribute("href");
    sessionStorage.setItem(MUSIC_AUTOPLAY_KEY, "true");

    document.body.classList.add("invitation-opening");
    invitationTrigger.style.pointerEvents = "none";

    window.setTimeout(() => {
      window.location.href = nextPage;
    }, 1250);
  });
}

function setRsvpStatus(message, type) {
  if (!rsvpStatus) {
    return;
  }

  rsvpStatus.textContent = message;
  rsvpStatus.dataset.state = type;
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}`);
  }
}

function setupRsvpForm() {
  if (!rsvpForm) {
    return;
  }

  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(rsvpForm);
    const payload = {
      name: String(formData.get("name") || "").trim(),
      attendance: String(formData.get("attendance") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      message: String(formData.get("message") || "").trim(),
      submittedAt: new Date().toISOString(),
    };

    if (!FORMSPREE_ENDPOINT) {
      setRsvpStatus(
        "RSVP form is ready, but you still need to connect your Formspree endpoint in script.js.",
        "warning"
      );
      return;
    }

    const submitButton = rsvpForm.querySelector("button[type='submit']");
    if (submitButton instanceof HTMLButtonElement) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    setRsvpStatus("Sending your RSVP...", "pending");

    try {
      await postJson(FORMSPREE_ENDPOINT, payload);

      rsvpForm.reset();
      setRsvpStatus("Thank you. Your RSVP has been sent successfully.", "success");
    } catch (error) {
      setRsvpStatus("Sorry, we could not send your RSVP right now. Please try again.", "error");
    } finally {
      if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = false;
        submitButton.textContent = "Send RSVP";
      }
    }
  });
}

function createPetal() {
  if (!petalShower) {
    return;
  }

  const petal = document.createElement("span");
  petal.className = "petal-shower__petal";
  const left = Math.random() * 100;
  const size = 10 + Math.random() * 16;
  const drift = -40 + Math.random() * 80;
  const duration = 4.8 + Math.random() * 3.8;
  const delay = Math.random() * 1.8;

  petal.style.left = `${left}%`;
  petal.style.width = `${size}px`;
  petal.style.height = `${size * 1.55}px`;
  petal.style.setProperty("--petal-drift", `${drift}px`);
  petal.style.animationDuration = `${duration}s`;
  petal.style.animationDelay = `${delay}s`;
  petal.style.opacity = `${0.45 + Math.random() * 0.4}`;

  petalShower.appendChild(petal);

  window.setTimeout(() => {
    petal.remove();
  }, (duration + delay + 0.4) * 1000);
}

function setupPetalShower() {
  if (!petalShower || prefersReducedMotion) {
    return;
  }

  for (let index = 0; index < PETAL_COUNT; index += 1) {
    window.setTimeout(createPetal, index * 260);
  }

  window.setInterval(createPetal, PETAL_INTERVAL_MS);
}

function updateMusicToggle(isPlaying, isReady = true) {
  if (!musicToggle) {
    return;
  }

  const label = musicToggle.querySelector(".music-toggle__text");
  musicToggle.dataset.state = isReady ? (isPlaying ? "playing" : "paused") : "unavailable";
  musicToggle.setAttribute("aria-pressed", String(isPlaying));
  musicToggle.setAttribute("aria-label", isPlaying ? "Pause wedding music" : "Play wedding music");

  if (label) {
    label.textContent = isReady ? (isPlaying ? "Music On" : "Music Off") : "No Music File";
  }
}

async function tryPlayMusic() {
  if (!weddingMusic) {
    updateMusicToggle(false, false);
    return false;
  }

  try {
    await weddingMusic.play();
    updateMusicToggle(true, true);
    return true;
  } catch (error) {
    updateMusicToggle(false, true);
    return false;
  }
}

function setupWeddingMusic() {
  if (!musicToggle) {
    return;
  }

  if (!weddingMusic || weddingMusic.querySelectorAll("source").length === 0) {
    updateMusicToggle(false, false);
    musicToggle.disabled = true;
    return;
  }

  weddingMusic.volume = 0.45;
  updateMusicToggle(false, true);

  weddingMusic.addEventListener("play", () => updateMusicToggle(true, true));
  weddingMusic.addEventListener("pause", () => updateMusicToggle(false, true));
  weddingMusic.addEventListener("ended", () => updateMusicToggle(false, true));
  weddingMusic.addEventListener("error", () => {
    updateMusicToggle(false, false);
    musicToggle.disabled = true;
  });

  musicToggle.addEventListener("click", async () => {
    if (!weddingMusic) {
      return;
    }

    if (weddingMusic.paused) {
      await tryPlayMusic();
      return;
    }

    weddingMusic.pause();
  });

  const shouldAutoplay = sessionStorage.getItem(MUSIC_AUTOPLAY_KEY) === "true";
  if (shouldAutoplay) {
    sessionStorage.removeItem(MUSIC_AUTOPLAY_KEY);
    void tryPlayMusic();

    const resumeOnGesture = async () => {
      const played = await tryPlayMusic();
      if (played) {
        window.removeEventListener("pointerdown", resumeOnGesture);
        window.removeEventListener("keydown", resumeOnGesture);
      }
    };

    window.addEventListener("pointerdown", resumeOnGesture, { once: true });
    window.addEventListener("keydown", resumeOnGesture, { once: true });
  }
}

updateCountdown();
setupScrollReveal();
setupNavSpy();
setupInvitationTransition();
setupRsvpForm();
setupPetalShower();
setupWeddingMusic();
setActiveNavLink("top");

if (countdownElements.days) {
  setInterval(updateCountdown, 1000);
}
