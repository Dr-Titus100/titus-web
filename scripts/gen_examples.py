# Builds src/data/examples.generated.json from src/data/examples.source.json by running the pinned
# titus_tools.py and the page glue, so the demo's highlights, scores and reports are the script's own output.
# Run it with `node scripts/gen-examples.mjs` after changing the examples or bumping the skill version.
import json, os, sys
root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(root, "public/skills/titus-humanizer"))
glue = {}
exec(open(os.path.join(root, "public/js/titus_glue.py")).read(), glue)
src = json.load(open(os.path.join(root, "src/data/examples.source.json")))
version = json.load(open(os.path.join(root, "skills.config.json")))["skills"][0].get("ref") \
    or json.load(open(os.path.join(root, "src/data/skills.generated.json")))["titus-humanizer"]["version"]

def analysis(text):
    return json.loads(glue["analyze"](text))

d = src["demo"]
a, b = analysis(d["before"]), analysis(d["after"])
out = {
    "version": version,
    "demo": {
        "before": a["cleaned"],
        "after": b["cleaned"],
        "spans": [[s["start"], s["end"], s["label"]] for s in a["spans"]],
        "patterns": sum(p["count"] for p in a["score"]["patterns"]),
        "beforeScore": a["score"]["score"], "beforeTier": a["score"]["tier"],
        "afterScore": b["score"]["score"], "afterTier": b["score"]["tier"],
        "afterPatterns": sum(p["count"] for p in b["score"]["patterns"]),
    },
    "examples": [
        {**ex, "report": json.loads(glue["compare"](ex["before"], ex["after"]))["report"]}
        for ex in src["examples"]
    ],
}
dest = os.path.join(root, "src/data/examples.generated.json")
text = json.dumps(out, indent=2, ensure_ascii=False) + "\n"
if "--check" in sys.argv:
    if open(dest).read() != text:
        sys.exit("src/data/examples.generated.json is out of date. Run node scripts/gen-examples.mjs and commit the result.")
    print("examples.generated.json matches the script")
else:
    open(dest, "w").write(text)
    print("wrote src/data/examples.generated.json")
