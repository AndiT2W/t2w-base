import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

/**
 * Die Leiste ist 248 px breit, als schmale Symbolleiste 68 px — so steht es
 * im freigegebenen Artboard (siehe DESIGN.md).
 *
 * Geprüft wird beides zusammen: die Breite der Leiste und der linke Abstand
 * der Inhaltsfläche.  Die zwei Werte stehen in zwei Dateien (`AppSidebar.tsx`
 * und `__root.tsx`); laufen sie auseinander, liegt die Leiste über dem Inhalt
 * oder es bleibt ein Streifen Hintergrund daneben.  Genau das fängt dieser
 * Test ab, und nicht bloß eine Zahl in einer Klasse.
 */

const kanten = async (page: import("@playwright/test").Page) => {
  const leiste = page.getByRole("complementary").first();
  const inhalt = page.locator("main").first();
  const l = await leiste.boundingBox();
  const m = await inhalt.boundingBox();
  if (!l || !m) throw new Error("Leiste oder Inhaltsfläche nicht sichtbar");
  return { breite: l.width, inhaltLinks: m.x };
};

test("hält Leiste und Inhaltsfläche auf 248 px, eingeklappt auf 68 px", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.goto("/");

  const leiste = page.getByRole("complementary").first();
  await expect(leiste).toBeVisible();

  const voll = await kanten(page);
  expect(voll.breite).toBe(248);
  expect(voll.inhaltLinks).toBe(248);

  await page.getByRole("button", { name: "Navigation einklappen" }).click();
  await expect(page.getByRole("button", { name: "Navigation ausklappen" })).toBeVisible();

  const schmal = await kanten(page);
  expect(schmal.breite).toBe(68);
  expect(schmal.inhaltLinks).toBe(68);

  // 68 px fassen die 44 px Fingerkuppe samt Rand: bei den bisherigen 64 px
  // ragten die Symbolfelder über die Leiste hinaus.  Geprüft wird, dass das
  // Feld seine volle Größe behält und ganz in der Leiste liegt.
  const feld = page
    .getByRole("complementary")
    .first()
    .getByRole("link", { name: "Übersicht" })
    .first();
  const f = await feld.boundingBox();
  if (!f) throw new Error("Symbolfeld nicht sichtbar");
  expect(f.width).toBe(44);
  expect(f.x).toBeGreaterThan(0);
  expect(f.x + f.width).toBeLessThanOrEqual(68);
});
