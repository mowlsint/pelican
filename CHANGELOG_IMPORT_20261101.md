# Tafelimport – Wartung 1.5.0-rc.2.2

Wenn eine Tafel und ihr Kennsignal gleichzeitig eingelesen wurden, übernahm jeder Import einen eigenen Snapshot des bisherigen Bestands. Der später abgeschlossene Import konnte dadurch das Ergebnis des anderen verwerfen. Importe laufen jetzt in einer Warteschlange; der Snapshot wird erst beim Start des jeweiligen Vorgangs angelegt. Während der Prüfung sind Entladen, Tafelwechsel und Nachrichtenverarbeitung gesperrt.

Die nativen Dateifelder sind sichtbar und bedienbar. Importstatus und Fehler stehen direkt darunter. Die Oberfläche benennt die benötigte Edition und erklärt vertauschte Dateitypen, ZIP/PDF/Masterdaten und Editionskonflikte. JSON-Syntaxfehler geben keine Ausschnitte des Dateiinhalts aus. Ein Startdiagnosehinweis bleibt sichtbar, falls JavaScript nicht ausgeführt wird.

Codec, private Zuordnungen und Drahtformat bleiben unverändert bei `1.5-SECURITY-RC2`. Ältere DRAFT-Tafeln werden nicht automatisch umetikettiert oder zugelassen.

## Tatsächlich ausgeführte Prüfungen

- 16 Node-Tests und Syntaxprüfung bestanden.
- 32 Offline-Browserprüfungen mit allen fünf privaten Einzeltafeln bestanden; 0 HTTP-Anfragen, 0 Seitenfehler.
- Derselbe Lauf gegen die generierte Pages-Startdatei bestanden: 32 Prüfungen.
- 26 zusätzliche Importprüfungen mit synthetischen Tafeln in `file://`-Offline- und lokalem HTTP-Betrieb bestanden, einschließlich nativer Dateiauswahl und der beiden Reihenfolgen überlappender Importe; 0 externe Anfragen, 0 Seitenfehler.
- Getestet mit Chromium 153 auf Linux. Der konkrete Browser und die konkrete vom Benutzer ausgewählte Datei sind damit noch nicht geprüft.

Die Veröffentlichung erfolgt ausschließlich auf dem bereits öffentlichen Branch `public-pages` unter `/docs`. Cloudflare, D1, Access und `main` werden durch diese Korrektur nicht verändert. Rückfall: vorheriger Pages-Commit `ce9f6be6bbfe1d286e02aed8cef3076fa5b17fbd`, dessen Importfehler dann wieder gelten.
