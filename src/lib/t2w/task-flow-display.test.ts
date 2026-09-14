import { describe, expect, it } from "vitest";
import { categoryTaskFlows } from "./task-flow-display";

describe("categoryTaskFlows", () => {
  it("keeps an independent task out of a dependency flow", () => {
    expect(
      categoryTaskFlows(
        [{ id: "design" }, { id: "print" }, { id: "allocation" }],
        [{ predecessorId: "design", successorId: "print" }],
      ),
    ).toEqual([[["design"], ["print"]], [["allocation"]]]);
  });

  it("keeps parallel predecessors together in one dependency flow", () => {
    expect(
      categoryTaskFlows(
        [{ id: "artwork" }, { id: "numbers" }, { id: "print" }],
        [
          { predecessorId: "artwork", successorId: "print" },
          { predecessorId: "numbers", successorId: "print" },
        ],
      ),
    ).toEqual([[["artwork", "numbers"], ["print"]]]);
  });
});
