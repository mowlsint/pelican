# PELICAN 1.3-RC3 · GitHub + Cloudflare Pages

**Dieses GitHub-Paket enthaelt KEINE Codetafeln und KEINE Kennsignal-Zuordnungstafel.**

## Neue Regeln
- **Kennsignale wurden neu vergeben**. Die Zuordnung existiert ausschliesslich im gesonderten privaten Archiv und serverseitig in Cloudflare D1.
- Jede gedruckte Codetafel traegt nur ihren eigenen Namen und das jeweilige zweibuchstabige Fortsetzungspraefix. Die dreibuchstabige Funkkennung steht ausschliesslich auf einem separaten Zuordnungsblatt.
- Browser: die Signalzuordnung wird **nur fuer die freigegebenen Tafeln** aus D1 gelesen; nicht in `assets/app.js` hinterlegt.
- Encoder fuegt das Kennsignal einmal am Anfang und einmal am Ende hinzu, plus Punkt nach den im IMO-Alphabet gesprochenen Gruppen.
- Decoder akzeptiert weiterhin achtstellige Gruppen ohne Kennsignal. Wenn ein vollstaendiger Sendeblock mit identischem Kennsignal am Anfang und Ende eingefuegt wird, waehlt die API automatisch die passende **freigegebene** Tafel.
- Achtstellige Codepaare und Fortsetzungskennungen sind unveraendert.
- Multi-Line Eingabe mit Tab/Enter, Sammeldecodierung mit Strg+Enter bleibt erhalten.

## Update (bestehende Cloudflare-Installation)
1. Dateien aus **diesem** GitHub-Paket im Repository ersetzen. Keine PDFs oder privaten Daten in GitHub hochladen.
2. Die Datei `PELICAN_D1_MIGRATION_RC3_VERTRAULICH.sql` aus dem **privaten Archiv** verwenden. **Zuerst D1 sichern.**
3. Migration in Cloudflare D1 ausfuehren: `npx wrangler d1 execute pelican-secure --remote --file ./PELICAN_D1_MIGRATION_RC3_VERTRAULICH.sql` – ausserhalb des Git-Repositories.
4. GitHub/Pages neu deployen. Funktionstest mit berechtigtem Access-Login und mit mindestens zwei unterschiedlichen freigegebenen Tafeln.
5. Vor Livebetrieb: Sender- und Empfaengerseite auf die neuen Kennsignale umstellen. Die alten Kennsignale nicht weiterverwenden.

## Neuinstallation
1. Repository mit dem GitHub-Paket anlegen und ueber Cloudflare Pages deployen. Das Backend benoetigt `jose` aus `package.json`.
2. Cloudflare Access fuer eigene Domain, `pages.dev` und Vorschau-Deployments aktivieren (Allow nur fuer freigegebene Konten).
3. D1 Binding `PELICAN_DB`, Variablen `CF_ACCESS_ISSUER` und `CF_ACCESS_AUD` setzen.
4. `schema.sql` einmalig in D1 importieren.
5. Das **private** `PELICAN_D1_VOLLIMPORT_RC3_VERTRAULICH.sql` in D1 importieren, danach individuelle Grants freigeben.
6. Access- und Berechtigungspruefungen ausfuehren. Onlinezugang ohne erfolgreiche JWT-Pruefung und Grant ist gesperrt.

## Sicherheit
Private SQL- und Master-Dateien sowie die separate Zuordnungstafel niemals nach GitHub hochladen. Auch gedruckte oder weitergegebene Tafeln koennen kopiert werden. PELICAN bietet keine kryptografisch belastbare Geheimhaltung. Der sichtbare CONFIDENTIAL-Hinweis oder PDF-Metadaten sind keine zuverlaessige KI-Sperre.

Kein automatisches Deployment oder D1-Update wurde ausgefuehrt. Die vorhandenen Tabellen fuer Seeraeume, Objekte, Ereignisse, Admiralty und Zusatzzeichen sind nicht veraendert.
