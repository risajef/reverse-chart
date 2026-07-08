# CSV Editor

Der CSV Editor ist als Git-Submodule unter `external/csv-editor` eingebunden und
kommt aus <https://github.com/risajef/csv-editor>. Der aktuelle eingebundene
Stand ist `fb103d2`.

## Zweck

Der Editor ist ein statisches Web-Werkzeug fuer CSV-Dateien. Daten koennen per
Drag-and-drop, Dateiauswahl oder Einfuegen importiert werden. Danach werden sie
als Tabelle angezeigt und koennen geprueft, sortiert, gefiltert und exportiert
werden.

## Funktionen

- CSV importieren per Drop, Upload oder Paste.
- Separator automatisch erkennen oder manuell auswaehlen.
- Zeilenlaengen validieren.
- Tabelle anzeigen und bearbeiten.
- Zeilen und Spalten einfuegen oder loeschen.
- Nach Spalten sortieren.
- Filter pro Tabelle oder Spalte anwenden.
- Tabelle transponieren.
- Aktuelle Ansicht kopieren oder herunterladen.
- Als Markdown-Tabelle kopieren.
- Als XLSX herunterladen.

## Lokaler Start

```bash
cd external/csv-editor
python3 -m http.server 8001
```

Danach ist der Editor unter `http://127.0.0.1:8001/` erreichbar.

## Submodule aktualisieren

```bash
git submodule update --remote external/csv-editor
git add external/csv-editor
git commit -m "Update csv-editor submodule"
```
