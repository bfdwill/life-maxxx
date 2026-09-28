/* Life-RPG app: tabs, taps, saving to GitHub. */
(function () {
  const L = window.RPG, ART = window.RPGArt;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const SETTINGS_KEY = "lrpg.settings";
  let cfg, today, info, state, tab = "today", selTown = null, saveMsg = null, busy = false, toastTimer, scrollToMe = false;

  // ---------- settings ----------
  function guessRepo() {
    const host = location.hostname, seg = location.pathname.split("/")[1] || "";
    return { owner: host.endsWith(".github.io") ? host.split(".")[0] : "", repo: seg && !seg.includes(".") ? seg : "life-rpg" };
  }
  function loadSettings() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"); } catch (e) {}
    const g = guessRepo();
    return { owner: s.owner || g.owner, repo: s.repo || g.repo, branch: s.branch || "main", token: s.token || "" };
  }
  let settings = loadSettings();
  const isOwner = () => !!(settings.token && settings.owner && settings.repo);

  // ---------- drafts ----------
  const draftKey = () => `lrpg.draft.${today}`;
  function persist() { try { localStorage.setItem(draftKey(), JSON.stringify(state)); } catch (e) {} }
  function loadDraft() { try { const d = localStorage.getItem(draftKey()); return d ? JSON.parse(d) : null; } catch (e) { return null; } }

  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("show"), 2400 + msg.length * 45);
  }

  // ---------- GitHub API ----------
  function friendly(status) {
    if (status === 401) return "GitHub rejected the token. Make a new one in Setup.";
    if (status === 403) return "The token needs Contents: Read and write on this repo.";
    if (status === 404) return "Repo or file not found. Check the owner and repo in Setup.";
    if (status === 409 || status === 422) return "The file changed while saving. Tap Save again.";
    return `GitHub error ${status}.`;
  }
  function explainNetError(e) {
    const m = String((e && e.message) || e);
    if (/ISO-8859-1|header|Invalid value|not a valid HTTP/i.test(m)) return "The token has a stray character in it. Delete the token box, copy the token again from GitHub, and paste it fresh.";
    return "Could not reach GitHub from this browser. Try cellular data instead of Wi-Fi (work or hospital Wi-Fi can block it), and turn off any VPN or content blocker.";
  }
  async function gh(path, opts) {
    const url = `https://api.github.com/repos/${encodeURIComponent(settings.owner)}/${encodeURIComponent(settings.repo)}${path ? "/" + path : ""}`;
    try {
      return await fetch(url, {
        ...(opts || {}),
        headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28",
                   Authorization: `Bearer ${settings.token}`, ...((opts && opts.headers) || {}) },
      });
    } catch (e) { throw new Error(explainNetError(e)); }
  }
  const b64dec = (b) => new TextDecoder().decode(Uint8Array.from(atob(b.replace(/\s/g, "")), (c) => c.charCodeAt(0)));
  function b64enc(t) { const bytes = new TextEncoder().encode(t); let s = ""; for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]); return btoa(s); }
  async function getFile(path) {
    const r = await gh(`contents/${encodeURI(path)}?ref=${encodeURIComponent(settings.branch)}`);
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(friendly(r.status));
    const j = await r.json();
    return { sha: j.sha, text: b64dec(j.content) };
  }
  async function putFile(path, text, sha, message) {
    const r = await gh(`contents/${encodeURI(path)}`, { method: "PUT",
      body: JSON.stringify({ message, content: b64enc(text), branch: settings.branch, ...(sha ? { sha } : {}) }) });
    if (!r.ok) throw new Error(friendly(r.status));
  }
  async function writeLog(date, line) {
    const path = `log/${date.slice(0, 7)}.md`;
    const f = await getFile(path);
    let text = f ? f.text : `# Log: ${date.slice(0, 7)}\n\n`;
    const lines = text.split("\n");
    const i = lines.findIndex((l) => l.startsWith(date));
    if (i >= 0) lines[i] = line; else { while (lines.length && lines[lines.length - 1] === "") lines.pop(); lines.push(line, ""); }
    await putFile(path, lines.join("\n"), f && f.sha, `log ${date}`);
  }
  async function appendSideQuest(obj) {
    const f = await getFile("side-quests.yml");
    let text = f ? f.text : "# One-off missions. One YAML list item per line.\n";
    if (!text.endsWith("\n")) text += "\n";
    await putFile("side-quests.yml", text + "- " + JSON.stringify(obj) + "\n", f && f.sha, `side quest: ${obj.title}`);
  }
  async function pullToday() {
    if (!isOwner() || state.dirty) return;
    try {
      const f = await getFile(`log/${today.slice(0, 7)}.md`);
      const ln = f && f.text.split("\n").find((l) => l.startsWith(today));
      if (ln && !state.dirty) { state = L.parseLine(ln).state; persist(); render(); }
    } catch (e) { /* offline or no access: keep local state */ }
  }

  // ---------- views ----------
  function hud() {
    const span = cfg.next_level_xp - cfg.level_floor_xp, pct = Math.min(100, Math.round(100 * (cfg.total_xp - cfg.level_floor_xp) / span));
    const dayTxt = info.phase === "active" ? `Day ${info.dayNo}/${cfg.total_days}` : info.phase === "before" ? `Starts in ${info.daysUntil}d` : "Complete";
    return `<div class="card"><div class="hudtop"><b>${esc(cfg.player)} · Lv ${cfg.level} ${esc(cfg.rank)}</b><span class="chip">${dayTxt}</span></div>
      <div class="bar"><i style="width:${pct}%"></i></div>
      <div class="row"><small class="grow">${cfg.total_xp.toLocaleString()} / ${cfg.next_level_xp.toLocaleString()} XP</small><span class="chip">🪙 ${cfg.gold_balance}</span><span class="chip">🏅 ${cfg.badges.filter((b) => b.earned).length}/${cfg.badges.length}</span></div></div>`;
  }

  function viewToday() {
    if (info.phase === "before") return `<div class="card">The adventure starts <b>${esc(cfg.start_date)}</b> (in ${info.daysUntil} day${info.daysUntil === 1 ? "" : "s"}). Peek at the Map while you wait.</div>`;
    if (info.phase === "after") return `<div class="card">The 90 days are done. Check the Map and Quests for the final tally.</div>`;
    const tm = L.dayInfo(cfg, L.addDays(today, 1));
    const sc = L.scoreDay(cfg, state);
    const rec = state.sleep === "R";
    let h = `<div class="card"><div class="row"><div class="grow"><b>${info.dowName} · ${esc(info.type)}</b> <small>${esc(L.TYPE_NAME[info.type] || "")}</small><br><small>Week ${info.wkIdx + 1} (${esc(cfg.quest_defs[info.weekKey].name)})${tm.phase === "active" ? ` · tomorrow ${esc(tm.type)}` : ""}</small></div></div></div>`;

    h += `<h3>How did you sleep?</h3><div class="card"><div class="seg sleep">
      ${[["G", "6h+", "🟢"], ["Y", "5-5.9h", "🟡"], ["R", "Under 5h", "🔴"]].map(([v, t, e]) => `<button data-act="sleep" data-v="${v}" class="${state.sleep === v ? "sel" : ""}">${e} ${t}</button>`).join("")}
    </div></div>`;

    h += `<div class="card">${L.getHints(cfg, info, state).map((x) => `<div class="hint"><span>${x.icon}</span><div>${esc(x.text)}</div></div>`).join("")}</div>`;

    h += `<h3>Dailies</h3>`;
    for (const d of cfg.dailies) {
      const c = state.codes[d.key], R = cfg.rules.daily_xp;
      h += `<div class="card daily ${c ? "on" : ""} ${rec ? "recovery" : ""}"><div class="dhead"><span class="ico">${esc(d.icon || "⭐")}</span><div class="grow"><b>${esc(d.name)}</b><small>${esc(d.normal)}</small></div><span class="chip">${esc(d.stat)}</span></div>
        <div class="seg">
          <button data-act="code" data-k="${d.key}" data-v="m" class="${c === "m" ? "sel" : ""}">Min<i>+${R.m}</i></button>
          <button data-act="code" data-k="${d.key}" data-v="N" class="${c === "N" ? "sel" : ""}">Full<i>+${R.N}</i></button>
          ${d.rest ? `<button data-act="code" data-k="${d.key}" data-v="r" class="${c === "r" ? "sel" : ""}">Rest<i>+${R.r}</i></button>` : ""}
        </div><small class="min">Min: ${esc(d.minimum)}</small></div>`;
    }

    const sqs = (cfg.side_quests || []).filter((q) => q.date && today >= L.addDays(q.date, -2) && today <= (q.until || q.date) && (!q.done || state.sq[q.id]));
    if (sqs.length) {
      h += `<h3>Side quests</h3>`;
      for (const q of sqs) {
        const early = today < q.date, on = !!state.sq[q.id];
        h += `<div class="card" style="border-color:${on ? "#2f7a48" : "#7a5cff"}"><b>✨ ${esc(q.title)}</b><br><small>${esc(q.hint || "")}</small>
          <div class="row" style="margin-top:8px"><span class="pill gold">+${q.xp} XP · +${q.gold}g</span><span class="grow"></span>
          ${early ? `<span class="pill">Heads-up: ${L.daysBetween(today, q.date)}d away</span>` : `<button class="btn ${on ? "" : "alt"}" style="width:auto" data-act="sq" data-id="${esc(q.id)}">${on ? "Done ✓" : "Mark done"}</button>`}</div></div>`;
      }
    }

    h += `<h3>Bonus habits</h3><div class="card"><div class="chips">`;
    for (const [t, hb] of Object.entries(cfg.rules.habits)) {
      const n = state.counts[t] || 0;
      h += `<button class="hb ${n ? "sel" : ""}" data-act="hab" data-t="${esc(t)}">${hb.icon || "•"} ${esc(hb.label || t)}${n > 1 ? `<em>×${n}</em>` : ""}</button>`;
    }
    h += `</div><small style="display:block;margin-top:8px">Tap to add. Training counts once a day, others up to ${cfg.rules.other_habit_cap_per_day}.</small>
      <div class="chips" style="margin-top:10px">`;
    for (const t of Object.keys(cfg.rules.negatives)) {
      const n = state.counts[t] || 0;
      h += `<button class="hb neg ${n ? "sel" : ""}" data-act="hab" data-t="${esc(t)}">${esc(cfg.rules.negative_labels[t] || t)} (-${cfg.rules.negatives[t]})${n > 1 ? `<em>×${n}</em>` : ""}</button>`;
    }
    h += `</div></div>`;

    h += `<h3>Today's mode</h3><div class="card"><div class="chips">
      <button class="hb ${state.flags.shield ? "sel" : ""}" data-act="flag" data-f="shield">🛡️ Family Shield</button>
      <button class="hb ${state.flags.pause ? "sel" : ""}" data-act="flag" data-f="pause">⏸️ Pause day</button></div>
      <label style="display:block;margin-top:12px">Note (public if repo is public)</label>
      <input type="text" id="note" maxlength="80" value="${esc(state.note)}" placeholder="optional, keep it clean"></div>`;

    h += sc.perfect ? `<div class="banner">⭐ PERFECT DAY ⭐</div>` : "";
    h += `<div class="card"><div class="row"><b class="grow">Today: +${sc.xp} XP · +${sc.gold}g</b><small>${sc.done}/${cfg.dailies.length} dailies</small></div>
      <small>Counts toward your level after you save and the tally runs (about a minute).</small>
      <button class="btn" style="margin-top:10px" data-act="save" ${busy ? "disabled" : ""}>${busy ? "Saving..." : isOwner() ? "Save day to GitHub" : "Get today's log line"}</button></div>`;

    if (saveMsg) {
      if (saveMsg.kind === "ok") h += `<div class="card" style="border-color:#2f7a48">✅ Saved. Stats and the map refresh in about a minute.</div>`;
      else if (saveMsg.kind === "err") h += `<div class="card warn">⚠️ ${esc(saveMsg.text)}<br><small>Your taps are still saved on this phone.</small></div>`;
      else h += `<div class="card"><small>Paste this line into <b>log/${today.slice(0, 7)}.md</b> (replace today's line if there is one):</small><pre class="line">${esc(saveMsg.line)}</pre>
        <button class="btn alt" data-act="copy">Copy line</button>${settings.owner ? `<a class="btn alt" style="margin-top:8px;text-align:center;text-decoration:none" href="https://github.com/${esc(settings.owner)}/${esc(settings.repo)}/edit/${esc(settings.branch)}/log/${today.slice(0, 7)}.md">Open the log on GitHub</a>` : ""}</div>`;
    }
    return h;
  }

  function viewMap() {
    const b = cfg.badges.find((x) => x.id === selTown);
    let h = `<div id="mapwrap"></div>`;
    if (b) {
      const link = settings.owner ? `https://github.com/${settings.owner}/${settings.repo}/blob/${settings.branch}/${b.file}` : null;
      h += `<div class="card badge ${b.earned ? "earned" : ""}"><span class="medal">🏅</span><div class="grow"><b>${esc(b.town)}</b><br><small>${esc(b.name)}: ${esc(b.blurb)}</small><br>
        <small>Reach Lv ${b.arrive_level} (${b.arrive_xp.toLocaleString()} XP) · target ${esc(b.target_date)}</small><br>
        ${b.earned ? `<span class="pill good">BADGE EARNED</span>` : `<span class="pill">Ship ${link ? `<a style="color:inherit" href="${esc(link)}">${esc(b.file)}</a>` : esc(b.file)} to win it</span>`}</div></div>`;
    } else h += `<div class="card"><small>Tap a gym to see how to win its badge. Earn XP to walk the route; ship the file to win the badge.</small></div>`;
    return h;
  }

  function viewQuests() {
    let h = "";
    if (info.phase === "active") {
      const v = L.weekView(cfg, info), n = v.need, hv = v.have;
      const rows = [
        ["🌙 Sleep 6h+ nights", hv.sleep_green_days, n.sleep_green_days],
        ["🍗 Full Fuel days", hv.normal_fuel_days, n.normal_fuel_days],
        ["🥋 Training sessions", hv.training_days, n.training_days],
        ["💻 Learn days", hv.learn_days, n.learn_days],
        ["🧪 Ship something (+homelab)", hv.ship_count, n.ship_count],
      ];
      h += `<h3>Week ${info.wkIdx + 1}: ${esc(v.def.name)}</h3><div class="card"><small>Clear 3 of 4 goals for ${v.def.xp} XP + ${v.def.gold}g. All 4 adds +${v.def.full_bonus_xp} XP. Learn counts both Learn days and shipping something.</small>`;
      for (const [t, have, need] of rows) {
        const pct = Math.min(100, Math.round(100 * have / need));
        h += `<div class="obj"><div class="top"><span>${t}</span><span class="${have >= need ? "ok" : ""}">${have}/${need}${have >= need ? " ✓" : ""}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>`;
      }
      h += `<small>${v.week && v.week.closed ? "This week is closed." : "Updates each time the tally runs."}</small></div>`;
    }

    h += `<h3>Side quests</h3>`;
    const sq = [...(cfg.side_quests || [])].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    if (!sq.length) h += `<div class="card"><small>None yet. Got a trip, appointment or deadline? Add it below and it will pop up on the day.</small></div>`;
    for (const q of sq) h += `<div class="card"><div class="row"><b class="grow">✨ ${esc(q.title)}</b>${q.done ? `<span class="pill good">DONE</span>` : ""}</div><small>${esc(q.date || "")} · +${q.xp} XP · +${q.gold}g</small></div>`;
    if (isOwner()) {
      h += `<div class="card"><b>Add a side quest</b><br><label>What</label><input type="text" id="sq-title" maxlength="60" placeholder="Get to the airport 2h early">
        <label>Date</label><input type="date" id="sq-date" value="${today}"><label>Bonus XP</label><input type="number" id="sq-xp" value="30" min="5" max="100">
        <label>Hint (optional)</label><input type="text" id="sq-hint" maxlength="100" placeholder="Bag packed the night before">
        <button class="btn" data-act="addsq">Add side quest</button></div>`;
    } else h += `<div class="card"><small>Connect GitHub in Setup to add side quests from here. New permanent Dailies are added in rules.yml.</small></div>`;

    h += `<h3>Badges</h3>`;
    for (const b of cfg.badges) {
      h += `<div class="card badge ${b.earned ? "earned" : ""}"><span class="medal">🏅</span><div class="grow"><b>${esc(b.name)}</b> <small>· ${esc(b.town)}</small><br><small>${esc(b.blurb)}</small><br><small>Target ${esc(b.target_date)} · <code>${esc(b.file)}</code></small></div>${b.earned ? `<span class="pill good">EARNED</span>` : ""}</div>`;
    }
    return h;
  }

  function viewSetup() {
    return `<h3>Connect GitHub</h3><div class="card">
      <small>Connecting lets the Save button write your day straight into your repo. Without it you can still tap around and copy the log line.</small>
      <label style="display:block;margin-top:10px">Repo owner</label><input type="text" id="s-owner" value="${esc(settings.owner)}" autocapitalize="none">
      <label>Repo name</label><input type="text" id="s-repo" value="${esc(settings.repo)}" autocapitalize="none">
      <label>Branch</label><input type="text" id="s-branch" value="${esc(settings.branch)}" autocapitalize="none">
      <label>Access token</label><input type="password" id="s-token" value="${esc(settings.token)}" placeholder="github_pat_..." autocapitalize="none" autocomplete="off">
      <button class="btn" data-act="savesettings">Save settings</button>
      <button class="btn alt" style="margin-top:8px" data-act="test">Test connection</button></div>
      <h3>Get a token (2 minutes)</h3><div class="card"><small>
      1. GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token.<br>
      2. Repository access: <b>Only select repositories</b> → pick life-rpg.<br>
      3. Permissions → Repository permissions → <b>Contents: Read and write</b>.<br>
      4. Generate, copy it, paste it above.<br><br>
      The token stays in this browser only. Use this on your own phone, never on a shared device. Tip: use Share → Add to Home Screen so this opens like an app.</small></div>
      <div class="card"><button class="btn alt" data-act="resetday">Reset today's taps</button></div>`;
  }

  function readForm() {
    let owner = $("#s-owner").value.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/^@/, "");
    let repo = $("#s-repo").value.trim();
    if (owner.includes("/")) { const p = owner.split("/"); owner = p[0]; if (!repo) repo = p[1]; }
    repo = repo.split("/").pop().replace(/\.git$/i, "");
    const token = $("#s-token").value.replace(/[^\x21-\x7E]/g, ""); // drop spaces, line breaks, and any non-ASCII characters
    $("#s-owner").value = owner; $("#s-repo").value = repo; $("#s-token").value = token; // show the cleaned values
    return { owner, repo, branch: $("#s-branch").value.trim() || "main", token };
  }
  function renderHud() { $("#hud").innerHTML = hud(); }
  function renderView() {
    const v = $("#view");
    v.innerHTML = tab === "today" ? viewToday() : tab === "map" ? viewMap() : tab === "quests" ? viewQuests() : viewSetup();
    document.querySelectorAll("#tabs button").forEach((b) => b.classList.toggle("on", b.dataset.v === tab));
    if (tab === "map") {
      const me = ART.drawMap($("#mapwrap"), cfg, selTown, (id) => { selTown = id; renderView(); });
      if (scrollToMe) { // first time on the map: bring the trainer into view
        scrollToMe = false;
        const r = $("#mapsvg").getBoundingClientRect();
        window.scrollTo(0, Math.max(0, r.top + window.scrollY + (me.y / me.height) * r.height - window.innerHeight * 0.45));
      }
    }
    const note = $("#note");
    if (note) note.addEventListener("input", () => { state.note = note.value; state.dirty = true; persist(); });
  }
  function render() { renderHud(); renderView(); }

  // ---------- actions ----------
  async function save() {
    if (busy) return;
    const st = JSON.parse(JSON.stringify(state));
    if (cfg.dailies.some((d) => d.key === "G") && !st.codes.G && !st.flags.pause) st.codes.G = "N"; // saving the day IS the Log daily
    state = st; persist();
    const line = L.buildLine(cfg, today, info.type, st);
    if (!isOwner()) { saveMsg = { kind: "copy", line }; renderView(); return; }
    busy = true; saveMsg = null; renderView();
    try { await writeLog(today, line); state.dirty = false; persist(); saveMsg = { kind: "ok" }; toast("Saved to GitHub ✓"); }
    catch (e) { saveMsg = { kind: "err", text: e.message || "Could not save." }; }
    busy = false; renderView();
  }

  function onClick(e) {
    const el = e.target.closest("[data-act]"); if (!el) return;
    const a = el.dataset.act;
    if (a === "tab") { tab = el.dataset.v; saveMsg = tab === "today" ? saveMsg : null; scrollToMe = tab === "map"; window.scrollTo(0, 0); renderView(); return; }
    if (a === "town") return;
    const touch = () => { state.dirty = true; saveMsg = null; persist(); renderView(); };
    if (a === "sleep") { state.sleep = state.sleep === el.dataset.v ? null : el.dataset.v; touch(); }
    else if (a === "code") { const k = el.dataset.k, v = el.dataset.v; if (state.codes[k] === v) delete state.codes[k]; else state.codes[k] = v; touch(); }
    else if (a === "hab") {
      const t = el.dataset.t, h = cfg.rules.habits[t];
      const cap = h ? (h.training ? 1 : cfg.rules.other_habit_cap_per_day) : 2;
      state.counts[t] = ((state.counts[t] || 0) + 1) > cap ? 0 : (state.counts[t] || 0) + 1; touch();
    }
    else if (a === "sq") { state.sq[el.dataset.id] = !state.sq[el.dataset.id]; touch(); }
    else if (a === "flag") { state.flags[el.dataset.f] = !state.flags[el.dataset.f]; touch(); }
    else if (a === "save") save();
    else if (a === "copy") { navigator.clipboard.writeText(saveMsg.line).then(() => toast("Copied"), () => toast("Long-press the line to copy")); }
    else if (a === "resetday") { state = L.emptyState(); saveMsg = null; persist(); toast("Today's taps cleared"); render(); }
    else if (a === "savesettings") {
      settings = readForm();
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (err) {}
      toast("Settings saved"); pullToday();
    }
    else if (a === "test") testConn();
    else if (a === "addsq") addSideQuest();
  }

  async function testConn() {
    settings = readForm();
    if (!settings.owner || !settings.repo || !settings.token) return toast("Fill in the owner, repo name, and token first.");
    if (!/^(github_pat_|ghp_)/.test(settings.token)) return toast("That doesn't look like a GitHub token. It should start with github_pat_.");
    toast("Testing...");
    try {
      const r = await gh("");
      if (!r.ok) return toast(friendly(r.status));
      const j = await r.json();
      toast(j.permissions && j.permissions.push === false ? "Connected, but this token is read-only. Add Contents: Read and write." : "Connected ✓");
    } catch (e) { toast(e.message || "Could not connect."); }
  }

  async function addSideQuest() {
    const title = $("#sq-title").value.trim(), date = $("#sq-date").value;
    if (!title || !date) return toast("Add a name and a date");
    let id = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "quest";
    const taken = new Set((cfg.side_quests || []).map((q) => q.id));
    if (taken.has(id)) id += "-" + date.slice(5).replace("-", "");
    const obj = { id, title, date, until: date, xp: Math.max(5, Math.min(100, parseInt($("#sq-xp").value, 10) || 30)), gold: 5, hint: $("#sq-hint").value.trim() };
    try { await appendSideQuest(obj); cfg.side_quests = [...(cfg.side_quests || []), { ...obj, stat: "DISC", done: false }]; toast("Side quest added ✓"); renderView(); }
    catch (e) { toast(e.message || "Could not add it"); }
  }

  // ---------- boot ----------
  function setDay() {
    today = L.ymd(new Date()); info = L.dayInfo(cfg, today);
    const recent = (cfg.recent || []).find((r) => r.date === today);
    state = loadDraft() || (recent ? L.stateFromRecent(recent) : L.emptyState());
    state.counts = state.counts || {}; state.sq = state.sq || {}; state.codes = state.codes || {}; state.flags = state.flags || { shield: false, pause: false };
  }
  async function boot() {
    document.body.addEventListener("click", onClick);
    try { cfg = await (await fetch("stats.json?ts=" + Date.now(), { cache: "no-store" })).json(); }
    catch (e) { $("#view").innerHTML = `<div class="card warn">Could not load stats.json. Run the tally (python scripts/tally.py) or wait for the GitHub Action to finish.</div>`; return; }
    setDay();
    tab = isOwner() && info.phase === "active" ? "today" : "map";
    scrollToMe = tab === "map";
    render(); pullToday();
    document.addEventListener("visibilitychange", () => { if (!document.hidden && L.ymd(new Date()) !== today) { setDay(); render(); } });
  }
  boot();
})();
