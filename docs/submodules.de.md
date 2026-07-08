# Submodule

Dieses Repository kann externe Werkzeuge als Git-Submodule einbinden. Dadurch
bleibt die Quelle des jeweiligen Werkzeugs separat, waehrend die Dokumentation
und Navigation hier zentral gepflegt werden.

## Eingebundene Submodule

| Pfad | Repository | Branch | Eingebundener Stand |
| --- | --- | --- | --- |
| `external/csv-editor` | <https://github.com/risajef/csv-editor> | `master` | `fb103d2` |

## Nach dem Klonen initialisieren

```bash
git submodule update --init --recursive
```

## Submodule aktualisieren

```bash
git submodule update --remote external/csv-editor
git status
git add external/csv-editor
git commit -m "Update csv-editor submodule"
```

## Neues Submodule hinzufuegen

```bash
git submodule add https://github.com/risajef/NAME.git external/NAME
git add .gitmodules external/NAME
```

Danach die Projektseite, Navigation und News ergaenzen.
