# Tool Addition Workflow

Use this repo-local note when adding another `risajef/*` tool to this collection.
This is internal maintainer guidance, not website content.

## Goal

When the user asks to add another tool, update the public docs only with pages
that belong to the website: project page, navigation, news, submodule inventory,
and README if useful. Keep workflow memory in `.codex/`.

## Steps

1. Check the remote repository and default branch.

   ```bash
   git ls-remote https://github.com/risajef/NAME.git
   ```

2. Add it as a submodule under `external/`.

   ```bash
   git submodule add https://github.com/risajef/NAME.git external/NAME
   ```

3. Inspect the submodule files before writing docs.

   ```bash
   find external/NAME -maxdepth 2 -type f -print
   sed -n '1,220p' external/NAME/README.md
   sed -n '1,220p' external/NAME/requirements.md
   ```

   Some projects may not have both files. Read whichever project files describe
   the app, then summarize from the actual source.

4. Add or update public docs.

   - Add `docs/projects/NAME.de.md` for the project overview.
   - If the site uses a `Tools` section, add `docs/tools/NAME.md` too.
   - Add the project to `mkdocs.yml` under `Projekte` and, when present,
     under `Tools`.
   - Add a dated entry to `docs/news.de.md`.
   - Add the submodule path, repository, branch, and commit to
     `docs/submodules.de.md`.
   - Update `docs/index.de.md` if the project list needs a row.

5. Verify.

   ```bash
   git submodule status
   git status --short
   ```

   Run project-specific checks if the root app or submodule files changed.

6. Commit and push when the user asked for a complete addition.

   ```bash
   git add .gitmodules external/NAME mkdocs.yml docs .codex
   git commit -m "Add NAME project"
   git push
   ```

## Public Docs Shape

Project page template:

````markdown
# NAME

Short description based on the submodule source.

## Zweck

What the tool does.

## Funktionen

- Important feature.
- Important feature.
- Important feature.

## Lokaler Start

```bash
cd external/NAME
python3 -m http.server 8001
```
````

Do not add this workflow itself to `mkdocs.yml`.
