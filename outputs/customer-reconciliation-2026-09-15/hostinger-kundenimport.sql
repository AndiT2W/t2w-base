-- Generated from t2w-kundenstamm-abgeglichen.xlsx on 2026-09-15T20:43:49.965Z.
-- Imports the 123 reconciled invoice customers into the t2w-base Organizer/Contact model.
-- This file intentionally does not contain invoice PDFs, bank-statement data, or credentials.

BEGIN;
LOCK TABLE "Organizer", "Contact", "OrganizerContact" IN SHARE ROW EXCLUSIVE MODE;

CREATE TEMP TABLE customer_import (
  source_id integer PRIMARY KEY,
  name text NOT NULL,
  type "OrganizerType" NOT NULL,
  country text NOT NULL,
  city text NOT NULL,
  street text NOT NULL,
  postal_code text NOT NULL,
  uid text NOT NULL,
  iban text NOT NULL,
  bic text NOT NULL,
  bank_name text NOT NULL,
  email text NOT NULL,
  primary_contact text NOT NULL,
  legacy_name text NOT NULL
) ON COMMIT DROP;

INSERT INTO customer_import (
  source_id, name, type, country, city, street, postal_code, uid, iban, bic, bank_name, email, primary_contact, legacy_name
) VALUES
  ('1', 'Tonstudio & EDV-Dienstleistungen', 'ORGANISATION', 'Österreich', 'Edt bei Lambach', 'Gnadlingerweg 7', '4650', '', '', '', '', '', 'Markus Lindinger', ''),
  ('2', 'Tourismusverband Schladming-Dachstein', 'ORGANISATION', 'Österreich', 'Schladming', 'Ramsauerstraße 756', '8970', 'ATU77352339', '', '', '', '', 'Belinda Wieser', ''),
  ('3', 'SILBERPFEIL-1934 Energy Handels GmbH & Co. KG', 'ORGANISATION', 'Österreich', 'Salzburg', 'Mattseer Straße 3', '5020', 'ATU71854727', '', '', '', '', '', ''),
  ('4', 'LC MKW Hausruck', 'ORGANISATION', 'Österreich', 'Geboltskirchen', 'Schlossweg 16', '4682', '', '', '', '', '', '', ''),
  ('5', 'Förderkreis der SpVgg Lam e.V.', 'ORGANISATION', 'Deutschland', 'Lam', 'Im Moos 15', '93462', '', '', '', '', '', 'André Purschke', 'F�rderkreis der SpVgg Lam e.V.'),
  ('6', 'NMC GmbH', 'ORGANISATION', 'Österreich', 'Salzburg', 'Felix-Dahn-Strasse 1a', '5020', 'ATU60937455', '', '', '', '', 'Roland Kurz', ''),
  ('7', 'Arthurhaus-Radacher GmbH&CoKG', 'ORGANISATION', 'Österreich', 'Mühlbach am Hochkönig', 'Mandlwandstraße 105', '5505', 'ATU35398404', '', '', '', '', 'Peter Raddacher', ''),
  ('8', 'Sport und Event Agentur Leitner', 'ORGANISATION', 'Österreich', 'Linz', 'Piringerhofstraße 23', '4020', 'ATU71131704', '', '', '', '', 'Stefan Leitner', ''),
  ('9', 'P3 Event GmbH', 'ORGANISATION', 'Österreich', 'Fieberbrunn', 'Pfaffenschwendt 28', '6391', 'ATU72567457', '', '', '', '', 'Marije Moors', ''),
  ('10', 'Tamara Brieler-Reiter', 'PERSON', 'Österreich', 'Gußwerk', 'Johannesplatz 2', '8632', '', '', '', '', '', 'Tamara Brieler-Reiter', ''),
  ('11', 'SkibergsteigerClub Altenmarkt', 'ORGANISATION', 'Österreich', 'Altenmarkt', 'Sportplatzstraße 19', '5541', '', '', '', '', '', 'Franz Pfeiler', ''),
  ('12', 'Johann Prangl', 'PERSON', 'Österreich', 'Gmunden', 'Grünbergweg 4', '4810', 'ATU64734826', '', '', '', '', 'Johann Prangl', ''),
  ('13', 'floro Sport& Events', 'ORGANISATION', 'Österreich', 'Gmunden', 'Freiwillige Schützenstraße 10', '4810', '', '', '', '', '', 'Florian Werner', ''),
  ('14', 'Skiunion Pettenbach', 'ORGANISATION', 'Österreich', 'Pettenbach', 'Weidenhaidstrasse 8', '4643', '', '', '', '', '', 'Stefan Mayer', ''),
  ('15', 'Manaröl Sport Nordic', 'ORGANISATION', 'Schweiz', 'Scuol', 'Via da Manaröl 602', '7550', '', '', '', '', '', 'Xaver Frieser', 'Manar�l Sport Nordic'),
  ('16', 'DAV Berchtesgaden', 'ORGANISATION', 'Deutschland', 'Bischofswiesen', 'Watzmannstrasse 4', '83483', '', '', '', '', '', 'Gabi Schieder-Moderegger', ''),
  ('17', 'TIQA Werbe- & Marketinggesellschft mbH', 'ORGANISATION', 'Österreich', 'Leoben', 'Fischergasse 12', '8700', 'ATU62995423', '', '', '', '', 'Katharina Schellnegger', ''),
  ('18', 'Benjamin Böhner', 'PERSON', 'Schweiz', 'Pfäffikon', 'Rietbrunnen 2', '8808', '', '', '', '', '', 'Benjamin Böhner', ''),
  ('19', 'Gierlinger Sport Services', 'ORGANISATION', 'Österreich', 'St. Florian am Inn', 'Bubing 78', '4782', '', '', '', '', '', 'Jakob Gierlinger', ''),
  ('20', 'Trailabenteuer - Verein für Outdoor- und Natursport', 'ORGANISATION', 'Österreich', 'Linz', 'Bahrgasse 13', '4020', '', '', '', '', '', 'Mag. Christoph Hain', 'Trailabenteuer - Verein f�r Outdoor- und Natursport'),
  ('21', 'Boardplay Projects', 'ORGANISATION', 'Österreich', 'Westendorf', 'Ried 115', '6363', '', '', '', '', '', 'Reinhard Gossner', ''),
  ('22', 'Aloha Project GmbH', 'ORGANISATION', 'Österreich', 'Linz', 'Piringerhofstraße 23', '4020', 'ATU82726301', '', '', '', '', 'Stefan Leitner', ''),
  ('23', 'ALV Sextner Dolomiten', 'ORGANISATION', 'Italien', 'Sexten', 'Dolomitenstr. 45', '39030', 'IT02719950210', '', '', '', '', 'Fabian Watschinger', ''),
  ('24', 'Zobl IT', 'ORGANISATION', 'Österreich', 'Attnang-Puchheim', 'Puchheimer Straße 29', '4800', '', '', '', '', '', 'Jonas Zobl', ''),
  ('25', 'Arben Hallac', 'PERSON', 'Österreich', 'Lambach', 'Schubertstraße 2', '4650', 'ATU69243204', '', '', '', '', 'Arben Hallac', ''),
  ('26', 'Verein The Sesh e.V.', 'ORGANISATION', 'Österreich', 'Axams', 'Olympiastraße 18c', '6094', '', '', '', '', '', 'Mario Pesl', ''),
  ('27', 'Emo Tirol', 'ORGANISATION', 'Österreich', 'Silz', 'Franz-Jais-Weg 11/1A', '6424', 'ATU77692828', '', '', '', '', 'Lukas Kocher', ''),
  ('28', 'SVG Jenbach-ZWV Wintersport', 'ORGANISATION', 'Österreich', 'Jenbach', 'Am Sportplatz 4a', '6200', '', '', '', '', '', 'Maximilian Wilfling', ''),
  ('29', 'Dachstein Tourismus AG', 'ORGANISATION', 'Österreich', 'Gosau', 'Gosauseestraße 52', '4824', 'ATU67291646', '', '', '', '', 'Bettina Plank', ''),
  ('30', 'Freimüller Handels GmbH', 'ORGANISATION', 'Österreich', 'Gmunden', 'Bahnhofstraße 54', '4810', 'ATU64563109', '', '', '', '', '', ''),
  ('31', 'KNOX Versicherungsmanagement GmbH', 'ORGANISATION', 'Österreich', 'Innsbruck', 'Resselstraße 33', '6020', '', '', '', '', '', '', ''),
  ('32', 'time2finish GbR', 'ORGANISATION', 'Deutschland', 'Schlaitdorf', 'Jusiweg 8', '72667', 'DE273990652', '', '', '', '', '', ''),
  ('33', 'Tourismusverband Seefeld', 'ORGANISATION', 'Österreich', 'Seefeld', 'Bahnhofsplatz 115', '6100', 'ATU56693778', '', '', '', '', 'Mag. (FH) Elias Walser', ''),
  ('34', 'TuS Kremsmünster, Sektion Leichtathletik & FitSport', 'ORGANISATION', 'Österreich', 'Kremsmünster', 'Grüntaler Straße 17', '4550', '', '', '', '', '', 'Oliver Kratochvil', 'TuS Kremsm�nster, Sektion Leichtathletik & FitSport'),
  ('35', 'Trailfuxn Running-Team', 'ORGANISATION', 'Österreich', 'Gmunden', 'Laudachseestraße 70', '4810', '', '', '', '', '', 'Matthias Schiller', ''),
  ('36', 'Andreas Neubauer', 'PERSON', 'Österreich', 'Linz', 'Kaisergasse 12-14', '4020', '', '', '', '', '', '', ''),
  ('37', 'Union Schlatt', 'ORGANISATION', 'Österreich', 'Schlatt', 'Schlatt 58', '4691', '', '', '', '', '', 'Mario Speigner', ''),
  ('38', 'Roundtable 46 Eferding Donautal', 'ORGANISATION', 'Österreich', 'Eferding', 'Stadtplatz 35', '4070', '', '', '', '', '', 'Fabian Eichhorn', ''),
  ('39', 'Tourismusverband Obertauern', 'ORGANISATION', 'Österreich', 'Obertauern', 'Pionierstraße 1', '5562', '', '', '', '', '', 'Florian Rauter', ''),
  ('40', 'LCAV Jodl Packaging', 'ORGANISATION', 'Österreich', 'Redlham', 'Fisching 5', '4846', '', '', '', '', '', 'Walter Regl', ''),
  ('41', 'Multikraft Produktions- und HandelsgmbH', 'ORGANISATION', 'Österreich', 'Pichl bei Wels', 'Sulzbach 17', '4632', 'ATU61462508', '', '', '', '', '', ''),
  ('42', 'TSV Mattighofen 1889', 'ORGANISATION', 'Österreich', 'Mattighofen', 'Jahnstrasse 8a', '5230', '', '', '', '', '', 'Josef Hartl', ''),
  ('43', 'MARKTGEMEINDE THALHEIM', 'ORGANISATION', 'Österreich', 'Thalheim bei Wels', 'Gemeindeplatz 1', '4600', '', '', '', '', '', '', ''),
  ('44', 'Somaland - Konzept.agentur.netzwerk', 'ORGANISATION', 'Österreich', 'Innsbruck', 'Leopoldstrasse 24/1', '6020', '', '', '', '', '', 'Mario Pesl', ''),
  ('45', 'ASKÖ Hallstatt', 'ORGANISATION', 'Österreich', 'Hallstatt', 'Eisl Gasse 140', '4830', '', '', '', '', '', 'Charly Trausner', 'ASK� Hallstatt'),
  ('46', 'Gert Aumayr', 'PERSON', 'Österreich', 'Spielberg', 'Ahornstraße 10', '8724', '', '', '', '', '', 'Tri Team Murtal', ''),
  ('47', 'SPORTUNION Rainbach - Sektion Bike & Run', 'ORGANISATION', 'Österreich', 'Rainbach', 'Birkengasse 1', '4261', '', '', '', '', '', 'Christoph Tröls', ''),
  ('48', 'Triathlon ATSV Braunau', 'ORGANISATION', 'Österreich', 'Braunau am Inn', 'Kranewikttweg 5', '5280', '', '', '', '', '', 'Nicole Jankowski', ''),
  ('49', 'R.I. Verputz-Technik OG', 'ORGANISATION', 'Österreich', 'Gunskirchen', 'Lilienstraße 10', '4623', 'ATU63450018', '', '', '', '', '', ''),
  ('50', 'inovent gmbh', 'ORGANISATION', 'Österreich', 'Altmünster', 'Hatschekstraße 7', '4813', 'ATU71231419', '', '', '', '', 'Axel Bammer', ''),
  ('51', 'MKW Kunststofftechnik GmbH', 'ORGANISATION', 'Österreich', 'Weibern', 'Jutogasse 3', '4675', 'ATU47352804', '', '', '', '', '', ''),
  ('52', 'LG St. Wolfgang', 'ORGANISATION', 'Österreich', 'St. Wolfgang', 'Windhag 18', '5360', '', '', '', '', '', 'Werner Haas', ''),
  ('53', 'ASK Raiffeisen Gosau', 'ORGANISATION', 'Österreich', 'Gosau', 'Gosau 623', '4824', '', '', '', '', '', 'Karl Posch', 'ASK� Raiffeisen Gosau'),
  ('54', 'Sparkasse Neuhofen Bank Aktiengesellschaft', 'ORGANISATION', 'Österreich', 'Neuhofen', 'Marktplatz 18', '4501', '', '', '', '', '', 'Daniel Krawinkler', ''),
  ('55', 'Union Sport STREICHER Seewalchen', 'ORGANISATION', 'Österreich', 'Seewalchen', 'Ainwalchen 15/2', '4863', '', '', '', '', '', 'Tom Streicher', ''),
  ('56', 'RED BULL MEDIA HOUSE GMBH', 'ORGANISATION', 'Österreich', 'Wals bei Salzburg', 'Oberst-Lepperdinger-Straße 11-15 Projektnummer IO 80Z_932WRN', '5071', '', '', '', '', '', 'Servus TV / Angi von Thun', ''),
  ('57', 'Red Bull GmbH', 'ORGANISATION', 'Österreich', 'Fuschl am See', 'Am Brunnen 1', '5330', '', '', '', '', '', 'Lukas Auer', ''),
  ('58', 'Run&More Laufclub Laakirchen', 'ORGANISATION', 'Österreich', 'Laakirchen', 'Langthalerstraße 17', '4664', '', '', '', '', '', 'Bianca Spitzer', ''),
  ('59', 'Tourismusverband Villach GmbH', 'ORGANISATION', 'Österreich', 'Villach', 'Bahnhofstraße 3', '9500', '', '', '', '', '', 'Michael Sternig', ''),
  ('60', 'TSV 1862 Bad Reichenhall e.V.', 'ORGANISATION', 'Deutschland', 'Bad Reichenhall', 'Postfach 1164', '83435', '', '', '', '', '', 'Boris Bregar', ''),
  ('61', 'Union Weibern - Sektion Radfahrverein Weibern', 'ORGANISATION', 'Österreich', 'Weibern', 'Meginhardgasse 4', '4675', '', '', '', '', '', 'Jakob Eibelhuber', ''),
  ('62', 'ASV Sport OK Toblach', 'ORGANISATION', 'Italien', 'Toblach', 'Seeweg 16', '39034', '', '', '', '', '', 'Gregor Sieder', ''),
  ('63', 'LRC Union Vorchdorf', 'ORGANISATION', 'Österreich', 'Vorchdorf', 'Fichtenweg 8', '4655', '', '', '', '', '', 'Petra Laherstorfer', ''),
  ('64', 'Sportverein Rinn', 'ORGANISATION', 'Österreich', 'Rinn', 'Hauptstrasse 2/7', '6074', '', '', '', '', '', 'Robert Grassmair', ''),
  ('65', 'DSG Union Raiba Pfandl', 'ORGANISATION', 'Österreich', 'Bad Ischl', 'Brennerstraße 7/Top5', '4820', '', '', '', '', '', 'Martin Platzer', ''),
  ('66', 'SlipStreamrz RC', 'ORGANISATION', 'Österreich', 'Graz', 'Ragnitzstraße 62b Top21', '8047', '', '', '', '', '', 'Florian Ries', ''),
  ('67', '#badischllaeuft', 'ORGANISATION', 'Österreich', 'Bad Ischl', 'Schneiderwirtstrasse 16', '4820', '', '', '', '', '', 'Peter Seebacher', ''),
  ('68', 'BRG Traun', 'ORGANISATION', 'Österreich', 'Traun', 'Schulstraße 59', '4050', '', '', '', '', '', 'Gnther Hintringer', ''),
  ('69', 'Runningteam KG', 'ORGANISATION', 'Österreich', 'Steinerkirchen', 'Landstraße 32', '4652', '', '', '', '', '', '', ''),
  ('70', 'Betriebssport Wirtschaftskammer Salzburg', 'ORGANISATION', 'Österreich', 'Salzburg', 'Faberstraße 18', '5020', '', '', '', '', '', 'Reinhard Sitzler', ''),
  ('71', 'BWT Austria GmbH', 'ORGANISATION', 'Österreich', 'Mondsee', 'Walter Simmerstr. 4', '5310', '', '', '', '', '', '', ''),
  ('72', 'Sportunion Roitham am Traunfall', 'ORGANISATION', 'Österreich', 'Roitham am Traunfall', 'Rosenweg 4', '4661', '', '', '', '', '', 'Verena Pichlmann', ''),
  ('73', 'Trumer Tri Team', 'ORGANISATION', 'Österreich', 'Obertrum am See', 'Weinbergstraße 18', '5162', '', '', '', '', '', 'Andreas Wallner', ''),
  ('74', 'Markus Sob', 'PERSON', 'Österreich', 'St. Marienkirchen', 'Schärdingerstraße 37', '4774', '', '', '', '', '', 'Markus Sob', ''),
  ('75', 'OberÖsterreichischer Landesradsportverband', 'ORGANISATION', 'Österreich', 'Linz', 'Postfach 40', '4040', '', '', '', '', '', 'Jakob Eibelhuber', 'Ober�sterreichischer Landesradsportverband'),
  ('76', 'Tourismusverband Seekirchen', 'ORGANISATION', 'Österreich', 'Seekirchen am Wallersee', 'Hauptstraße 3', '5201', '', '', '', '', '', 'Alexander Ebner', ''),
  ('77', 'Gerdo Hazeleger', 'PERSON', 'Niederlande', 'Renswoude', 'Het Binnenveld 11', '3927 BC', '', '', '', '', '', 'Gerdo Hazeleger', ''),
  ('78', 'Jacaranda Sport Consulting GmbH', 'ORGANISATION', 'Deutschland', 'München', 'Thierschstraße 20', '80538', 'DE266443665', '', '', '', '', 'Nick Federspiel', ''),
  ('79', 'Elternverein der VS 2 Linz', 'ORGANISATION', 'Österreich', 'Linz', 'Dornacher Straße 33', '4040', '', '', '', '', '', 'Thomas Fuchshuber', ''),
  ('80', 'Stadtgemeinde Vöcklabruck', 'ORGANISATION', 'Österreich', 'Vöcklabruck', 'Klosterstraße 9', '4840', 'ATU37836204', '', '', '', '', 'Irene Kellermayr', ''),
  ('81', 'Juliverse GmbH', 'ORGANISATION', 'Österreich', 'Traun', 'Neubaustraße 26', '4050', 'ATU74055023', '', '', '', '', 'Julia Prandstetter', ''),
  ('82', 'Verein Karnisches Ungetüm', 'ORGANISATION', 'Österreich', 'Villach-Auen', 'Heidenfeldstraße 14a/36', '9500', '', '', '', '', '', 'Leopold Durchner', 'Verein Karnisches Unget�m'),
  ('83', 'TriRun Linz', 'ORGANISATION', 'Österreich', 'Linz', 'Ramsauerstraße 143', '4020', '', '', '', '', '', 'Peter Weinzierl', ''),
  ('84', 'Verein Lebensfreunde Prambachkirchen', 'ORGANISATION', 'Österreich', 'Prambachkirchen', 'Uttenthal 25', '4731', '', '', '', '', '', 'Markus Autengruber', ''),
  ('85', 'Sportverein Hellmonsödt', 'ORGANISATION', 'Österreich', 'Hellmonsödt', 'Sonnenhang 23', '4202', '', '', '', '', '', 'Michael Sakellaris', 'Sportverein Hellmons�dt'),
  ('86', 'Wirtschafsband A9 Fränkische Schweiz e.V.', 'ORGANISATION', 'Deutschland', 'Pegnitz', 'Hauptstraße 37', '91257', '', '', '', '', '', 'Michael Breitenfelder', 'Wirtschafsband A9 Fr�nkische Schweiz e.V.'),
  ('87', 'HYROX Training Club', 'ORGANISATION', 'Österreich', 'Liezen', 'Friedau 25', '8940', '', '', '', '', '', 'Andreas Prommer', ''),
  ('88', 'RC Alpentour', 'ORGANISATION', 'Österreich', 'Graz', 'Oberer Plattenweg 60/5', '8043', '', '', '', '', '', 'Gerhard Schönbacher', ''),
  ('89', 'Ratschings-Jaufen GmbH', 'ORGANISATION', 'Italien', 'Ratschings (Prov. BZ)', 'Innerratschings 18A', '39040', 'IT00390630218', '', '', '', '', '', ''),
  ('90', 'SUNBA Natternbach', 'ORGANISATION', 'Österreich', 'Natternbach', 'Badstraße 3', '4723', '', '', '', '', '', 'Michael Hofmann', ''),
  ('91', 'Feeldgood Mondsee GmbH', 'ORGANISATION', 'Österreich', 'Tiefgraben', 'Herzog Odilo Str 101', '5310', 'ATU74904749', '', '', '', '', '', ''),
  ('92', 'Union Lauffreunde Mondsee', 'ORGANISATION', 'Österreich', 'Tiefgraben', 'Am Gaisberg 7', '5310', '', '', '', '', '', 'Karl Mörtl', ''),
  ('93', 'RWA Licht- und Lüftungstechnik GmbH', 'ORGANISATION', 'Österreich', 'Gunskirchen', 'Boschstr. 5', '4626', 'ATU77282405', '', '', '', '', 'Roman Breitwieser', ''),
  ('94', 'Steinwerk Event GmbH', 'ORGANISATION', 'Österreich', 'Schladming', 'Katzenburgweg 558/12', '8970', 'ATU77363728', '', '', '', '', 'Harald Steiner', ''),
  ('95', 'Laufteam SV Raika Kolsass-Weer', 'ORGANISATION', 'Österreich', 'Kolsass', 'Johann-Schuler-Weg 3', '6114', '', '', '', '', '', 'Christian Ehrenstrasser', ''),
  ('96', 'Tourismusverband Wilder Kaiser', 'ORGANISATION', 'Österreich', 'Ellmau', 'Dorf 35', '6352', '', '', '', '', '', 'Marcus Sappl', ''),
  ('97', 'Landesradsportverband Salzburg', 'ORGANISATION', 'Österreich', 'Wals', 'Oberst-Lepperdinger-Straße 21', '5071', '', '', '', '', '', 'Thomas Hädlmoser', ''),
  ('98', 'G-Sport', 'ORGANISATION', 'Österreich', 'Seekirchen', 'Postgasse 3/7', '5201', 'ATU65425827', '', '', '', '', 'Josef Gruber', ''),
  ('99', 'btec mechatronics gmbh & co kg', 'ORGANISATION', 'Österreich', 'Linz', 'Leonfeldnerstraße 133', '4040', 'ATU68218868', '', '', '', '', 'Dipl.-Ing. Michael Rösler', ''),
  ('100', 'AMATEURSPORTVEREIN RATSCHINGS', 'ORGANISATION', 'Italien', 'Ratschings (BZ)', 'Innerratschings Bichl 7', '39040', 'IT01377070212', '', '', '', '', 'Hanspeter Schölzhorn', ''),
  ('101', 'TSV von 1873 Wörth a. d. Donau e.V.', 'ORGANISATION', 'Deutschland', 'Wörth an der Donau', 'Gschwelltalstraße 3', '93086', '', '', '', '', '', 'Abteilung Radsport', 'TSV von 1873 W�rth a. d. Donau e.V.'),
  ('102', 'Peaks Park GmbH', 'ORGANISATION', 'Schweiz', 'Pontresina', 'Via Maistra 163', '7504', 'CHE-371.355.240', '', '', '', '', 'Mirko Groeschner', ''),
  ('103', 'Naturfreunde Gmunden Ohlsdorf', 'ORGANISATION', 'Österreich', 'Niedertalheim', 'Viert 5', '4692', '', '', '', '', '', 'Martin Schimpl', ''),
  ('104', '#SUPtheTraun - Der SUP-Club an der Traun', 'ORGANISATION', 'Österreich', 'Thalheim', 'Charwatweg 18', '4600', '', '', '', '', '', 'Stefan Wendt', ''),
  ('105', 'Plus-City Betriebsgesellschaft m.b.H.', 'ORGANISATION', 'Österreich', 'Pasching', 'Pluskaufstr. 7', '4061', 'ATU22743805', '', '', '', '', 'Isabel Hahn', ''),
  ('106', 'Trail Pro-Events e.U.', 'ORGANISATION', 'Österreich', 'Salzburg', 'Unterfeldstraße 13 / Top 1', '5020', 'ATU80077523', '', '', '', '', 'Tobias Niermeier', ''),
  ('107', 'TSV Timelkam', 'ORGANISATION', 'Österreich', 'Timelkam', 'St. Julienstrasse 13', '4850', '', '', '', '', '', 'Martin Zaunrieth', ''),
  ('108', 'Fieberbrunner Körperkult', 'ORGANISATION', 'Österreich', 'Fieberbrunn', 'Vornbichl 2', '6391', '', '', '', '', '', 'Maximilian Foidl', 'Fieberbrunner K�rperkult'),
  ('109', 'FC Koch Türen Natters', 'ORGANISATION', 'Österreich', 'Mutters', 'Riedbach 12/3', '6162', '', '', '', '', '', 'David Gstraunthaler', 'FC Koch T�ren Natters'),
  ('110', 'Tourismusverband Paznaun - Ischgl', 'ORGANISATION', 'Österreich', 'Ischgl', 'Dorfstrasse 43', '6561', 'ATU61398366', '', '', '', '', '', ''),
  ('111', 'Starlim Spritzguss GmbH', 'ORGANISATION', 'Österreich', 'Marchtrenk', 'Mühlstraße 21', '4614', 'ATU61512036', '', '', '', '', '', ''),
  ('112', 'Lauffreunde Traunsee Panthers', 'ORGANISATION', 'Österreich', 'Ohlsdorf', 'Kornstrasse 37', '4694', '', '', '', '', '', 'Fritz Baldinger', ''),
  ('113', 'SC Anger', 'ORGANISATION', 'Deutschland', 'Anger', 'Am Kirchberg 12', '83454', 'DE131567374', '', '', '', '', 'Julia Kern', ''),
  ('114', 'Alexandra Heid', 'PERSON', 'Deutschland', 'Pfullingen', 'Griesstraße 15/1', '72793', '', '', '', '', '', 'Alexandra Heid', ''),
  ('115', 'Tourismusverband Obertrum am See', 'ORGANISATION', 'Österreich', 'Obertrum am See', 'Schulstraße 2', '5162', 'ATU57037655', '', '', '', '', 'Sabine Gärtner', ''),
  ('116', 'popaflo sportswear gmbh', 'ORGANISATION', 'Österreich', 'Niederwalkirchen', 'Baumgartsau 41', '4174', 'ATU75185719', '', '', '', '', 'Popa Florin-Robert', ''),
  ('117', 'OstseeMan Marketing und Event GmbH', 'ORGANISATION', 'Deutschland', 'Harrislee', 'Libellenring 6', '24955', 'DE345245222', '', '', '', '', 'Sven Christensen', ''),
  ('118', 'RE/MAX Bad Ischl', 'ORGANISATION', 'Österreich', 'Bad Ischl', 'Esplanade 4', '4820', '', '', '', '', '', 'Harald Prohaska', ''),
  ('119', 'Bernegger GmbH', 'ORGANISATION', 'Österreich', 'Molln', 'Gradau 15', '4591', '', '', '', '', '', '', ''),
  ('120', 'Helmut Steiner', 'PERSON', 'Österreich', 'Obertrum am See', 'Seestraße 17/1', '5162', '', '', '', '', '', 'Helmut Steiner', ''),
  ('121', 'TB-Turnverein Haag 1908', 'ORGANISATION', 'Österreich', 'Haag am Hausruck', 'Rottenbacherstraße 2', '4680', '', '', '', '', '', 'Michael Stroi', '�TB-Turnverein Haag 1908'),
  ('122', 'Herwig Höfle', 'PERSON', 'Österreich', 'Wals-Siezenheim', 'Ferdinand-Porsche-Straße 10, Top 5', '5071', '', '', '', '', '', 'Herwig Höfle', ''),
  ('123', 'Daniel Wimmer', 'PERSON', 'Deutschland', 'Anger', 'Gartenweg 2b', '83454', '', '', '', '', '', 'Daniel Wimmer', '');

