# Wartungsfassung 01.11.2026

Anwendung 1.5.0-rc.2.1, unverändertes Funkformat 1.5-SECURITY-RC2.

- Sint Maarten in Online-/Offline-Anzeige und Druckbuch korrigiert; interne ID sint_maarte bleibt kompatibel.
- Führendes Unicode U+FEFF bleibt beim Decodieren erhalten.
- Import weist unvollständige Statuskarten und Fortsetzungs-/Seeraumpräfix-Kollisionen ab.
- Drei neue Regressionstests; bestehende Funktionen und private Zuordnungen bleiben erhalten.
- Lokale Migration gegen ursprünglichen 1.4-RC1-Vollimport geprüft; kein Produktionsexport.
- PR #1 ist bereits gemergt; Cloudflare-Login 403 verhindert Bestandsaufnahme, geschütztes Staging und Produktionsabnahme.
- Kein Branchwechsel oder Deployment ohne vorangehende Prüfung der Cloudflare-Autoveröffentlichung.

Zusätzliche Online-Oberflächenkorrektur: verspätete Encode-/Decode-Antworten werden nach Tafelwechsel oder Leeren verworfen. Dadurch gelangen keine veralteten Gruppen unter das Kennsignal einer inzwischen gewählten anderen Tafel. Synthetische Browsertests prüfen normalen Betrieb sowie die Antwortreihenfolge; das ist kein Live-Access-Test.
