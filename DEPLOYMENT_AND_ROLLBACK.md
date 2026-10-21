# Kontrollierter Übergang und Rückfall

Stand 21.10.2026. **Keine produktive Umschaltung freigegeben oder ausgeführt.**

## Tatsächlich bekannte Basis

Repository: https://github.com/mowlsint/pelican

PR: https://github.com/mowlsint/pelican/pull/1

Produktiver GitHub-Basiscommit bei Bestandsaufnahme: `02476afa1953c0a1ef56413bf92c01a1ebb52c56`. Das beweist keinen Cloudflare-Deploymentstand. Pages-Projekt, produktive Domain, tatsächlicher Commit, D1-ID, Preview-Bindings und Access-AUD sind noch nicht aus dem Dashboard ermittelt. Der Cloud Browser zeigte eine Cloudflare-Anmeldeseite.

Keine Produktions- oder Preview-Domain, Datenbankbezeichnung oder UUID in diesem Dokument ist vorgegeben.

## Vor jeder Remote-Änderung

1. Im Dashboard das tatsächliche Projekt, GitHub-Repository, Produktionsbranch, Preview-Branchfilter, automatische Deployments und die letzte Deployment-ID erfassen. Unveröffentlichte Branches können Preview-Deployments auslösen; nicht als Zugriffsbarriere behandeln.
2. Die produktive D1 und das Binding `PELICAN_DB` erfassen; Preview muss eine separate D1 verwenden. Issuer/Audience für Produktion und Staging prüfen. Keine Produktiv-Daten in ungeschützte Vorschauen importieren.
3. Access vor dem Staging-Import für die konkrete Haupt-, pages.dev-, Preview- und Deployment-URL prüfen. Ohne Session müssen HTML und API abgewehrt werden. Danach mit freigegebenem Konto anmelden. Ein öffentlicher 200 für die statische HTML erfüllt die Access-Vorgabe nicht, auch wenn die API selbst JWT verlangt.
4. Vollständigen Remote-SQL-Export außerhalb des Repositorys erstellen: `npx wrangler d1 export "$PELICAN_PROD_DB" --remote --output "$PELICAN_PRIVATE_BACKUP"`. Namen und Pfade stammen aus der Bestandsaufnahme. Zusätzlich D1-Time-Travel-Bookmark dokumentieren, sofern verfügbar.
5. Export auf Fehler, Größe, Integrität und enthaltene Docs/Grants prüfen. In einer **neuen separaten** D1 wiederherstellen und Altanwendung sowie mindestens einen alten Grant testen. Erst dann gilt das Backup als remote wiederherstellbar. Ein lokaler SQLite-Test allein genügt nicht.

## Staging

- Eigenes Pages-Projekt oder nachweislich isolierte Preview-Umgebung mit eigener D1, gleichem JWT-Prüfprinzip und Access-Schutz aller erreichbaren Hosts.
- Echten alten Export einspielen. `schema.sql` ist idempotent; bestehende Grants nicht ersetzen. Nicht den RC2-Vollimport als Ersatz für die alte Datenbasis ausgeben.
- Private `PELICAN_1_5_D1_PRIVATE_MIGRATION_RC2.sql` aus dem Privatpaket verwenden. Die Datei enthält keine Grant-Schreiboperation. Explizite `BEGIN TRANSACTION`/`COMMIT` sind für Wrangler-D1-Dateiimporte entfernt. Remote-Batching und Fehlerverhalten bleiben real zu testen.
- Vollimport ausschließlich für eine neue Datenbank. Er ist kein vollständiger Produktionsbackup und enthält keine bisherigen Benutzerfreigaben.
- Nach Migration mit Barbados-only, Louisiana-only, beiden, Decode-only, Encode-only, inaktivem und nicht freigegebenem Benutzer prüfen. Die erforderlichen Testidentitäten müssen tatsächlich verfügbar sein; fehlende Identitäten als Lücke dokumentieren.
- Jede Tafel, alte Haupt-/ND-Nachrichten, RC2-Status/Referenz/Position/IMO/Unicode, falsches Kennsignal und direkten unberechtigten API-Aufruf prüfen. GET und Fehlerantworten auf private Zuordnungen prüfen.
- Aktuelle Grants vollständig mit dem Backup vergleichen; keine E-Mail-Adressen in öffentliche Testberichte oder CI schreiben.
- Netzwerkantworten für `*.book.json`, `*.signals.json`, private SQL/PDF/ZIP und Quellverzeichnisse dürfen keine privaten Bytes enthalten. Pages-SPA-Fallback kann statt 404 die universelle HTML liefern; Inhalt zusätzlich prüfen.

