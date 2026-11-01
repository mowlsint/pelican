# Technischer Teststand SECURITY-RC2

01.11.2026. **Lokale Abnahme mit ausdrücklich offenen Remote-Prüfungen.**

| Prüfung | Tatsächliches Ergebnis |
|---|---|
| Node-Syntax für gemeinsamen Kern, API und Frontend | Bestanden |
| Pages-Functions-Bundle | Wrangler 4.151.3 kompiliert den Worker erfolgreich; kein Upload/Deployment |
| Automatisierte Node-Tests | 15 Testfälle bestanden; synthetische und private Tafeln separat ausgeführt |
| Alle Hauptbegriffe | 583 Begriffe je Tafel im Roundtrip; fünf Tafeln |
| Tafelpaare | Alle zehn auf Hauptfelder, ND, Status und Sondergruppen geprüft |
| Sondertransport | 676 Digraphen je Tafel vollständig vorwärts/rückwärts geprüft |
| Falsche Tafel / Kennsignal | Negative Prüfungen bestanden; rohe Hauptgruppen sind allgemein nicht eindeutig |
| Unicode | Deutsch, Polnisch, Walisisch, Kyrillisch, Chinesisch, Emoji und langer Text bestanden |
| Status/Referenz/Position/IMO | Positive und negative Prüfungen bestanden; ungültige Familie, Referenz, Datum, Grenze, Prüfziffer und doppelte Sonderdaten abgewiesen |
| Access-JWT und Grants lokal | Echte RS256-Signaturprüfung mit lokalem JWKS-Test; Issuer, Audience, Ablauf, fehlendes JWT, inaktiv, ohne Grant, Encode-only, Decode-only und fremde Tafel geprüft |
| API-Vertraulichkeit lokal | GET enthält keine Tafelzuordnungen; interne Fehlertexte werden nicht ausgeliefert |
| 1.4-Implementierung | Alter GitHub-Handler vom Basiscommit geprüft; 25 Nachrichten ergeben identische Haupt-/ND-Ausgabe und funktionieren in beide Decodierrichtungen |
| Gemeinsamer Offline-Kern | Exakter Vergleich und CSP-Scripthash bestanden |
| Browser-Offline-Test | 32 Prüfungen, erneut Chromium 153.0.8010.0, Linux file://, Offline-Kontext, 0 HTTP-Anfragen, 0 Seitenfehler |
| PDF | Fünf vollständige Bücher mit je 30 Seiten; 7.215 Zuordnungen mit JSON abgeglichen; Seitenlayout gerendert und geprüft |
| Lokale Migration | Originaler privater 1.4-RC1-Vollimport → RC2; 2.245 alte Hauptcodes, ND, Kennsignale und fünf Testgrants erhalten; wiederholbar |
| Lokaler Backup-Restore | SQLite-Backup in separate DB; Integrität und vollständiger Daten-/Grantvergleich bestanden |
| Tatsächliche alte Produktions-D1 | Noch nicht verfügbar, nicht geprüft |
| Remote-D1, Staging, Access-Domains | Nicht ausgeführt; Cloudflare-Login-API meldet 403 |
| Echtes Kokoro-Audio | Nicht ausgeführt; getestet ist der NATO-Sprechtext mit Pausenpunkten |
| Windows-Dateiöffnung | Nicht ausgeführt; Linux-Dateiöffnung nachgewiesen |
| Fachliche Endabnahme | 583 Katalogbegriffe bedürfen der fachlichen Abnahme; kein automatischer Test ersetzt diese |
| Globale Meldungs-ID-Eindeutigkeit | Kein globales Register implementiert; sechs Buchstaben allein garantieren keine globale Eindeutigkeit |
| Produktionsfreigabe / Merge | Keine Umschaltung in diesem Auftrag; PR #1 wurde bereits am 22.10.2026 gemergt |

## Behobene Befunde

