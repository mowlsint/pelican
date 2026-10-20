# PELICAN 1.4-RC1 · Cloudflare Pages · GitHub-ONLY

**Hier sind KEINE geheimen Codetafeln, Kennsignal-Mappings oder Migrationsdaten enthalten.**

## Neu

- Ereignis `MIL-EXERCISE-ANNOUNCED`: „Militärische Übung für künftigen Zeitpunkt angekündigt; Durchführung nicht bestätigt“.
- Die tatsächlichen zweibuchstabigen Ereigniscodes liegen ausschließlich in D1 und den persönlichen Papiercodetafeln.
- Vorherige Ereigniskennungen, See-/Objekt-/Admiralty-Codes, Zusatzpräfixe und die geheim verwalteten Funkkennungen DRJ / ABC / BCB / FOC / SCR werden **nicht geändert**. Ihre Zuordnung ist nur im vertraulichen Archiv enthalten.
- Ein angekündigter Übungstermin bedeutet NICHT, dass die Übung tatsächlich begonnen hat oder das Gebiet aktuell gesperrt ist.
- Exakte Zeiten, Daten und Warnnummern benötigen wie bisher `ND`-Ergänzungsgruppen (Louisiana).

## Cloudflare Update

1. Vorher D1 sichern. Für eine bestehende 1.3-RC3-Installation: Aus dem **privaten** Archiv die Datei `PELICAN_D1_MIGRATION_1_4_RC1_VERTRAULICH.sql` mit `wrangler d1 execute <DB-NAME> --remote --file <PFAD>` einspielen. **Nicht in GitHub ablegen!**
2. Dieses öffentliche GitHub-Paket in das Repository übernehmen. Der Pages-Workflow deployed nur Code, nicht die vertrauliche SQL.
3. Mit einem berechtigten Cloudflare-Access-Konto den neuen Katalogeintrag im Ereignisdropdown prüfen; eine echte End-to-End-Testmeldung kodieren und zurückdekodieren.
4. Bei alten Papier-/Offline-Clients den neuen Ereigniscode nicht verwenden, bis die neue Tafel zugestellt ist.

## Wichtige Semantik

Das Feld `event` ist ein **Ereignis**, kein universeller Statusmarker. Verallgemeinerte PRELIMINARY-/STATUS-Funktionen sind als Vorschlag in der privaten Dokumentation formuliert, noch nicht neu kodiert.

Cloudflare Access und D1-Grants müssen bereits sicher konfiguriert sein. Keine Deployment-/D1-Schreiboperation wurde automatisch vorgenommen. Das System ist ein codebasiertes Verschleierungsverfahren und keine belastbare kryptografische Verschlüsselung.
