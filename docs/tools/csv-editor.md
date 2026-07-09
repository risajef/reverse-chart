# CSV Editor

Der CSV Editor ist ein statisches Browser-Werkzeug zum Importieren, Pruefen,
Bearbeiten, Filtern, Sortieren und Exportieren von CSV-Daten.

## Oeffnen

Der Quellcode ist als Submodule eingebunden:

```text
external/csv-editor
```

Lokal starten:

```bash
cd external/csv-editor
python3 -m http.server 8001
```

Danach ist der Editor unter `http://127.0.0.1:8001/` erreichbar.

## Funktionen

- CSV per Drag-and-drop, Dateiauswahl oder Paste importieren.
- Separator automatisch erkennen oder manuell waehlen.
- Tabellenstruktur validieren.
- Daten als Tabelle bearbeiten.
- Zeilen und Spalten einfuegen oder loeschen.
- Sortieren, Filtern und Transponieren.
- Aktuelle Ansicht kopieren, als Markdown kopieren, als CSV herunterladen oder
  als XLSX exportieren.

## Repository

- GitHub: <https://github.com/risajef/csv-editor>
- Submodule: `external/csv-editor`
