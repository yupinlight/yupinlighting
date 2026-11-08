(function () {
  "use strict";

  /* navigation */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
  }

  document.querySelectorAll(".sub-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var item = btn.closest(".has-sub");
      var open = item.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.textContent = open ? "−" : "+";
    });
  });

  /* search */
  var input = document.getElementById("search-input");
  var results = document.getElementById("search-results");
  var empty = document.getElementById("search-empty");
  var indexPromise = null;

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch("/index.json").then(function (r) { return r.json(); }).catch(function () { return []; });
    }
    return indexPromise;
  }

  function escapeHtml(s) {
    return String(s || "").replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function score(item, q) {
    var model = (item.model || "").toLowerCase();
    var title = (item.title || "").toLowerCase();
    var kw = (item.keywords || "").toLowerCase();
    var summary = (item.summary || "").toLowerCase();
    if (model && model === q) return 100;
    if (model && model.indexOf(q) === 0) return 80;
    if (model && model.indexOf(q) > -1) return 60;
    if (title.indexOf(q) > -1) return 40;
    if (kw.indexOf(q) > -1) return 30;
    if (summary.indexOf(q) > -1) return 15;
    return 0;
  }

  function render(list, q) {
    if (!results) return;
    results.innerHTML = "";
    if (empty) empty.hidden = list.length > 0;
    list.forEach(function (item) {
      var a = document.createElement("a");
      a.className = "search-result";
      a.href = item.url;
      a.innerHTML =
        '<span class="sr-model">' + escapeHtml(item.model || item.type) + "</span>" +
        '<span class="sr-title">' + escapeHtml(item.title) + "</span>" +
        '<span class="sr-meta">' + escapeHtml(item.series || "") + "</span>";
      results.appendChild(a);
    });
  }

  if (input) {
    var timer = null;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      clearTimeout(timer);
      if (q.length < 2) { if (results) results.innerHTML = ""; if (empty) empty.hidden = true; return; }
      timer = setTimeout(function () {
        loadIndex().then(function (items) {
          var hits = items
            .map(function (it) { return { item: it, s: score(it, q) }; })
            .filter(function (x) { return x.s > 0; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 12)
            .map(function (x) { return x.item; });
          render(hits, q);
        });
      }, 120);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input && !/input|textarea|select/i.test(document.activeElement.tagName)) {
        e.preventDefault();
        input.focus();
      }
    });

    var params = new URLSearchParams(location.search);
    var qp = params.get("q");
    if (qp) {
      input.value = qp;
      input.dispatchEvent(new Event("input"));
    }
  }

  /* series filters */
  var filterForm = document.querySelector("[data-filter]");
  if (filterForm) {
    var cards = Array.prototype.slice.call(document.querySelectorAll(".product-grid--series .p-card"));
    var countEl = document.querySelector("[data-filter-count]");
    var emptyEl = document.querySelector("[data-filter-empty]");
    var selWatt = filterForm.querySelector("[data-filter-watt]");
    var selCct = filterForm.querySelector("[data-filter-cct]");
    var selColour = filterForm.querySelector("[data-filter-colour]");
    var selDiffuser = filterForm.querySelector("[data-filter-diffuser]");
    var selLumen = filterForm.querySelector("[data-filter-lumen]");

    function inRange(value, range) {
      if (!range) return true;
      var n = parseFloat(value) || 0;
      if (range.indexOf("+") > -1) return n >= parseFloat(range);
      var parts = range.split("-");
      return n >= parseFloat(parts[0]) && n <= parseFloat(parts[1]);
    }

    function applyFilters() {
      var shown = 0;
      cards.forEach(function (card) {
        var ok =
          inRange(card.getAttribute("data-watt"), selWatt.value) &&
          (!selCct.value || card.getAttribute("data-cct") === selCct.value) &&
          (!selColour.value || card.getAttribute("data-colour").indexOf(selColour.value) > -1) &&
          (!selDiffuser.value || card.getAttribute("data-diffuser") === selDiffuser.value) &&
          inRange(card.getAttribute("data-lumen"), selLumen.value);
        card.hidden = !ok;
        if (ok) shown++;
      });
      if (countEl) countEl.textContent = shown;
      if (emptyEl) emptyEl.hidden = shown > 0;
    }

    filterForm.addEventListener("change", applyFilters);
    filterForm.addEventListener("reset", function () { setTimeout(applyFilters, 0); });
  }

  /* inquiry form */
  var form = document.querySelector(".rfq-form");
  if (form) {
    var modelParam = new URLSearchParams(location.search).get("model");
    var message = form.querySelector("#message");
    if (modelParam && message && message.value.indexOf(modelParam) === -1) {
      message.value = "Model: " + modelParam + "\n";
    }

    var blockedDomains = ["example.com", "test.com", "mailinator.com", "tempmail.com", "guerrillamail.com"];
    var allowedExt = ["jpg", "jpeg", "png", "pdf", "docx"];

    function setError(name, msg) {
      var el = form.querySelector('[data-for="' + name + '"]');
      if (el) el.textContent = msg || "";
      var field = form.querySelector("#" + name);
      if (field) {
        var wrap = field.closest(".field");
        if (wrap) wrap.classList.toggle("has-error", !!msg);
      }
    }

    form.addEventListener("submit", function (e) {
      var ok = true;
      ["name", "email", "message", "attachment"].forEach(function (n) { setError(n, ""); });

      var name = form.querySelector("#name").value.trim();
      if (name.length < 2 || name.length > 50) { setError("name", "Please enter your name (2–50 characters)."); ok = false; }

      var email = form.querySelector("#email").value.trim();
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!emailOk) {
        setError("email", "Please enter a valid business email address.");
        ok = false;
      } else {
        var domain = email.split("@")[1].toLowerCase();
        if (blockedDomains.indexOf(domain) > -1) { setError("email", "Please use your company email address."); ok = false; }
      }

      var msg = message.value.trim();
      if (msg.length < 10 || msg.length > 2000) { setError("message", "Please describe your requirement (10–2000 characters)."); ok = false; }

      var files = form.querySelector("#attachment").files;
      if (files && files.length > 3) { setError("attachment", "Attach no more than 3 files."); ok = false; }
      if (files && files.length) {
        Array.prototype.forEach.call(files, function (f) {
          var ext = (f.name.split(".").pop() || "").toLowerCase();
          if (allowedExt.indexOf(ext) === -1) { setError("attachment", "Only jpg, png, pdf or docx files are accepted."); ok = false; }
          if (f.size > 10 * 1024 * 1024) { setError("attachment", "Each file must be 10 MB or smaller."); ok = false; }
        });
      }

      if (!ok) {
        e.preventDefault();
        var firstErr = form.querySelector(".has-error input, .has-error textarea");
        if (firstErr) firstErr.focus();
      }
    });
  }
})();
