import glob, json, os, re, unicodedata, html
from pypdf import PdfReader

ROOT = r'C:\work\t2w-base\raw\03_rechnungen'

def clean(s):
    s = html.unescape((s or '').replace('\u0000', ' '))
    replacements = {
        '\ufffdsterreich': 'Österreich',
        'Stra\ufffde': 'Straße', 'stra\ufffde': 'straße', 'M\ufffdhlbach': 'Mühlbach',
        'F\ufffdrderkreis': 'Förderkreis', 'Andr\ufffd': 'André', 'Gr\ufffdnbach': 'Grünbach',
        'H\ufffdglw\ufffdrth': 'Höglwörth', 'K\ufffdnig': 'König', 'V\ufffdcklabruck': 'Vöcklabruck',
        'L\ufffdufer': 'Läufer', '\ufffd': ''
    }
    for old, new in replacements.items(): s = s.replace(old, new)
    s = re.sub(r'\s+', ' ', s).strip(' ,')
    return s

def key(s):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFKD', s.lower()).encode('ascii','ignore').decode())

def text_for(path):
    return '\n'.join((p.extract_text() or '') for p in PdfReader(path).pages)

rows = {}
sources = []
for path in sorted(glob.glob(os.path.join(ROOT, '*.pdf'))):
    text = text_for(path)
    lines = [clean(x) for x in text.splitlines()]
    lines = [x for x in lines if x]
    m = re.search(r'RECHNUNG\s+(\d{6}(?:-\d+)?)', text, re.I)
    if not m:
        m = re.search(r'(\d{6}(?:-\d+)?)', os.path.basename(path))
    invoice = m.group(1) if m else ''
    date = (re.search(r'DATUM\s+(\d{2}\.\d{2}\.\d{4})', text, re.I) or [None,''])[1]
    customer = ''
    for i, line in enumerate(lines):
        if 'Kunde:' in line:
            customer = clean(line.split('Kunde:',1)[1]).split(' Kunde:',1)[0]
            break
    if not customer:
        for i, line in enumerate(lines):
            if 'Kunde:' in line:
                customer = clean(line.split('Kunde:',1)[1]); break
    if not customer:
        continue
    contact = ''
    for i, line in enumerate(lines):
        if line.lower().startswith('z.hd.'):
            contact = clean(line[5:]).split('Kunde:',1)[0].strip('- '); break
    idx = next((i for i,x in enumerate(lines) if 'Kunde:' in x), -1)
    addr = lines[idx+1:idx+5] if idx >= 0 else []
    addr = [x for x in addr if not re.search(r'RECHNUNG|Desselbrunn|UID:|POS|Zwischensumme', x, re.I)]
    country = ''
    for j, x in enumerate(addr):
        cm = re.search(r'\b(Österreich|Oesterreich|Deutschland|Italien|Schweiz)\b', x, re.I)
        if cm:
            country = clean(cm.group(1))
            addr[j] = x[:cm.start()].strip()
            addr = addr[:j+1]
            break
    postal = city = ''
    address_text = ' '.join(addr)
    mm = re.search(r'(.+?),\s*(\d{4,5})\s+([^,]+)', address_text)
    if mm:
        street, postal, city = [clean(x) for x in mm.groups()]
    else:
        street = ', '.join(addr)
    tail = text[text.lower().rfind('verwendungszweck'):]
    uidm = re.search(r'UID:\s*([A-Z]{2,3}\s?[A-Z0-9 -]+)', tail, re.I)
    uid = clean(uidm.group(1)) if uidm else ''
    if uid in ('-', '—'): uid = ''
    k = '|'.join([key(customer), key(street), key(postal), key(city)])
    row = rows.setdefault(k, {'customer_name':customer,'type':'ORGANISATION','country':country,'city':city,'street':street,'postal_code':postal,'uid':'','email':'','iban':'','bic':'','primary_contact':contact,'source_invoices':[],'source_files':[],'notes':''})
    if contact and not row['primary_contact']: row['primary_contact'] = contact
    if uid and uid not in row['uid']: row['uid'] = uid
    row['source_invoices'].append(invoice)
    row['source_files'].append(os.path.basename(path))
    sources.append({'invoice':invoice,'customer':customer,'file':os.path.basename(path)})

for row in rows.values():
    row['source_invoices'] = ', '.join(sorted(set(x for x in row['source_invoices'] if x)))
    row['source_files'] = ', '.join(sorted(set(row['source_files'])))
    if not row['country']: row['notes'] = 'Land nicht eindeutig aus Rechnung extrahiert'
    if not row['uid']: row['notes'] = (row['notes'] + '; ' if row['notes'] else '') + 'UID nicht vorhanden/unklar'

print(json.dumps({'customers':list(rows.values()),'invoice_count':len(sources),'customer_count':len(rows)}, ensure_ascii=False, indent=2))