-- Prefer UID, otherwise name + postal code, then a unique normalized name.
-- This permits corrected postal codes while still rejecting an ambiguous target.
CREATE TEMP TABLE customer_candidates ON COMMIT DROP AS
SELECT
  s.source_id,
  o.id AS organizer_id,
  CASE
    WHEN s.uid <> ''
      AND regexp_replace(lower(coalesce(o.uid, '')), '[^a-z0-9]', '', 'g') = regexp_replace(lower(s.uid), '[^a-z0-9]', '', 'g')
      THEN 1
    WHEN lower(trim(o.name)) = lower(trim(s.name)) AND coalesce(o."postalCode", '') = s.postal_code
      THEN 2
    WHEN s.legacy_name <> '' AND lower(trim(o.name)) = lower(trim(s.legacy_name))
      THEN 4
    ELSE 3
  END AS match_rank
FROM customer_import s
JOIN "Organizer" o ON
  (s.uid <> '' AND regexp_replace(lower(coalesce(o.uid, '')), '[^a-z0-9]', '', 'g') = regexp_replace(lower(s.uid), '[^a-z0-9]', '', 'g'))
  OR lower(trim(o.name)) = lower(trim(s.name))
  OR (s.legacy_name <> '' AND lower(trim(o.name)) = lower(trim(s.legacy_name)));

