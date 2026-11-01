# MOwlSINT PELICAN 1.5 SECURITY-RC2

Universeller Anwendungscode. Private Tafeln, Kennsignale, SQL-Datensätze und Druckbücher gehören ausschließlich in das getrennte Privatpaket.

**Stand 01.11.2026: lokal geprüfte RC2-Wartungsfassung; Cloudflare-Staging und Produktionsfreigabe stehen aus. PR #1 ist seit 22.10.2026 gemergt. Der aktuelle GitHub-main-Stand ist a60d650aa99ec57b6682c9470fc5ac2dd082918e; ein produktives Pages-Deployment ist damit nicht nachgewiesen.**

## Ausführung

Node >=22.13. `npm ci`, `npm run check`, `npm test`, `npm run build`.

Cloudflare Pages: Buildbefehl `npm run build`; Ausgabeverzeichnis `dist`; Functions liegen im Projektwurzelverzeichnis `functions/`. Bestehende Dashboard-Einstellungen erst nach Bestandsprüfung anpassen. `dist` wird anhand einer festen Positivliste erstellt. SQL, JSON-Tafeln, PDF, Tests und Dokumentation gelangen nicht in die statischen Assets. Kein automatisches Deployment-Skript und kein produktiver Wrangler-Konfigurationswechsel enthalten.

`jose` ist mit Lockdatei festgelegt. Für lokale Pages-Entwicklung kann ein separat installiertes Wrangler mit `npm run dev` verwendet werden; tatsächliche D1-Bindings vorher aus dem Dashboard übernehmen. Keine Datenbank-ID oder Domain wird geraten.

## Architektur

- `lib/pelican-core.mjs`: gemeinsamer Codec ohne private Zuordnungen.
- `offline.html`: alleinstehende HTML mit eingebettetem, identischem Kern. `npm run sync:offline` synchronisiert den Kern und aktualisiert den CSP-Scripthash.
- `functions/api/index.js`: Cloudflare-Access-JWT-Prüfung und D1-Grants; kein Download ganzer Tafeln.
- `assets/app.js`: Eingabe, Mehrfachmeldungen und NATO-Sprechtext für Kokoro.
- `schema.sql`: unverändertes leeres Datenbankschema.
- `scripts/build.mjs`: begrenzte statische Dateiausgabe.
- `scripts/render-codebooks.py`: vollständige private Druckbücher aus privaten Eingaben erzeugen; optionale Python-Abhängigkeiten reportlab/pypdf. Private Eingabe und Ausgabe immer außerhalb des Repositorys halten.

## Sicherheitsrevision RC2

Die vorherige SECURITY-RC ersetzte die sechs Nutzbuchstaben einer QW-/YY-Gruppe einzeln. Die Komposition zweier solcher Tafeln ist wiederum eine Buchstabensubstitution. Die alte Umsetzung erfüllte die verlangte Unabhängigkeit daher nicht.

RC2 nutzt je Tafel eine unabhängig zufällig erzeugte Permutation der 676 Buchstabenpaare. Jedes der drei Nutzpaare wird damit umgesetzt. Vorwärts- und Rückwärtsprüfung aller Paare und Tafelvergleiche schließen einfache Caesar- sowie positionsweise Buchstabensubstitutionen in den geprüften Zuordnungen aus. Das ist **kein Beweis kryptografischer Sicherheit** und kein neuer Secure-Modus.

Private Dateiedition: `1.5-SECURITY-RC2`; `special_cipher.version=2`, `special_cipher.pairs` enthält 676 unterschiedliche Paare. Alte 1.5-QW-/YY-Formate werden nicht stillschweigend übernommen. Hauptcodes, ND-Zuordnungen, Statuspaare und Kennsignale bleiben gegenüber dem gelieferten SECURITY-RC-Paket gleich.

**Ohne Kennsignal ist die Tafel nicht eindeutig überprüfbar.** In acht der zehn privaten Tafelpaare existieren Hauptgruppen, die in beiden Tafeln syntaktisch gültig sind. Das folgt aus dem vorhandenen Codebestand. Ein falsch gewähltes Buch kann solche Gruppen falsch interpretieren. Signalumschlossene Blöcke werden auf das Kennsignal und online zusätzlich auf den Decode-Grant geprüft. Kennsignale sind keine kryptografische Authentisierung.

## Tests

`npm test` verwendet ausschließlich synthetisch erzeugte Testtafeln. Tests mit echten Tafeln laufen lokal mit `PELICAN_BOOK_DIR=/absoluter/privater/pfad npm test`. Diese Umgebung und Daten niemals in GitHub Actions hinterlegen.

