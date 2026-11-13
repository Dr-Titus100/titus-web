# Glue between the page and titus_tools.py. The worker (titus-worker.js) loads it in the browser,
# and scripts/gen-examples.mjs runs it with local Python to build the examples on the overview page.
import sys, json, re
sys.path.insert(0, "/home/pyodide")
import titus_tools as tt

# titus-humanizer after v1.2.0 skips links and file paths in the score, and its score report names
# everything it left as-is. Until the site pins that release, the glue adds both to the pinned
# script, the same way the next release does them. Remove this block then.
if not hasattr(tt, "_blank_links_and_paths"):
    def _is_path(item):
        return item.count("/") + item.count("\\") >= 2 or bool(re.search(r"\.\w+$", item))

    # A link stops at a space, a quote mark, a backtick or a dash, as in the next release.
    _LINK = re.compile(r"\b(?:https?|ftp)://[^\s<>\"'`\u2014\u2013\u201c\u201d\u2018\u2019]+|\bwww\.[^\s<>\"'`\u2014\u2013\u201c\u201d\u2018\u2019]+")

    def _blank_links_and_paths(text):
        def link(m):
            item = tt._trim_link(m.group(0))
            return " " * len(item) + m.group(0)[len(item):]
        def path(m):
            item = m.group(0).rstrip(tt._TRAILING)
            return " " * len(item) + m.group(0)[len(item):] if _is_path(item) else m.group(0)
        return tt.KEPT_PATH.sub(path, _LINK.sub(link, text))

    _strip_code = tt._strip_code
    tt._strip_code = lambda text: _blank_links_and_paths(_strip_code(text))
    tt._blank_links_and_paths = _blank_links_and_paths
if not hasattr(tt, "_skipped_line"):
    def _skipped_line(text):
        found = tt.kept_items(text)
        parts = [f"{len(found[k])} {k if len(found[k]) == 1 or k == 'emoji' else k + 's'}" for k in tt.KEPT_KINDS if found[k]]
        if not parts:
            return None
        return "Left as-is and not scored: " + (parts[0] if len(parts) == 1 else ", ".join(parts[:-1]) + " and " + parts[-1])
    tt._skipped_line = _skipped_line

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
    # The same regexes and filters tt.score counts, with code, quoted text, links and file paths
    # blanked out so positions line up and nothing inside them is marked.
    body = tt._blank_links_and_paths(_blank_quotes(_blank_code(text), _quote_spans(text)))
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
        "skipped": tt._skipped_line(cleaned),
        "min_words": tt.MIN_WORDS,
    })

def compare(original, rewrite):
    text, clean_new = tt.report(original, rewrite)
    clean_orig, _ = tt.clean(original)
    return json.dumps({
        "report": text,
        "cleaned_rewrite": clean_new,
        "before": _score_dict(tt.score(clean_orig)),
        "after": _score_dict(tt.score(clean_new)),
        "spans_after": _pattern_spans(clean_new),
    })
