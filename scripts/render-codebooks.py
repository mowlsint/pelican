#!/usr/bin/env python3
"""Render complete private receiver books. Input/output directories MUST stay outside GitHub.
Dependencies: reportlab, pypdf. Contains no private mappings.
"""
import argparse,json,re
from pathlib import Path
from io import BytesIO
from xml.sax.saxutils import escape
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate,Paragraph,Table,TableStyle,PageBreak,Spacer
from pypdf import PdfReader,PdfWriter
ap=argparse.ArgumentParser();ap.add_argument('books');ap.add_argument('output');ap.add_argument('--digraph-pages');args=ap.parse_args()
fontroot=Path('/usr/share/fonts/truetype/dejavu');pdfmetrics.registerFont(TTFont('DV',str(fontroot/'DejaVuSans.ttf')));pdfmetrics.registerFont(TTFont('DVB',str(fontroot/'DejaVuSans-Bold.ttf')))
styles=getSampleStyleSheet();styles.add(ParagraphStyle(name='BodyDV',fontName='DV',fontSize=9,leading=13,spaceAfter=8));styles.add(ParagraphStyle(name='CellDV',fontName='DV',fontSize=8,leading=11));styles.add(ParagraphStyle(name='HeadDV',fontName='DVB',fontSize=18,leading=23,textColor=colors.HexColor('#102633'),spaceAfter=16));styles.add(ParagraphStyle(name='SubDV',fontName='DVB',fontSize=12,leading=16,spaceAfter=10))
P=lambda text,style='BodyDV':Paragraph(escape(str(text)).replace('\n','<br/>'),styles[style])
out=Path(args.output);out.mkdir(parents=True,exist_ok=True)

def digraph_page(b):
 from reportlab.pdfgen import canvas
 from reportlab.lib.colors import HexColor
 W,H=A4;abc='ABCDEFGHIJKLMNOPQRSTUVWXYZ';buf=BytesIO();c=canvas.Canvas(buf,pagesize=A4)
 c.setFillColor(HexColor('#102633'));c.rect(0,H-106,W,106,fill=1,stroke=0);c.setFillColor(HexColor('#dbbe74'));c.setFont('Helvetica-Bold',17);c.drawString(38,H-40,'PELICAN 1.5 - SECURITY-RC2')
 c.setFillColorRGB(1,1,1);c.setFont('Helvetica-Bold',12);c.drawString(38,H-62,b['table_name']);c.setFont('Helvetica',9);c.drawString(38,H-82,'VERTRAULICH - private Digraphentafel - Anhang fuer Sondergruppen')
 c.setFillColor(HexColor('#102633'));c.setFont('Helvetica-Bold',11);c.drawString(38,H-131,'QW- und YY-Gruppen: drei Buchstabenpaare ersetzen')
 lines=['Die ersten zwei Buchstaben QW / YY bleiben unveraendert. Die sechs folgenden',
        'Buchstaben werden in drei Paare geteilt. Fuer jedes Klarpaar: erster Buchstabe',
        'bestimmt die Zeile, zweiter die Spalte; der Tabellenwert ist das Sendepaar.',
        'Beim Decodieren das Sendepaar in der Tabelle suchen; Zeile + Spalte ergeben',
        'das Klarpaar. Erst danach Position / IMO / UTF-8 samt CRC16 auswerten.']
 c.setFont('Helvetica',9)
 for i,line in enumerate(lines):c.drawString(38,H-149-13*i,line)
 x0,y0,cw,rh=47,H-235,18.4,15
 c.setFont('Courier-Bold',9)
 for j,a in enumerate(abc):c.drawCentredString(x0+(j+1)*cw,y0,a)
 for i,a in enumerate(abc):
  y=y0-(i+1)*rh
  if i%2==0:c.setFillColor(HexColor('#eef2f4'));c.rect(x0+cw/2,y-3,26.5*cw,rh,fill=1,stroke=0)
  c.setFillColor(HexColor('#102633'));c.setFont('Courier-Bold',9);c.drawCentredString(x0,y,a);c.setFont('Courier',8)
  for j in range(26):c.drawCentredString(x0+(j+1)*cw,y,b['special_cipher']['pairs'][i*26+j])
 y=155;c.setFont('Helvetica-Bold',10);c.drawString(38,y,'Revisions- und Verteilungshinweise');c.setFont('Helvetica',9)
 for i,line in enumerate(['Nur mit Software und digitaler Einzeltafel SECURITY-RC2 verwenden.',
  'QW-/YY-Nachrichten aelterer 1.5-Entwuerfe sind damit nicht austauschbar.',
  'Hauptcodes, ND-Fortsetzungen, Statuscodes und Kennsignale bleiben erhalten.',
  'Kennsignale separat verteilen. Ohne Kennsignal ist die Tafel nicht eindeutig.',
  'Codebuch zur Verschleierung. Keine kryptografisch sichere Verschluesselung.']):c.drawString(38,y-19-13*i,line)
 c.setFont('Helvetica',8);c.drawString(38,34,'MOwlSINT PELICAN | SECURITY-RC2 | nur an autorisierte Empfaenger');c.drawRightString(W-38,34,'Anhang');c.save();return PdfReader(BytesIO(buf.getvalue())).pages[0]

