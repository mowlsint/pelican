# PELICAN Pages · Änderung 1.3-RC2 (19.10.2026)

## Ziel
Mehrere Meldungen mit der Tastatur zeilenweise eingeben und **einmal gemeinsam decodieren**. Einheitliche IMO-Sprechfassung mit Punkt nach jeder Gruppe zur Anregung von TTS-Pausen.

## Änderung
- `index.html`: Mehrzeilen-Decoder (9 Zeilen initial), Bedienhinweise, Schaltfläche „Alle decodieren“, Gruppen-Zähler, separate IMO-TTS-Sendeblockansicht.
- `assets/app.js`: Tab fügt Zeilenwechsel ein; Shift+Tab bleibt Navigationsgeste; Ctrl/Cmd+Enter decodiert einmal; strukturierte Ergebnisausgabe pro Hauptmeldung und zugehörige Zusatzdetails; Sprechertext pro Gruppe mit abschließendem Punkt; Copy-Button für gesamten IMO-Text.
- `assets/site.css`: bessere Lesbarkeit und Ergebnisdarstellung.
- `functions/api/index.js`: Punkt als separates Trennzeichen zwischen achtstelligen Gruppen akzeptieren (kein Codebestandteil).
- Die fünf Codetafeln und alle D1-Zuordnungen sind **unverändert**.

## Beispiel-Eingabe
```text
KQNIPJHA.
NDSXHTKJ.
NDHFNSNS.
```
Ohne LOU im Decoder; alle drei Gruppen gleichzeitig decodieren. Die beiden `ND`-Gruppen ergänzen die erste Hauptmeldung.

## Sicherheit
Nur das **GitHub-sichere Paket** deployen. Niemals das private D1-Datenpaket oder die Offline-HTML-Anwendung mit eingebetteten Tabellen nach Pages hochladen.
