# ADR 0004: On-Demand Data Visualization Skill

## Status

Amended by ADR 0005

## Decision

Aperture publishes the `create-data-visualizations` agent skill from this
repository. The skill name describes the action that an agent performs; it does
not reuse the Aperture library name.

Users load the skill in an active agent session with:

```sh
npx skills use kevin-courbet/aperture@create-data-visualizations
```

The public repository is the canonical source for the skill, its references,
schemas, assets, and validation CLI. Global agent configuration does not keep a
second copy or load the skill automatically.

The original decision also assigned standalone report work to this skill. ADR
0005 moves report composition and generation to the separate Reports library
and skill.
