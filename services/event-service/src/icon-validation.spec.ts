import { describe, expect, it } from "vitest";
import { MAX_ICON_BYTES, symbolPruefen } from "./icon-validation.js";

const svg = (inhalt: string) => Buffer.from(`<svg viewBox="0 0 24 24">${inhalt}</svg>`, "utf8");

function png(breite: number, hoehe: number) {
  const puffer = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(puffer, 0);
  puffer.writeUInt32BE(breite, 16);
  puffer.writeUInt32BE(hoehe, 20);
  return puffer;
}

describe("symbolPruefen", () => {
  it("nimmt ein einfarbiges SVG an und meldet es als einfärbbar", () => {
    const ergebnis = symbolPruefen(
      "image/svg+xml",
      svg('<path d="M4 4h16v16H4z" fill="#0f7d86"/>'),
    );
    expect(ergebnis).toEqual({ ok: true, monochrome: true });
  });

  it("erkennt mehrfarbige SVG als nicht einfärbbar", () => {
    const ergebnis = symbolPruefen(
      "image/svg+xml",
      svg('<path fill="#0f7d86" d="M0 0h8v8H0z"/><circle fill="#cb8418" cx="4" cy="4" r="2"/>'),
    );
    expect(ergebnis).toEqual({ ok: true, monochrome: false });
  });

  it("zählt currentColor und none nicht als eigene Farbe", () => {
    const ergebnis = symbolPruefen(
      "image/svg+xml",
      svg(
        '<path fill="none" stroke="currentColor" d="M0 0h8"/><rect fill="#127951" width="4" height="4"/>',
      ),
    );
    expect(ergebnis).toEqual({ ok: true, monochrome: true });
  });

  it.each([
    ["<script>alert(1)</script>", "script"],
    ["<foreignObject><div/></foreignObject>", "foreignobject"],
    ['<image href="http://fremd/x.png"/>', "image"],
    ["<style>*{}</style>", "style"],
  ])("lehnt %s ab", (inhalt, element) => {
    const ergebnis = symbolPruefen("image/svg+xml", svg(inhalt));
    expect(ergebnis.ok).toBe(false);
    if (!ergebnis.ok) expect(ergebnis.grund.toLowerCase()).toContain(element);
  });

  it("lehnt Ereignisbehandler ab", () => {
    const ergebnis = symbolPruefen("image/svg+xml", svg('<path onload="alert(1)" d="M0 0h8"/>'));
    expect(ergebnis).toMatchObject({ ok: false });
    if (!ergebnis.ok) expect(ergebnis.grund).toContain("onload");
  });

  it("lehnt Verweise auf andere Dateien ab", () => {
    const ergebnis = symbolPruefen("image/svg+xml", svg('<use href="#fremd"/>'));
    expect(ergebnis).toMatchObject({ ok: false });
  });

  it("lehnt eigene Entitäten ab", () => {
    const inhalt = Buffer.from(
      '<!DOCTYPE svg [<!ENTITY x "y">]><svg viewBox="0 0 1 1"><path d="M0 0"/></svg>',
      "utf8",
    );
    expect(symbolPruefen("image/svg+xml", inhalt)).toMatchObject({ ok: false });
  });

  it("nimmt ein quadratisches PNG an, aber nie als einfärbbar", () => {
    expect(symbolPruefen("image/png", png(64, 64))).toEqual({ ok: true, monochrome: false });
  });

  it("lehnt ein nicht quadratisches PNG ab und nennt die Masse", () => {
    const ergebnis = symbolPruefen("image/png", png(64, 32));
    expect(ergebnis).toMatchObject({ ok: false });
    if (!ergebnis.ok) expect(ergebnis.grund).toContain("64 × 32");
  });

  it("lehnt fremde Dateitypen und zu grosse Dateien ab", () => {
    expect(symbolPruefen("image/gif", png(8, 8))).toMatchObject({ ok: false });
    expect(symbolPruefen("image/svg+xml", Buffer.alloc(MAX_ICON_BYTES + 1, 0x20))).toMatchObject({
      ok: false,
    });
    expect(symbolPruefen("image/png", Buffer.alloc(0))).toMatchObject({ ok: false });
  });
});
