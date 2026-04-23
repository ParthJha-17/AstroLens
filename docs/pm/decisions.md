# PM — Decisions Log

> Scoping decisions made by the PM. Do not re-litigate these without ED approval.

---

**[DEC-01] | 2026-04-23**
Decision: No user authentication in v1.
Rationale: Adds significant complexity; core value is in browsing and briefings, not personalization.
Out of scope: saved images, user profiles, bookmarks, email subscriptions.

**[DEC-02] | 2026-04-23**
Decision: GPT-4o briefings are generated on-demand and cached; not pre-generated for all APOD images.
Rationale: Minimizes OpenAI API costs (pay-per-use, no free tier). Cache means repeat visitors pay nothing extra.
Out of scope: batch pre-generation of all historical briefings.

**[DEC-03] | 2026-04-23**
Decision: Responsive web only (no mobile app) in v1.
Rationale: Next.js responsive design covers mobile browsers. Native app is a v2 consideration.
Out of scope: React Native, PWA offline mode.

**[DEC-04] | 2026-04-23**
Decision: Free-tier infrastructure only for v1.
Rationale: Project constraint. Neon (PostgreSQL), Vercel (frontend), NASA APIs (free with key).
Out of scope: paid database tiers, CDN, Redis caching layer.
