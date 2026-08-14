# ADR 0006: Publish Skill From Central Catalog

## Status

Accepted

## Decision

Aperture remains the development source for the
`create-data-visualizations` skill, including its references, schemas, assets,
and validation CLI.

After a skill change lands on Aperture `main`, automation owned by
`kevin-courbet/skills` selects the latest skill commit, validates it, and
publishes the exact skill directory. The distribution repository records the
Aperture source commit and verifies its generated copy against that commit.

Consumers load and install the skill from the central catalog:

```sh
npx skills use kevin-courbet/skills@create-data-visualizations
npx skills add kevin-courbet/skills --skill create-data-visualizations -y
```
