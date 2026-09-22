# TIME2WIN CI und Branding

## Markenfarben

- Grün: `#8DC63F`
- Dunkelblau: `#05193A`
- Logo-intern: Schwarz `#1D1D1B`, Weiß `#FFFFFF` und Grün `#95C11F` gemäß bereitgestellter SVG-Datei.

Die Anwendung verwendet die CI-Farben zentral in `src/styles.css` über `--brand-green` und `--brand-navy`. Die vorherige Farbdefinition lag bis zum 22.09.2026 als Datei `src/styles_begin.css` im Arbeitsverzeichnis; sie steht jetzt nur noch in der Git-Historie unter [`52bd4fad:src/styles_begin.css`](https://github.com/AndiT2W/t2w-base/blob/52bd4fad/src/styles_begin.css), lokal abrufbar mit `git show 52bd4fad:src/styles_begin.css`.

## Logo

Das freigegebene TIME2WIN-Logo liegt als `public/time2win_logo_button.svg` vor. Es wird in der Sidebar als Marken-Icon und als Browser-Favicon verwendet.

## Deployment

Die Änderung wurde am 2026-08-21 auf `https://base.time2win.cloud` deployed. Der produktive Dienst läuft im Hostinger-Projekt `/docker/t2w-base`.

## Quellen

- [Aktuelle Farbtokens](../../src/styles.css)
- [Logo-Asset](../../public/time2win_logo_button.svg)
- [Archivierter Ausgangsstand in der Historie](https://github.com/AndiT2W/t2w-base/blob/52bd4fad/src/styles_begin.css) (`git show 52bd4fad:src/styles_begin.css`)
