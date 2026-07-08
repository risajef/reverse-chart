# Projekt hinzufuegen

Diese Checkliste ist die Merkhilfe fuer weitere Werkzeuge in dieser Sammlung.
Sie beschreibt die gleichen Schritte, die fuer `csv-editor` verwendet wurden.

## Checkliste

1. Repository pruefen.

   ```bash
   git ls-remote https://github.com/risajef/NAME.git
   ```

2. Submodule hinzufuegen.

   ```bash
   git submodule add https://github.com/risajef/NAME.git external/NAME
   ```

3. Projektseite aus der Vorlage kopieren.

   ```bash
   cp docs/templates/project.de.md docs/projects/NAME.de.md
   ```

4. `mkdocs.yml` erweitern.

   ```yaml
   nav:
     - Projekte:
         - NAME: projects/NAME.de.md
   ```

5. `docs/news.de.md` um einen Eintrag mit Datum ergaenzen.

6. `docs/submodules.de.md` mit Pfad, Repository, Branch und Commit ergaenzen.

7. Alles pruefen und committen.

   ```bash
   git status
   git add .gitmodules external/NAME mkdocs.yml docs
   git commit -m "Add NAME project"
   ```

## Hinweise

- Submodule-Pfade liegen unter `external/`.
- Projektseiten liegen unter `docs/projects/`.
- Navigation wird in `mkdocs.yml` gepflegt.
- News-Eintraege stehen in `docs/news.de.md`, neueste Eintraege oben.
- Fuer statische Werkzeuge reicht meist `python3 -m http.server`.
