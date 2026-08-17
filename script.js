const weddingDate = new Date("2026-10-15T09:30:00");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqpzknvn";
const PETAL_COUNT = 8;
const PETAL_INTERVAL_MS = 900;
const MUSIC_AUTOPLAY_KEY = "weddingMusicAutoplay";
const MUSIC_STOPPED_KEY = "weddingMusicStopped";
const FIREWORK_PALETTE = [
  { hue: 0, core: "#ffd35a", glow: "#ff9f1c" },
  { hue: 10, core: "#ffdca8", glow: "#ffb347" },
  { hue: 20, core: "#ffe8bf", glow: "#ff8f3f" },
  { hue: 138, core: "#b8ffe2", glow: "#1cac78" },
];
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
const fireworksTransition = document.querySelector("#fireworks-transition");
const guestNameDisplay = document.querySelector("#personalized-guest-name");
const guestNameInput = document.querySelector("#guest-link-name");
const guestLinkButton = document.querySelector("#copy-guest-link");
const guestLinkStatus = document.querySelector("#guest-link-status");
const guestLinkTool = document.querySelector("#guest-link-tool");
const guestEditorLink = document.querySelector("#open-guest-editor");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const DEFAULT_GUEST_NAME = "Your Name Here";
const EDIT_MODE_PARAM = "edit";
const EDIT_MODE_VALUE = "1";
const GUEST_TOKEN_PARAM = "g";
const LEGACY_GUEST_PARAM = "guest";
const GUEST_TOKEN_KEY = "KaveeshaAnjuWeddingInvite2026";
const FIREWORK_BURST_COUNT = 11;

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
    const nextPage = invitationTrigger.getAttribute("href");
    const searchParams = new URLSearchParams(window.location.search);
    const guestToken = searchParams.get(GUEST_TOKEN_PARAM);
    const legacyGuestParam = searchParams.get(LEGACY_GUEST_PARAM);
    const editParam = searchParams.get(EDIT_MODE_PARAM);
    const destination = new URL(nextPage || "details.html", window.location.href);

    if (guestToken) {
      destination.searchParams.set(GUEST_TOKEN_PARAM, guestToken);
    }

    if (!guestToken && legacyGuestParam) {
      destination.searchParams.set(LEGACY_GUEST_PARAM, legacyGuestParam);
    }

    if (editParam === EDIT_MODE_VALUE) {
      destination.searchParams.set(EDIT_MODE_PARAM, EDIT_MODE_VALUE);
    }

    sessionStorage.setItem(MUSIC_AUTOPLAY_KEY, "true");
    invitationTrigger.href = destination.toString();
  });
}

function createFireworkBurst(index) {
  const burst = document.createElement("span");
  burst.className = "fireworks-transition__burst";
  burst.setAttribute("aria-hidden", "true");

  const rocket = document.createElement("span");
  rocket.className = "fireworks-transition__rocket";

  const core = document.createElement("span");
  core.className = "fireworks-transition__core";

  const sparkleCount = 18 + Math.floor(Math.random() * 10);
  const emberCount = 14 + Math.floor(Math.random() * 8);
  const left = 14 + Math.random() * 72;
  const top = 22 + Math.random() * 44;
  const delay = index * 120;
  const size = 150 + Math.random() * 120;
  const palette = FIREWORK_PALETTE[index % FIREWORK_PALETTE.length];
  const rise = 90 + Math.random() * 120;
  const drift = -30 + Math.random() * 60;

  burst.style.left = `${left}%`;
  burst.style.top = `${top}%`;
  burst.style.width = `${size}px`;
  burst.style.height = `${size}px`;
  burst.style.animationDelay = `${delay}ms`;
  burst.style.setProperty("--firework-hue", `${palette.hue}deg`);
  burst.style.setProperty("--firework-core", palette.core);
  burst.style.setProperty("--firework-glow", palette.glow);
  burst.style.setProperty("--rocket-rise", `${rise}px`);
  burst.style.setProperty("--rocket-drift", `${drift}px`);

  burst.appendChild(rocket);
  burst.appendChild(core);

  for (let sparkleIndex = 0; sparkleIndex < sparkleCount; sparkleIndex += 1) {
    const sparkle = document.createElement("span");
    sparkle.className = "fireworks-transition__spark";
    const angle = -155 + Math.random() * 130;
    const distance = 50 + Math.random() * 92;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    sparkle.style.setProperty("--spark-x", `${x.toFixed(2)}px`);
    sparkle.style.setProperty("--spark-y", `${y.toFixed(2)}px`);
    sparkle.style.setProperty("--spark-rotate", `${-28 + Math.random() * 56}deg`);
    sparkle.style.setProperty("--spark-thickness", `${1.8 + Math.random() * 2}px`);
    sparkle.style.setProperty("--spark-length", `${42 + Math.random() * 54}px`);
    sparkle.style.setProperty("--spark-delay", `${440 + Math.random() * 130}ms`);
    sparkle.style.setProperty("--spark-duration", `${660 + Math.random() * 180}ms`);
    burst.appendChild(sparkle);
  }

  for (let emberIndex = 0; emberIndex < emberCount; emberIndex += 1) {
    const ember = document.createElement("span");
    ember.className = "fireworks-transition__ember";
    ember.style.setProperty("--ember-x", `${-56 + Math.random() * 112}px`);
    ember.style.setProperty("--ember-y", `${-72 - Math.random() * 54}px`);
    ember.style.setProperty("--ember-fall", `${44 + Math.random() * 42}px`);
    ember.style.setProperty("--ember-delay", `${520 + Math.random() * 180}ms`);
    ember.style.setProperty("--ember-duration", `${780 + Math.random() * 240}ms`);
    ember.style.setProperty("--ember-size", `${2 + Math.random() * 3}px`);
    burst.appendChild(ember);
  }

  return burst;
}