`node tests/check-independent-codebooks.mjs /privat/*.book.json` prüft alle Paarvergleiche für Hauptfelder, ND, Status und Sondergruppen.

`npm run test:offline` benötigt Playwright, einen installierten Chromium und `PELICAN_BOOK_DIR`. Optional `PELICAN_CHROMIUM` auf eine lokale Chromium-Datei setzen; `PELICAN_PLAYWRIGHT_MODULE` erlaubt ein bereits vorhandenes Playwright-Modul. Der Browser läuft im Offline-Kontext und öffnet `file://`. Linux-Chromium wurde tatsächlich geprüft; Windows bleibt separat abzunehmen.

Der Regressionstest verwendet die universelle 1.4-RC1-Implementierung vom GitHub-Basiscommit `02476afa1953c0a1ef56413bf92c01a1ebb52c56` mit den gelieferten kompatiblen Zuordnungen. Das ersetzt keine Prüfung gegen eine echte alte Produktionsdatenbank.

## Betrieb und Freigabe

Ein Empfänger erhält ausschließlich `BUCH_<table>.zip` und separat `SIGNAL_<table>.zip`. Das Buchpaket enthält Offline-HTML, eine Einzeltafel, deren Druckbuch und eine Anleitung. Der Master ist niemals ein Empfängerpaket. Importdateien sind kopierbar; Besitz entspricht keiner technisch durchsetzbaren Personenautorisierung. Prüfsummen über einen vertrauenswürdigen zweiten Kanal abgleichen.

Online bleiben `PELICAN_DB`, `CF_ACCESS_ISSUER` und `CF_ACCESS_AUD` erforderlich. Die API prüft die D1-Revisionsmarkierung und verweigert eine unpassende Datenbank mit 503. Alle aktiven Encode-/Decode-Grants gelten getrennt. Fehlerantworten enthalten keine internen Ausnahmen oder aufgelösten Sondergruppen.

Cloudflare-Bestandsaufnahme, echter Remote-Backup, Wiederherstellung in separater D1, Access-Schutz aller Domains, Migration echter Altstrukturen und Produktionsfreigabe sind verpflichtende offene Schritte. Siehe [DEPLOYMENT_AND_ROLLBACK.md](DEPLOYMENT_AND_ROLLBACK.md) und [VALIDATION.md](VALIDATION.md).

## Wartungsfassung vom 01.11.2026

Die Tafel heißt Sint Maarten. Oberfläche und API zeigen den korrigierten Namen auch bei alten importierten Dateien. Neue Empfängerdateien heißen `sint_maarten.book.json`, `sint_maarten.signals.json` und `sint_maarten.druckbuch.pdf`. Die interne ID `sint_maarte` bleibt erhalten, damit vorhandene Grants und Importe kompatibel bleiben. Keine Codezuordnung oder Kennsignale wurden geändert.

Der Decoder erhält führendes Unicode U+FEFF jetzt verlustfrei. Beim Import werden fehlende Statusfamilien/-werte, fehlender NONE-Zeitbezug und Kollisionen zwischen dem tafelspezifischen Fortsetzungspräfix und Seeraumcodes abgewiesen. Die Fortsetzungspräfixe anderer Tafeln werden unverändert verwendet; ND ist nicht für jede Tafel das tatsächliche Präfix. Das Funkformat bleibt SECURITY-RC2.

Der Offline-Browsertest akzeptiert optional `PELICAN_CHROMIUM_ARGS` als JSON-Liste für lokale Browserparameter. Diese Einstellungen betreffen ausschließlich Tests.

Cloudflare hat den sicheren Anmeldeversuch dieses Work-Browsers am 01.11.2026 mit einem Login-API-Fehler 403 abgewiesen. Solange die automatische Branch-Veröffentlichung und Access-Abdeckung unbekannt sind, wird kein Branch verschoben und kein Deployment ausgelöst. Ein vorbereiteter Git-Commit ohne Branchänderung ist keine veröffentlichte Anwendung.

Zusätzliche Online-Oberflächenkorrektur: verspätete Encode-/Decode-Antworten werden nach Tafelwechsel oder Leeren verworfen. Dadurch gelangen keine veralteten Gruppen unter das Kennsignal einer inzwischen gewählten anderen Tafel. Synthetische Browsertests prüfen normalen Betrieb sowie die Antwortreihenfolge; das ist kein Live-Access-Test.
