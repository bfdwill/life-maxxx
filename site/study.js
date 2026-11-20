/* Anki-style study tab: Leitner-box spaced repetition over window.STUDY_DECKS. */
(function () {
  const L = window.RPG;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const KEY = "lrpg.study.srs";
  const INTERVALS = [0, 1, 2, 4, 9, 16]; // days to wait after reaching box 1..5 (box 0 unused)

  function todayStr() { return (L && L.ymd) ? L.ymd(new Date()) : new Date().toISOString().slice(0, 10); }
  function plusDays(d, n) { return (L && L.addDays) ? L.addDays(d, n) : d; }
  function loadSRS() { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } }
  function saveSRS(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  let srs = loadSRS();
  let deckId = null, queue = [], qi = 0, flipped = false, stats = { seen: 0, good: 0 };

  function cardState(id) { return srs[id] || { box: 1, due: todayStr() }; }
  function dueCount(deck) {
    const t = todayStr();
    return deck.cards.filter((c) => cardState(c.id).due <= t).length;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function startSession(id) {
    const deck = (window.STUDY_DECKS || []).find((d) => d.id === id);
    if (!deck) return;
    deckId = id;
    const t = todayStr();
    let due = deck.cards.filter((c) => cardState(c.id).due <= t);
    if (!due.length) due = deck.cards.slice(); // nothing due: free practice through the whole deck
    queue = shuffle(due.slice());
    qi = 0; flipped = false; stats = { seen: 0, good: 0 };
  }

  function grade(good) {
    const c = queue[qi];
    if (!c) return;
    const st = cardState(c.id);
    st.box = good ? Math.min(5, st.box + 1) : 1;
    st.due = plusDays(todayStr(), INTERVALS[st.box]);
    srs[c.id] = st; saveSRS(srs);
    stats.seen++; if (good) stats.good++;
    qi++; flipped = false;
  }

  function behaviorBack(c) {
    const lines = [];
    if (c.storyId && window.STUDY_STORIES && window.STUDY_STORIES[c.storyId]) {
      const s = window.STUDY_STORIES[c.storyId];
      lines.push(`<b>Primary story — ${esc(s.title)}</b>`);
      lines.push(`<b>Cause:</b> ${esc(s.cause)}`);
      lines.push(`<b>Action:</b> ${esc(s.action)}`);
      lines.push(`<b>Result:</b> ${esc(s.result)}`);
      lines.push(`<small>Skills: ${esc(s.skills.join(", "))}</small>`);
    } else {
      lines.push(`<b>No real story mapped yet.</b>`);
    }
    if (c.alt) lines.push(`<small>${esc(c.alt)}</small>`);
    if (c.note) lines.push(`<small style="color:var(--gold)">${esc(c.note)}</small>`);
    return lines.join("<br>");
  }
  function cardBackHtml(c) {
    if (c.type === "behavioral") return behaviorBack(c);
    if (Array.isArray(c.back)) return c.back.map(esc).join("<br><br>");
    return esc(c.back || "");
  }

  function view() {
    const decks = window.STUDY_DECKS || [];
    if (!deckId) {
      let h = `<h3>Study</h3><div class="card"><small>Spaced-repetition flashcards for interview prep. Tap a deck to review what's due; cards you miss come back sooner, cards you know come back less often.</small></div>`;
      for (const d of decks) {
        const due = dueCount(d);
        h += `<div class="card row"><div class="grow"><b>${d.icon} ${esc(d.name)}</b><br><small>${d.cards.length} cards · ${due} due today</small></div>
          <button class="btn alt" style="width:auto" data-act="study-pick" data-id="${d.id}">${due ? "Study" : "Practice"}</button></div>`;
      }
      h += `<div class="card"><small>Reviewed 10+ cards? Head to the Today tab and tap 🧠 Study reps to log it for XP.</small></div>`;
      return h;
    }
    const deck = decks.find((d) => d.id === deckId);
    if (!deck) { deckId = null; return view(); }
    if (qi >= queue.length) {
      return `<h3>${esc(deck.name)}</h3><div class="card"><b>Session done.</b><br><small>${stats.good}/${stats.seen} marked "Got it".</small>
        ${stats.seen >= 10 ? `<div class="pill good" style="margin-top:8px">10+ reviewed — log 🧠 Study reps on Today</div>` : ""}
        <button class="btn" style="margin-top:10px" data-act="study-exit">Back to decks</button></div>`;
    }
    const c = queue[qi];
    let h = `<h3>${esc(deck.name)} · ${qi + 1}/${queue.length}</h3>`;
    h += `<div class="card" style="min-height:120px"><small>${esc(c.tag || "")}</small><div style="font-size:17px;font-weight:700;margin-top:6px">${esc(c.q)}</div></div>`;
    if (flipped) {
      h += `<div class="card" style="border-color:#2f7a48">${cardBackHtml(c)}</div>
        <div class="seg"><button data-act="study-grade" data-v="again">Again</button><button class="sel" data-act="study-grade" data-v="good">Got it</button></div>`;
    } else {
      h += `<button class="btn" data-act="study-flip">Show answer</button>`;
    }
    h += `<button class="btn alt" style="margin-top:10px" data-act="study-exit">Exit session</button>`;
    return h;
  }

  function onClick(el) {
    const a = el.dataset.act;
    if (a === "study-pick") startSession(el.dataset.id);
    else if (a === "study-flip") flipped = true;
    else if (a === "study-grade") grade(el.dataset.v === "good");
    else if (a === "study-exit") { deckId = null; queue = []; qi = 0; }
  }

  window.RPGStudy = { view, onClick };
})();
