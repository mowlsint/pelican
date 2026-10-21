# PELICAN 1.5-DRAFT - UNIVERSAL PROGRAM CODE

**Ausschliesslich oeffentliche universelle Software, keine Geheimcodes.**

Diese Version basiert auf 1.4-RC1. Entwurfsstand, nicht produktiv einsetzen.

* `index.html`: Cloudflare Pages, Login/Grants mit Cloudflare Access / D1.
* `functions/api/index.js`: Authentifizierter D1-Adapter.
* `lib/pelican-core.mjs`: gemeinsamer Codier-/Decodierkern, ohne vertrauliche Codepaare.
* `offline.html`: echte Einzelseiten-Offline-HTML mit lokalem, fluechtigem Dateiupload, ohne Netzwerkrequests.
* `schema.sql`: nur oeffentliches Datenbankschema; keine Datensaetze.

## Betrieb / keine automatischen Aktionen

Private `*.book.json`, `*.signals.json`, PDF-Buecher und `PELICAN_1_5_D1_PRIVATE_*.sql` befinden sich AUSSCHLIESSLICH im getrennten Privatpaket. Vor SQL-Einsatz DB sichern; erst nach Freigabe Tests in Staging. Keine Actions/Deployments ausgeloest.

Der Webdecoder erhaelt keine Codetabellen im Browser. Die Offline-Datei nimmt beliebige Einzeltafeln und optional ihre Signaldatei entgegen. Offline-Pakete sind bei Weitergabe kopierbar; Besitz ist keine kryptografische Autorisierung.
