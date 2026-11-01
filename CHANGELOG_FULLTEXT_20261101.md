# Volltext-Decodierung – 1.5.0-rc.2.3

Die öffentliche Station und die Offline-HTML zeigen decodierte Meldungen standardmäßig als lesbaren deutschen Volltext. Hauptfelder, Admiralty-Bewertung, Meldungs-ID, Referenz, Status und Zeitbezug sowie Akteure, Beziehungen, Länder, IMO, UTC, Positionen, Namen, Unicode und ND-Text werden dargestellt. Mehrere Meldungen bleiben getrennt. Ausgelassene Informationen werden nicht ergänzt. Die Ausgabe übersetzt technische Statusbezeichnungen, interpretiert aber keine ungesendeten Sachverhalte.

Der Formatter gehört zum gemeinsamen universellen Kern. Die Cloudflare-API liefert ergänzend `text`; der zugehörige Browseradapter zeigt diesen Text und bietet JSON als geschlossenen Detailbereich an. Bestehende JSON-Felder und das Drahtformat bleiben erhalten. Alle Texte werden über `textContent` eingefügt, damit übertragener HTML-Text nicht ausgeführt wird.

Prüfungen: 18 Node-Tests; 32 Offline-Browserprüfungen mit allen fünf privaten Tafeln und sichtbarem Volltext; 7 synthetische Browserprüfungen des getrennten API-Frontends einschließlich sicherer Textdarstellung und verworfener verspäteter Antworten. Die öffentliche Pages-Veröffentlichung und die Auslieferungsarchive erhalten denselben Stand. Der getrennte Cloudflare-/D1-Produktionsbetrieb wird dadurch nicht umgeschaltet.