function launchFireworksTransition() {
  if (!fireworksTransition || prefersReducedMotion) {
    return;
  }

  fireworksTransition.replaceChildren();
  fireworksTransition.hidden = false;
  fireworksTransition.classList.remove("is-active");
  void fireworksTransition.offsetWidth;
  fireworksTransition.classList.add("is-active");

  for (let index = 0; index < FIREWORK_BURST_COUNT; index += 1) {
    fireworksTransition.appendChild(createFireworkBurst(index));
  }

  window.setTimeout(() => {
    fireworksTransition.classList.remove("is-active");
    fireworksTransition.hidden = true;
    fireworksTransition.replaceChildren();
  }, 1500);
}

function setupAdminEditRedirect() {
  if (!invitationTrigger) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  if (params.get(EDIT_MODE_PARAM) !== EDIT_MODE_VALUE) {
    return;
  }

  const destination = new URL("details.html", window.location.href);
  destination.searchParams.set(EDIT_MODE_PARAM, EDIT_MODE_VALUE);

  const guestToken = params.get(GUEST_TOKEN_PARAM);
  const legacyGuestParam = params.get(LEGACY_GUEST_PARAM);

  if (guestToken) {
    destination.searchParams.set(GUEST_TOKEN_PARAM, guestToken);
  }

  if (!guestToken && legacyGuestParam) {
    destination.searchParams.set(LEGACY_GUEST_PARAM, legacyGuestParam);
  }

  window.location.replace(destination.toString());
}

