# Life-RPG

A 90-day habit system built around a hospital floor-tech schedule (2pm-10:30pm shifts on a 14-day cycle). It started 2026-09-21 alongside a second, overnight remote job; that job ended and the 90 days restarted on 2026-11-23, floor shifts only (see `schedule.md`). It scores five daily habits, weekly quests, and a Linux → homelab learning track. A GitHub Action tallies the daily log, refreshes the stats below, and deploys the dashboard. Day 1 is 2026-11-23.

<!-- RPG:START -->
**Level 1 · Recruit** — 185 XP (next level at 220, 35 to go)

Day 2/90 · 2 days active · Gold 25

| Stat | Progress | XP |
|---|---|---:|
| VIT | `██████░░░░` | 30 |
| FUEL | `██████░░░░` | 30 |
| GRIT | `██████░░░░` | 30 |
| SYS | `█████████░` | 45 |
| DISC | `██████████` | 50 |

Quest: W2 “Build” · 0/4 objectives so far
Badges: 0/5
Path: Linux → Day-45 checkpoint on Jan 06 (43 days)

_Last tally: 2026-11-24_
<!-- RPG:END -->

## What I'm building
The `learn/` folder is the portfolio side of this repo: Linux notes, hardened-VM checklists, and homelab writeups. A Day-45 checkpoint decides whether the second half goes toward networking / SRE / infrastructure or IAM / PAM security.

## The 5 Dailies
| Code | Daily | Stat | Normal | Minimum (2-10 min) |
|---|---|---|---|---|
| S | Sleep Floor | VIT | Asleep by 1:30, 6h+ | 10-min wind-down |
| F | Fuel | FUEL | All 5 anchors | Shake + yogurt |
| M | Move | GRIT | 20+ min of movement | 5-min mobility or 10-min walk |
| L | Learn | SYS | 30 min Linux / homelab | 10 min |
| G | Log | DISC | Log line + tomorrow's day type | Log line only |

## How to log (about 1 minute)
Add one line per day to `log/YYYY-MM.md`:

```
2026-11-23 | OFF | sleep:G | S:N F:m M:r L:N G:N | +cook +homelab | note
```

| Field | Values |
|---|---|
| Day type | `FLR` floor shift, `OFF` day off (see `schedule.md`). Older days logged `DBL` both jobs or `RMT` remote only |
| Sleep | `sleep:G` 6h+, `sleep:Y` 5-5.9h, `sleep:R` under 5h (Recovery Mode) |
| Dailies | `N` normal, `m` minimum, `r` rest or shield (scores like a minimum), `-` skipped |
| Habits | `+train` `+sleep7` `+anchor` `+cook` `+homelab` `-screens` `-fasting` |
| Flags | `shield` (family first, zero questions), `pause` (sick, injured, travel; nothing scored) |

Missing days are just blank. Nothing is subtracted and there are no streaks to break.

**Sunday review:** copy `reviews/TEMPLATE.md` to `reviews/2026-W48.md` (ISO week number). It can slide to Monday and closes by Wednesday.
**Rewards:** add a line like `2026-11-27 | T1 | gelato` to `rewards.log`.

## Live dashboard
The `site/` folder is a phone-first web app: a pixel-art map where the trainer walks between gym towns as XP grows, five gym badges you win by shipping real files, a Today screen with tap-to-log Dailies and hints, and side quests for one-off missions (a trip, an appointment).

**Deploy (one time)**
1. Create a GitHub repo named `life-rpg` and push everything here, including the hidden `.github` folder.
2. Repo → Settings → Pages → **Source: GitHub Actions**.
3. Repo → Actions → *tally-and-deploy* → Run workflow. Your site appears at `https://YOUR-USERNAME.github.io/life-rpg/`.
4. Open the site → Setup tab → paste a fine-grained token (Contents: Read and write, this repo only). The Save button then writes your daily log line straight to the repo.

Every save runs the tally, refreshes the stats above, and redeploys the site in about a minute.

**Badges** unlock when the file exists and has real content: `learn/linux/cheatsheet.md`, `learn/linux/hardened-vm-checklist.md`, `learn/homelab/homelab-writeup.md`, `learn/path/project-1.md`, `learn/path/project-2.md`.

**New Dailies:** add a line to `dailies:` in `rules.yml` and the site picks it up. **One-off missions:** add them from the Quests tab, or paste a line into `side-quests.yml`.

## Run it locally
`pip install pyyaml && python scripts/tally.py`, then `cd site && python -m http.server` and open localhost:8000.

## Privacy
Keep this repo's log to statuses only. Sleep is a G/Y/R code, and scale weight, family details, and health notes never go in a log line or a review.
