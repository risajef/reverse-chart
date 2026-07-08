# Reverse Chart

Reverse Chart ist ein statisches Web-Werkzeug zum Digitalisieren von Diagrammen.
Ein Chart-Bild wird geladen, Achsen werden ueber bekannte Punkte kalibriert, und
anschliessend koennen weitere Punkte ausgelesen oder als CSV exportiert werden.

## Funktionen

- Bild per Upload oder Drag-and-drop laden.
- X- und Y-Achse separat kalibrieren.
- Lineare und logarithmische Achsen unterstuetzen.
- Messpunkte im Diagramm setzen und in der Seitenleiste anzeigen.
- Messpunkte als CSV exportieren.

## Dateien

| Datei | Beschreibung |
| --- | --- |
| `index.html` | Einstiegspunkt der Anwendung. |
| `app.js` | Interaktion, Kalibrierung, Messung und CSV-Export. |
| `styles.css` | Layout und visuelles Design. |
| `lin_example.png` | Beispiel fuer logarithmische Achsen. |
| `log_example.png` | Beispiel fuer ein Balkendiagramm. |

## Entwicklung

```bash
python3 -m http.server 8000
```

Die Anwendung braucht keinen Build-Schritt. Nach Aenderungen reicht ein
Browser-Refresh.