SELECT match_rank, count(DISTINCT source_id) AS customer_count
FROM customer_candidates
GROUP BY match_rank
ORDER BY match_rank;

DO $$
DECLARE ambiguous_count integer;
BEGIN
  SELECT count(*) INTO ambiguous_count
  FROM (
    SELECT c.source_id
    FROM customer_candidates c
    JOIN (
      SELECT source_id, min(match_rank) AS best_rank
      FROM customer_candidates
      GROUP BY source_id
    ) best ON best.source_id = c.source_id AND best.best_rank = c.match_rank
    GROUP BY c.source_id
    HAVING count(*) > 1
  ) ambiguous;
  IF ambiguous_count > 0 THEN
    RAISE EXCEPTION 'Customer import stopped: % staging rows match multiple existing organizers', ambiguous_count;
  END IF;
END $$;

CREATE TEMP TABLE customer_resolution ON COMMIT DROP AS
SELECT
  s.*,
  candidate.organizer_id
FROM customer_import s
LEFT JOIN LATERAL (
  SELECT organizer_id
  FROM customer_candidates c
  WHERE c.source_id = s.source_id
  ORDER BY match_rank, organizer_id
  LIMIT 1
) candidate ON true;

-- Keep existing optional banking/email values if the invoice source did not supply them.
-- The known issuer UID ATU75191418 is explicitly removed when it was incorrectly stored as a customer UID.
UPDATE "Organizer" o
SET
  name = r.name,
  type = r.type,
  country = r.country,
  city = r.city,
  street = r.street,
  "postalCode" = r.postal_code,
  uid = CASE
    WHEN r.uid <> '' THEN r.uid
    WHEN regexp_replace(lower(coalesce(o.uid, '')), '[^a-z0-9]', '', 'g') = 'atu75191418' THEN NULL
    ELSE o.uid
  END,
  iban = CASE WHEN r.iban <> '' THEN r.iban ELSE o.iban END,
  bic = CASE WHEN r.bic <> '' THEN r.bic ELSE o.bic END,
  "bankName" = CASE WHEN r.bank_name <> '' THEN r.bank_name ELSE o."bankName" END,
  email = CASE WHEN r.email <> '' THEN r.email ELSE o.email END
