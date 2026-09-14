# ADR-0002: Canonical Event and global tasks

Accepted — 2026-09-14. `PmTask` is the sole persisted Aufgabe module for Event and global planning. The older `EventTask` store and its read/write path are deleted without migration by explicit product decision; Event snapshots expose only a compact readiness projection. Task dependencies remain inside one planning scope so Event readiness and archival stay local.