## Konkrete Produktionsfreigabe

Erst nach erfolgreichem Remote-Staging einen Freigabevorschlag mit tatsächlichem Commit, Deployment, Domains, D1-IDs, aktuellem Backup-Hash, Restore-Nachweis, Testergebnissen und Wartungsfenster vorlegen. Der Benutzer muss diese konkrete Umschaltung freigeben.

Empfohlene anschließend zu prüfende Reihenfolge:

1. Schreib-/Sendebetrieb im abgestimmten Wartungsfenster pausieren und letzte Änderungen an Grants erfassen. Erneuten verifizierten Backup erstellen.
2. Produktions-D1 migrieren, während die bisherige Anwendung noch bereitsteht. Der alte 1.4-Handler liest seine bisherigen Schlüssel weiter; diese Kompatibilität muss zuvor mit dem echten Staging-Export bestätigt sein.
3. Erst nach Datenprüfung PR nach `main` übernehmen und das verifizierte Pages-Deployment veröffentlichen. Bestehende Build-Einstellungen müssen `npm run build` / `dist` nutzen; geänderte Branch-Konfiguration nicht gleichzeitig unkontrolliert aktivieren.
4. RC2-HTML und RC2-Tafeln/Signaldateien gemeinsam an autorisierte Empfänger verteilen. Alte 1.5-Sondergruppen nicht mischen.
5. Live-Smoke-Tests über echten Access-Zugang durchführen und Freigabe dokumentieren.

## Rückfall

Vorab zwei Wege in Staging tatsächlich üben:

- **Anwendungsrückfall:** Pages auf die zuvor protokollierte Deployment-ID zurücksetzen. Nicht einen vermuteten Git-Commit mit dem tatsächlich ausgelieferten Deployment verwechseln. Die alte 1.4-Anwendung kann die ergänzte D1-Struktur lesen, sofern Staging dies bestätigt hat. RC2-Sondergruppen in dieser Phase nicht senden.
- **Datenrückfall:** Bei beschädigter Datenbasis Time Travel auf den protokollierten Bookmark zurücksetzen oder den vollständigen Remote-Export in eine separate Ersatz-D1 einspielen. Erst nach Integritäts-/Grantvergleich gezielt das Binding zurückschalten. Das kann nachträgliche Grant-Änderungen zurücknehmen; diese vorab sichern und kontrolliert wieder anwenden. Binding-Wechsel und Datenrückfall können einen erneuten Pages-Deploy benötigen; tatsächliche Umgebung entscheidet.

SQL-Import in die bestehende D1 ist ohne vorheriges Leeren kein exakter Restore, weil später hinzugefügte Schlüssel erhalten bleiben können. Deshalb Restore-Nachweis in einer neuen D1 oder dokumentiertes Time Travel verwenden. Lokale Wiederherstellung wurde geprüft; Remote-Restore und Produktionsrollback sind noch nicht ausgeführt.

## Primärquellen für die Verfahrensdetails

- https://developers.cloudflare.com/d1/best-practices/import-export-data/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/workers/wrangler/commands/pages/
- https://developers.cloudflare.com/pages/configuration/headers/

Die Offline-Datei setzt eine eigene CSP mit einem Hash ihres exakten Inline-Scripts und `connect-src 'none'`. `_headers` löst den allgemeinen CSP-Header nur für `/offline` und `/offline.html`; die Meta-CSP bleibt wirksam. Das vermeidet miteinander kollidierende CSP-Regeln und lässt die Ein-Datei-Anwendung ohne Netzwerk laufen. Andere statische Pfade behalten die strenge allgemeine CSP; API-Antworten setzen ihre eigenen Sicherheitsheader.
