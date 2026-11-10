"""Generate the LOL word hunt: every word from the list is hidden in the grid, and the
cells no word uses spell a secret message when read left-to-right, top-to-bottom.

    python3 tools/wordsearch.py  -> wordsearch.js (window.WORDSEARCH = {...})
"""
import json, random, sys
from pathlib import Path

N = 13
WORDS = {
    "THE HITS":   ["JOGODO", "OJUELEGBA", "ESSENCE", "JORO", "SOCO", "FEVER", "GINGER", "COME CLOSER", "PAKURUMO"],
    "THE ALBUMS": ["SUPERSTAR", "AYO", "MADE IN LAGOS", "MORAYO"],
    "THE NIGHT":  ["STARBOY", "BIG WIZ", "MACHALA", "ABUJA", "EAGLE SQUARE", "WIZZEMBER", "LIVE OUT LOUD"],
}
MESSAGES = ["GET YOUR TICKET NOW", "GET YOUR TICKET NOW AT WIZKID TIX AFRICA"]
DIRS = [(0, 1), (1, 0), (1, 1), (-1, 1), (0, -1), (-1, 0), (-1, -1), (1, -1)]
EXAMPLE = "STARBOY"

def key(w): return w.replace(" ", "").replace("'", "")

def attempt(rng, words):
    grid = [[None] * N for _ in range(N)]
    placed = {}
    for w in sorted(words, key=lambda w: -len(key(w))):
        k = key(w); best = []
        for _ in range(400):
            dr, dc = rng.choice(DIRS)
            # the example word stays left-to-right so readers see how it works
            if w == EXAMPLE: dr, dc = 0, 1
            r, c = rng.randrange(N), rng.randrange(N)
            er, ec = r + dr * (len(k) - 1), c + dc * (len(k) - 1)
            if not (0 <= er < N and 0 <= ec < N): continue
            cells = [(r + dr * i, c + dc * i) for i in range(len(k))]
            if any(grid[a][b] not in (None, k[i]) for i, (a, b) in enumerate(cells)): continue
            overlap = sum(grid[a][b] == k[i] for i, (a, b) in enumerate(cells))
            if overlap == len(k): continue
            best.append((overlap, cells))
        if not best: return None
        best.sort(key=lambda x: -x[0])
        top = best[0][0]
        cells = rng.choice([b for o, b in best if o == top] if rng.random() < 0.7 else [b for _, b in best])
        for i, (a, b) in enumerate(cells): grid[a][b] = k[i]
        placed[w] = cells
    return grid, placed

def main():
    words = [w for ws in WORDS.values() for w in ws]
    msgs = {len(key(m)): m for m in MESSAGES}
    for seed in range(200000):
        rng = random.Random(seed)
        res = attempt(rng, words)
        if not res: continue
        grid, placed = res
        free = [(r, c) for r in range(N) for c in range(N) if grid[r][c] is None]
        if len(free) in msgs:
            msg = msgs[len(free)]
            for (r, c), ch in zip(free, key(msg)): grid[r][c] = ch
            out = {"size": N, "seed": seed, "grid": ["".join(row) for row in grid], "categories": WORDS,
                   "placed": {w: cells for w, cells in placed.items()}, "message": msg,
                   "messageCells": free, "example": EXAMPLE}
            # sanity: every word readable at its cells, message readable from free cells
            for w, cells in placed.items(): assert "".join(grid[a][b] for a, b in cells) == key(w)
            assert "".join(grid[a][b] for a, b in free) == key(msg)
            Path(__file__).parent.parent.joinpath("assets", "wordsearch.js").write_text("window.WORDSEARCH = " + json.dumps(out) + ";\n")
            print("seed", seed, "free", len(free), msg); print("\n".join(" ".join(r) for r in out["grid"])); return
    sys.exit("no layout found")

main()