1. Die frühere Sonderalphabet-Version war in allen zehn Paaren durch Buchstabensubstitution ableitbar. RC2 ersetzt sie durch unabhängig zufällige Digraphen-Permutationen. Keine alten 1.5-QW-/YY-Nachrichten als RC2 ausgeben.
2. Statuswerte werden auf ihre Familie geprüft; doppelte Sonderangaben und Selbstbeziehungen werden abgelehnt.
3. Beschädigte Katalog-/Tafelimporte werden strenger validiert. Mehrdateiimport erfolgt atomar; ein Fehler übernimmt keine halbe Auswahl.
4. Leere Signalblöcke und unvollständige Unicode-Gruppen werden abgelehnt. Unicode-Ersatz nicht gepaarter Surrogate wird verhindert.
5. API-Grenzen gelten auch für gestreamte Requests ohne Content-Length. Interne Datenfehler führen zu neutralen Antworten.
6. Unpassende Datenbankrevision wird vor Benutzung mit 503 abgewehrt.
7. Entladen entfernt Tafel, Signal und sichtbare Nachrichtenreste. Fehlgeschlagenes neues Encodieren lässt keinen alten Sendeblock als neues Ergebnis stehen.
8. Statische Auslieferung ist auf `dist` mit fester Positivliste begrenzt. Die Offline-CSP blockiert Netzverbindungen und erlaubt ausschließlich den bekannten Scriptinhalt.
9. Druckbücher werden vollständig aus den digitalen Zuordnungen erzeugt, einschließlich aller Status- und Sonderdaten.

## Nicht lösbare Mehrdeutigkeit bei unveränderten Hauptcodes

In acht von zehn Tafelvergleichen überschneiden sich die gültigen Codepaare in allen vier Hauptfeldern. Daher existieren Rohgruppen, die in zwei Tafeln gültig sind. Eine universelle Zurückweisung jeder falsch zugeordneten Rohgruppe ist mit diesen unveränderten Hauptcodes nicht nachweisbar. Oberfläche und Dokumentation weisen darauf hin. Nur Signalprüfung und der jeweils freigegebene Zugriff ordnen solche Sendeblöcke zuverlässig der konfigurierten Tafel zu; das ist keine kryptografische Absenderprüfung.

## Grenzen der bisherigen Migration

Die lokale Prüfung beginnt mit dem mitgelieferten SECURITY-RC-Vollimport. Das ist bereits eine 1.5-Struktur. Ein echter alter 1.4-Produktions-Export lag nicht vor. Der Test mit der echten alten 1.4-Software beweist Protokollkompatibilität für die geprüften Fälle, nicht die Remote-Migration aller Produktionsdaten. Diese Abgrenzung ist ein Freigabekriterium.

## Wiederholte Prüfung am 01.11.2026

15 Node-Testfälle mit synthetischen Daten und fünf echten RC2-Tafeln; 98 ursprüngliche Codec- und 55 Sondertransportassertions; zehn Unabhängigkeitsvergleiche; 32 file://-Browserprüfungen mit ausgeschaltetem Netzwerk und null HTTP-Anfragen/Seitenfehlern bestanden. Führendes U+FEFF, vollständige Statuskarten und ND-Präfixkollisionen sind durch neue Regressionstests abgedeckt. Die 1.4-Daten stammen aus dem ursprünglichen privaten Auslieferungsarchiv, ausdrücklich nicht aus der produktiven D1. Alle fünf aktuellen 30-Seiten-PDFs wurden neu erzeugt; 7.215 Codezuordnungen mit JSON verglichen, Titel und Schlussseiten gerendert und visuell geprüft. Haupt-/ND-/Status-/Sonderzuordnungen und Kennsignale stimmen mit dem früheren RC2-Master überein; nur der Anzeigename und Empfängerdateiname für Sint Maarten wurden berichtigt.

Die im historischen RC2-Bericht erwähnte noch fehlende Altstrukturprüfung ist damit lokal nachgeholt. Remote-Backup/-Restore, reale Access-Identitäten, geschütztes Staging, Windows und akustische Kokoro-Abnahme bleiben offen.

Zusätzliche Online-Oberflächenkorrektur: verspätete Encode-/Decode-Antworten werden nach Tafelwechsel oder Leeren verworfen. Dadurch gelangen keine veralteten Gruppen unter das Kennsignal einer inzwischen gewählten anderen Tafel. Synthetische Browsertests prüfen normalen Betrieb sowie die Antwortreihenfolge; das ist kein Live-Access-Test.
