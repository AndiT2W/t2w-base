import { describe, expect, it } from "vitest";
import { createLocaleRenderer } from "./locale-rendering";

describe("locale rendering module", () => {
  const catalogs = { de: { greeting: "Hallo" }, en: { greeting: "Hello" } };
  const legacy = { Stammdaten: "Basic data" };

  it("renders keyed text with German fallback", () => {
    const renderer = createLocaleRenderer("en", catalogs, legacy);

    expect(renderer.translate("greeting")).toBe("Hello");
    expect(renderer.translate("missing")).toBe("missing");
  });

  it("keeps German legacy text and translates English legacy text", () => {
    expect(createLocaleRenderer("de", catalogs, legacy).translate("Stammdaten")).toBe("Stammdaten");
    expect(createLocaleRenderer("en", catalogs, legacy).translate("Stammdaten")).toBe("Basic data");
  });

  it("formats through the selected locale", () => {
    expect(createLocaleRenderer("de", catalogs, legacy).formatNumber(1234.5)).toBe("1.234,5");
    expect(createLocaleRenderer("en", catalogs, legacy).formatNumber(1234.5)).toBe("1,234.5");
  });
});
