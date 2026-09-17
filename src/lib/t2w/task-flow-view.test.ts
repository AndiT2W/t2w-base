import { describe, expect, it } from "vitest";
import {
  chainView,
  foreignPredecessorIds,
  splitFlows,
  successorIds,
} from "./task-flow-view";

describe("splitFlows", () => {
  it("trennt Ketten von Aufgaben ohne Vorgänger", () => {
    const { chains, singles } = splitFlows([[["a"], ["b"]], [["c"]], [["d"], ["e"], ["f"]]]);

    expect(chains).toEqual([
      [["a"], ["b"]],
      [["d"], ["e"], ["f"]],
    ]);
    expect(singles).toEqual(["c"]);
  });

  it("zählt parallele Aufgaben einer Stufe als Kette", () => {
    const { chains, singles } = splitFlows([[["a", "b"]]]);

    expect(chains).toEqual([[["a", "b"]]]);
    expect(singles).toEqual([]);
  });

  it("kommt mit einer Kategorie ohne Aufgaben zurecht", () => {
    expect(splitFlows([])).toEqual({ chains: [], singles: [] });
  });
});

describe("chainView", () => {
  const done = (ids: string[]) => (id: string) => ids.includes(id);

  it("lässt eine kurze Kette unverändert", () => {
    const view = chainView([["a"], ["b"], ["c"]], done([]));

    expect(view.collapsedDoneCount).toBe(0);
    expect(view.stages.map((stage) => stage.taskIds)).toEqual([["a"], ["b"], ["c"]]);
    expect(view.stageCount).toBe(3);
  });

  it("faltet erledigte Stufen am Anfang zusammen", () => {
    const view = chainView([["a"], ["b"], ["c"], ["d"]], done(["a", "b"]));

    expect(view.collapsedDoneCount).toBe(2);
    expect(view.stages.map((stage) => stage.taskIds)).toEqual([["c"], ["d"]]);
  });

  it("faltet nur den Anfang, nicht erledigte Stufen mittendrin", () => {
    const view = chainView([["a"], ["b"], ["c"]], done(["a", "c"]));

    expect(view.collapsedDoneCount).toBe(1);
    expect(view.stages.map((stage) => stage.taskIds)).toEqual([["b"], ["c"]]);
  });

  it("faltet eine Stufe nur, wenn sie ganz erledigt ist", () => {
    const view = chainView([["a", "b"], ["c"]], done(["a"]));

    expect(view.collapsedDoneCount).toBe(0);
    expect(view.stages.map((stage) => stage.taskIds)).toEqual([["a", "b"], ["c"]]);
  });

  it("hält bei einer ganz erledigten Kette die letzte Stufe sichtbar", () => {
    const view = chainView([["a"], ["b"], ["c"]], done(["a", "b", "c"]));

    expect(view.collapsedDoneCount).toBe(2);
    expect(view.stages.map((stage) => stage.taskIds)).toEqual([["c"]]);
  });

  it("zeigt höchstens drei Aufgaben je Stufe und zählt den Rest", () => {
    const view = chainView([["a"], ["b", "c", "d", "e", "f"]], done([]));

    expect(view.stages[1]).toEqual({ taskIds: ["b", "c", "d"], hiddenCount: 2 });
  });
});

describe("foreignPredecessorIds", () => {
  const groups: Record<string, string | null> = {
    aufbau: "technik",
    abnahme: "technik",
    transport: "logistik",
    hardware: "logistik",
    konzept: null,
  };
  const groupIdOf = (id: string) => groups[id] ?? null;

  it("findet Vorgänger aus einer anderen Kategorie", () => {
    const found = foreignPredecessorIds(
      ["aufbau", "abnahme"],
      [
        { predecessorId: "transport", successorId: "aufbau" },
        { predecessorId: "aufbau", successorId: "abnahme" },
      ],
      groupIdOf,
      "technik",
    );

    expect(found).toEqual(["transport"]);
  });

  it("nennt jeden fremden Vorgänger nur einmal", () => {
    const found = foreignPredecessorIds(
      ["aufbau", "abnahme"],
      [
        { predecessorId: "transport", successorId: "aufbau" },
        { predecessorId: "transport", successorId: "abnahme" },
      ],
      groupIdOf,
      "technik",
    );

    expect(found).toEqual(["transport"]);
  });

  it("behandelt „ohne Kategorie“ als eigene Kategorie", () => {
    const found = foreignPredecessorIds(
      ["konzept"],
      [{ predecessorId: "hardware", successorId: "konzept" }],
      groupIdOf,
      null,
    );

    expect(found).toEqual(["hardware"]);
  });
});

describe("successorIds", () => {
  it("liefert die Gegenrichtung der Kanten", () => {
    const edges = [
      { predecessorId: "a", successorId: "b" },
      { predecessorId: "a", successorId: "c" },
      { predecessorId: "b", successorId: "d" },
    ];

    expect(successorIds("a", edges)).toEqual(["b", "c"]);
    expect(successorIds("d", edges)).toEqual([]);
  });
});
