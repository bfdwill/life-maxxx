/* Life-RPG pure logic: dates, log-line parse/build, scoring, hints. No DOM here. */
(function (root) {
  const pad = (n) => String(n).padStart(2, "0");
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseYmd = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const daysBetween = (a, b) => Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
  const addDays = (s, n) => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
  const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const TYPE_NAME = { DBL: "Both jobs", FLR: "Floor only", RMT: "Remote only" };

  function dayInfo(cfg, dateStr) {
    const idx = daysBetween(cfg.start_date, dateStr);
    if (idx < 0) return { phase: "before", idx, daysUntil: -idx };
    if (idx >= cfg.total_days) return { phase: "after", idx };
    const wkIdx = Math.floor(idx / 7);
    const weekKey = cfg.cycle[wkIdx % cfg.cycle.length];
    const dow = idx % 7; // start_date must be a Monday
    return { phase: "active", idx, dayNo: idx + 1, wkIdx, weekKey, dow, dowName: DOW[dow],
             type: cfg.cycle_types[weekKey][dow] };
  }

  function emptyState() {
    return { sleep: null, codes: {}, counts: {}, sq: {}, flags: { shield: false, pause: false }, note: "", dirty: false };
  }

  function parseLine(line) {
    const m = line.match(/^\s*(\d{4}-\d{2}-\d{2})\s*\|(.*)$/);
    if (!m) return null;
    const parts = m[2].split("|").map((p) => p.trim());
    while (parts.length < 5) parts.push("");
    const [type, sleep, dailies, habits, ...noteParts] = parts;
    const st = emptyState();
    st.type = type.toUpperCase();
    const sm = sleep.match(/sleep:\s*([GYRgyr])/);
    st.sleep = sm ? sm[1].toUpperCase() : null;
    for (const [, k, c] of dailies.matchAll(/\b([A-Z]):([Nmr-])/g)) if (c !== "-") st.codes[k] = c;
    for (const t of habits.toLowerCase().split(/\s+/).filter(Boolean)) {
      if (t === "shield") st.flags.shield = true;
      else if (t === "pause") st.flags.pause = true;
      else if (t.startsWith("+sq:")) st.sq[t.slice(4)] = true;
      else st.counts[t] = (st.counts[t] || 0) + 1;
    }
    st.note = noteParts.join(" | ");
    return { date: m[1], state: st };
  }

  function stateFromRecent(entry) {
    const line = `${entry.date} | ${entry.type} | sleep:${entry.sleep || "-"} | ` +
      Object.entries(entry.codes).map(([k, c]) => `${k}:${c}`).join(" ") + ` | ${entry.tokens.join(" ")} |`;
    return parseLine(line).state;
  }

  function buildLine(cfg, date, type, st) {
    const dailies = cfg.dailies.map((d) => `${d.key}:${st.codes[d.key] || "-"}`).join(" ");
    const tokens = [];
    const order = [...Object.keys(cfg.rules.habits), ...Object.keys(cfg.rules.negatives)];
    for (const t of order) for (let i = 0; i < (st.counts[t] || 0); i++) tokens.push(t);
    for (const id of Object.keys(st.sq)) if (st.sq[id]) tokens.push(`+sq:${id}`);
    if (st.flags.shield) tokens.push("shield");
    if (st.flags.pause) tokens.push("pause");
    const note = (st.note || "").replace(/\|/g, "/").replace(/\s+/g, " ").trim();
    return `${date} | ${type || "?"} | sleep:${st.sleep || "-"} | ${dailies} | ${tokens.join(" ")} | ${note}`.replace(/\s+$/, "");
  }

  function scoreDay(cfg, st) {
    const R = cfg.rules;
    let xp = 0, gold = 0, done = 0;
    for (const d of cfg.dailies) {
      const c = st.codes[d.key];
      if (c && R.daily_xp[c] !== undefined) { done++; xp += R.daily_xp[c]; gold += R.daily_gold[c]; }
    }
    const bonus = [];
    const perfect = cfg.dailies.every((d) => st.codes[d.key] && R.daily_xp[st.codes[d.key]] !== undefined);
    if (perfect) { bonus.push(R.perfect_day.xp); gold += R.perfect_day.gold; }
    let trained = 0, other = 0;
    for (const [tok, h] of Object.entries(R.habits)) {
      for (let i = 0; i < (st.counts[tok] || 0); i++) {
        if (h.training) { if (trained >= 1) continue; trained++; }
        else { if (other >= R.other_habit_cap_per_day) continue; other++; }
        bonus.push(h.xp); gold += h.gold;
      }
    }
    for (const [tok, cut] of Object.entries(R.negatives)) {
      for (let i = 0; i < (st.counts[tok] || 0); i++) {
        if (bonus.length) { const bi = bonus.indexOf(Math.max(...bonus)); bonus[bi] -= Math.min(cut, bonus[bi]); }
      }
    }
    xp += bonus.reduce((a, b) => a + b, 0);
    for (const q of cfg.side_quests || []) if (st.sq[q.id]) { xp += q.xp; gold += q.gold; }
    return { xp, gold, done, perfect };
  }

  const LEARN_PLAN = [
    { until: 14, label: "Linux CLI", topics: [
      "Navigate: pwd, ls -la, cd", "Files: touch, cp, mv, rm, mkdir", "Read files: cat, less, head, tail -f",
      "Search: grep and find", "Permissions: chmod, chown, umask", "Pipes and redirects: | > >> tee",
      "Review, then add 5 commands to your cheat sheet"] },
    { until: 28, label: "Users, processes, hardening", topics: [
      "Users and groups: useradd, usermod, id", "sudo and visudo", "Processes: ps, top, kill",
      "systemd: systemctl status/enable", "Logs: journalctl -u and /var/log", "SSH hardening basics",
      "Review, then update your hardened-VM checklist"] },
    { until: 45, label: "Networking and bash", topics: [
      "ip a, ip r, ss -tulpn", "DNS: dig and resolv.conf", "Firewall: ufw or nftables", "SSH keys and ~/.ssh/config",
      "Bash: variables, if, loops", "Bash: write a small backup script", "Write up what you built in the homelab"] },
    { until: 999, label: "Path project", topics: ["Work on your path project: commit one small thing"] },
  ];
  function learnTarget(dayNo) {
    const phase = LEARN_PLAN.find((p) => dayNo <= p.until) || LEARN_PLAN[LEARN_PLAN.length - 1];
    return { phase: phase.label, topic: phase.topics[(dayNo - 1) % phase.topics.length] };
  }

  const OBJ_TEXT = {
    sleep: ["sleep_green_days", (n) => `${n} more night${n > 1 ? "s" : ""} of 6h+ sleep`],
    fuel: ["normal_fuel_days", (n) => `${n} more full Fuel day${n > 1 ? "s" : ""}`],
    move: ["training_days", (n) => `${n} more training session${n > 1 ? "s" : ""}`],
    learn: ["learn_days", (n) => `${n} more Learn day${n > 1 ? "s" : ""}`],
  };

  function weekView(cfg, info) {
    const q = cfg.quest_defs[info.weekKey];
    const w = (cfg.weeks || {})[String(info.wkIdx)];
    const have = (w && w.have) || { sleep_green_days: 0, normal_fuel_days: 0, training_days: 0, learn_days: 0, ship_count: 0 };
    return { def: q, week: w || null, have, need: q.need };
  }

  function getHints(cfg, info, st) {
    const hints = [];
    if (info.phase !== "active") return hints;
    if (st.flags.pause) hints.push({ icon: "⏸️", text: "Pause day: nothing is scored and nothing is lost." });
    else if (st.flags.shield) hints.push({ icon: "🛡️", text: "Family Shield is on. Family time is never scored. Do what you can, skip the rest." });
    else if (st.sleep === "R") hints.push({ icon: "🛌", text: "Recovery Mode: under 5h of sleep. Minimums only, no training, zero penalty." });
    else if (info.dow === 1 && info.type === "FLR") hints.push({ icon: "🧘", text: "Tuesday is a built-in rest day. Tap Rest on Move and protect your sleep." });
    else if (info.type === "DBL") hints.push({ icon: "⚡", text: "Double day: do the 5 Minimums first, the rest is bonus. Pack your break meal, no hard training." });
    else if (info.type === "FLR") hints.push({ icon: "🌙", text: "Night off from remote. Bank 8h+ of sleep tonight, and batch-cook if you have energy." });
    else hints.push({ icon: "☀️", text: "Remote-only day. Your best window for training and lab time is 2-8pm." });

    const lt = learnTarget(info.dayNo);
    hints.push({ icon: "💡", text: `Learn target (${lt.phase}): ${lt.topic}` });

    const v = weekView(cfg, info);
    const daysLeft = 7 - info.dow;
    const gaps = [];
    for (const [k, [field, txt]] of Object.entries(OBJ_TEXT)) {
      const n = v.need[field] - (v.have[field] || 0);
      if (n > 0) gaps.push({ k, n, txt: txt(n) });
    }
    const metCount = 4 - gaps.length;
    if (metCount < 3 && gaps.length) {
      gaps.sort((a, b) => a.n - b.n);
      hints.push({ icon: "⚔️", text: `Quest "${v.def.name}": ${gaps[0].txt} to close in on the full reward (${daysLeft} day${daysLeft > 1 ? "s" : ""} left).` });
    } else {
      const nb = (cfg.badges || []).find((b) => !b.earned);
      if (nb) {
        const left = daysBetween(ymdNow(), nb.target_date);
        const when = left >= 0 ? `target ${nb.target_date} (${left} day${left === 1 ? "" : "s"})` : "no rush, ship it when you can";
        hints.push({ icon: "🏅", text: `${nb.name}: ${nb.blurb} (${when}).` });
      } else hints.push({ icon: "🏆", text: "Every badge is earned. Enjoy the summit." });
    }
    return hints;
  }
  const ymdNow = () => ymd(new Date());

  function levelFor(xp, base) { let n = 1; while (base * (n + 1) * n <= xp) n++; return n; }

  function trainerProgress(cfg) {
    // returns {seg, f} for the map: which leg of the route and how far along it
    const T = [0, ...cfg.badges.map((b) => b.arrive_xp)];
    const xp = cfg.total_xp;
    for (let i = 0; i < T.length - 1; i++) {
      if (xp < T[i + 1]) return { seg: i, f: (xp - T[i]) / (T[i + 1] - T[i]) };
    }
    return { seg: T.length - 2, f: 1 };
  }

  const api = { ymd, parseYmd, daysBetween, addDays, dayInfo, emptyState, parseLine, stateFromRecent, buildLine,
                scoreDay, learnTarget, getHints, weekView, levelFor, trainerProgress, TYPE_NAME, DOW };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.RPG = api;
})(typeof window !== "undefined" ? window : globalThis);
