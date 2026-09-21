import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

/** Ein winziges, einfarbiges SVG — quadratisch, weit unter 50 KB. */
const SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/></svg>';

test("lädt ein eigenes Symbol hoch und wählt es für einen Service", async ({ page }) => {
  await mockEventManagementApi(page);

  let bibliothek: unknown[] = [];
  let hochgeladen: { fileName?: string; mimeType?: string; contentBase64?: string } | null = null;
  await page.route("**/api/v1/icons", async (route) => {
    if (route.request().method() === "POST") {
      hochgeladen = route.request().postDataJSON();
      const symbol = {
        id: "11111111-2222-4333-8444-555555555555",
        name: "kegel.svg",
        mimeType: "image/svg+xml",
        size: SVG.length,
        monochrome: true,
        active: true,
        createdAt: "2026-08-20T09:00:00.000Z",
      };
      bibliothek = [symbol];
      return route.fulfill({ status: 201, json: symbol });
    }
    return route.fulfill({ json: bibliothek });
  });
  await page.route("**/api/v1/icons/*", (route) =>
    route.fulfill({ contentType: "image/svg+xml", body: SVG }),
  );

  await page.goto("/einstellungen?tab=auswahllisten&liste=services");
  await page.getByRole("button", { name: "Darstellung für Service UHF" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Noch keine eigenen Symbole.")).toBeVisible();

  await dialog.getByLabel("Symboldatei auswählen").setInputFiles({
    name: "kegel.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from(SVG),
  });

  // Hochgeladen wird als base64 im Rumpf, wie bei den Aufgabenanhängen.
  await expect.poll(() => hochgeladen).not.toBeNull();
  expect(hochgeladen!.fileName).toBe("kegel.svg");
  expect(Buffer.from(hochgeladen!.contentBase64!, "base64").toString()).toBe(SVG);

  // Das frisch hochgeladene Symbol ist sofort gewählt: wer es hochlädt, will es.
  await expect(dialog.getByRole("button", { name: "kegel.svg", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByText("Service gespeichert.").last()).toBeVisible();
});

test("nennt den Grund, wenn der Dienst ein Symbol ablehnt", async ({ page }) => {
  await mockEventManagementApi(page);
  await page.route("**/api/v1/icons", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          json: { message: "Das Symbol ist nicht quadratisch." },
        })
      : route.fulfill({ json: [] }),
  );

  await page.goto("/einstellungen?tab=auswahllisten&liste=services");
  await page.getByRole("button", { name: "Darstellung für Service UHF" }).click();
  await page
    .getByRole("dialog")
    .getByLabel("Symboldatei auswählen")
    .setInputFiles({ name: "breit.png", mimeType: "image/png", buffer: Buffer.from("x") });

  // Still bereinigen zerstört ein Symbol, ohne dass es jemand erfährt —
  // deshalb steht der Grund des Dienstes wörtlich auf dem Schirm.
  await expect(page.getByText("Das Symbol ist nicht quadratisch.")).toBeVisible();
});
