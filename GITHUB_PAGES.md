# Öffentliche PELICAN-Station

GitHub Pages stellt die universelle Anwendung mit lokalem Dateiimport bereit. Sie benötigt weder Cloudflare noch D1. Private Tafeln und Kennsignale werden separat an berechtigte Empfänger ausgegeben und in der Anwendung lokal eingelesen. Die Anwendung lädt keine Tafeln nach und übermittelt die importierten Inhalte nicht an einen Server.

## Veröffentlichung

`npm run build:pages` erzeugt ausschließlich `docs/index.html`, `docs/offline.html` und `docs/.nojekyll`. Die öffentliche Station und die herunterladbare Offline-Datei verwenden denselben Codec und dieselbe Importlogik. Die CSP blockiert Netzwerkverbindungen aus der Anwendung. Die HTML muss zunächst vom Hostingdienst geladen werden; danach findet die Verarbeitung lokal statt.

Im GitHub-Repository unter Settings → Pages als Quelle **Deploy from a branch**, Branch **public-pages**, Ordner **/docs** wählen. Der Branch enthält den geprüften Wartungsstand vom 01.11.2026 einschließlich Sint Maarten, Unicode- und Importkorrekturen. Private Dateien sind weder Teil dieses Branches noch des Pages-Verzeichnisses.

Die Datei `index.html` im Repository-Wurzelverzeichnis gehört weiterhin zum getrennten Cloudflare/D1-Adapter. Sie ist deshalb nicht die Startdatei der GitHub-Pages-Veröffentlichung. GitHub Pages kann die serverseitigen Functions nicht ausführen. Die Cloudflare-D1-Inbetriebnahme bleibt ein eigener, bislang nicht remote abgenommener Betriebsweg.

## Nutzung

1. Öffentliche Station öffnen oder Offline-HTML herunterladen.
2. Eigene `.book.json` importieren.
3. Die separat ausgegebene `.signals.json` importieren.
4. Vier Hauptfelder wählen und bei Bedarf Zusatzdaten ergänzen, oder empfangene Codegruppen einfügen.
5. Nach Gebrauch die Tafel entladen oder den Tab schließen.

Es gibt keine öffentlichen Tafeln, Kennsignaldateien oder echten Meldungsarchive. Synthetische Beispiele liegen ausschließlich in den Tests. PELICAN ist Codebuchverschleierung und bietet keine kryptografisch sichere Verschlüsselung. Ohne Kennsignal sind manche alten Hauptgruppen nicht eindeutig einer Tafel zuzuordnen.

## Prüfen und zurücksetzen

`npm ci`, `npm run build:pages`, `npm test`. Der Browser-Regressionslauf unter `tests/browser/offline.e2e.mjs` kann über `PELICAN_OFFLINE_HTML=docs/index.html` gegen die veröffentlichte Startdatei ausgeführt werden. Private Testeingaben verbleiben außerhalb des Repositorys.

Ein Rückfall der öffentlichen Seite erfolgt über einen geprüften vorherigen Commit des Branches `public-pages` beziehungsweise durch Abschalten der Pages-Veröffentlichung in Settings → Pages. Die private D1 und deren Grants werden dabei nicht verändert.
