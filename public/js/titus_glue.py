# Glue between the page and titus_tools.py. The worker (titus-worker.js) loads it in the browser,
# and scripts/gen-examples.mjs runs it with local Python to build the examples on the overview page.
import sys, json, re
sys.path.insert(0, "/home/pyodide")
import titus_tools as tt

def _protected(text):
    spans = [(m.start(), m.end()) for m in tt.PROTECTED.finditer(text)]
    return lambda i: any(a <= i < b for a, b in spans)

def _hidden_marks(text):
    # Mirrors the checks in tt._clean_prose so the page can show where each removed character was.
    # The counts the page reports come from tt.clean itself.
    is_protected = _protected(text)
    chars = list(text)
    marks = []
    for i, ch in enumerate(chars):
        if is_protected(i):
            continue
        cp = ord(ch)
        prev = chars[i - 1] if i else ""
        nxt = chars[i + 1] if i + 1 < len(chars) else ""
        name = None
        if cp in tt.ZERO_WIDTH:
            name = tt.ZERO_WIDTH[cp]
        elif cp in tt.JOINERS:
            keep = tt._is_emoji(prev) or tt._is_emoji(nxt) or tt.COMPLEX_SCRIPTS.match(prev or " ") or tt.COMPLEX_SCRIPTS.match(nxt or " ")
            if not keep:
                name = tt.JOINERS[cp]
        elif cp in tt.BIDI:
            name = "text-direction control"
        elif 0xE0000 <= cp <= 0xE007F:
            if not (tt._in_flag_tags(chars, i) or (cp == 0xE007F and i and 0xE0020 <= ord(prev) <= 0xE007E and tt._in_flag_tags(chars, i - 1))):
                name = "invisible tag character"
        elif 0xFE00 <= cp <= 0xFE0F or 0xE0100 <= cp <= 0xE01EF:
            if not tt._is_emoji(prev):
                name = "variation selector"
        elif 0xE000 <= cp <= 0xF8FF or 0xF0000 <= cp <= 0x10FFFD or 0xFDD0 <= cp <= 0xFDEF or (cp & 0xFFFE) == 0xFFFE:
            name = "private-use or non-character"
        elif cp in tt.SPACES:
            name = "unusual space"
        if name:
            marks.append({"start": i, "end": i + 1, "name": name, "cp": "U+%04X" % cp})
    for m in re.finditer(r"\w+", text):
        if is_protected(m.start()):
            continue
        w = m.group(0)
        latin = sum(c.isascii() and c.isalpha() for c in w)
        fake = sum(c in tt.HOMOGLYPHS for c in w)
        if fake and latin and latin + fake == sum(c.isalpha() for c in w):
            for j, c in enumerate(w):
                if c in tt.HOMOGLYPHS:
                    marks.append({"start": m.start() + j, "end": m.start() + j + 1, "name": "look-alike letter", "cp": "U+%04X" % ord(c), "looks": tt.HOMOGLYPHS[c]})
    return sorted(marks, key=lambda x: x["start"])

def _blank_code(text):
    return re.sub(r"\x60{3}.*?\x60{3}|\x60[^\x60]*\x60", lambda m: " " * len(m.group(0)), text, flags=re.S)

def _quote_spans(text):
    # The quotations tt.score skips, found the same way as tt.quotations, with their positions.
    body = _blank_code(text)
    found = [(m.start(), m.end()) for m in tt.BLOCK_QUOTE.finditer(body)]
    blanked = tt.BLOCK_QUOTE.sub(lambda m: " " * len(m.group(0)), body)
    found += [(m.start(), m.end()) for m in tt.QUOTED.finditer(blanked)]
    return sorted(found)

def _blank_quotes(text, quotes):
    # Blank each quotation without moving any position. Like tt._strip_code, a quotation that ends
    # a sentence leaves a period behind, so the next sentence still starts after one.
    chars = list(text)
    for a, b in quotes:
        fill = [" "] * (b - a)
        if re.search(r"[.!?]\W*$", text[a:b]) and b - a >= 2:
            fill[-2] = "."
        chars[a:b] = fill
    return "".join(chars)

def _pattern_spans(text):
    # The same regexes and filters tt.score counts, with code and quoted text blanked out so
    # positions line up and nothing inside a quotation is marked.
    body = _blank_quotes(_blank_code(text), _quote_spans(text))
    spans = []
    for label, rx, w in tt.COMPILED:
        keep = tt.FILTERS.get(label, lambda b, m: True)
        for m in rx.finditer(body):
            if m.end() <= m.start() or not keep(body, m):
                continue
            seg = body[m.start():m.end()]
            lead = len(seg) - len(seg.lstrip(" .!?\n\t"))
            trail = len(seg) - len(seg.rstrip(" \n\t"))
            s, e = m.start() + lead, m.end() - trail
            if e > s:
                spans.append({"start": s, "end": e, "label": label, "weight": w})
    return spans

