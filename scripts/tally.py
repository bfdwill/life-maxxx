#!/usr/bin/env python3
"""Life-RPG tally.

Reads rules.yml, side-quests.yml, log/*.md, reviews/ and rewards.log, then writes
site/stats.json (used by the website) and refreshes the block between the RPG
markers in README.md.

Needs PyYAML:  pip install pyyaml
Run:           python scripts/tally.py
"""
import json
import re
import sys
from collections import defaultdict
from datetime import date, timedelta
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
STATS = ["VIT", "FUEL", "GRIT", "SYS", "DISC"]
LINE_RE = re.compile(r"^\s*(\d{4}-\d{2}-\d{2})\s*\|(.*)$")
CODE_RE = re.compile(r"\b([A-Z]):([Nmr-])")
START_MARK, END_MARK = "<!-- RPG:START -->", "<!-- RPG:END -->"


def load_yaml(name, default):
    p = ROOT / name
    if not p.exists():
        return default
    data = yaml.safe_load(p.read_text(encoding="utf-8"))
    return default if data is None else data


def to_date(v):
    if v is None:
        return None
    return v if isinstance(v, date) else date.fromisoformat(str(v))


def parse_log():
    """One line per day: date | daytype | sleep:G | S:N F:m M:r L:N G:N | habits | note"""
    days = {}
    for f in sorted((ROOT / "log").glob("*.md")):
        for line in f.read_text(encoding="utf-8").splitlines():
            m = LINE_RE.match(line)
            if not m:
                continue
            parts = [p.strip() for p in m.group(2).split("|")]
            parts += [""] * (5 - len(parts))
            daytype, sleep, dailies, habits = parts[:4]
            sm = re.search(r"sleep:\s*([GYRgyr])", sleep)
            tokens = habits.lower().split()
            days[date.fromisoformat(m.group(1))] = {
                "type": daytype.upper(),
                "sleep": sm.group(1).upper() if sm else None,
                "codes": dict(CODE_RE.findall(dailies)),
                "tokens": tokens,
                "pause": "pause" in tokens,
                "exempt": "shield" in tokens or bool(sm and sm.group(1).upper() == "R"),
            }
    return days


def score_day(day, R):
    """Returns (xp by stat, gold, dailies done)."""
    stat_xp = defaultdict(int)
    gold = 0
    done = 0
    codes = day["codes"]
    for key, code in codes.items():
        if key in R["dailies"] and code in R["daily_xp"]:
            done += 1
            stat_xp[R["dailies"][key]["stat"]] += R["daily_xp"][code]
            gold += R["daily_gold"][code]

    bonus = []  # [stat, xp]; only bonus XP can be lost to a negative habit
    pd = R["perfect_day"]
    if all(codes.get(k) in R["daily_xp"] for k in R["dailies"]):
        bonus.append([pd["stat"], pd["xp"]])
        gold += pd["gold"]

    trained = other = 0
    for t in day["tokens"]:
        h = R["habits"].get(t)
        if not h:
            continue
        if h.get("training"):
            if trained >= 1:
                continue
            trained += 1
        else:
            if other >= R["other_habit_cap_per_day"]:
                continue
            other += 1
        bonus.append([h["stat"], h["xp"]])
        gold += h["gold"]

    for t in day["tokens"]:
        cut = R["negatives"].get(t, 0)
        if cut and bonus:
            biggest = max(bonus, key=lambda b: b[1])
            biggest[1] -= min(cut, biggest[1])

    for stat, xp in bonus:
        stat_xp[stat] += xp
    return stat_xp, gold, done


def week_stats(week_days):
    st = dict.fromkeys(
        ["sleep_green_days", "normal_fuel_days", "training_days", "learn_days", "ship_count"], 0
    )
    for d in week_days:
        st["sleep_green_days"] += d["sleep"] == "G"
        st["normal_fuel_days"] += d["codes"].get("F") == "N"
        st["training_days"] += "+train" in d["tokens"]
        st["learn_days"] += d["codes"].get("L") in ("N", "m")
        st["ship_count"] += "+homelab" in d["tokens"]
    return st


def objectives(st, need):
    return {
        "sleep": st["sleep_green_days"] >= need["sleep_green_days"],
        "fuel": st["normal_fuel_days"] >= need["normal_fuel_days"],
        "move": st["training_days"] >= need["training_days"],
        "learn": st["learn_days"] >= need["learn_days"] and st["ship_count"] >= need["ship_count"],
    }


def split(xp, stats):
    q, r = divmod(xp, len(stats))
    return {s: q + (1 if i < r else 0) for i, s in enumerate(stats)}


def level_for(xp, base):
    n = 1
    while base * (n + 1) * n <= xp:
        n += 1
    return n


