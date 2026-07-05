(function () {
  "use strict";

  var brand = window.__BRAND__ || {};
  var fineHover = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var $ = function (sel, scope) { return (scope || document).querySelector(sel); };
  var $$ = function (sel, scope) { return Array.prototype.slice.call((scope || document).querySelectorAll(sel)); };

  function safe(fn, name) {
    try { fn(); } catch (e) { console.warn("[" + name + "] failed:", e); }
  }

  // ---- Splash: double safety net (CSS handles the 2.4s fallback) ----
  function initSplash() {
    var splash = $("[data-splash]");
    if (!splash) return;
    var hide = function () { splash.classList.add("is-out"); };
    if (document.readyState === "complete") setTimeout(hide, 350);
    else window.addEventListener("load", function () { setTimeout(hide, 300); });
    setTimeout(hide, 2200);
  }

  // ---- Mobile nav ----
  function initNav() {
    var navToggle = $("#navToggle");
    var navMobilePanel = $("#navMobilePanel");
    var navEl = $("#mainNav");
    if (navToggle && navMobilePanel) {
      navToggle.addEventListener("click", function () {
        var isOpen = navMobilePanel.classList.toggle("open");
        navToggle.classList.toggle("open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });
      $$("a", navMobilePanel).forEach(function (link) {
        link.addEventListener("click", function () {
          navMobilePanel.classList.remove("open");
          navToggle.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        });
      });
    }
    if (navEl) {
      window.addEventListener("scroll", function () {
        navEl.classList.toggle("scrolled", window.scrollY > 20);
      }, { passive: true });
    }
  }

  // ---- Reveal on scroll: low threshold + 6s safety net (gotcha A.8) ----
  function initReveals() {
    var targets = $$(".reveal");
    if (!targets.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          $$(".bar-fill", entry.target).forEach(function (fill) { fill.classList.add("animated"); });
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.01, rootMargin: "0px 0px -2% 0px" });
    targets.forEach(function (el) { io.observe(el); });

    setTimeout(function () {
      targets.forEach(function (el) {
        if (!el.classList.contains("in-view") && el.getBoundingClientRect().top < window.innerHeight) {
          el.classList.add("in-view");
        }
      });
    }, 6000);
  }

  // ---- Bidirectional scroll-scrub: continuous progress, reverses on scroll up ----
  // Sets --scrub-progress (0..1) on every [data-scrub] element, recalculated on
  // every rAF-throttled scroll/resize tick. CSS reads the variable directly for
  // opacity/transform — no transition, so it tracks the scrollbar 1:1 in both
  // directions. Disabled entirely under prefers-reduced-motion (see gotcha A.2:
  // this IS an intrusive, continuous-parallax-style effect, unlike fades/counters).
  function initScrub() {
    if (reducedMotion) return;
    var els = $$("[data-scrub]");
    if (!els.length) return;
    var hero = $(".hero");
    var ticking = false;

    function clamp01(n) { return Math.min(Math.max(n, 0), 1); }

    // Entrance elements (rise/slide) settle to progress=1 once they've risen
    // to ~60% down the viewport — i.e. "comfortably on screen" — instead of
    // requiring a full crossing to the top. That old formula (progress=1 only
    // once the element had almost exited past the top) meant content that
    // lands mid-viewport via an anchor jump or a fast/inertial mobile scroll
    // could get stuck at a mid-value forever: text half-faded, permanently,
    // until the user scrolled that exact section further. This is a
    // legibility bug, not a style choice — fix the formula, don't just mask it.
    function entranceProgress(rect, vh) {
      var settleAt = vh * 0.6;
      return clamp01((vh - rect.top) / (vh - settleAt));
    }

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      var heroRect = hero ? hero.getBoundingClientRect() : null;

      els.forEach(function (el) {
        var progress;
        if (el.dataset.scrub === "hero" && heroRect) {
          progress = clamp01(-heroRect.top / (heroRect.height || vh));
        } else {
          progress = entranceProgress(el.getBoundingClientRect(), vh);
        }
        el.style.setProperty("--scrub-progress", progress.toFixed(3));
      });
    }

    function onScrollOrResize() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

    // Safety net (same idea as the 6s reveal fallback in initReveals): if an
    // entrance element is already visible but scroll math hasn't settled it
    // to progress=1 yet (anchor jump landing mid-section, a scroll event that
    // never fired, etc.), force it. Hero is excluded — its fade is tied to
    // scrolling AWAY from the top, so "visible" doesn't mean "settled" there.
    setTimeout(function () {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        if (el.dataset.scrub === "hero") return;
        var current = parseFloat(el.style.getPropertyValue("--scrub-progress")) || 0;
        if (current < 1 && el.getBoundingClientRect().top < vh) {
          el.style.setProperty("--scrub-progress", "1");
        }
      });
    }, 2000);
  }

  // ---- Schedule / open-closed status (real per-day hours) ----
  function initSchedule() {
    var schedule = brand.schedule;
    if (!schedule) return;
    var now = new Date();
    var day = now.getDay();
    var hour = now.getHours() + now.getMinutes() / 60;
    var today = schedule[day];
    var isOpenNow = !!today && hour >= today.opens && hour < today.closes;

    var todayLi = $('.schedule-list li[data-day="' + day + '"]');
    if (todayLi) todayLi.classList.add("today");

    function formatHour(h) {
      var hh = Math.floor(h);
      var mm = Math.round((h - hh) * 60);
      return hh + ":" + (mm < 10 ? "0" : "") + mm;
    }

    var statusMessage;
    if (isOpenNow) {
      statusMessage = "Obert ara";
    } else if (today && hour < today.opens) {
      statusMessage = "Obre avui a les " + formatHour(today.opens);
    } else {
      var nextDay = day;
      var hops = 0;
      do { nextDay = (nextDay + 1) % 7; hops++; } while (!schedule[nextDay] && hops < 7);
      var next = schedule[nextDay];
      statusMessage = next ? ("Tancat · Obre " + next.label + " a les " + formatHour(next.opens)) : "Tancat";
    }

    [
      { badge: $("#scheduleStatus"), text: $("#scheduleStatusText") },
      { badge: $("#heroStatusBadge"), text: $("#heroStatusText") }
    ].forEach(function (pair) {
      if (!pair.badge || !pair.text) return;
      pair.badge.classList.toggle("is-open", isOpenNow);
      pair.text.textContent = statusMessage;
    });
  }

  // ---- Reviews marquee: duplicate content for seamless loop, never gated ----
  function initMarquee() {
    var tracks = $$(".t-track");
    if (!tracks.length) return;
    tracks.forEach(function (track) {
      if (track.dataset.marqueeBound) return;
      track.dataset.marqueeBound = "1";
      var dur = track.dataset.duration;
      if (dur) track.style.animationDuration = dur + "s";
      var original = Array.prototype.slice.call(track.children);
      original.forEach(function (node) { track.appendChild(node.cloneNode(true)); });
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        tracks.forEach(function (track) { track.classList.add("t-running"); });
      });
    });
  }

  // ---- Tilt 3D on hover (data-tilt elements) — gated by fine pointer, NOT reduced-motion ----
  function initTilt() {
    if (!fineHover) return;
    var els = $$("[data-tilt]");
    els.forEach(function (el) {
      var rect;
      el.addEventListener("mouseover", function (e) {
        if (el.contains(e.relatedTarget)) return;
        rect = el.getBoundingClientRect();
      });
      el.addEventListener("mousemove", function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * -10;
        var ry = (px - 0.5) * 10;
        el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("mouseout", function (e) {
        if (el.contains(e.relatedTarget)) return;
        el.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  // ---- Floating call button: only after scrolling past the hero ----
  // (wa-float is commented out in index.html — the landline has no WhatsApp;
  // this selector simply matches fewer elements until it's reactivated)
  function initFloatButtons() {
    var hero = $(".hero");
    var floats = $$(".call-float, .wa-float");
    if (!hero || !floats.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        floats.forEach(function (btn) { btn.classList.toggle("is-visible", !entry.isIntersecting); });
      });
    }, { threshold: 0, rootMargin: "-80% 0px 0px 0px" });
    io.observe(hero);
  }

  // ---- Reservation form -> phone call ----
  // The listed number (973 79 20 95) is a landline with no WhatsApp linked, so
  // submitting opens the dialer instead. The form fields help the customer
  // prepare what to say; they aren't transmitted anywhere (a phone call can't
  // carry them). TODO: once a real mobile number is confirmed, restore the
  // wa.me flow (see TODO in lib/manifest.js) and re-enable wa-float.
  function initContactForm() {
    var form = $("#reserva");
    if (!form) return;
    var submitBtn = $("#ctSubmit");
    var phone = brand.phone || "973792095";
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;

      submitBtn.classList.add("is-success");
      setTimeout(function () {
        window.location.href = "tel:" + phone;
        submitBtn.classList.remove("is-success");
      }, 300);
    });
  }

  function initFooterYear() {
    var y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  }

  function boot() {
    safe(initSplash, "initSplash");
    safe(initNav, "initNav");
    safe(initReveals, "initReveals");
    safe(initScrub, "initScrub");
    safe(initSchedule, "initSchedule");
    safe(initMarquee, "initMarquee");
    safe(initTilt, "initTilt");
    safe(initFloatButtons, "initFloatButtons");
    safe(initContactForm, "initContactForm");
    safe(initFooterYear, "initFooterYear");
    document.documentElement.classList.add("is-ready");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
