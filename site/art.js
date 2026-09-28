/* Life-RPG pixel art and the world map. Original sprites drawn from character grids. */
(function (root) {
  const PAL = {
    trainer: { R: "#e04a3a", r: "#a83024", S: "#f2c59b", K: "#2b2233", B: "#3a6ee0", W: "#ffffff", J: "#34457a", F: "#222" },
    tree: { T: "#7a4b2a", L: "#3fae4a", D: "#2b7d36" },
    gym: { A: "#3a5ecf", a: "#27428f", W: "#f5e9d0", G: "#9fd3ff", D: "#6b4423" },
    summit: { A: "#e2b52b", a: "#a9821a", W: "#f5e9d0", G: "#9fd3ff", D: "#6b4423" },
    home: { R: "#d24a3a", W: "#f5e9d0", w: "#d9c9a6", G: "#9fd3ff", D: "#6b4423" },
    star: { Y: "#f6c62a" },
    starOff: { Y: "#4a4f73" },
  };
  const G = {
    trainer: [
      "...RRRR...", "..RRRRRR..", ".RRRRRRRR.", ".rrrrrrrr.", "..SSSSSS..", "..SKSSKS..", "..SSSSSS..",
      "...SSSS...", ".BBBBBBBB.", "SBBBWWBBBS", "SBBBWWBBBS", ".BBBBBBBB.", "..JJ..JJ..", "..FF..FF..",
    ],
    tree: ["..DDDD..", ".DLLLLD.", "DLLLLLLD", "DLLLLLLD", ".DLLLLD.", "..DLLD..", "...TT...", "...TT...", "...TT...", "..TTTT.."],
    gym: [
      "....aaaaaaaa....", "..aaAAAAAAAAaa..", ".aAAAAAAAAAAAAa.", "aAAAAAAAAAAAAAAa", "aaaaaaaaaaaaaaaa",
      ".WWWWWWWWWWWWWW.", ".WGGWWWWWWWWGGW.", ".WGGWWWWWWWWGGW.", ".WWWWWDDDDWWWWW.", ".WWWWWDDDDWWWWW.",
      ".WWWWWDDDDWWWWW.", ".WWWWWDDDDWWWWW.", ".WWWWWDDDDWWWWW.", ".wwwwwwwwwwwwww.",
    ].map((r) => r.replace(/w/g, "W")),
    home: [
      "....RRRR....", "..RRRRRRRR..", ".RRRRRRRRRR.", "RRRRRRRRRRRR", ".WWWWWWWWWW.", ".WGGWWWWGGW.",
      ".WGGWDDWGGW.", ".WWWWDDWWWW.", ".WWWWDDWWWW.", ".wwwwwwwwww.",
    ],
    star: ["...YY...", "...YY...", "YYYYYYYY", ".YYYYYY.", "..YYYY..", ".YYYYYY.", ".YY..YY.", "YY....YY"],
  };

  function sprite(grid, pal, px, x, y, attrs) {
    let out = `<g transform="translate(${x},${y})" shape-rendering="crispEdges" ${attrs || ""}>`;
    grid.forEach((row, j) => {
      let i = 0;
      while (i < row.length) {
        const c = row[i];
        if (c === "." || !pal[c]) { i++; continue; }
        let k = i; while (k < row.length && row[k] === c) k++;
        out += `<rect x="${i * px}" y="${j * px}" width="${(k - i) * px}" height="${px}" fill="${pal[c]}"/>`;
        i = k;
      }
    });
    return out + "</g>";
  }

  // Route: home at the bottom, five towns climbing to the summit
  const WP = [{ x: 70, y: 850 }, { x: 265, y: 700 }, { x: 95, y: 550 }, { x: 265, y: 400 }, { x: 95, y: 250 }, { x: 240, y: 100 }];
  const segD = (a, b) => { const my = (a.y + b.y) / 2; return `M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}`; };

  function rng(seed) { let a = seed; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function drawMap(el, cfg, selectedId, onSelect) {
    const badges = cfg.badges;
    let s = `<svg id="mapsvg" viewBox="0 0 360 900" width="100%" role="img" aria-label="World map">`;
    s += `<defs><pattern id="grass" width="16" height="16" patternUnits="userSpaceOnUse"><rect width="16" height="16" fill="#7ec850"/><rect x="3" y="4" width="2" height="2" fill="#6fb844"/><rect x="11" y="10" width="2" height="2" fill="#6fb844"/><rect x="8" y="1" width="2" height="2" fill="#8ed85e"/></pattern></defs>`;
    s += `<rect width="360" height="900" fill="url(#grass)"/>`;
    // water near the harbor
    const hb = WP[3];
    s += `<g shape-rendering="crispEdges"><ellipse cx="${hb.x + 45}" cy="${hb.y + 95}" rx="70" ry="40" fill="#3f8fd8"/><ellipse cx="${hb.x + 45}" cy="${hb.y + 95}" rx="58" ry="30" fill="#58a8e8"/></g>`;
    // mountains behind the summit
    const sm = WP[5];
    s += `<g><polygon points="${sm.x - 120},${sm.y + 10} ${sm.x - 50},${sm.y - 90} ${sm.x + 10},${sm.y + 10}" fill="#8a8fa8"/><polygon points="${sm.x - 20},${sm.y + 10} ${sm.x + 50},${sm.y - 100} ${sm.x + 120},${sm.y + 10}" fill="#a0a5bd"/><polygon points="${sm.x + 50},${sm.y - 100} ${sm.x + 32},${sm.y - 68} ${sm.x + 68},${sm.y - 68}" fill="#fff"/><polygon points="${sm.x - 50},${sm.y - 90} ${sm.x - 66},${sm.y - 60} ${sm.x - 34},${sm.y - 60}" fill="#fff"/></g>`;
    // path segments
    for (let i = 0; i < WP.length - 1; i++) {
      s += `<path d="${segD(WP[i], WP[i + 1])}" fill="none" stroke="#b98d55" stroke-width="30" stroke-linecap="square"/>`;
    }
    for (let i = 0; i < WP.length - 1; i++) {
      s += `<path id="seg${i}" d="${segD(WP[i], WP[i + 1])}" fill="none" stroke="#ecd9a5" stroke-width="22" stroke-linecap="square"/>`;
    }
    s += `<g id="trees"></g><g id="places"></g><g id="me"></g></svg>`;
    el.innerHTML = s;

    const svg = el.querySelector("svg");
    // sample the path so trees keep clear of it
    const samples = [];
    const segs = [];
    for (let i = 0; i < WP.length - 1; i++) {
      const p = svg.querySelector(`#seg${i}`); const len = p.getTotalLength(); segs.push({ p, len });
      for (let d = 0; d <= len; d += 8) { const pt = p.getPointAtLength(d); samples.push([pt.x, pt.y]); }
    }
    const obstacles = [[hb.x + 45, hb.y + 95, 85]];
    const rand = rng(90210); const trees = [];
    for (let tries = 0; tries < 900 && trees.length < 46; tries++) {
      const x = 14 + rand() * 320, y = 20 + rand() * 840;
      if (samples.some(([px, py]) => Math.hypot(px - x, py - y) < 34)) continue;
      if (WP.slice(1).some((w) => Math.abs(x - (w.x + (w.x > 180 ? 42 : -42))) < 62 && y > w.y - 90 && y < w.y + 44) || Math.hypot(WP[0].x - x, WP[0].y - y) < 60 || WP.some((w) => Math.hypot(w.x - x, w.y - y) < 40)) continue;
      if (obstacles.some(([ox, oy, r]) => Math.hypot(ox - x, oy - y) < r)) continue;
      if (trees.some((t) => Math.hypot(t[0] - x, t[1] - y) < 26)) continue;
      trees.push([x, y]);
    }
    trees.sort((a, b) => a[1] - b[1]);
    svg.querySelector("#trees").innerHTML = trees.map(([x, y]) => sprite(G.tree, PAL.tree, 3, x - 12, y - 30)).join("");

    // places: home + five gyms
    let pl = "";
    const label = (x, y, t, size, fill) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" font-weight="700" font-family="ui-monospace,Menlo,Consolas,monospace" fill="${fill || "#fff"}" stroke="#1b1f3a" stroke-width="3" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
    pl += sprite(G.home, PAL.home, 3, WP[0].x - 18, WP[0].y - 30);
    pl += label(WP[0].x, WP[0].y + 16, "HOME", 11);
    let stubs = "";
    badges.forEach((b, i) => {
      const w = WP[i + 1];
      const side = w.x > 180 ? 1 : -1;
      const bx = w.x + side * 42;                       // building sits beside the path, the trainer walks on it
      const pal = i === badges.length - 1 ? PAL.summit : PAL.gym;
      const sel = selectedId === b.id;
      stubs += `<line x1="${w.x}" y1="${w.y - 6}" x2="${bx}" y2="${w.y - 6}" stroke="#b98d55" stroke-width="16"/><line x1="${w.x}" y1="${w.y - 6}" x2="${bx}" y2="${w.y - 6}" stroke="#ecd9a5" stroke-width="10"/>`;
      pl += `<g data-town="${b.id}" style="cursor:pointer">`;
      if (sel) pl += `<rect x="${bx - 40}" y="${w.y - 80}" width="80" height="112" fill="none" stroke="#ffcb47" stroke-width="2" stroke-dasharray="4 3"/>`;
      pl += sprite(G.gym, pal, 3, bx - 24, w.y - 42);
      pl += sprite(G.star, b.earned ? PAL.star : PAL.starOff, 3, bx - 12, w.y - 70);
      pl += label(bx, w.y + 14, b.town.toUpperCase(), 10);
      pl += label(bx, w.y + 27, `Lv ${b.arrive_level} · Day ${b.target_day}`, 9, b.earned ? "#ffd75e" : "#cfd4ff");
      pl += `<rect x="${bx - 48}" y="${w.y - 80}" width="96" height="112" fill="transparent"/></g>`;
    });
    // stubs go under the buildings, on top of the path
    svg.querySelector("#trees").insertAdjacentHTML("beforebegin", `<g>${stubs}</g>`);
    svg.querySelector("#places").innerHTML = pl;

    // the trainer
    const tp = root.RPG.trainerProgress(cfg);
    const seg = segs[tp.seg];
    const pt = seg.p.getPointAtLength(seg.len * tp.f);
    svg.querySelector("#me").innerHTML =
      `<g transform="translate(${pt.x - 15},${pt.y - 40})"><g class="bob">${sprite(G.trainer, PAL.trainer, 3, 0, 0)}</g></g>` +
      `<g transform="translate(${pt.x},${pt.y - 48})">${label(0, 0, `Lv ${cfg.level}`, 10, "#ffcb47")}</g>`;

    svg.querySelectorAll("[data-town]").forEach((g) => g.addEventListener("click", () => onSelect(g.getAttribute("data-town"))));
    return { x: pt.x, y: pt.y, height: 900 };
  }

  root.RPGArt = { drawMap, sprite, PAL, G };
})(typeof window !== "undefined" ? window : globalThis);