function sanitizeGuestName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function encodeGuestName(guestName) {
  const sanitizedName = sanitizeGuestName(guestName);
  if (!sanitizedName) {
    return "";
  }

  const bytes = Array.from(sanitizedName, (character, index) => {
    const keyCode = GUEST_TOKEN_KEY.charCodeAt(index % GUEST_TOKEN_KEY.length);
    return character.charCodeAt(0) ^ keyCode;
  });

  const binary = bytes.map((byte) => String.fromCharCode(byte)).join("");
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeGuestToken(token) {
  if (!token) {
    return "";
  }

  try {
    const normalizedToken = String(token).replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalizedToken.length % 4 === 0 ? "" : "=".repeat(4 - (normalizedToken.length % 4));
    const binary = window.atob(normalizedToken + padding);
    const decoded = Array.from(binary, (character, index) => {
      const keyCode = GUEST_TOKEN_KEY.charCodeAt(index % GUEST_TOKEN_KEY.length);
      return String.fromCharCode(character.charCodeAt(0) ^ keyCode);
    }).join("");

    return sanitizeGuestName(decoded);
  } catch (error) {
    return "";
  }
}

function setGuestLinkStatus(message, type) {
  if (!guestLinkStatus) {
    return;
  }

  guestLinkStatus.textContent = message;
  guestLinkStatus.dataset.state = type;
}

function buildGuestLink(guestName) {
  const url = new URL("index.html", window.location.href);
  url.searchParams.delete(EDIT_MODE_PARAM);
  url.searchParams.delete(LEGACY_GUEST_PARAM);
  url.searchParams.delete(GUEST_TOKEN_PARAM);

  const guestToken = encodeGuestName(guestName);

  if (guestToken) {
    url.searchParams.set(GUEST_TOKEN_PARAM, guestToken);
  }

  return url.toString();
}

function updateGuestInvitation(name) {
  if (!guestNameDisplay) {
    return;
  }

  guestNameDisplay.textContent = name || DEFAULT_GUEST_NAME;
  guestNameDisplay.classList.toggle("is-empty", !name);
}

function isEditModeEnabled(params) {
  return params.get(EDIT_MODE_PARAM) === EDIT_MODE_VALUE;
}

function setupGuestEditorAccess() {
  const params = new URLSearchParams(window.location.search);
  const isEditMode = isEditModeEnabled(params);

  if (guestEditorLink) {
    guestEditorLink.hidden = !isEditMode;
    guestEditorLink.href = "details.html?edit=1";
  }
}

function setupGuestInvitation() {
  if (!guestNameDisplay) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const initialName =
    decodeGuestToken(params.get(GUEST_TOKEN_PARAM)) || sanitizeGuestName(params.get(LEGACY_GUEST_PARAM));
  const isEditMode = isEditModeEnabled(params);

  updateGuestInvitation(initialName);

  if (guestLinkTool) {
    guestLinkTool.hidden = !isEditMode;
  }

  if (!isEditMode) {
    return;
  }

  if (guestNameInput) {
    guestNameInput.value = initialName;

    guestNameInput.addEventListener("input", () => {
      const nextName = sanitizeGuestName(guestNameInput.value);
      updateGuestInvitation(nextName);
      setGuestLinkStatus(nextName ? "Guest preview updated." : "Guest name cleared.", "info");
    });
  }

  if (!guestLinkButton) {
    return;
  }

  guestLinkButton.addEventListener("click", async () => {
    const guestName = sanitizeGuestName(guestNameInput ? guestNameInput.value : "");
    const nextUrl = buildGuestLink(guestName);

    window.history.replaceState({}, "", nextUrl);
    updateGuestInvitation(guestName);

    try {
      await navigator.clipboard.writeText(nextUrl);
      setGuestLinkStatus(
        guestName ? `Copied guest link for ${guestName}.` : "Copied general invitation link.",
        "success"
      );
    } catch (error) {
      setGuestLinkStatus("Link updated in the address bar. Please copy it manually.", "warning");
    }
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

function setMusicStoppedPreference(isStopped) {
  try {
    if (isStopped) {
      sessionStorage.setItem(MUSIC_STOPPED_KEY, "true");
      return;
    }

    sessionStorage.removeItem(MUSIC_STOPPED_KEY);
  } catch (error) {
    // Ignore storage issues and continue with in-memory playback only.
  }
}

function shouldAutoplayMusic() {
  try {
    return (
      sessionStorage.getItem(MUSIC_AUTOPLAY_KEY) === "true" &&
      sessionStorage.getItem(MUSIC_STOPPED_KEY) !== "true"
    );
  } catch (error) {
    return false;
  }
}

async function tryPlayMusic() {
  if (!weddingMusic) {
    updateMusicToggle(false, false);
    return false;
  }

  try {
    await weddingMusic.play();
    setMusicStoppedPreference(false);
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
      setMusicStoppedPreference(false);
      await tryPlayMusic();
      return;
    }

    setMusicStoppedPreference(true);
    weddingMusic.pause();
  });

  const shouldAutoplay = shouldAutoplayMusic();
  if (shouldAutoplay) {
    try {
      sessionStorage.removeItem(MUSIC_AUTOPLAY_KEY);
    } catch (error) {
      // Ignore storage issues and attempt playback anyway.
    }
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
setupAdminEditRedirect();
setupInvitationTransition();
setupGuestEditorAccess();
setupGuestInvitation();
setupRsvpForm();
setupPetalShower();
setupWeddingMusic();
setActiveNavLink("top");

if (countdownElements.days) {
  setInterval(updateCountdown, 1000);
}
