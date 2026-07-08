# Werkzeuge

Diese Sammlung dokumentiert kleine, statische Browser-Werkzeuge. Die Anwendungen
laufen ohne Backend und koennen direkt aus den jeweiligen HTML-Dateien oder ueber
ein statisches Hosting gestartet werden.

## Projekte

| Projekt | Zweck | Quelle |
| --- | --- | --- |
| [Reverse Chart](projects/reverse-chart.de.md) | Werte aus Diagramm-Bildern ueber Kalibrierpunkte auslesen. | Dieses Repository |
| [CSV Editor](projects/csv-editor.de.md) | CSV-Dateien importieren, pruefen, filtern, sortieren und exportieren. | Submodule `external/csv-editor` |

## Schnellstart

```bash
git clone --recurse-submodules https://github.com/risajef/reverse-chart.git
cd reverse-chart
python3 -m http.server 8000
```

Danach ist die Sammlung lokal unter `http://127.0.0.1:8000/` erreichbar. Die
Submodule werden mit `--recurse-submodules` direkt mitgeladen.
