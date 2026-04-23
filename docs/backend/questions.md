# Backend Dev — Questions & Blockers

> Backend Dev writes here when blocked. Senior SDE answers and marks RESOLVED.

---

## Q-01 — Missing secrets [RESOLVED ✅]

**Task:** BE-01
All secrets now in `backend/.env`: NASA_API_KEY ✅ | OPENAI_API_KEY ✅ | DATABASE_URL ✅ | Reddit ✅ (dropped) | YouTube ✅ (dropped)

---

## Q-02 — Reddit/YouTube removed from agent [NOTED]

**Task:** BE-06
**Decision:** Reddit and YouTube APIs are unavailable (cost). The GPT-4o agent will use only `web_search` (DuckDuckGo, free). `sources` list will contain only type `"web"`. Updated `config.py` and `requirements.txt` accordingly.
