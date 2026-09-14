import { expect, test } from "@playwright/test";
import { mockEventManagementApi } from "./support/event-management-api";

test("lädt Tabellenspalten aus dem Konto und speichert Änderungen zurück", async ({ page }) => {
  await mockEventManagementApi(page);
  let preference: { version: 1; visible: string[]; sort: { key: string; direction: string } } = {
    version: 1,
    visible: ["Status", "Event", "Veranstalter", "Zeitraum", "Aufgaben", "Ordner"],
    sort: { key: "Zeitraum", direction: "asc" },
  };
  let putBody: unknown;
  await page.route("**/api/v1/table-preferences/**", async (route) => {
    if (route.request().method() === "GET") return route.fulfill({ json: { value: preference } });
    if (route.request().method() === "PUT") {
      putBody = route.request().postDataJSON();
      preference = putBody as typeof preference;
      return route.fulfill({ json: { value: preference } });
    }
    return route.fallback();
  });

  await page.goto("/");
  await expect(page.getByRole("button", { name: "Tage sortieren" })).toHaveCount(0);

  await page.getByRole("button", { name: "Spalten auswählen" }).click();
  const days = page.getByRole("checkbox", { name: "Tage" });
  await expect(days).not.toBeChecked();
  await days.check();
  await expect.poll(() => putBody).toMatchObject({ visible: expect.arrayContaining(["Tage"]) });
});
