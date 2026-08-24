const weddingDate = new Date("2026-10-15T09:30:00");
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqpzknvn";
const PETAL_COUNT = 8;
const PETAL_INTERVAL_MS = 900;
const MUSIC_AUTOPLAY_KEY = "weddingMusicAutoplay";
const MUSIC_STOPPED_KEY = "weddingMusicStopped";
const INVITATION_PETAL_COUNT = 30;
const INVITATION_OPEN_DELAY_MS = 1500;
const PETAL_START_STAGGER_MS = 260;
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
const invitationTransition = document.querySelector("#invitation-transition");
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
let petalIntervalId = null;
let hasStartedPetalShower = false;

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
    event.preventDefault();

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
    launchInvitationTransition(invitationTrigger);
    invitationTrigger.setAttribute("aria-disabled", "true");
    invitationTrigger.style.pointerEvents = "none";

    window.setTimeout(() => {
      window.location.href = destination.toString();
    }, INVITATION_OPEN_DELAY_MS);
  });
}

function getButtonBorderPoint(triggerBounds, transitionBounds, progress) {
  if (!triggerBounds) {
    return {
      x: transitionBounds.width / 2,
      y: transitionBounds.height * 0.72,
    };
  }

  const localLeft = triggerBounds.left - transitionBounds.left;
  const localTop = triggerBounds.top - transitionBounds.top;
  const width = triggerBounds.width;
  const height = triggerBounds.height;
  const perimeter = width * 2 + height * 2;
  const distance = progress * perimeter;

  if (distance <= width) {
    return { x: localLeft + distance, y: localTop };
  }

  if (distance <= width + height) {
    return { x: localLeft + width, y: localTop + (distance - width) };
  }

  if (distance <= width * 2 + height) {
    return { x: localLeft + width - (distance - width - height), y: localTop + height };
  }

  return {
    x: localLeft,
    y: localTop + height - (distance - width * 2 - height),
  };
}

function createInvitationPetal(index, originX, originY) {
  const petal = document.createElement("span");
  petal.className = "invitation-transition__petal";
  petal.setAttribute("aria-hidden", "true");

  const size = 9 + Math.random() * 10;
  const burstX = -180 + Math.random() * 360;
  const burstY = -250 - Math.random() * 130;
  const duration = 1.35 + Math.random() * 0.55;
  const delay = index * 28;
  const rotate = -45 + Math.random() * 90;
  const hue = 202 + Math.random() * 12;

  petal.style.left = `${originX}px`;
  petal.style.top = `${originY}px`;
  petal.style.width = `${size}px`;
  petal.style.height = `${size * 1.55}px`;
  petal.style.setProperty("--petal-burst-x", `${burstX}px`);
  petal.style.setProperty("--petal-burst-y", `${burstY}px`);
  petal.style.setProperty("--petal-rotate", `${rotate}deg`);
  petal.style.setProperty("--petal-hue", `${hue}deg`);
  petal.style.animationDelay = `${delay}ms`;
  petal.style.animationDuration = `${duration}s`;
  petal.style.opacity = `${0.78 + Math.random() * 0.18}`;

  return petal;
}

function launchInvitationTransition(triggerElement) {
  if (!invitationTransition || prefersReducedMotion) {
    return;
  }

  const transitionBounds = invitationTransition.getBoundingClientRect();
  const triggerBounds = (triggerElement || invitationTrigger)?.getBoundingClientRect();

  invitationTransition.replaceChildren();
  invitationTransition.hidden = false;
  invitationTransition.classList.remove("is-active");
  void invitationTransition.offsetWidth;
  invitationTransition.classList.add("is-active");

  for (let index = 0; index < INVITATION_PETAL_COUNT; index += 1) {
    const progress = index / INVITATION_PETAL_COUNT;
    const borderPoint = getButtonBorderPoint(triggerBounds, transitionBounds, progress);
    invitationTransition.appendChild(createInvitationPetal(index, borderPoint.x, borderPoint.y));
  }

  window.setTimeout(() => {
    invitationTransition.classList.remove("is-active");
    invitationTransition.hidden = true;
    invitationTransition.replaceChildren();
  }, INVITATION_OPEN_DELAY_MS + 120);
}