for path in sorted(Path(args.books).glob('*.book.json')):
 b=json.loads(path.read_text());b['table_name']='Sint Maarten' if b['table_id'] in ('sint_maarte','sint_maarten') else b['table_name'];buf=BytesIO();story=[]
 def table(head,rows,widths):
  data=[[P(x,'CellDV') for x in head]]+[[P(x,'CellDV') for x in row] for row in rows]
  t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),colors.HexColor('#dce5e9')),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#f1f4f6')]),('VALIGN',(0,0),(-1,-1),'TOP'),('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),('LINEBELOW',(0,0),(-1,0),.6,colors.HexColor('#718794'))]));story.append(t)
 story+=[P('MOwlSINT · PELICAN','HeadDV'),P(b['table_name'],'HeadDV'),P('1.5-SECURITY-RC2 · VERTRAULICH','SubDV'),P('Private Empfänger-Codetafel. Nur diese zugewiesene Tafel weitergeben. Kennsignale sind nicht enthalten; sie werden separat verteilt.'),P('Betrieb','SubDV')]
 for text in ['Offline: offline.html öffnen, eigene .book.json importieren und die separate .signals.json laden. Alle Daten bleiben im Arbeitsspeicher. Zum Entfernen „Tafel entladen“ wählen.',
  'Jede Hauptgruppe hat acht Buchstaben: Seeraum (2), Objekt (2), Ereignis (2), Admiralty (2). Fortsetzungen und Sondergruppen folgen der zugehörigen Hauptgruppe.',
  'Kennsignal einmal vor und einmal nach dem Sendeblock. Ohne Kennsignal ist die Tafel nicht eindeutig geprüft: Hauptgruppen können in mehreren Tafeln gültig sein.',
  'Alle Begriffe und Funkzuordnungen dieses Buchs stammen aus der zugehörigen digitalen RC2-Einzeltafel. Kennsignal und fremde Tafeln sind ausgeschlossen.',
  'QW und YY verwenden die neue private Digraphentafel im Anhang. Ältere 1.5-Sondergruppen sind nicht kompatibel. Hauptcodes, ND und Status bleiben erhalten.',
  'PELICAN ist ein Codebuch zur Verschleierung. Es bietet keine kryptografisch sichere Verschlüsselung. Inhalt, Quelle und Admiralty-Bewertung fachlich prüfen.']:
  story.append(P(text))
 for key,title in [('sea','01 · Seeraum'),('object','02 · Objekt'),('event','03 · Ereignis'),('admiralty','04 · Admiralty')]:
  story+=[PageBreak(),P(title,'HeadDV')]
  table(['Code','Kennung','Bedeutung'],[(b['sections'][key][x['id']],x['id'],x.get('de') or x.get('en') or x['id']) for x in b['catalog'][key]],[38,172,305])
 story+=[PageBreak(),P('05 · ND-Fortsetzungen','HeadDV'),P('Präfix '+b['extension']['prefix']+' plus drei Zeichencodes zu je zwei Buchstaben. PAD nur am Ende. Lange Worttoken werden vor einzelnen Zeichen verwendet. ND normalisiert Text in Großbuchstaben; UTF-8 transportiert die Originalschreibweise verlustfrei.')]
 symbols={x['id']:x for x in b['symbols']}
 rows=[]
 for ident,code in b['extension']['tokens'].items():
  item=symbols.get(ident,{});v=item.get('value','');display='[Füllzeichen]' if ident=='PAD' else '[Leerzeichen]' if v==' ' else repr(v)[1:-1] if v.strip()=='' else v
  rows.append((code,ident,display,item.get('type','padding')))
 table(['Code','Token-ID','Zeichen / Wort','Art'],rows,[38,140,247,90])
 story+=[PageBreak(),P('06 · Status und Referenzen','HeadDV')]
 st=b['status_protocol'];table(['Funktion','Präfix'],st['prefixes'].items(),[425,90])
 story.append(P('Eigene ID und Referenz bestehen aus sechs Buchstaben. Referenz benötigt eine eigene, abweichende ID. UPDATE, CORRECTION, RETRACTION, EXTENDED, RESCHEDULED, POSTPONED und CANCELLED erfordern eine Referenz. IDs sind kein global garantiert eindeutiges Register.'))
 for k,title in [('families','Statusfamilie'),('statuses','Statuswert'),('time_qualifiers','Zeitbezug')]:
  story+=[Spacer(1,12),P(title,'SubDV')];table(['Kennung','Code'],st[k].items(),[425,90])
 story+=[PageBreak(),P('07 · Sondergruppen und Unicode','HeadDV')]
 for text in ['Akteure: Kennung A bis Z. A kann das Hauptobjekt bezeichnen. QW-A bezeichnet einen weiteren Akteur mit Objektcode und Länderkennung. QW-E codiert eine Beziehung zu einem zweiten Akteur; der Zeitbezug unterscheidet zuvor, zeitgleich, danach und unbekannt.',
  'QW-L übermittelt eine Länderrolle. QW-I und QW-J transportieren eine siebenstellige IMO-Nummer mit Prüfziffer. QW-T in drei Gruppen transportiert UTC als Jahr, Monat, Tag, Stunde und Minute.',
  'Position: QW-O enthält Akteur, Datum W (WGS84) oder U (unbekannt) und Genauigkeit A/B/C/U. Vier QW-P-Gruppen folgen für Breite, Hundertstel, Länge und Hundertstel. Grad und Minuten liegen innerhalb gültiger Grenzen.',
  'QW-N transportiert die Länge nachfolgender ND-Namensgruppen. YY transportiert beliebige UTF-8-Zeichen: Textart N (Eigenname), P (Ortsname), L (Freitext), R (Referenztext), D (Dokumentenkennung). Länge in Bytes; drei Bytes pro Datengruppe; am Ende CRC16-CCITT-FALSE über Textart, Akteur und Bytes.',
  'Vor dem Senden der QW-/YY-Gruppen die sechs Nutzbuchstaben in drei Paare teilen und mit der privaten Digraphentafel ersetzen. Die ersten zwei Buchstaben QW / YY bleiben sichtbar. Beim Empfang erst rückwärts umsetzen, danach fachlich decodieren.',
  'Sonderdaten als JSON-Liste: Typen actor, relation, country, imo, utc, position, name und unicode. Die Software prüft Prüfziffer, Bereiche, Länge, UTF-8, CRC, Referenzen, Statusfamilie und doppelte Sonderdaten.',
  'Kokoro: ALFA, BRAVO, CHARLIE, DELTA, ECHO, FOXTROT, GOLF, HOTEL, INDIA, JULIETT, KILO, LIMA, MIKE, NOVEMBER, OSCAR, PAPA, QUEBEC, ROMEO, SIERRA, TANGO, UNIFORM, VICTOR, WHISKEY, X-RAY, YANKEE, ZULU. Satzpunkt nach jeder Gruppe.',
  'Keine automatische Online-Nachladung. Importierte Dateien sind kopierbar; Besitz ist keine kryptografische Autorisierung. Empfänger müssen dieselbe Revision nutzen.']:
  story.append(P(text))
 def footer(c,doc):
  c.setFont('DV',7);c.setFillColor(colors.HexColor('#526875'));c.drawString(40,25,'PELICAN · '+b['table_name']+' · SECURITY-RC2 · VERTRAULICH');c.drawRightString(A4[0]-40,25,str(doc.page))
 doc=SimpleDocTemplate(buf,pagesize=A4,leftMargin=40,rightMargin=40,topMargin=42,bottomMargin=42);doc.build(story,onFirstPage=footer,onLaterPages=footer)
 writer=PdfWriter();reader=PdfReader(BytesIO(buf.getvalue()))
 for page in reader.pages:writer.add_page(page)
 writer.add_page(PdfReader(Path(args.digraph_pages)/(b['table_id']+'.pdf')).pages[0] if args.digraph_pages else digraph_page(b));writer.add_metadata({'/Title':'PELICAN SECURITY-RC2 - '+b['table_name'],'/Subject':'Complete private receiver book without signal'})
 target=out/(('sint_maarten' if b['table_id']=='sint_maarte' else b['table_id'])+'.druckbuch.pdf')
 with target.open('wb') as f:writer.write(f)
 printed='\n'.join(x.extract_text() for x in PdfReader(target).pages)
 for k in b['sections']:
  for item in b['catalog'][k]:assert item['id'] in printed
 print(b['table_id'],len(writer.pages),'pages;',sum(len(v) for v in b['sections'].values()),'catalogue IDs printed')
