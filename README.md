# PELICAN 1.3-RC2 · Cloudflare Pages (GitHub-sichere Fassung)

**ACHTUNG:** Diese Anwendung wird absichtlich **ohne** PELICAN-Codetafeln ausgeliefert. In dieses GitHub-Repository gehören nur die Dateien aus dem *GitHub-Paket*. Das separate private Paket mit Zuordnungen, SQL-Import und Masterdaten darf **niemals auf GitHub oder Cloudflare Pages als statische Dateien** hochgeladen werden. Auch nicht in ein privates GitHub-Repository, das mit einer Buildpipeline publiziert wird.

## Neu in RC2: mehrere Gruppen gleichzeitig decodieren
- Im Decoder eine **achtstellige Gruppe pro Zeile** eingeben; mehrere Hauptmeldungen und Zusatzgruppen werden erst nach **„Alle decodieren“** serverseitig verarbeitet.
- **Tab** innerhalb des Eingabefelds fügt einen Zeilenwechsel ein. Auch **Enter** wechselt die Zeile. **Strg+Enter** (Mac: Cmd+Enter) startet die gesamte Decodierung. **Shift+Tab** erlaubt weiterhin den normalen Tastatur-Fokuswechsel.
- Punkte am Ende einer achtstelligen Gruppe, z. B. `KQNIPJHA.`, dienen als TTS-Pausenzeichen und werden beim Decodieren als Trennzeichen akzeptiert.
- Die von der Software erzeugte **IMO-Sprachfassung** ergänzt nach jeder achtstelligen Gruppe und nach `LOU` einen Punkt, damit TTS-Systeme kurz pausieren können. Ein Punktsymbol gehört **nicht** zum PELICAN-Code.
- `ND`-Fortsetzungsgruppen (bei Louisiana) gehören weiterhin zur letzten Hauptmeldung und werden gemeinsam angezeigt.
- **Unveränderte Datenbasis:** Das bisherige private Cloudflare-D1-Paket aus 1.3 kann weiterverwendet werden; es müssen **keine** vertraulichen Codetabellen erneut importiert werden.

## Aufbau
- `index.html` und `assets/` – Benutzeroberfläche ohne Codezuordnungen.
- `functions/api/index.js` – serverseitige Codeauflösung; validiert Cloudflare-Access-JWT und überprüft individuelle Freigaben.
- `schema.sql` – Datenbankschema, ohne Geheimdaten.
- `package.json` – Laufzeitpaket `jose` für JWT-Prüfung.
- `_headers` – Cache- und Browser-Sicherheitsheader.

## Einrichtung
1. Eigenes GitHub-Repository für die **GitHub-Dateien** erstellen. **Nicht** die alte PELICAN-Offline-HTML-Datei hochladen.
2. In Cloudflare unter **Workers & Pages > Create application > Pages > Connect to Git** das Repository verbinden. Root-Verzeichnis `/`, Build command leer (bzw. `exit 0` falls erforderlich), Output directory `.` (Projektwurzel). Ein Release vor Access-Konfiguration darf keine funktionierende API haben; diese Version verweigert Anfragen ohne gültige Konfiguration.
3. Unter **Workers & Pages > D1** eine D1-Datenbank z. B. `pelican-secure` anlegen. `schema.sql` über Wrangler importieren: `npx wrangler d1 execute pelican-secure --remote --file ./schema.sql`.
4. In der Pages-Anwendung unter **Settings > Bindings > Add > D1 database** das Binding `PELICAN_DB` auf die erstellte D1-Datenbank setzen, danach neu deployen.
5. In **Zero Trust > Access controls > Applications** die PELICAN-Domain mit einer **Self-hosted application** schützen. `Allow` nur für individuell freigegebene E-Mail-Adressen und MFA/OTP oder deinen Identity Provider. **Ebenso die Produktions-`*.pages.dev`-URL sowie Preview-Deployments absichern**, damit kein ungeschützter alternativer Zugang bleibt. Bei Pages gibt es dafür gesonderte Regeln; siehe Cloudflare-Dokumentation.
6. In Cloudflare Access den **Application Audience (AUD) Tag** kopieren. In **Pages > Settings > Variables and Secrets** setzen: `CF_ACCESS_ISSUER=https://DEIN-TEAM.cloudflareaccess.com` und `CF_ACCESS_AUD=DEIN-AUD-TAG`. Kein Secret im HTML oder GitHub.
7. **Privates SQL** aus dem separat gelieferten vertraulichen Paket lokal verwenden: `npx wrangler d1 execute pelican-secure --remote --file ./PELICAN_D1_IMPORT_VERTRAULICH.sql`. Datei anschließend außerhalb des Git-Repositories aufbewahren.
8. Berechtigte E-Mail-Adressen in `pelican_grants` eintragen; Beispiel-SQL steht nur im **privaten Paket**. `can_encode`, `can_decode`, `active` steuern die Rechte für jede Tafel separat. Ohne Grant verweigert die API alle Abfragen.
9. Funktion testen: ohne Anmeldung 403/Login, mit Anmeldung aber ohne Grant 403, mit Grant ein Achtbuchstaben-Code; anschließend Sperren und erneut testen. Vor Live-Freigabe zusätzlich Start/Ende des Sendeblocks, Fortsetzungsgruppen und Zugriff auf alternative URLs testen.

## Cloudflare-Dokumentation
- Pages + D1: https://developers.cloudflare.com/pages/functions/bindings/
- Cloudflare Access: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/
- Access JWT: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- pages.dev-Schutz: https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain

## Sicherheitsgrenzen
- Das Backend enthält die Codetafeln. Veröffentlicht wird **nur** die Oberfläche.
- Zugriffskontrolle und Protokoll sind keine moderne Verschlüsselung; berechtigte Nutzer können Antworten sammeln und die Papiertefeln kopieren.
- Ein KI-Warntext, sichtbare/unsichtbare Wasserzeichen und PDF-Ablauf sind keine zuverlässige technische Sperre.
- Für behördliche Verschlusssachen und tatsächlich vertrauliche Kommunikation PELICAN ohne zusätzlich geprüfte Kryptografie nicht einsetzen.
- PELICAN 1.2-RC2 / 1.3 ist weiter eine Pilotfassung. NAVTEX-Servicegrenzen teilweise nicht unabhängig verifiziert.
- Automatische Rotation und eine Administrationsoberfläche sind **noch nicht implementiert**.
