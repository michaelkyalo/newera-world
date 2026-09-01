(function () {
  "use strict";

  const section = document.querySelector(".cinema-scroll");
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const track = document.querySelector(".sights-track");
  const sightsControls = document.querySelector(".sights-controls");
  const prevBtn = document.querySelector(".sight-prev");
  const nextBtn = document.querySelector(".sight-next");
  const originalCards = track ? Array.from(track.children) : [];

  if (!section || !track) return;

  let targetMouseX = 0, targetMouseY = 0, mouseX = 0, mouseY = 0;
  let targetScroll = 0, smoothScroll = 0;
  let initialized = false, rafPending = false;
  let sightCards = [];
  const originalSightCount = originalCards.length;
  let activeSight = originalSightCount;

  function clamp(v, min = 0, max = 1) { return Math.min(max, Math.max(min, v)); }
  function smoothstep(e0, e1, v) {
    const x = clamp((v - e0) / (e1 - e0));
    return x * x * (3 - 2 * x);
  }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function segmentInOut(s, a, b, c, d) {
    const enter = smoothstep(a, b, s), exit = smoothstep(c, d, s);
    return { enter, exit, active: enter * (1 - exit) };
  }
  function getScrollDistance() {
    return clamp(
      -section.getBoundingClientRect().top,
      0,
      section.offsetHeight - window.innerHeight
    );
  }

  function setVar(name, value) { root.style.setProperty(name, value); }

  function update() {
    rafPending = false;

    targetScroll = getScrollDistance();
    if (!initialized || reduceMotion.matches) {
      smoothScroll = targetScroll;
      initialized = true;
    } else {
      smoothScroll = lerp(smoothScroll, targetScroll, 0.14);
    }
    if (Math.abs(smoothScroll - targetScroll) < 0.08) smoothScroll = targetScroll;

    mouseX = lerp(mouseX, targetMouseX, 0.12);
    mouseY = lerp(mouseY, targetMouseY, 0.12);

    const frame2 = segmentInOut(smoothScroll, 560, 900, 1300, 1620);
    const frame3 = segmentInOut(smoothScroll, 1760, 2140, 2540, 2700);
    const progress = clamp(smoothScroll / 2700);
    const introExit = smoothstep(90, 650, smoothScroll);
    const sightsEnterRaw = smoothstep(2760, 3560, smoothScroll);
    const sightsEnter = Math.pow(sightsEnterRaw, 1.55);
    const sightsControlsEnter = smoothstep(3360, 3660, smoothScroll);
    const blurActive = clamp(frame2.active + frame3.active);
    const frame2Opacity = frame2.active * (1 - frame3.enter);
    const splitDrift = Math.pow(frame2.enter, 1.5);
    const panel2Opacity = frame2.active * (1 - frame2.exit);
    const panel3Opacity = frame3.active * (1 - frame3.exit);
    const backScale = 0.76 + progress * 0.2 + frame2.enter * 0.18 + frame3.enter * 0.16;
    const sharedHeroY = progress * -74;
    const sharedHeroScale = progress * 0.23;
    const sightsScreenTop = Math.min(220, Math.max(112, window.innerHeight * 0.19)) - 50;
    const sightsParentTop = window.innerHeight - (window.innerHeight - sightsScreenTop) / backScale;

    const mx = reduceMotion.matches ? 0 : mouseX;
    const my = reduceMotion.matches ? 0 : mouseY;
    setVar("--mx", mx.toFixed(4));
    setVar("--my", my.toFixed(4));

    setVar("--back-opacity", (1 - frame2.active * 0.06).toFixed(4));
    setVar("--back-x", `${mouseX * -12}px`);
    setVar("--back-y", `${mouseY * -4}px`);
    setVar("--back-scale", backScale.toFixed(4));
    setVar("--four-y", `${10 + progress * 10}vh`);
    setVar("--four-scale", (0.78 + progress * 0.16).toFixed(4));
    setVar("--bazaar-y", `${20 - progress * 8}vh`);
    // Reduced from the original 14px blur / 0.255 dimming — at full
    // blurActive the background was disappearing into a flat wash. This
    // keeps enough blur/dim for text contrast while leaving the artwork
    // (and hero video) clearly recognizable behind the story panels.
    setVar("--blur-px", `${blurActive * 8}px`);
    setVar("--back-brightness", (1 - blurActive * 0.15).toFixed(4));
    setVar("--bazaar-blur-px", `${frame2.active * 8}px`);
    setVar("--bazaar-brightness", (1 - frame2.active * 0.15 - frame3.active * 0.04).toFixed(4));
    setVar("--bazaar-saturation", (1 + frame3.active * 0.18).toFixed(4));
    setVar("--shade-opacity", "1");
    setVar("--shade-z", frame2.active > 0.02 ? "2" : "0");
    setVar("--shade-top-alpha", (blurActive * 0.28).toFixed(4));
    setVar("--shade-mid-alpha", (blurActive * 0.24).toFixed(4));
    setVar("--shade-bottom-alpha", (blurActive * 0.34).toFixed(4));

    setVar("--title-y", `${introExit * -210}px`);
    setVar("--title-scale", (1 - introExit * 0.08).toFixed(4));
    setVar("--title-opacity", (1 - introExit).toFixed(4));

    setVar("--bridge-x", `calc(-50% + ${mouseX * 18}px)`);
    setVar("--bridge-y", `${mouseY * 8 + sharedHeroY - frame2.exit * 760}px`);
    setVar("--bridge-bottom", `${5 - frame2.enter * 13}vh`);
    setVar("--bridge-width", `${52 + frame2.enter * 30}vw`);
    setVar("--bridge-scale", (1.02 + sharedHeroScale + frame2.exit * 0.46).toFixed(4));

    setVar("--split-left-x", `calc(-50% + ${-splitDrift * 46}vw + ${mouseX * 22}px)`);
    setVar("--split-left-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
    setVar("--split-left-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));
    setVar("--split-right-x", `calc(-50% + ${splitDrift * 46}vw + ${mouseX * 22}px)`);
    setVar("--split-right-y", `${mouseY * 10 + sharedHeroY - splitDrift * 180}px`);
    setVar("--split-right-scale", (1 + sharedHeroScale + frame2.enter * 0.74).toFixed(4));

    setVar("--frame2-opacity", frame2Opacity.toFixed(4));
    setVar("--frame2-x", `calc(-50% + ${mouseX * 10}px)`);
    setVar("--frame2-y", `calc(-50% + ${mouseY * 8 - frame2.exit * 150}px)`);
    setVar("--frame2-scale", (1.06 + frame2.enter * 0.08 + frame2.exit * 0.08).toFixed(4));

    setVar("--intro-copy-y", `${introExit * 90}px`);
    setVar("--intro-copy-opacity", (1 - introExit).toFixed(4));
    setVar("--panel2-opacity", panel2Opacity.toFixed(4));
    setVar("--panel2-y", `calc(-50% + ${-frame2.exit * 86 + (1 - frame2.enter) * 58}px)`);
    setVar("--panel3-opacity", panel3Opacity.toFixed(4));
    setVar("--panel3-y", `calc(-50% + ${-frame3.exit * 86 + (1 - frame3.enter) * 58}px)`);

    setVar("--sights-opacity", sightsEnter.toFixed(4));
    setVar("--sights-controls-opacity", sightsControlsEnter.toFixed(4));
    if (sightsControls) sightsControls.classList.toggle("is-ready", sightsControlsEnter > 0.98);
    setVar("--sights-visibility", sightsEnter > 0.01 ? "visible" : "hidden");
    setVar("--sights-y", "0px");
    setVar("--sights-enter-x", `${(1 - sightsEnter) * 420}vw`);
    setVar("--sights-scale", (1 / backScale).toFixed(4));
    setVar("--sights-top", `${sightsParentTop}px`);
    setVar("--sights-screen-top", `${sightsScreenTop}px`);

    if (
      Math.abs(smoothScroll - targetScroll) > 0.08 ||
      Math.abs(mouseX - targetMouseX) > 0.001 ||
      Math.abs(mouseY - targetMouseY) > 0.001
    ) {
      requestTick();
    }
  }

  function requestTick() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(update);
  }

  /* ---------------- sight-card video previews (lazy) ---------------- *
   * Each card's <video> has no `src` in the markup — only a
   * `data-video-src` attribute — so nothing downloads on page load even
   * though the carousel clones every card three times for the infinite
   * loop (15 video elements total). The real src is only assigned the
   * first time a visitor actually hovers/focuses/taps a given card, and
   * playback pauses (without unloading) once they move away, so a
   * revisited card resumes instantly without re-fetching.
   *
   * This is deliberately decoupled from the carousel's own .is-active
   * class, which marks whichever card is currently centered as the
   * slider auto-cycles — tying video loads to that would silently
   * stream a new clip every time the slider advances, which is exactly
   * the kind of avoidable mobile-data cost this is trying to prevent. */

  const isCoarsePointer =
    typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

  function loadCardVideoIfNeeded(video) {
    if (!video || video.dataset.loaded === "true") return;
    const src = video.getAttribute("data-video-src");
    if (!src) return;
    const source = document.createElement("source");
    source.src = src;
    source.type = "video/mp4";
    video.appendChild(source);
    video.load();
    video.dataset.loaded = "true";
  }

  function previewCardVideo(card) {
    const video = card.querySelector(".sight-video");
    if (!video) return;
    loadCardVideoIfNeeded(video);
    card.classList.add("is-previewing");
    if (!reduceMotion.matches) {
      video.play().catch(() => {
        /* Autoplay can be blocked before any user gesture has landed;
           the card still shows its poster/scrim, so this is a silent
           no-op rather than a broken experience. */
      });
    }
  }

  function stopCardVideoPreview(card) {
    const video = card.querySelector(".sight-video");
    card.classList.remove("is-previewing");
    if (video && !video.paused) video.pause();
  }

  function initCardVideoInteractions(card) {
    card.addEventListener("mouseenter", () => previewCardVideo(card));
    card.addEventListener("mouseleave", () => stopCardVideoPreview(card));
    card.addEventListener("focus", () => previewCardVideo(card));
    card.addEventListener("blur", () => stopCardVideoPreview(card));

    if (isCoarsePointer) {
      // Touch devices have no hover state — tapping toggles the preview
      // instead, and tapping a second card (or elsewhere) closes the
      // previous one so only one video plays at a time.
      card.addEventListener("touchstart", (e) => {
        const alreadyPreviewing = card.classList.contains("is-previewing");
        sightCards.forEach((c) => { if (c !== card) stopCardVideoPreview(c); });
        if (alreadyPreviewing) {
          stopCardVideoPreview(card);
        } else {
          previewCardVideo(card);
        }
      }, { passive: true });
    }
  }

  /* ---------------- infinite sight-card slider ---------------- */

  function setupSightSlider() {
    if (!originalSightCount) return;
    track.replaceChildren();
    for (let setIndex = 0; setIndex < 3; setIndex++) {
      originalCards.forEach((card, cardIndex) => {
        const clone = card.cloneNode(true);
        clone.dataset.sightIndex = String(setIndex * originalSightCount + cardIndex);
        track.appendChild(clone);
      });
    }
    sightCards = Array.from(track.children);
    activeSight = originalSightCount;

    sightCards.forEach((card) => {
      card.addEventListener("click", () => selectSightCard(card));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectSightCard(card);
        }
      });
      initCardVideoInteractions(card);
    });

    track.addEventListener("transitionend", normalizeSightSlider);
    updateSightSlider();
  }

  function updateSightSlider() {
    if (!sightCards.length) return;
    const cardWidth = sightCards[0].offsetWidth;
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    setVar("--sights-shift", `${-(cardWidth + gap) * activeSight}px`);
    sightCards.forEach((card) => {
      card.classList.toggle("is-active", Number(card.dataset.sightIndex) === activeSight);
    });
  }

  function moveSightSlider(dir) {
    activeSight += dir;
    updateSightSlider();
  }

  function selectSightCard(card) {
    const idx = Number(card.dataset.sightIndex);
    if (Number.isFinite(idx)) {
      activeSight = idx;
      updateSightSlider();
    }
  }

  function jumpSightSlider(i) {
    track.classList.add("is-jumping");
    activeSight = i;
    updateSightSlider();
    requestAnimationFrame(() => {
      requestAnimationFrame(() => track.classList.remove("is-jumping"));
    });
  }

  function normalizeSightSlider() {
    if (activeSight >= originalSightCount * 2) {
      jumpSightSlider(activeSight - originalSightCount);
    } else if (activeSight < originalSightCount) {
      jumpSightSlider(activeSight + originalSightCount);
    }
  }

  /* ---------------- nav anchor scroll fix ---------------- *
   * Story panels are position:absolute and only look right at a specific
   * *scroll distance* through .cinema-scroll — their raw DOM position
   * doesn't correspond to where they're actually legible, so a plain
   * href="#craft" jump lands the browser mid-transition (heavy blur,
   * wrong panel visible). Instead we intercept nav clicks and scroll to
   * the settled midpoint of each panel's reveal window, matching the
   * same ranges the segmentInOut() calls above use:
   *  - heritage (frame2): fully active between scroll 900–1300 → 1100
   *  - craft    (frame3): fully active between scroll 2140–2540 → 2340 */
  const NAV_SCROLL_TARGETS = { "#cinema": 0, "#heritage": 1100, "#craft": 2340 };

  function scrollToStoryDistance(distance) {
    const rect = section.getBoundingClientRect();
    const targetY = Math.max(0, window.scrollY + rect.top + distance);
    window.scrollTo({ top: targetY, behavior: reduceMotion.matches ? "auto" : "smooth" });
  }

  document.querySelectorAll('.site-nav a[href^="#"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!(href in NAV_SCROLL_TARGETS)) return;
    link.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToStoryDistance(NAV_SCROLL_TARGETS[href]);
    });
  });

  /* ---------------- listeners ---------------- */

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", () => { updateSightSlider(); requestTick(); });
  window.addEventListener("pointermove", (e) => {
    targetMouseX = e.clientX / window.innerWidth - 0.5;
    targetMouseY = e.clientY / window.innerHeight - 0.5;
    requestTick();
  }, { passive: true });

  if (prevBtn) prevBtn.addEventListener("click", () => moveSightSlider(-1));
  if (nextBtn) nextBtn.addEventListener("click", () => moveSightSlider(1));

  window.addEventListener("load", () => {
    setupSightSlider();
    requestTick();
  });
})();