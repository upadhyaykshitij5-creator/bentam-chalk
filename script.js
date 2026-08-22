/* ============================================================
   BENTAM CHALK — script.js
   Vanilla JS. Reads everything from data.json (single source of truth)
   and renders: trust strip, serviceability, product cards,
   nutrition panel, ingredient story, FAQ, footer legal, cart & checkout.
   ------------------------------------------------------------
   No build step. No framework. Just fetch + DOM.
   ============================================================ */

(function () {
  "use strict";

  /* Small DOM helpers */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  const money = (n) => (n && n > 0 ? "₹" + n : "TBD");

  /* Inline brand glyphs for social/contact links (linking to official profiles) */
  function brandIcon(name) {
    const svg = (vb, path) => `<svg class="c-ic" viewBox="${vb}" width="20" height="20" fill="currentColor" aria-hidden="true">${path}</svg>`;
    switch (name) {
      case "whatsapp":
        return svg("0 0 32 32", '<path d="M16 .4C7.4.4.5 7.3.5 15.9c0 2.8.7 5.4 2 7.8L.4 31.6l8.1-2.1c2.3 1.3 4.9 1.9 7.5 1.9 8.6 0 15.5-7 15.5-15.5S24.6.4 16 .4zm0 28.3c-2.4 0-4.7-.6-6.7-1.8l-.5-.3-4.8 1.3 1.3-4.7-.3-.5c-1.3-2.1-2-4.5-2-7C3 8.7 8.9 2.8 16.1 2.8S29.1 8.7 29.1 15.9 23.2 28.7 16 28.7zm7.2-9.8c-.4-.2-2.3-1.1-2.7-1.3-.4-.1-.6-.2-.9.2s-1 1.3-1.3 1.5c-.2.2-.5.3-.9.1-.4-.2-1.7-.6-3.2-2-1.2-1.1-2-2.4-2.2-2.8-.2-.4 0-.6.2-.8l.6-.7c.2-.2.3-.4.4-.7.1-.3 0-.5 0-.7-.1-.2-.9-2.2-1.3-3-.3-.7-.7-.6-.9-.6h-.8c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 3.9 1.7 4.2c.2.3 2.9 4.5 7.1 6.3 1 .4 1.8.7 2.4.9 1 .3 1.9.3 2.6.2.8-.1 2.3-.9 2.7-1.9.3-.9.3-1.7.2-1.9-.1-.1-.3-.2-.7-.4z"/>');
      case "instagram":
        return svg("0 0 24 24", '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1-.4-2.2-.1-1.3-.1-1.7-.1-4.9s0-3.6.1-4.9c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1.1-1.7.2-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.2.4-.3 1-.4 2.1C2.6 9.5 2.6 9.9 2.6 12s0 2.5.1 3.3c.1 1.1.2 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.2 1 .3 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1-.1 1.7-.2 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.2-.4.3-1 .4-2.1.1-1.2.1-1.6.1-3.3s0-2.5-.1-3.3c-.1-1.1-.2-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.2-1-.3-2.1-.4C15.5 4 15.1 4 12 4zm0 3.1a4.9 4.9 0 110 9.8 4.9 4.9 0 010-9.8zm0 1.8a3.1 3.1 0 100 6.2 3.1 3.1 0 000-6.2zm5.1-.9a1.1 1.1 0 110 2.2 1.1 1.1 0 010-2.2z"/>');
      case "facebook":
        return svg("0 0 24 24", '<path d="M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.6 4.5-4.6 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-1.9.9-1.9 1.8V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0024 12z"/>');
      case "email":
        return svg("0 0 24 24", '<path d="M2 4h20a1 1 0 011 1v14a1 1 0 01-1 1H2a1 1 0 01-1-1V5a1 1 0 011-1zm10 7L3.6 6H20.4L12 11zm0 2.3L3 7.4V18h18V7.4l-9 5.9z"/>');
      default:
        return "";
    }
  }

  /* ============================================================
     VIDEO VISIBILITY — pause autoplay videos once they scroll off-screen,
     resume when back in view, so at most the videos actually on screen are
     ever decoding at once (mobile data/battery — the build guide's own rule
     against autoplaying several videos at a time).
     ============================================================ */
  const videoVisibilityObserver = ("IntersectionObserver" in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const v = entry.target;
          v.dataset.inView = entry.isIntersecting ? "1" : "0";
          if (entry.isIntersecting) {
            // Below-the-fold videos carry preload="none" so they never download
            // until actually scrolled to — switch to real preloading the first
            // time that happens, then let the browser fetch and start playing.
            if (v.preload === "none") { v.preload = "auto"; v.load(); }
            // Safety net: a play() call that lands mid-scroll-transition can get
            // dropped/interrupted. Retry across a spread of delays if it didn't take —
            // each a no-op once it succeeds, or if the video scrolled back out of view
            // again before a retry fires (checked via data-in-view, not a stale closure,
            // so a since-reversed scroll doesn't restart it).
            const tryPlay = () => { if (v.paused && v.dataset.inView === "1") v.play().catch(() => {}); };
            tryPlay();
            [300, 1000, 2500].forEach((delay) => setTimeout(tryPlay, delay));
          } else {
            v.pause();
          }
        });
      }, { threshold: 0.15 })
    : null;
  function observeVideoVisibility(video) {
    if (videoVisibilityObserver) videoVisibilityObserver.observe(video);
  }
  $$(".hero-video, .nutrition-video video").forEach(observeVideoVisibility);

  /* App state */
  let DATA = null;
  const cart = [];                 // { key, productId, size, name, sizeLabel, orderLabel, price }
  let selectedLocality = null;     // chosen delivery locality string
  let rzpEnabled = false;          // true once the server reports live Razorpay keys
  let rzpKeyId = "";               // publishable key id (safe in browser)

  /* ------------------------------------------------------------
     BOOT — load data.json, then render everything
     ------------------------------------------------------------ */
  fetch("data.json")
    .then((r) => {
      if (!r.ok) throw new Error("Failed to load data.json (" + r.status + ")");
      return r.json();
    })
    .then((data) => {
      DATA = data;
      renderTrustStrip();
      renderProducts();
      renderWhy();
      renderMissionVision();
      initNutritionPanel();
      renderScience();
      renderFAQ();
      // (Ingredient "Real Food, Real Process" story section removed.)
      renderFooter();
      renderProductSchema();
      initBackendPayments();
    })
    .catch((err) => {
      console.error(err);
      const grid = $("#productGrid");
      if (grid) grid.innerHTML =
        '<p style="color:var(--slate)">Could not load product data. If viewing locally, run a small web server (see README) so data.json can be fetched.</p>';
    });

  /* ============================================================
     HERO SOUND TOGGLE — the video autoplays MUTED (browsers block
     autoplay-with-audio). This button lets the visitor opt into sound.
     ============================================================ */
  (function initHeroSound() {
    const btn = document.getElementById("heroSound");
    const vid = document.querySelector(".hero-video");
    if (!btn || !vid) return;
    btn.addEventListener("click", () => {
      vid.muted = !vid.muted;
      const on = !vid.muted;
      btn.querySelector(".hero-sound-ic").textContent = on ? "🔊" : "🔇";
      btn.setAttribute("aria-pressed", String(on));
      btn.setAttribute("aria-label", on ? "Turn hero video sound off" : "Turn hero video sound on");
      if (on) { vid.volume = 1; vid.play().catch(() => {}); } // resume in case it was paused
    });
  })();

  /* ============================================================
     HERO STAT — animated count-up on scroll into view (triggers once).
     HTML already shows the final number as a no-JS/static fallback.
     ============================================================ */
  (function initHeroStatCountUp() {
    const el = document.getElementById("heroStat");
    if (!el) return;
    const target = parseInt(el.dataset.target, 10);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return; // static value already shown

    const animate = () => {
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        el.textContent = Math.round(eased * target);
        if (p < 1) requestAnimationFrame(tick);
      }
      el.textContent = "0";
      requestAnimationFrame(tick);
    };

    if (!("IntersectionObserver" in window)) { return; } // static fallback stands
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { animate(); io.disconnect(); }
      });
    }, { threshold: 0.6 });
    io.observe(el);
  })();

  /* ============================================================
     HEADER — scroll state + mobile menu
     ============================================================ */
  const header = $("#siteHeader");
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 20);
  }, { passive: true });

  const burger = $("#navBurger");
  const nav = $(".main-nav");
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  // Close mobile menu after navigating
  $$(".main-nav a").forEach((a) =>
    a.addEventListener("click", () => {
      nav.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    })
  );

  // "Buy / Subscribe", "Check Delivery & Subscribe", mobile buy bar, and the nav's
  // "Delivery" link all open the cart — the delivery-pincode check now lives there,
  // shown only at the point of purchase instead of taking up its own page section.
  $$('[data-action="open-cart"]').forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      renderCart();
      openCart();
    })
  );

  /* ============================================================
     3. TRUST STRIP
     ============================================================ */
  function renderTrustStrip() {
    const wrap = $("#trustStrip");
    wrap.innerHTML = "";
    const icons = { protein: "💪", cholesterol: "🚫", sugar: "🍃", fresh: "❄️", lab: "🔬" };
    DATA.trustStrip.forEach((t) => {
      const item = el("div", "trust-item");
      item.innerHTML =
        `<span class="t-icon" aria-hidden="true">${icons[t.icon] || "✓"}</span>` +
        `<span class="t-label">${t.label}</span>` +
        `<span class="t-tip">${t.tooltip}</span>`;
      wrap.appendChild(item);
    });
  }

  /* ============================================================
     4. SERVICEABILITY — pincode -> locality dropdown / waitlist
     ============================================================ */
  const pinForm = $("#pinForm");
  const pinInput = $("#pinInput");
  const pinServiceable = $("#pinServiceable");
  const pinUnserviceable = $("#pinUnserviceable");
  const localitySelect = $("#localitySelect");
  const pinHelp = $("#pinHelp");
  let pinHelpDefaultText = pinHelp.textContent; // set for real once DATA loads — see renderFAQ()

  // Shared by the manual "Check" submit AND the GPS auto-fill below, so both
  // paths run the exact same serviceable/unserviceable logic.
  function applyPincode(pin) {
    if (!/^\d{6}$/.test(pin)) {
      pinInput.classList.add("error");
      pinInput.setAttribute("aria-invalid", "true");
      pinHelp.textContent = "Enter a valid 6-digit pincode.";
      pinInput.focus();
      return false;
    }
    pinInput.classList.remove("error");
    pinInput.removeAttribute("aria-invalid");
    pinHelp.textContent = pinHelpDefaultText;

    const zone = DATA.deliveryZones[pin];
    if (zone && zone.length) {
      // Serviceable: populate locality dropdown
      localitySelect.innerHTML = "";
      zone.forEach((loc) => localitySelect.appendChild(el("option", null, loc)));
      selectedLocality = zone[0];
      pinServiceable.hidden = false;
      pinUnserviceable.hidden = true;
      updateCartLocality();
      return true;
    } else {
      // Unserviceable: show waitlist
      pinServiceable.hidden = true;
      pinUnserviceable.hidden = false;
      selectedLocality = null;
      updateCartLocality();
      return false;
    }
  }

  pinForm.addEventListener("submit", (e) => {
    e.preventDefault();
    applyPincode(pinInput.value.trim());
  });

  // Only allow digits in the pin field
  pinInput.addEventListener("input", () => {
    pinInput.value = pinInput.value.replace(/\D/g, "").slice(0, 6);
  });

  localitySelect.addEventListener("change", () => {
    selectedLocality = localitySelect.value;
    updateCartLocality();
  });

  // GPS check — gets the phone's coordinates, confirms they're inside Agra
  // against the lat/lng box in data.json, then reverse-geocodes them into a
  // real street address + pincode via OpenStreetMap's free Nominatim API (no
  // key/billing needed — Google's equivalent Geocoding API requires a paid
  // account we don't have). The detected pincode auto-runs the same
  // serviceable-area check as typing it in, and the street text pre-fills the
  // checkout address field — the customer can still edit either before paying.
  const geoBtn = $("#geoCheckBtn");
  const geoStatus = $("#geoStatus");
  let detectedStreetAddress = "";

  async function reverseGeocode(lat, lng) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Reverse geocode failed");
    return res.json();
  }

  geoBtn.addEventListener("click", () => {
    geoStatus.hidden = false;
    if (!("geolocation" in navigator)) {
      geoStatus.textContent = "Location isn't available on this device/browser — please enter your pincode above.";
      return;
    }
    geoStatus.textContent = "Checking your location…";
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const bounds = DATA.deliveryGeoBounds;
        const { latitude: lat, longitude: lng } = pos.coords;
        const inArea = bounds &&
          lat >= bounds.latMin && lat <= bounds.latMax &&
          lng >= bounds.lngMin && lng <= bounds.lngMax;

        if (!inArea) {
          geoStatus.textContent = "You're outside our current delivery area — we deliver only within Agra right now.";
          pinServiceable.hidden = true;
          pinUnserviceable.hidden = false;
          selectedLocality = null;
          updateCartLocality();
          return;
        }

        geoStatus.textContent = "✓ You're in Agra — looking up your exact address…";
        reverseGeocode(lat, lng)
          .then((place) => {
            const a = place.address || {};
            const pin = (a.postcode || "").replace(/\D/g, "").slice(0, 6);
            detectedStreetAddress = [a.road, a.suburb || a.neighbourhood, a.city_district]
              .filter(Boolean).join(", ") || place.display_name || "";

            if (pin && DATA.deliveryZones[pin]) {
              pinInput.value = pin;
              applyPincode(pin);
              geoStatus.textContent = `✓ Detected ${detectedStreetAddress ? detectedStreetAddress + " · " : ""}pincode ${pin}. Address pre-filled at checkout — please confirm it's correct.`;
            } else {
              geoStatus.textContent = "✓ You're in Agra, but we couldn't match an exact pincode automatically — please enter it above.";
              pinInput.focus();
            }
          })
          .catch(() => {
            geoStatus.textContent = "✓ You're in Agra — couldn't fetch the exact address, please enter your pincode above.";
            pinInput.focus();
          });
      },
      (err) => {
        geoStatus.textContent = err.code === err.PERMISSION_DENIED
          ? "Location access denied — no problem, just enter your pincode above."
          : "Couldn't get your location — please enter your pincode above.";
      },
      { timeout: 8000 }
    );
  });

  // Waitlist (front-end demo capture)
  const waitlistForm = $("#waitlistForm");
  waitlistForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = $("#waitlistEmail");
    if (!email.value || !email.checkValidity()) { email.classList.add("error"); return; }
    email.classList.remove("error");
    $("#waitlistDone").hidden = false;
    email.value = "";
  });

  /* ============================================================
     5. PRODUCT CARDS (with size toggle + order selector)
     ============================================================ */
  function renderProducts() {
    const grid = $("#productGrid");
    grid.innerHTML = "";
    DATA.products.forEach((p) => grid.appendChild(buildProductCard(p)));
  }

  function buildProductCard(p) {
    const sizeKeys = Object.keys(p.sizes);
    const card = el("div", "product-card");
    card.dataset.product = p.id;

    // --- media (video preview) ---
    // Both cards share one identical 16:9 frame; the video fills it (object-fit: cover).
    const media = el("div", "pc-media");
    media.innerHTML =
      `<span class="pc-media-badge">${p.shortName}</span>` +
      `<video autoplay muted loop playsinline preload="none" poster="${p.image}" aria-label="${p.name} preview">` +
      `<source src="${p.video}" type="video/mp4"></video>`;
    card.appendChild(media);
    observeVideoVisibility(media.querySelector("video"));

    // --- body ---
    const body = el("div", "pc-body");

    body.appendChild(el("h3", "pc-title", p.name));
    body.appendChild(el("p", "pc-tagline", p.tagline));
    body.appendChild(el("p", "pc-desc", p.description));

    // attributes
    const attrs = el("div", "pc-attrs");
    p.attributes.forEach((a) => attrs.appendChild(el("span", null, a)));
    body.appendChild(attrs);

    // size toggle (only when >1 size)
    let currentSize = p.defaultSize;
    if (sizeKeys.length > 1) {
      const seg = el("div", "seg-control");
      seg.setAttribute("role", "group");
      seg.setAttribute("aria-label", "Select size for " + p.name);
      sizeKeys.forEach((sk) => {
        const b = el("button", sk === currentSize ? "is-active" : null, p.sizes[sk].label);
        b.type = "button";
        b.addEventListener("click", () => {
          currentSize = sk;
          $$(".seg-control button", seg).forEach((x) => x.classList.remove("is-active"));
          b.classList.add("is-active");
          paintStats();
          paintPrice();
        });
        seg.appendChild(b);
      });
      body.appendChild(seg);
    }

    // stats (protein / kcal) — repaints on size change
    const stats = el("div", "pc-stats");
    body.appendChild(stats);
    function paintStats() {
      const s = p.sizes[currentSize];
      // Some products (Chaas) state nutrition on a fixed lab basis regardless of bottle size
      const note = s.statNote ? `<span class="stat-note">${s.statNote}</span>` : "";
      stats.innerHTML =
        `<div class="pc-stat"><div class="num">${s.protein_g}g</div><div class="lbl">Protein${note}</div></div>` +
        (s.kcal != null ? `<div class="pc-stat"><div class="num">${s.kcal}</div><div class="lbl">kcal</div></div>` : "") +
        (s.rda_protein != null ? `<div class="pc-stat"><div class="num">${s.rda_protein}%</div><div class="lbl">Daily Protein</div></div>` : "");
    }
    paintStats();

    // care list
    const care = el("ul", "pc-care");
    p.care.forEach((c) => care.appendChild(el("li", null, c)));
    body.appendChild(care);

    // Plan picker — one tile per plan in data.json (Single Bottle / Weekly / 15
    // Days / Monthly). Tiles instead of a dropdown so the subscription
    // commitment is visible up front, not hidden inside a <select>.
    const order = el("div", "pc-order");
    order.innerHTML = `<label>Choose your plan</label>`;
    const tiles = el("div", "pc-plans");
    tiles.setAttribute("role", "radiogroup");
    let selectedOptionId = p.orderOptions[0].id;
    p.orderOptions.forEach((o) => {
      const tile = el("button", "pc-plan" + (o.id === selectedOptionId ? " active" : ""));
      tile.type = "button";
      tile.setAttribute("role", "radio");
      tile.setAttribute("aria-checked", o.id === selectedOptionId ? "true" : "false");
      tile.dataset.opt = o.id;
      tile.innerHTML = `<span class="pc-plan-name">${o.label}</span>` +
        (o.type === "subscription" ? `<span class="pc-plan-tag">Subscription</span>` : `<span class="pc-plan-tag one-time">One-time</span>`);
      tile.addEventListener("click", () => {
        selectedOptionId = o.id;
        $$(".pc-plan", tiles).forEach((t) => {
          const isActive = t.dataset.opt === selectedOptionId;
          t.classList.toggle("active", isActive);
          t.setAttribute("aria-checked", isActive ? "true" : "false");
        });
        paintPrice();
      });
      tiles.appendChild(tile);
    });
    order.appendChild(tiles);

    // Quantity = bottles PER DAY (customer's choice). The plan sets the number of
    // days. Line total = bottle price × bottles/day × days.
    const qtyId = "qty-" + p.id;
    const qtyWrap = el("div", "pc-qty");
    qtyWrap.innerHTML = `<label for="${qtyId}">Bottles per day</label>`;
    const qtyInput = el("input");
    qtyInput.type = "number";
    qtyInput.id = qtyId;
    qtyInput.min = "1"; qtyInput.max = "10"; qtyInput.step = "1"; qtyInput.value = "1";
    qtyInput.inputMode = "numeric";
    qtyWrap.appendChild(qtyInput);
    order.appendChild(qtyWrap);

    const priceLine = el("p", "pc-price");
    order.appendChild(priceLine);
    body.appendChild(order);

    const currentOption = () => p.orderOptions.find((o) => o.id === selectedOptionId) || p.orderOptions[0];
    // The one-time trial tier prices off size.trialPrice (when set); every
    // subscription plan bills at the regular per-bottle price — mirrors the
    // server's computeAmountPaise() so displayed and charged totals match.
    const unitPriceFor = (size, option) =>
      (option && option.type === "one-time" && size.trialPrice != null) ? size.trialPrice : (size.price || 0);
    const currentQty = () => {
      let q = parseInt(qtyInput.value, 10);
      if (!Number.isInteger(q) || q < 1) q = 1;
      if (q > 10) q = 10;
      return q;
    };

    function paintPrice() {
      const s = p.sizes[currentSize];
      const opt = currentOption();
      const unit = unitPriceFor(s, opt);
      const days = opt.deliveries || 1;
      const qty = currentQty();
      const lineTotal = unit * qty * days;
      if (days > 1) {
        // Subscription plan — always show the full commitment: total pay,
        // the per-bottle breakdown, AND how many days this locks in.
        priceLine.innerHTML =
          `<span class="rupee">${money(lineTotal)}</span>` +
          `<span class="save">Total for ${days} days</span>` +
          `<span class="per">${money(unit)} × ${qty} bottle${qty > 1 ? "s" : ""}/day × ${days} days · charged once via Razorpay</span>`;
      } else if (s.price > 0 && s.mrp && s.mrp > s.price && unit === s.price) {
        const save = Math.round((1 - s.price / s.mrp) * 100);
        priceLine.innerHTML =
          `<span class="rupee">₹${s.price}</span>` +
          `<span class="mrp">₹${s.mrp}</span>` +
          `<span class="save">Launch price · Save ${save}%</span>` +
          `<span class="per">${s.label} · per bottle</span>`;
      } else {
        priceLine.innerHTML = `<span class="rupee">${money(unit)}</span> <span class="per">${s.label} · single trial bottle${qty > 1 ? " × " + qty : ""}</span>`;
      }
    }
    qtyInput.addEventListener("input", paintPrice);
    paintPrice();

    // actions
    const actions = el("div", "pc-actions");
    const addBtn = el("button", "btn btn-outline", "Add to Cart");
    const buyBtn = el("button", "btn btn-primary", "Buy Now");
    addBtn.type = "button"; buyBtn.type = "button";
    const getSelection = () => ({
      product: p,
      size: currentSize,
      option: currentOption(),
      qty: currentQty()
    });
    addBtn.addEventListener("click", () => { addToCart(getSelection()); openCart(); });
    buyBtn.addEventListener("click", () => { addToCart(getSelection()); openCart(); });
    actions.appendChild(addBtn);
    actions.appendChild(buyBtn);
    body.appendChild(actions);

    card.appendChild(body);
    return card;
  }

  /* ============================================================
     5b. WHY IT'S DIFFERENT (auto-fade carousel)
     ============================================================ */
  function renderWhy() {
    buildWhyCarousel();
  }

  function renderMissionVision() {
    const mv = DATA.brand.missionVision;
    if (!mv) return;
    $("#mvKicker").textContent = mv.kicker || "";
    $("#mvQuote").textContent = mv.quote || "";
    $("#mvMission").textContent = mv.mission || "";
    $("#mvVision").textContent = mv.vision || "";

    const founders = DATA.brand.founders;
    if (!founders) return;
    // Per-photo framing in the 3:4 oval: no crop → show the whole photo (contain);
    // a crop (aspect 3:4) → zoom to that region via responsive background %s.
    const photoStyle = (f) => {
      const base = `background-image:url('${encodeURI(f.photo)}')`;
      if (!f.crop) return `${base};background-size:contain;background-position:center`;
      const c = f.crop, n = f.natural;
      const sizeW = (n.w / c.w * 100).toFixed(2);
      const posX = n.w === c.w ? 50 : (c.x / (n.w - c.w) * 100).toFixed(2);
      const posY = n.h === c.h ? 50 : (c.y / (n.h - c.h) * 100).toFixed(2);
      const filter = f.filter ? `;filter:${f.filter}` : "";
      return `${base};background-size:${sizeW}% auto;background-position:${posX}% ${posY}%${filter}`;
    };
    const fill = (which, f) => {
      const cap = which.charAt(0).toUpperCase() + which.slice(1);
      const photo = $("#mvPhoto" + cap);
      if (photo && f) {
        photo.setAttribute("style", photoStyle(f));
        photo.setAttribute("aria-label", f.name + ", " + f.role + " of Bentam Chalk");
      }
      if ($("#mvName" + cap)) $("#mvName" + cap).textContent = f ? f.name : "";
      if ($("#mvRole" + cap)) $("#mvRole" + cap).textContent = f ? f.role : "";
    };
    fill("mission", founders.mission);
    fill("vision", founders.vision);
  }

  // Auto-fading single-card carousel for "Why It's Different" — one slide visible at a
  // time (fades in/out), so the section only takes the height of one card. Advances on a
  // timer, pauses on hover/focus, and offers prev/next + dot controls for manual browsing.
  // Respects prefers-reduced-motion by not auto-advancing (dots/arrows still work).
  function buildWhyCarousel() {
    const track = $("#whyTrack");
    const dotsWrap = $("#whyDots");
    if (!track || !DATA.whyDifferent || !DATA.whyDifferent.length) return;

    const icons = { protein: "💪", omega: "🌿", bone: "🦴", bcaa: "⚡", cholesterol: "🚫", clean: "🌱" };
    const items = DATA.whyDifferent;
    let index = 0;
    let timer = null;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    track.innerHTML = "";
    dotsWrap.innerHTML = "";
    const slides = items.map((w, i) => {
      const s = el("div", "why-slide" + (i === 0 ? " is-active" : ""));
      s.innerHTML =
        `<span class="why-ic" aria-hidden="true">${icons[w.icon] || "✓"}</span>` +
        `<h3>${w.title}</h3><p>${w.body}</p>`;
      s.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      track.appendChild(s);
      return s;
    });
    const dots = items.map((w, i) => {
      const d = el("button", "why-dot" + (i === 0 ? " is-active" : ""));
      d.type = "button";
      d.setAttribute("role", "tab");
      d.setAttribute("aria-label", w.title);
      d.setAttribute("aria-selected", i === 0 ? "true" : "false");
      d.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(d);
      return d;
    });

    function goTo(i, userInitiated) {
      index = (i + items.length) % items.length;
      slides.forEach((s, k) => {
        s.classList.toggle("is-active", k === index);
        s.setAttribute("aria-hidden", k === index ? "false" : "true");
      });
      dots.forEach((d, k) => {
        d.classList.toggle("is-active", k === index);
        d.setAttribute("aria-selected", k === index ? "true" : "false");
      });
      if (userInitiated) restart();
    }

    function start() {
      if (reduceMotion || items.length < 2) return; // don't force motion on users who opted out
      stop();
      timer = setInterval(() => goTo(index + 1, false), 4500);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    $("#whyPrev").addEventListener("click", () => goTo(index - 1, true));
    $("#whyNext").addEventListener("click", () => goTo(index + 1, true));

    const carousel = $("#whyCarousel");
    carousel.addEventListener("mouseenter", stop);
    carousel.addEventListener("mouseleave", start);
    carousel.addEventListener("focusin", stop);
    carousel.addEventListener("focusout", start);

    start();
  }

  /* ============================================================
     6. NUTRITION PANEL — product + size + tabs, %RDA bars
     ============================================================ */
  const nutritionState = { productIndex: 0, size: "300ml", tab: "macros" };

  function initNutritionPanel() {
    const p = DATA.products[nutritionState.productIndex];
    nutritionState.size = p.defaultSize;

    buildNutritionProductToggle();
    buildNutritionSizeToggle();

    // tab clicks
    $$("#nutritionTabs button").forEach((b) =>
      b.addEventListener("click", () => {
        nutritionState.tab = b.dataset.tab;
        $$("#nutritionTabs button").forEach((x) => {
          const on = x === b;
          x.classList.toggle("is-active", on);
          x.setAttribute("aria-selected", String(on));
        });
        paintNutrientRows();
      })
    );

    $("#rdaFootnote").textContent =
      "Lab-verified values. " + DATA.brand.legal.rdaFootnote + " " + DATA.brand.legal.labReportNote;
    paintNutrientRows();
  }

  function buildNutritionProductToggle() {
    const wrap = $("#nutritionProductToggle");
    wrap.innerHTML = "";
    DATA.products.forEach((p, i) => {
      const b = el("button", i === nutritionState.productIndex ? "is-active" : null, p.shortName);
      b.type = "button";
      b.setAttribute("role", "tab");
      b.addEventListener("click", () => {
        nutritionState.productIndex = i;
        nutritionState.size = DATA.products[i].defaultSize;
        $$("#nutritionProductToggle button").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        buildNutritionSizeToggle();
        paintNutrientRows();
      });
      wrap.appendChild(b);
    });
  }

  function buildNutritionSizeToggle() {
    const wrap = $("#nutritionSizeToggle");
    const p = DATA.products[nutritionState.productIndex];
    const keys = Object.keys(p.sizes);
    wrap.innerHTML = "";
    // Single-size products: show a static label instead of a toggle
    if (keys.length <= 1) {
      wrap.innerHTML = `<button class="is-active" type="button" disabled>${p.sizes[keys[0]].label}</button>`;
      nutritionState.size = keys[0];
      return;
    }
    keys.forEach((k) => {
      const b = el("button", k === nutritionState.size ? "is-active" : null, p.sizes[k].label);
      b.type = "button";
      b.addEventListener("click", () => {
        nutritionState.size = k;
        $$("#nutritionSizeToggle button").forEach((x) => x.classList.remove("is-active"));
        b.classList.add("is-active");
        paintNutrientRows();
      });
      wrap.appendChild(b);
    });
  }

  function paintNutrientRows() {
    const p = DATA.products[nutritionState.productIndex];
    const rows = (p.nutrients[nutritionState.tab] || []);
    // Size key -> field suffix: "300ml"->300, "500ml"->500, "1000ml"->1000
    const suffix = String(nutritionState.size).replace(/[^\d]/g, "");
    const container = $("#nutrientRows");
    container.innerHTML = "";

    if (!rows.length) {
      container.appendChild(el("p", "field-help", "No entries in this category for this product."));
      return;
    }

    rows.forEach((n) => {
      const val = n["per" + suffix];
      const rda = n["rda" + suffix];
      if (val == null) return; // size not applicable to this nutrient

      const row = el("div", "nutrient-row");
      const hasBar = typeof rda === "number" && rda > 0;
      const capped = hasBar ? Math.min(rda, 100) : 0;
      const over = hasBar && rda > 100;

      row.innerHTML =
        `<div class="nr-top">` +
          `<span class="nr-name">${n.name}</span>` +
          `<span class="nr-val">${val}</span>` +
        `</div>` +
        // Bar starts at width:0 and is animated to its real value below (data-fill
        // holds the target) so the %RDA reads as a satisfying fill-in, not a static bar.
        (hasBar
          ? `<div class="nr-bar"><div class="nr-fill${over ? " over" : ""}" style="width:0%" data-fill="${capped}"></div></div>` +
            `<div class="nr-rda">${over ? `<span class="over-txt">${rda}% RDA (&gt;100%)</span>` : rda + "% RDA"}</div>`
          : "");
      container.appendChild(row);
    });

    // Animate all bars to their target width on the next frame (two rAFs so the
    // browser commits the width:0 starting state first and the transition fires).
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$(".nr-fill", container).forEach((bar) => { bar.style.width = bar.dataset.fill + "%"; });
    }));
  }


  /* ============================================================
     10. FAQ (accordion)
     ============================================================ */
  // Shared accordion builder — used by both the FAQ and "Backed by Global Science" sections
  function buildAccordion(list, items, prefix) {
    if (!list || !items) return;
    list.innerHTML = "";
    items.forEach((f, i) => {
      const item = el("div", "faq-item");
      const btnId = prefix + "-q-" + i, panelId = prefix + "-a-" + i;
      item.innerHTML =
        `<button class="faq-q" id="${btnId}" aria-expanded="false" aria-controls="${panelId}">` +
          `<span>${f.q}</span><span class="chev" aria-hidden="true">▾</span>` +
        `</button>` +
        `<div class="faq-a" id="${panelId}" role="region" aria-labelledby="${btnId}">` +
          `<div class="faq-a-inner">${f.a}</div>` +
        `</div>`;
      const btn = $(".faq-q", item);
      const ans = $(".faq-a", item);
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", String(open));
        ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0";
      });
      list.appendChild(item);
    });
  }

  /* ---- "Ask Bentam" chatbot — a client-side matcher over DATA.faq ----
     No API/keys/backend: it scores the user's words against every FAQ (question
     weighted higher than answer) with a small synonym map, and replies with the
     best match, or a WhatsApp fallback when unsure. Private, instant, offline. */
  // Single source of truth for "which areas do we deliver to" copy — pulled from
  // DATA.brand.serviceAreas (edit that one array to add/remove a city anywhere
  // it's mentioned; nothing here needs to change).
  function chatAreasText() {
    const areas = DATA.serviceAreas || [];
    if (!areas.length) return "your area — check by pincode";
    if (areas.length === 1) return areas[0];
    return areas.slice(0, -1).join(", ") + " and " + areas[areas.length - 1];
  }
  function chatResolveTemplate(html) {
    return html.replace(/\{\{serviceAreas\}\}/g, chatAreasText());
  }
  const CHAT_STOP = new Set("a an the is are am do does did can could will would should i you it its it's my me we our your of to in on at for and or with how what when where why which that this so if but as be been drink".split(" "));
  const CHAT_SYN = {
    price: ["pay", "payment", "cost", "upi", "card", "rupee"], cost: ["pay", "payment", "price"],
    pay: ["payment", "upi", "card"], money: ["pay", "payment", "price"],
    vegan: ["plant", "dairy", "animal"], milk: ["dairy", "lactose"], lactose: ["dairy"], dairy: ["lactose", "milk"],
    fresh: ["shelf", "last", "expire", "expiry", "store", "fridge", "refrigerated"], expire: ["shelf", "fresh", "last"],
    last: ["shelf", "fresh", "expire"], shelf: ["fresh", "last", "expire"],
    deliver: ["delivery", "area", "pincode", "ship", "shipping", "location"], delivery: ["deliver", "area", "pincode"],
    ship: ["delivery", "deliver"], area: ["delivery", "pincode", "location"],
    sugar: ["sweet"], protein: ["amino", "bcaa", "aminos"], amino: ["protein", "bcaa"],
    store: ["keep", "fridge", "chill", "chilled", "refrigerated"], keep: ["store", "fridge", "chill"],
    freeze: ["frozen", "freezer"], frozen: ["freeze"],
    soy: ["soya", "soybean"], soya: ["soy", "soybean"], safe: ["safety"],
    workout: ["gym", "exercise", "recovery", "muscle"], gym: ["workout", "muscle"],
    subscription: ["subscribe", "plan", "weekly", "monthly", "recurring", "bottles"], subscribe: ["subscription", "plan"],
    cancel: ["pause", "stop", "change"], pause: ["cancel", "stop", "change"],
    taste: ["flavour", "flavor", "tastes"], refund: ["return", "replace", "wrong", "problem", "issue", "broken"],
    ingredients: ["inside", "contains", "fillers", "made"], chaas: ["buttermilk", "lassi"], shake: ["settle", "separate"]
  };
  // Light stem: drop a trailing "s" on longer words so plurals match singulars
  // (workouts→workout, bottles→bottle, subscriptions→subscription).
  function chatStem(w) { return w.length > 3 && w.endsWith("s") ? w.slice(0, -1) : w; }
  function chatTokens(s) {
    return (s || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
      .filter((w) => w && !CHAT_STOP.has(w)).map(chatStem);
  }
  // Combined offline knowledge base: FAQ items + the nutrition-science entries.
  // Cached token sets keep matching fast. `keys` (phrase match list) score highest.
  let CHAT_INDEX = null;
  function chatBuildIndex() {
    if (CHAT_INDEX) return CHAT_INDEX;
    const items = [];
    (DATA.faq || []).forEach((f) => items.push({ a: chatResolveTemplate(f.a), keyTok: new Set(), qWords: new Set(chatTokens(f.q)), aWords: new Set(chatTokens(f.a)) }));
    (DATA.chatKnowledge || []).forEach((k) => items.push({
      a: k.a,
      keyTok: new Set((k.keys || []).flatMap((x) => chatTokens(x))),
      qWords: new Set(chatTokens(k.q)),
      aWords: new Set(chatTokens(k.a)),
    }));
    CHAT_INDEX = items;
    return items;
  }
  function chatFindAnswer(query) {
    const qt = chatTokens(query);
    if (!qt.length) return null;
    let best = null, bestScore = 0;
    chatBuildIndex().forEach((it) => {
      let score = 0;
      qt.forEach((w) => {
        if (it.keyTok.has(w)) score += 3;           // curated keyword = strongest
        else if (it.qWords.has(w)) score += 2;      // word in the topic/question
        else if (it.aWords.has(w)) score += 1;      // word in the answer
        (CHAT_SYN[w] || []).map(chatStem).forEach((syn) => {
          if (it.keyTok.has(syn)) score += 1.5;
          else if (it.qWords.has(syn)) score += 1.5;
          else if (it.aWords.has(syn)) score += 0.75;
        });
      });
      if (score > bestScore) { bestScore = score; best = it; }
    });
    return bestScore >= 1.5 ? { a: best.a } : null;
  }
  // Small-talk layer — checked BEFORE the keyword matcher, so plain greetings
  // and "who/what are you" openers (what a real first-time visitor actually
  // types) get a warm, on-brand reply instead of the "not sure" fallback.
  const CHAT_SMALLTALK = [
    { re: /^(hi|hii+|hello|hey|hey there|yo|namaste)\b/, a: "Hey! 👋 I'm here to help with Bentam Chalk — ask about our drinks, nutrition, delivery or subscriptions." },
    { re: /(who are you|what are you|your name)/, a: "I'm the Bentam Chalk website assistant — ask me anything about our Soy Protein X, Chaas, delivery or orders." },
    { re: /(what is this|what('s| is) bentam|about (your |the )?(company|brand|product)|tell me about (your |the )?product)/,
      a: () => `Bentam Chalk makes fresh, plant-based Soy Protein X and Boondi Masala Chaas — 100% dairy-free, zero cholesterol, delivered chilled in ${chatAreasText()}.` },
    { re: /^(thanks|thank you|thx|ok|okay|cool|great|nice)\b/, a: "You're welcome! Anything else you'd like to know?" },
    { re: /^(bye|goodbye|see ya)\b/, a: "Thanks for stopping by — reach us on WhatsApp anytime. 👋" },
  ];
  function chatSmallTalk(text) {
    const t = text.trim().toLowerCase();
    for (const s of CHAT_SMALLTALK) if (s.re.test(t)) return typeof s.a === "function" ? s.a() : s.a;
    return null;
  }
  // Size-aware nutrition lookup — answers "how much protein/calories in
  // 300ml/500ml/1L [Chaas]?" with the EXACT numbers for the size actually asked
  // about and the right product, pulled live from DATA.products — never a static
  // FAQ string that only ever names one size (which silently misleads for others).
  function chatNutritionBySize(text) {
    const t = text.toLowerCase();
    if (!/protein|calorie|kcal|energy/.test(t)) return null;
    const sizeMatch = t.match(/(300|500|1000|1)\s*(ml|l\b|litre|liter)/);
    if (!sizeMatch) return null;
    const sizeKey = (sizeMatch[1] === "1" ? "1000" : sizeMatch[1]) + "ml";
    const wantsChaas = /chaas|boondi|buttermilk/.test(t);
    const product = (DATA.products || []).find((p) => p.id === (wantsChaas ? "soy-boondi-chaas" : "protein-x"));
    const s = product && product.sizes && product.sizes[sizeKey];
    if (!s) return null;
    return `A ${s.label} ${product.shortName} gives you <strong>${s.protein_g} g protein</strong> (${s.kcal} kcal)` +
      (s.rda_protein ? ` — about ${s.rda_protein}% of an adult's daily protein.` : ".");
  }
  // Real pincode check — if the user's message contains a 6-digit number, look
  // it up in DATA.deliveryZones (the same live data the cart's pincode form
  // uses) and give an honest green/red flag. No hardcoded area names: whatever
  // pincodes exist in the data is what "serviceable" means, today or tomorrow.
  function chatPincodeCheck(text) {
    const m = text.match(/\b(\d{6})\b/);
    if (!m) return null;
    const pin = m[1];
    const zone = DATA.deliveryZones && DATA.deliveryZones[pin];
    if (zone && zone.length) {
      return `✅ Yes, we deliver to <strong>${pin}</strong> (${zone.join(", ")}). Open the cart and enter this pincode to choose your area and order.`;
    }
    return `❌ We don't deliver to <strong>${pin}</strong> yet — we're currently live in ${chatAreasText()}. Join the waitlist from the cart and we'll notify you when we expand there.`;
  }
  function chatEscape(s) {
    return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }
  function chatAppend(role, html) {
    const log = $("#chatLog");
    const row = el("div", "chat-msg chat-" + role);
    row.innerHTML = role === "bot"
      ? `<span class="chat-ava" aria-hidden="true">BC</span><div class="chat-bubble">${html}</div>`
      : `<div class="chat-bubble">${html}</div>`;
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return row;
  }
  function chatSuggest(list) {
    const wrap = $("#chatSuggests");
    wrap.innerHTML = "";
    list.forEach((f) => {
      const chip = el("button", "chat-chip");
      chip.type = "button";
      chip.textContent = f.q;
      chip.addEventListener("click", () => chatAsk(f.q));
      wrap.appendChild(chip);
    });
  }
  // A rotating handful of starter questions — a mix of product + nutrition science
  // to show the assistant's breadth. Each is a plain question the engine can answer.
  const CHAT_STARTERS = [
    "🧊 How long does it stay fresh?",
    "💪 How much protein do I get?",
    "🥛 Is it dairy-free?",
    "📍 Do you deliver to my area?",
    "🔁 How do subscriptions work?",
    "💳 How do I pay?",
  ];
  function chatStarters() {
    const pool = CHAT_STARTERS.slice();
    const picks = [];
    for (let n = 0; n < 5 && pool.length; n++) picks.push({ q: pool.splice(Math.floor(Math.random() * pool.length), 1)[0] });
    return picks;
  }
  // Adaptive: when the AI backend is live (ANTHROPIC_API_KEY set) the chat is a
  // real LLM with conversation memory; otherwise it falls back to the offline
  // keyword matcher over the FAQ. Checked once on boot via /api/chat-config.
  let CHAT_AI = false;
  const chatHistory = []; // [{role, content}] sent to the AI for context
  function chatConvertHtml(text) {
    // Plain-text AI replies → safe HTML: escape, linkify bare URLs, keep line breaks.
    return chatEscape(text)
      .replace(/\n/g, "<br>")
      .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  }
  function chatAsk(text) {
    chatAppend("user", chatEscape(text));

    // Greetings/small-talk answer instantly, offline, in both modes — no need
    // to spend an AI call (or the keyword matcher) on "hi" / "who are you".
    const smallTalk = chatPincodeCheck(text) || chatSmallTalk(text) || chatNutritionBySize(text);
    if (smallTalk) {
      chatAppend("bot", smallTalk);
      if (CHAT_AI) chatHistory.push({ role: "user", content: text }, { role: "assistant", content: smallTalk });
      return;
    }

    const typing = chatAppend("bot", `<span class="chat-typing"><i></i><i></i><i></i></span>`);
    const bubble = typing.querySelector(".chat-bubble");
    const wa = (DATA.brand.contact && DATA.brand.contact.whatsappIntl) || "919258010913";

    if (CHAT_AI) {
      chatHistory.push({ role: "user", content: text });
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory.slice(-12) }),
      })
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error("chat " + r.status))))
        .then((data) => {
          const reply = data.reply || "Sorry, I didn't catch that — could you try again?";
          chatHistory.push({ role: "assistant", content: reply });
          bubble.innerHTML = chatConvertHtml(reply);
          $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
        })
        .catch(() => {
          // AI unreachable → fall back to the offline matcher for this turn.
          const m = chatFindAnswer(text);
          bubble.innerHTML = m ? m.a
            : `I'm having trouble reaching my brain right now 🤔 — please try again, or message us on ` +
              `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>.`;
          $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
        });
      return;
    }

    // Offline knowledge-base mode
    setTimeout(() => {
      const match = chatFindAnswer(text);
      bubble.innerHTML = match
        ? match.a
        : `I'm not fully sure about that one 🤔 — try rephrasing, or ask us directly on ` +
          `<a href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>. ` +
          `Here are a few things I can help with:`;
      $("#chatLog").scrollTop = $("#chatLog").scrollHeight;
      chatSuggest(chatStarters());
    }, 420);
  }
  // (Re)starts the conversation from a clean slate: clears the transcript, wipes
  // the in-memory history so the AI has no prior context, and re-shows the greeting.
  function chatStart() {
    const log = $("#chatLog");
    if (!log) return;
    log.innerHTML = "";
    chatHistory.length = 0;
    chatAppend("bot", `Hi! Ask me about our drinks, nutrition, delivery or subscriptions.`);
    chatSuggest(chatStarters());
  }
  function renderFAQ() {
    const chat = $("#faqChat");
    if (!chat || !DATA.faq) return;
    // Now that DATA is loaded, fill in the real service-area text (was a
    // static placeholder in the HTML until this point — see index.html).
    const pinHelpEl = $("#pinHelp");
    if (pinHelpEl) {
      pinHelpDefaultText = `Fresh, small-batch delivery in ${chatAreasText()}.`;
      pinHelpEl.textContent = pinHelpDefaultText;
    }
    chatStart();
    const reset = $("#chatReset");
    if (reset) reset.addEventListener("click", chatStart);
    $("#chatForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("#chatInput");
      const text = input.value.trim();
      if (!text) return;
      input.value = "";
      chatAsk(text);
    });
    // Detect whether the live AI backend is available; upgrade silently if so.
    fetch("/api/chat-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => { if (cfg && cfg.enabled) CHAT_AI = true; })
      .catch(() => {});
  }

  function renderScience() {
    if (!DATA.science) return;
    const intro = $("#scienceIntro");
    if (intro) intro.textContent = DATA.science.intro || "";
    buildAccordion($("#scienceList"), DATA.science.items, "sci");
  }

  /* ============================================================
     11. FOOTER LEGAL
     ============================================================ */
  function renderFooter() {
    const L = DATA.brand.legal;
    const C = DATA.brand.contact || {};
    $("#footerLegal").innerHTML =
      (L.company ? `<p><strong>${L.company}</strong></p>` : "") +
      `<p>${L.fssai}</p><p>${L.udyam}</p>`;

    const contact = $("#footerContact");
    if (contact) {
      const waPretty = C.whatsapp ? C.whatsapp.replace(/(\d{5})(\d{5})/, "$1 $2") : "";
      contact.innerHTML =
        (C.whatsappIntl ? `<a class="c-link c-wa" href="https://wa.me/${C.whatsappIntl}" target="_blank" rel="noopener">${brandIcon("whatsapp")}<span>WhatsApp +91 ${waPretty}</span></a>` : "") +
        (C.email ? `<a class="c-link c-mail" href="mailto:${C.email}">${brandIcon("email")}<span>${C.email}</span></a>` : "") +
        (C.instagramUrl ? `<a class="c-link c-ig" href="${C.instagramUrl}" target="_blank" rel="noopener">${brandIcon("instagram")}<span>${C.instagram}</span></a>` : "") +
        (C.facebookUrl ? `<a class="c-link c-fb" href="${C.facebookUrl}" target="_blank" rel="noopener">${brandIcon("facebook")}<span>${C.facebook || "Facebook"}</span></a>` : "");

    }

    $("#footerFootnote").textContent = L.rdaFootnote + " " + L.labReportNote;
    $("#year").textContent = new Date().getFullYear();
  }

  /* ============================================================
     SEO — Product structured data (JSON-LD), built from the same
     DATA.products used everywhere else, so prices/names can never drift
     out of sync with what the page actually shows.
     ============================================================ */
  function renderProductSchema() {
    const items = DATA.products.map((p) => {
      const sizeKeys = Object.keys(p.sizes);
      const cheapest = sizeKeys.reduce((min, k) => Math.min(min, p.sizes[k].price || Infinity), Infinity);
      return {
        "@type": "Product",
        "name": p.name,
        "description": p.description,
        "image": p.image,
        "brand": { "@type": "Brand", "name": DATA.brand.trademark },
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": "INR",
          "lowPrice": cheapest,
          "offerCount": sizeKeys.length
        }
      };
    });
    const graph = { "@context": "https://schema.org", "@graph": items };
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(graph);
    document.head.appendChild(s);
  }

  /* ============================================================
     9. CART DRAWER + CHECKOUT MODAL
     ============================================================ */
  const cartDrawer = $("#cartDrawer");
  const cartScrim = $("#cartScrim");
  const modalScrim = $("#modalScrim");
  const checkoutModal = $("#checkoutModal");

  function addToCart(sel) {
    const s = sel.product.sizes[sel.size];
    const days = (sel.option && sel.option.deliveries) || 1;
    const qty = sel.qty || 1;
    const unit = (sel.option && sel.option.type === "one-time" && s.trialPrice != null) ? s.trialPrice : (s.price || 0);
    cart.push({
      key: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
      productId: sel.product.id,
      size: sel.size,          // size KEY (e.g. "300ml"/"1000ml") — server prices by this
      optionId: sel.option ? sel.option.id : "single",
      name: sel.product.name,
      sizeLabel: s.label,
      orderLabel: sel.option.label,
      unitPrice: unit,
      qtyPerDay: qty,
      days: days,
      price: unit * qty * days // line total = bottle × bottles/day × days
    });
    renderCart();
  }

  function removeFromCart(key) {
    const i = cart.findIndex((x) => x.key === key);
    if (i > -1) cart.splice(i, 1);
    renderCart();
  }

  function cartTotal() {
    return cart.reduce((sum, x) => sum + (x.price || 0), 0);
  }

  function renderCart() {
    $("#cartCount").textContent = String(cart.length);
    const items = $("#cartItems");
    items.innerHTML = "";

    if (!cart.length) {
      items.appendChild(el("p", "cart-empty", "Your cart is empty. Add a bottle to get started."));
      $("#checkoutOpen").disabled = true;
    } else {
      cart.forEach((item) => {
        const line = el("div", "cart-line");
        line.innerHTML =
          `<div class="cl-top"><span class="cl-name">${item.name}</span>` +
          `<span class="cl-price">${money(item.price)}</span></div>` +
          `<span class="cl-meta">${item.sizeLabel} &middot; ${item.orderLabel}` +
          ((item.qtyPerDay > 1 || item.days > 1) ? ` &middot; ${money(item.unitPrice)} × ${item.qtyPerDay}/day × ${item.days}d` : "") +
          `</span>` +
          `<button class="cl-remove" type="button">Remove</button>`;
        $(".cl-remove", line).addEventListener("click", () => removeFromCart(item.key));
        items.appendChild(line);
      });
      $("#checkoutOpen").disabled = false;
    }

    const total = cartTotal();
    $("#cartTotal").textContent = total > 0 ? "₹" + total : "TBD";
    updateCartLocality();
  }

  // Collapses the pincode form into a compact "Delivering to: X · Change" bar once a
  // locality is confirmed, so the delivery check doesn't linger once it's done its job.
  function updateCartLocality() {
    const wrap = $("#cartDelivery");
    const setBar = $("#cartLocalitySet");
    const node = $("#cartLocality");
    if (selectedLocality) {
      node.innerHTML = `Delivering to: <strong>${selectedLocality}</strong>`;
      setBar.hidden = false;
      wrap.classList.add("is-set");
    } else {
      setBar.hidden = true;
      wrap.classList.remove("is-set");
    }
  }

  $("#changeLocality").addEventListener("click", () => {
    $("#cartDelivery").classList.remove("is-set");
    pinInput.focus();
  });

  // Keyboard focus trap for the cart drawer / checkout modal — both are
  // role="dialog" aria-modal="true", so Tab shouldn't be able to reach the
  // page behind them while open. Restores focus to whatever opened the dialog on close.
  let lastFocusedEl = null;
  let releaseTrap = null;
  function trapFocus(container) {
    const focusables = $$(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      container
    ).filter((f) => f.offsetParent !== null);
    if (!focusables.length) return () => {};
    const first = focusables[0], last = focusables[focusables.length - 1];
    function onKeydown(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    container.addEventListener("keydown", onKeydown);
    return () => container.removeEventListener("keydown", onKeydown);
  }

  function openCart() {
    lastFocusedEl = document.activeElement;
    cartDrawer.hidden = false;
    cartScrim.hidden = false;
    requestAnimationFrame(() => cartDrawer.classList.add("open"));
    document.body.classList.add("no-scroll");
    releaseTrap = trapFocus(cartDrawer);
    $("#cartClose").focus();
  }
  function closeCart() {
    cartDrawer.classList.remove("open");
    cartScrim.hidden = true;
    document.body.classList.remove("no-scroll");
    setTimeout(() => { cartDrawer.hidden = true; }, 300);
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  $("#cartToggle").addEventListener("click", () => { renderCart(); openCart(); });
  $("#cartClose").addEventListener("click", closeCart);
  cartScrim.addEventListener("click", closeCart);

  // Checkout modal
  function openCheckout() {
    if (!cart.length) return;
    // Require a serviceable locality before checkout — reveal the delivery-check
    // form right there in the cart (it lives inside the drawer) instead of navigating away.
    if (!selectedLocality) {
      $("#cartDelivery").classList.remove("is-set");
      $("#pinInput").focus();
      return;
    }
    $("#coLocality").value = selectedLocality;
    // Pre-fill the GPS-detected street text, but only into an empty field —
    // never overwrite something the customer already typed themselves.
    const addrField = $("#coAddress");
    if (detectedStreetAddress && !addrField.value.trim()) addrField.value = detectedStreetAddress;
    $("#checkoutSummary").innerHTML =
      `${cart.length} item(s) &middot; Total <strong>${cartTotal() > 0 ? "₹" + cartTotal() : "TBD"}</strong> &middot; Delivery to ${selectedLocality}`;
    $("#checkoutDone").hidden = true;
    lastFocusedEl = document.activeElement;
    checkoutModal.hidden = false;
    modalScrim.hidden = false;
    document.body.classList.add("no-scroll");
    releaseTrap = trapFocus(checkoutModal);
    $("#coName").focus();
  }
  function closeCheckout() {
    checkoutModal.hidden = true;
    modalScrim.hidden = true;
    document.body.classList.remove("no-scroll");
    if (releaseTrap) { releaseTrap(); releaseTrap = null; }
    if (lastFocusedEl) lastFocusedEl.focus();
  }
  $("#checkoutOpen").addEventListener("click", () => {
    // Only leave the cart drawer once a locality is confirmed — otherwise stay put
    // so the just-revealed delivery-check form is actually visible to fill in.
    if (!selectedLocality) { openCheckout(); return; }
    closeCart();
    openCheckout();
  });
  $("#checkoutClose").addEventListener("click", closeCheckout);
  modalScrim.addEventListener("click", closeCheckout);

  // Saves the order + customer details to a place the business OWNS (email inbox or
  // sheet) via the configured form endpoint — so the business "has the customer"
  // independent of WhatsApp. Fire-and-forget: uses FormData (a "simple" request, no
  // CORS preflight) and never blocks or fails the checkout if the endpoint is slow/down.
  function captureOrder(order) {
    const cap = DATA.brand.orderCapture;
    if (!cap || !cap.endpoint) return Promise.resolve(false);
    const fd = new FormData();
    fd.append("orderId", order.orderId);
    fd.append("items", order.items);
    fd.append("total", order.total);
    fd.append("name", order.name);
    fd.append("phone", order.phone);
    fd.append("address", order.address);
    fd.append("locality", order.locality);
    fd.append("payment", order.payment);
    fd.append("placedAt", order.placedAt);
    return fetch(cap.endpoint, { method: "POST", body: fd, headers: { Accept: "application/json" } })
      .then((r) => r.ok)
      .catch(() => false); // capture failure must not block the customer
  }

  // Asks the server whether live Razorpay keys are configured. If so, we load
  // Razorpay's checkout.js and switch the button to secure server-priced payment.
  // If not (e.g. local static preview), everything below stays on the existing
  // gateway-link / WhatsApp flow — nothing breaks without a backend.
  function initBackendPayments() {
    fetch("/api/payment-config")
      .then((r) => (r.ok ? r.json() : null))
      .then((cfg) => {
        if (!cfg || !cfg.enabled) return;
        rzpEnabled = true;
        rzpKeyId = cfg.keyId;
        // Load Razorpay checkout only when it's actually usable.
        if (!document.getElementById("rzpCheckoutJs")) {
          const s = document.createElement("script");
          s.id = "rzpCheckoutJs";
          s.src = "https://checkout.razorpay.com/v1/checkout.js";
          document.head.appendChild(s);
        }
        const btn = $("#checkoutSubmitBtn");
        const note = $("#checkoutNote");
        if (btn) btn.textContent = "Pay Securely";
        if (note) note.textContent =
          "Your delivery details are saved to us, then you pay the exact total through Razorpay's " +
          "secure window — the amount is locked by our server and can't be edited. WhatsApp is for help, not payment.";
      })
      .catch(() => { /* no backend → checkout stays blocked with a clear message */ });
  }

  // Server payload: only WHAT was chosen (id + size key + qty). No price/amount —
  // the server computes the total from data.json so it can't be tampered with.
  function cartForServer() {
    return cart.map((i) => ({ id: i.productId, size: i.size, option: i.optionId, qty: i.qtyPerDay }));
  }
  // Customer info sent to the server for delivery scheduling only (name/phone/
  // address are never used for pricing — that stays server-computed from
  // data.json, exactly as before).
  function customerForServer(order) {
    return { name: order.name, phone: order.phone, address: order.address, locality: order.locality };
  }

  // Opens the Razorpay modal bound to a server-created order_id. Because the
  // checkout is order-bound, Razorpay reads the amount from its own servers —
  // the customer cannot alter it.
  function payWithRazorpay(order, freq, items) {
    const done = $("#checkoutDone");
    fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, freq, customer: customerForServer(order) }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.orderId) throw new Error(data.error || "Could not start payment");
        if (typeof Razorpay === "undefined") throw new Error("Payment library still loading — try again in a moment");

        const rzp = new Razorpay({
          key: rzpKeyId,
          order_id: data.orderId,       // the lock: amount is fixed by this order
          amount: data.amount,          // display only; server order is authoritative
          currency: data.currency || "INR",
          name: "Bentam Chalk",
          description: "Order " + order.orderId + (freq && freq !== "single" ? " · " + freq : ""),
          prefill: { name: order.name, contact: order.phone },
          notes: { locality: order.locality, address: order.address },
          theme: { color: "#b87333" },
          handler: (resp) => {
            // Verify the callback signature for UX; the webhook is the trusted path.
            fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(resp),
            })
              .then((r) => r.json())
              .then((v) => {
                // Each cart line becomes its own delivery-tracking link (a product
                // on a weekly plan and one on monthly, say, get separate schedules).
                const links = (v.tracking || [])
                  .map((t) => `<a href="/track.html?t=${t.token}" target="_blank" rel="noopener">Track ${t.product} deliveries →</a>`)
                  .join("<br>");
                done.innerHTML = v.ok
                  ? `✓ Payment received — thank you! Order <strong>${order.orderId}</strong> (Razorpay ref ${resp.razorpay_payment_id}).` +
                    (links ? `<br><br>${links}` : "") +
                    `<br><br>We'll confirm delivery on WhatsApp.`
                  : `⚠ Payment captured but verification is pending. Keep Razorpay ref ${resp.razorpay_payment_id} and message us on WhatsApp if unconfirmed.`;
                done.hidden = false;
                cart.length = 0;
                renderCart();
              });
          },
        });
        rzp.on("payment.failed", (ev) => {
          done.innerHTML = `⚠ Payment didn't go through (${(ev.error && ev.error.description) || "cancelled"}). ` +
            `Your details are saved — you can retry, or reach us on WhatsApp.`;
          done.hidden = false;
        });
        rzp.open();
      })
      .catch((err) => {
        done.innerHTML = `⚠ ${err.message}. Your details are saved — please retry or contact us on WhatsApp.`;
        done.hidden = false;
      });
  }

  // Checkout submit — Razorpay only, no exceptions. There is no WhatsApp/manual-UPI
  // path to pay through: if the backend isn't configured, checkout refuses to
  // proceed rather than creating an order with no tracked payment behind it (that
  // gap used to let a "subscription" get sold with zero delivery record created).
  $("#checkoutForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const form = e.target;
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const done = $("#checkoutDone");
    if (!rzpEnabled) {
      done.innerHTML = `⚠ Online payment isn't available right now. Please try again shortly, or message us on WhatsApp.`;
      done.hidden = false;
      return;
    }

    const name = $("#coName").value.trim();
    const phone = $("#coPhone").value.trim();
    const address = $("#coAddress").value.trim();
    const total = cartTotal();
    const orderId = "BC" + Date.now().toString(36).toUpperCase();

    const order = {
      orderId,
      items: cart.map((i) => `${i.name} — ${i.sizeLabel}, ${i.orderLabel} (${money(i.price)})`).join("; "),
      total: total > 0 ? total : "TBD",
      name, phone, address,
      locality: selectedLocality || "-",
      payment: "Razorpay",
      placedAt: new Date().toISOString()
    };

    // Save the customer + order details to the owner's own inbox/sheet.
    captureOrder(order);

    const freq = (cart[0] && cart[0].optionId) || "single";
    done.innerHTML = `Opening secure payment for Order <strong>${orderId}</strong>…`;
    done.hidden = false;
    // Cart clears only on payment success, inside payWithRazorpay's handler —
    // so it survives a cancel/retry.
    payWithRazorpay(order, freq, cartForServer());
  });

  // ESC closes overlays
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!checkoutModal.hidden) closeCheckout();
    else if (!cartDrawer.hidden) closeCart();
  });
})();