def _score_dict(r):
    r = dict(r)
    r["patterns"] = [{"label": l, "count": c, "sample": s} for l, c, s in r["patterns"]]
    return r

def analyze(text):
    cleaned, found = tt.clean(text)
    return json.dumps({
        "cleaned": cleaned,
        "found": dict(found.most_common()),
        "found_text": tt.describe_found(found),
        "hidden": _hidden_marks(text),
        "score": _score_dict(tt.score(cleaned)),
        "spans": _pattern_spans(cleaned),
        "quotes": [{"start": a, "end": b} for a, b in _quote_spans(cleaned)],
        "min_words": tt.MIN_WORDS,
    })

# Things the rewrite must carry over exactly: quoted text, code, file paths, links and emoji.
# This adds one "Left as-is" line to the script's report, after checking that each item from the
# original appears unchanged in the rewrite. When every quotation came through, it takes the place
# of the script's own "Quoted text" line. When one changed, the script's line stays, since it says
# what to restore.
_CODE = re.compile(r"`{3}.*?`{3}|`[^`\n]+`", re.S)
_LINK = re.compile(r"\b(?:https?|ftp)://[^\s<>\"']+|\bwww\.[^\s<>\"']+")
_PATH = re.compile(r"(?<![\w/:.])(?:~|\.{1,2})?/(?:[\w.\-]+/)*[\w.\-]+|\b[A-Za-z]:\\(?:[\w.\-]+\\)*[\w.\-]+")
_TRAIL = ".,;:!?)]}"

def _kept_items(original):
    found = {"quotation": tt.quotations(original), "code snippet": [], "file path": [], "link": [], "emoji": []}
    rest = original
    for kind, rx in (("code snippet", _CODE), ("link", _LINK)):
        for m in rx.finditer(rest):
            found[kind].append(m.group(0).rstrip(_TRAIL) if kind == "link" else m.group(0))
        rest = rx.sub(" ", rest)
    for m in _PATH.finditer(rest):
        item = m.group(0).rstrip(_TRAIL)
        # A path needs a folder and a name, such as ~/notes/plan.md or C:\\data\\run.csv.
        if item.count("/") + item.count("\\") >= 2 or re.search(r"\.\w+$", item):
            found["file path"].append(item)
    i, chars = 0, list(original)
    while i < len(chars):
        if tt._is_emoji(chars[i]):
            j = i + 1
            # Keep a whole emoji sequence together: joiners, variation selectors, skin tones and the next emoji in a ZWJ sequence.
            while j < len(chars) and (ord(chars[j]) in (0x200D, 0xFE0F) or 0x1F3FB <= ord(chars[j]) <= 0x1F3FF or (ord(chars[j - 1]) == 0x200D and tt._is_emoji(chars[j]))):
                j += 1
            found["emoji"].append("".join(chars[i:j]))
            i = j
        else:
            i += 1
    return found

def _kept_line(original, rewrite):
    found = _kept_items(original)
    kept, changed = [], []
    for kind, items in found.items():
        if not items:
            continue
        ok = sum(item in rewrite for item in items)
        if kind == "quotation" and ok < len(items):
            continue  # the script's own line covers it
        n = len(items)
        noun = kind if n == 1 or kind == "emoji" else kind + "s"
        if ok == n:
            kept.append(f"{n} {noun}")
        else:
            changed.append(f"{n - ok} of {n} {noun}")
    if not kept and not changed:
        return None
    def join(parts):
        return parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " and " + parts[-1]
    line = []
    if kept:
        line.append(f"Left as-is: {join(kept)}")
    if changed:
        line.append(f"Changed in the rewrite: {join(changed)}. Restore them from the original.")
    return "\n".join(line)

def compare(original, rewrite):
    text, clean_new = tt.report(original, rewrite)
    clean_orig, _ = tt.clean(original)
    kept = _kept_line(clean_orig, clean_new)
    if kept:
        lines = text.split("\n")
        quote = next((k for k, l in enumerate(lines) if l.startswith("Quoted text:")), None)
        if quote is not None and "left as written and not scored" in lines[quote]:
            del lines[quote]
            quote = None
        # After the script's "Quoted text" line when it stays, otherwise after "Hidden characters removed".
        at = quote + 1 if quote is not None else next((k + 1 for k, l in enumerate(lines) if l.startswith("Hidden characters removed:")), len(lines))
        lines[at:at] = kept.split("\n")
        text = "\n".join(lines)
    return json.dumps({
        "report": text,
        "cleaned_rewrite": clean_new,
        "before": _score_dict(tt.score(clean_orig)),
        "after": _score_dict(tt.score(clean_new)),
        "spans_after": _pattern_spans(clean_new),
    })
