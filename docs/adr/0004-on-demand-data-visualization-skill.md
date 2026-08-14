# ADR 0004: On-Demand Data Visualization Skill

## Status

Amended by ADR 0005 and ADR 0006

## Decision

Aperture develops the `create-data-visualizations` agent skill in this
repository. The skill name describes the action that an agent performs; it does
not reuse the Aperture library name. The central catalog publishes it as defined
by ADR 0006.

Users load the skill in an active agent session with:

```sh
npx skills use kevin-courbet/skills@create-data-visualizations
```

This repository is the development source for the skill, its references,
schemas, assets, and validation CLI. ADR 0006 defines publication through the
central skills catalog. Global agent configuration does not keep a second
development copy or load the skill automatically.

The original decision also assigned standalone report work to this skill. ADR
0005 moves report composition and generation to the separate Reports library
and skill.
