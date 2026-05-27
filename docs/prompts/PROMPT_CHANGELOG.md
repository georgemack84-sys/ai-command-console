# Prompt Changelog

## 2026-04-24

- phase: 3.4C
- prompt version: 1
- major changes:
  - introduced governed advisory learning phase prompt
  - added build governance artifacts and debrief requirement
  - added threat-model-first implementation gate
- reason:
  - advisory learning needs explicit architectural and safety controls before feature work
- known risks:
  - existing runtime control contains embedded advisory logic that must be untangled safely
  - lint-based boundary enforcement does not fully cover `services/**`