function createHeart(index) {
  const heart = document.createElement("span");
  heart.className = "heart-transition__heart";
  heart.setAttribute("aria-hidden", "true");
  heart.textContent = "❤";

  const startX = 38 + Math.random() * 24;
  const drift = -90 + Math.random() * 180;
  const sway = 16 + Math.random() * 18;
  const duration = 1350 + Math.random() * 500;
  const delay = index * 70;
  const scale = 0.9 + Math.random() * 0.8;
  const rotate = -16 + Math.random() * 32;

  heart.style.left = `${startX}%`;
  heart.style.setProperty("--heart-drift", `${drift}px`);
  heart.style.setProperty("--heart-sway", `${sway}px`);
  heart.style.setProperty("--heart-scale", scale.toFixed(2));
  heart.style.setProperty("--heart-rotate", `${rotate}deg`);
  heart.style.animationDelay = `${delay}ms`;
  heart.style.animationDuration = `${duration}ms`;

  return heart;
}

function launchHeartTransition() {
  if (!heartTransition || prefersReducedMotion) {
    return;
  }

  heartTransition.replaceChildren();
  heartTransition.hidden = false;
  heartTransition.classList.remove("is-active");
  void heartTransition.offsetWidth;
  heartTransition.classList.add("is-active");

  for (let index = 0; index < HEART_BURST_COUNT; index += 1) {
    heartTransition.appendChild(createHeart(index));
  }

  window.setTimeout(() => {
    heartTransition.classList.remove("is-active");
    heartTransition.hidden = true;
    heartTransition.replaceChildren();
  }, INVITATION_OPEN_DELAY_MS + 120);
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

  const startPetalShower = () => {
    if (hasStartedPetalShower || document.hidden) {
      return;
    }

    hasStartedPetalShower = true;

    for (let index = 0; index < PETAL_COUNT; index += 1) {
      window.setTimeout(() => {
        if (!document.hidden) {
          createPetal();
        }
      }, index * PETAL_START_STAGGER_MS);
    }

    if (!petalIntervalId) {
      petalIntervalId = window.setInterval(() => {
        if (!document.hidden) {
          createPetal();
        }
      }, PETAL_INTERVAL_MS);
    }
  };

  const stopPetalShower = () => {
    if (petalIntervalId) {
      window.clearInterval(petalIntervalId);
      petalIntervalId = null;
    }
    hasStartedPetalShower = false;
    petalShower.replaceChildren();
  };

  const syncPetalShower = () => {
    if (document.hidden) {
      stopPetalShower();
      return;
    }

    startPetalShower();
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry) {
          return;
        }

        if (entry.isIntersecting) {
          syncPetalShower();
          return;
        }

        stopPetalShower();
      },
      {
        threshold: 0.01,
      }
    );

    observer.observe(document.body);
  }

  document.addEventListener("visibilitychange", syncPetalShower);
  syncPetalShower();
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
      localStorage.setItem(MUSIC_STOPPED_KEY, "true");
      sessionStorage.setItem(MUSIC_STOPPED_KEY, "true");
      return;
    }

    localStorage.removeItem(MUSIC_STOPPED_KEY);
    sessionStorage.removeItem(MUSIC_STOPPED_KEY);
  } catch (error) {
    // Ignore storage issues and continue with in-memory playback only.
  }
}

function isMusicStoppedPreferenceEnabled() {
  try {
    return localStorage.getItem(MUSIC_STOPPED_KEY) === "true" || sessionStorage.getItem(MUSIC_STOPPED_KEY) === "true";
  } catch (error) {
    return false;
  }
}

function shouldAutoplayMusic() {
  try {
    return sessionStorage.getItem(MUSIC_AUTOPLAY_KEY) === "true" || !isMusicStoppedPreferenceEnabled();
  } catch (error) {
    return !isMusicStoppedPreferenceEnabled();
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