FROM customer_resolution r
WHERE o.id = r.organizer_id;

INSERT INTO "Organizer" (
  id, name, type, active, country, city, street, "postalCode", uid, iban, bic, "bankName", email, "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(), name, type, true, country, city, street, postal_code,
  nullif(uid, ''), nullif(iban, ''), nullif(bic, ''), nullif(bank_name, ''), nullif(email, ''), now(), now()
FROM customer_resolution
WHERE organizer_id IS NULL;

-- Resolve again so newly created organizers receive their invoice-derived primary contact.
CREATE TEMP TABLE customer_target ON COMMIT DROP AS
SELECT
  r.*,
  coalesce(
    r.organizer_id,
    (
      SELECT o.id
      FROM "Organizer" o
      WHERE lower(trim(o.name)) = lower(trim(r.name)) AND coalesce(o."postalCode", '') = r.postal_code
      ORDER BY o."createdAt"
      LIMIT 1
    )
  ) AS final_organizer_id
FROM customer_resolution r;

-- Preserve existing contact metadata; only maintain the full display name and the organizer relation.
UPDATE "Contact" c
SET name = t.primary_contact
FROM customer_target t
JOIN "Organizer" o ON o.id = t.final_organizer_id
WHERE t.primary_contact <> ''
  AND o."primaryContactId" = c.id
  AND c.name IS DISTINCT FROM t.primary_contact;

CREATE TEMP TABLE contact_to_create (
  organizer_id uuid PRIMARY KEY,
  contact_id uuid NOT NULL,
  primary_contact text NOT NULL
) ON COMMIT DROP;
INSERT INTO contact_to_create (organizer_id, contact_id, primary_contact)
SELECT t.final_organizer_id, gen_random_uuid(), t.primary_contact
  FROM customer_target t
  JOIN "Organizer" o ON o.id = t.final_organizer_id
  WHERE t.primary_contact <> ''
    AND NOT EXISTS (
      SELECT 1
      FROM "OrganizerContact" oc
      JOIN "Contact" c ON c.id = oc."contactId"
      WHERE oc."organizerId" = o.id AND lower(trim(c.name)) = lower(trim(t.primary_contact))
    )
ON CONFLICT (organizer_id) DO NOTHING;

INSERT INTO "Contact" (id, name, archived, "syncStatus", "createdAt", "updatedAt")
SELECT contact_id, primary_contact, false, 'NEVER', now(), now()
FROM contact_to_create;

-- Link the newly created contacts; existing matching contacts are already linked.
INSERT INTO "OrganizerContact" ("organizerId", "contactId", role)
SELECT organizer_id, contact_id, 'Primärkontakt'
FROM contact_to_create
ON CONFLICT DO NOTHING;

-- The most recent matching link is the imported primary contact.
UPDATE "Organizer" o
SET "primaryContactId" = candidate.contact_id
FROM (
  SELECT DISTINCT ON (t.final_organizer_id)
    t.final_organizer_id AS organizer_id,
    c.id AS contact_id
  FROM customer_target t
  JOIN "OrganizerContact" oc ON oc."organizerId" = t.final_organizer_id
  JOIN "Contact" c ON c.id = oc."contactId"
  WHERE t.primary_contact <> '' AND lower(trim(c.name)) = lower(trim(t.primary_contact))
  ORDER BY t.final_organizer_id, c."updatedAt" DESC, c."createdAt" DESC
) candidate
WHERE o.id = candidate.organizer_id;

-- Verification is emitted before commit and should return 123 / 123 / 0.
SELECT
  (SELECT count(*) FROM customer_import) AS staged_customers,
  (SELECT count(*) FROM customer_target WHERE final_organizer_id IS NOT NULL) AS resolved_customers,
  (SELECT count(*) FROM customer_target WHERE final_organizer_id IS NULL) AS unresolved_customers;

COMMIT;
