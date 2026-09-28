# Life-RPG

A 90-day habit system built around a two-job schedule (remote healthcare IT nights plus hospital floor shifts). It scores five daily habits, weekly quests, and a Linux → homelab learning track. A GitHub Action tallies the daily log, refreshes the stats below, and deploys the dashboard. Day 1 was 2026-09-21.

<!-- RPG:START -->
_No log entries yet. Day 1 is 2026-09-21._

| Stat | Progress | XP |
|---|---|---:|
| VIT | `░░░░░░░░░░` | 0 |
| FUEL | `░░░░░░░░░░` | 0 |
| GRIT | `░░░░░░░░░░` | 0 |
| SYS | `░░░░░░░░░░` | 0 |
| DISC | `░░░░░░░░░░` | 0 |

Quest: W1 “Hold the Line” starts 2026-09-21
Badges: 0/5
Path: Linux → Day-45 checkpoint on Nov 04 (44 days)
<!-- RPG:END -->

## What I'm building
The `learn/` folder is the portfolio side of this repo: Linux notes, hardened-VM checklists, and homelab writeups. A Day-45 checkpoint decides whether the second half goes toward networking / SRE / infrastructure or IAM / PAM security.

## The 5 Dailies
| Code | Daily | Stat | Normal | Minimum (2-10 min) |
|---|---|---|---|---|
| S | Sleep Floor | VIT | Asleep by 7:15, 6h+ | 10-min wind-down |
| F | Fuel | FUEL | All 5 anchors | Shake + yogurt |
| M | Move | GRIT | 20+ min of movement | 5-min mobility or 10-min walk |
| L | Learn | SYS | 30 min Linux / homelab | 10 min |
| G | Log | DISC | Log line + tomorrow's day type | Log line only |

## How to log (about 1 minute)
Add one line per day to `log/YYYY-MM.md`:

```
2026-09-21 | DBL | sleep:G | S:N F:m M:r L:N G:N | +cook +homelab | note
```

| Field | Values |
|---|---|
| Day type | `DBL` both jobs, `FLR` floor only, `RMT` remote only (see `schedule.md`) |
| Sleep | `sleep:G` 6h+, `sleep:Y` 5-5.9h, `sleep:R` under 5h (Recovery Mode) |
| Dailies | `N` normal, `m` minimum, `r` rest or shield (scores like a minimum), `-` skipped |
| Habits | `+train` `+sleep7` `+anchor` `+cook` `+homelab` `-screens` `-fasting` |
| Flags | `shield` (family first, zero questions), `pause` (sick, injured, travel; nothing scored) |

Missing days are just blank. Nothing is subtracted and there are no streaks to break.

**Sunday review:** copy `reviews/TEMPLATE.md` to `reviews/2026-W39.md` (ISO week number). It can slide to Monday and closes by Wednesday.
**Rewards:** add a line like `2026-09-25 | T1 | gelato` to `rewards.log`.

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
