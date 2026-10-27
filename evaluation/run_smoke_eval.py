"""Small API smoke evaluation; not a substitute for reviewed answer quality."""
import json
import os
import urllib.error
import urllib.request

API_URL = os.getenv("API_URL", "http://localhost:8000")
QUESTIONS_PATH = os.path.join(os.path.dirname(__file__), "questions.json")
ABSTENTION_HINTS = ("couldn't find enough information", "could not find", "not in the uploaded documents")

def post_question(question: str) -> dict:
    payload = json.dumps({"question": question}).encode("utf-8")
    req = urllib.request.Request(f"{API_URL}/chat", data=payload, headers={"Content-Type":"application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=90) as response:
        return json.loads(response.read().decode("utf-8"))

def main() -> None:
    with open(QUESTIONS_PATH, encoding="utf-8") as file:
        questions = json.load(file)
    results = []
    for item in questions:
        try:
            response = post_question(item["question"])
            answer, sources = response.get("answer", ""), response.get("sources", [])
            expected = item["expected_behavior"]
            cited = bool(sources) and (", p." in answer.lower() or ", p " in answer.lower())
            abstained = bool(response.get("abstained")) or any(h in answer.lower() for h in ABSTENTION_HINTS)
            passed = abstained if expected == "abstain" else bool(answer) and cited and not abstained
            results.append({"id":item["id"],"expected":expected,"passed_smoke_check":passed,"abstained":abstained,"source_count":len(sources),"answer":answer})
        except (urllib.error.URLError, TimeoutError, ValueError) as exc:
            results.append({"id":item["id"],"passed_smoke_check":False,"error":str(exc)})
    passed_count = sum(bool(r.get("passed_smoke_check")) for r in results)
    print(json.dumps({"passed":passed_count,"total":len(results),"results":results}, indent=2))
    print("\nThis heuristic checks citations/abstention, not factual correctness.")

if __name__ == "__main__":
    main()