def rank_for(level, ranks):
    name = ranks[0][1]
    for lo, r in ranks:
        if level >= lo:
            name = r
    return name


def bar(x, mx, width=10):
    filled = round(width * x / mx) if mx else 0
    return "█" * filled + "░" * (width - filled)


def tally():
    R = load_yaml("rules.yml", None)
    start = to_date(R["start_date"])
    total_days = R["total_days"]
    end_date = start + timedelta(days=total_days - 1)
    days = {d: v for d, v in parse_log().items() if start <= d <= end_date}
    last = max(days) if days else None
    day_no = min((last - start).days + 1, total_days) if last else 0

    sq_defs = {}
    for q in load_yaml("side-quests.yml", []):
        sq_defs[str(q["id"]).lower()] = {
            "id": str(q["id"]).lower(),
            "title": q.get("title", q["id"]),
            "date": to_date(q.get("date")).isoformat() if q.get("date") else None,
            "until": to_date(q.get("until") or q.get("date")).isoformat() if q.get("date") else None,
            "xp": int(q.get("xp", 25)),
            "gold": int(q.get("gold", 5)),
            "stat": q.get("stat", "DISC"),
            "hint": q.get("hint", ""),
            "done": False,
        }

    stat_xp = {s: 0 for s in STATS}
    gold = 0
    active = 0
    done_by_day = {}

    for d in sorted(days):
        if days[d]["pause"]:
            continue
        active += 1
        sx, g, done = score_day(days[d], R)
        done_by_day[d] = done
        for k, v in sx.items():
            stat_xp[k] += v
        gold += g
        for t in days[d]["tokens"]:
            if t.startswith("+sq:"):
                q = sq_defs.get(t[4:])
                if q and not q["done"]:
                    q["done"] = True
                    stat_xp[q["stat"]] = stat_xp.get(q["stat"], 0) + q["xp"]
                    gold += q["gold"]

    # Weekly quests (resolved once a later log entry shows the week has ended)
    weeks = defaultdict(list)
    for d in sorted(days):
        if not days[d]["pause"]:
            weeks[(d - start).days // 7].append(days[d])
    quests = {}
    for idx, wdays in sorted(weeks.items()):
        key = R["cycle"][idx % len(R["cycle"])]
        q = R["quests"][key]
        week_end = min(start + timedelta(days=idx * 7 + 6), end_date)
        have = week_stats(wdays)
        met = objectives(have, q["need"])
        n = sum(met.values())
        closed = last >= week_end
        rxp = rgold = 0
        if closed:
            if n >= 3:
                rxp, rgold = q["xp"], q["gold"]
            elif n == 2:
                rxp, rgold = q["xp"] // 2, q["gold"] // 2
            if n == 4:
                rxp += q["full_bonus_xp"]
            for s, v in split(rxp, R["quest_stats"]).items():
                stat_xp[s] += v
            gold += rgold
        quests[idx] = {"week": key, "name": q["name"], "met": n, "closed": closed,
                       "xp": rxp, "gold": rgold, "objectives": met, "have": have}

    # Comeback quests: two low days in a row arms one; any 3 Dailies next day clears it
    cb = R["comeback"]
    low, armed, comebacks = 0, False, 0
    for d in sorted(done_by_day):
        if days[d]["exempt"]:
            continue  # Shield / Recovery days neither count nor break anything
        done = done_by_day[d]
        if armed:
            if done >= cb["clear_min_done"]:
                stat_xp[cb["stat"]] += cb["xp"]
                gold += cb["gold"]
                comebacks += 1
            armed, low = False, 0
        low = low + 1 if done <= cb["low_max_done"] else 0
        if low >= cb["low_days"]:
            armed, low = True, 0

    # Milestones
    for m in R["milestones"]:
        if day_no >= m["day"]:
            stat_xp[m["stat"]] += m["xp"]
            gold += m["gold"]

    # Gym badges: earned when the file exists and has real content
    base = R["levels"]["base"]
    br = R["badge_reward"]
    badges = []
    for b in R.get("badges", []):
        p = ROOT / b["file"]
        earned = p.exists() and p.stat().st_size >= R.get("badge_min_bytes", 300)
        if earned:
            stat_xp[br["stat"]] += br["xp"]
            gold += br["gold"]
        badges.append({
            "id": b["id"], "name": b["name"], "town": b["town"], "file": b["file"],
            "blurb": b.get("blurb", ""), "target_day": b["target_day"],
            "target_date": (start + timedelta(days=b["target_day"] - 1)).isoformat(),
            "arrive_level": b["arrive_level"],
            "arrive_xp": base * b["arrive_level"] * (b["arrive_level"] - 1),
            "earned": bool(earned),
        })

    # Sunday reviews
    reviews = [p for p in (ROOT / "reviews").glob("*.md") if re.fullmatch(r"\d{4}-W\d{2}\.md", p.name)]
    stat_xp[R["review"]["stat"]] += R["review"]["xp"] * len(reviews)
    gold += R["review"]["gold"] * len(reviews)

    # Gold spent: rewards.log lines look like  2026-09-25 | T1 | gelato
    spent = 0
    rlog = ROOT / "rewards.log"
    if rlog.exists():
        for line in rlog.read_text(encoding="utf-8").splitlines():
            m = LINE_RE.match(line)
            t = re.search(r"\bT\d\b", m.group(2)) if m else None
            if t:
                spent += R["reward_tiers"].get(t.group(0), 0)
    balance = max(0, gold - spent)

    total = sum(stat_xp.values())
    level = level_for(total, base)
    floor = base * level * (level - 1)
    nxt = base * (level + 1) * level
    rank = rank_for(level, R["ranks"])

    # README block
    top = max(stat_xp.values())
    lines = []
    if last is None:
        lines.append(f"_No log entries yet. Day 1 is {start.isoformat()}._")
    else:
        lines.append(f"**Level {level} · {rank}** — {total:,} XP (next level at {nxt:,}, {nxt - total:,} to go)")
        lines.append("")
        lines.append(f"Day {day_no}/{total_days} · {active} days active · Gold {balance}")
    lines += ["", "| Stat | Progress | XP |", "|---|---|---:|"]
    for s in STATS:
        lines.append(f"| {s} | `{bar(stat_xp[s], top)}` | {stat_xp[s]:,} |")
    lines.append("")
    if quests:
        q = quests[max(quests)]
        state = "closed" if q["closed"] else "so far"
        lines.append(f"Quest: {q['week']} “{q['name']}” · {q['met']}/4 objectives {state}")
    else:
        lines.append(f"Quest: W1 “{R['quests']['W1']['name']}” starts {start.isoformat()}")
    won = [b["name"] for b in badges if b["earned"]]
    lines.append(f"Badges: {len(won)}/{len(badges)}" + (f" ({', '.join(won)})" if won else ""))
    day45 = start + timedelta(days=44)
    if last is None or last < day45:
        left = (day45 - (last or start)).days
        lines.append(f"Path: Linux → Day-45 checkpoint on {day45.strftime('%b %d')} ({left} days)")
    else:
        lines.append("Path: chosen at Day 45, see `learn/day45-path.md`")
    if last:
        lines += ["", f"_Last tally: {last.isoformat()}_"]
    block = "\n".join(lines)

    readme_path = ROOT / "README.md"
    readme = readme_path.read_text(encoding="utf-8")
    pat = re.compile(re.escape(START_MARK) + r".*?" + re.escape(END_MARK), re.S)
    if not pat.search(readme):
        sys.exit("README.md is missing the RPG:START / RPG:END markers")
    new = f"{START_MARK}\n{block}\n{END_MARK}"
    readme_path.write_text(pat.sub(lambda _m: new, readme), encoding="utf-8")

    # Website data
    recent = []
    for d in sorted(days)[-21:]:
        v = days[d]
        recent.append({"date": d.isoformat(), "type": v["type"], "sleep": v["sleep"],
                       "codes": v["codes"], "tokens": v["tokens"], "pause": v["pause"]})
    site = {
        "player": R.get("player", "Player"),
        "start_date": start.isoformat(), "total_days": total_days,
        "cycle": R["cycle"], "cycle_types": R["cycle_types"],
        "dailies": [dict(key=k, **v) for k, v in R["dailies"].items()],
        "rules": {
            "daily_xp": R["daily_xp"], "daily_gold": R["daily_gold"],
            "perfect_day": R["perfect_day"], "habits": R["habits"],
            "other_habit_cap_per_day": R["other_habit_cap_per_day"],
            "negatives": R["negatives"], "negative_labels": R.get("negative_labels", {}),
        },
        "quest_defs": R["quests"],
        "day": day_no, "last_log": last.isoformat() if last else None, "days_active": active,
        "total_xp": total, "level": level, "rank": rank,
        "level_floor_xp": floor, "next_level_xp": nxt, "levels_base": base,
        "stats": stat_xp, "gold_balance": balance, "reviews": len(reviews),
        "comebacks_cleared": comebacks,
        "weeks": {str(i): q for i, q in quests.items()},
        "badges": badges,
        "side_quests": list(sq_defs.values()),
        "recent": recent,
    }
    out = ROOT / "site" / "stats.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(site, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Day {day_no}/{total_days} · Level {level} {rank} · {total:,} XP · Gold {balance} · Badges {len(won)}/{len(badges)}")


if __name__ == "__main__":
    tally()
