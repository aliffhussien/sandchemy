# Dump Ideas

This document serves as a collection point for wild, ambitious, or "dump" ideas for the future of Sandchemy and the AI that builds it.

## Deep Research AI Protocol (The "Legit Researcher")

Instead of relying on LLM training weights to invent physical constants, the AI developing this app should behave as a legit open-source researcher.

### How it works:
1. **Initial Search:** The AI uses web search tools (Wikipedia, scientific databases, open-source wikis) to find the foundational data for the app.
2. **Branching:** As it discovers new concepts (e.g., specific heat capacity, latent heat), it spawns sub-searches to acquire the exact real-world numbers and physical rules.
3. **The Knowledge Graph (The Dump):** Instead of a simple `SCIENCE.md`, the AI compiles a comprehensive folder of research files (e.g., `research/physics.md`, `research/chemistry.md`), fully citing where every number came from using real URLs.
4. **Implementation:** Only *after* this deep research dump is complete does the AI write code, strictly mapping the application logic to the researched constants and citations.

### Rules for the AI:
- Prioritize Wikipedia, academic papers, and official documentation.
- If an exact number cannot be found, make an educated guess but heavily flag it in the research dump with `[GUESS]` so it can be manually verified later.
