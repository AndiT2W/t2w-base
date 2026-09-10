import json
def q(v): return "NULL" if not v else "'" + str(v).replace("'", "''") + "'"
j=json.load(open('invoice_customers.json',encoding='utf8'))
out=['BEGIN;']
for c in j['customers']:
    name=q(c['customer_name']); country=q(c['country']); city=q(c['city']); street=q(c['street']); postal=q(c['postal_code']); uid=q(c['uid']); email=q(c['email']); iban=q(c['iban']); bic=q(c['bic']); bank=q(c.get('bankName',''))
    out.append(f"DO $$ DECLARE oid uuid; cid uuid; BEGIN SELECT id INTO oid FROM \"Organizer\" WHERE lower(name)=lower({name}) AND coalesce(\"postalCode\",'')=coalesce({postal},'') LIMIT 1; IF oid IS NULL THEN INSERT INTO \"Organizer\" (id,name,type,active,country,city,street,\"postalCode\",uid,iban,bic,\"bankName\",email,\"createdAt\",\"updatedAt\") VALUES (gen_random_uuid(),{name},'ORGANISATION',true,{country},{city},{street},{postal},{uid},{iban},{bic},{bank},{email},now(),now()) RETURNING id INTO oid; END IF;")
    contact=(c.get('primary_contact') or '').strip()
    if contact:
        cn=q(contact)
        out.append(f"SELECT id INTO cid FROM \"Contact\" WHERE lower(name)=lower({cn}) LIMIT 1; IF cid IS NULL THEN INSERT INTO \"Contact\" (id,name,\"createdAt\",\"updatedAt\") VALUES (gen_random_uuid(),{cn},now(),now()) RETURNING id INTO cid; END IF; INSERT INTO \"OrganizerContact\" (\"organizerId\",\"contactId\") VALUES (oid,cid) ON CONFLICT DO NOTHING;")
    out.append('END $$;')
out.append('COMMIT;')
open('invoice_customer_import.sql','w',encoding='utf8').write('\n'.join(out))
