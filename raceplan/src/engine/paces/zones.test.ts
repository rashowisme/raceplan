import { describe, expect, it } from "vitest";
import { PACE_ZONES } from "../types";
import { estimationZones, paceZonesFromVdot } from "./zones";

describe("pace zones", () => {
  it("are ordered E > M > T > I > R (slower → faster) with fast < slow", () => {
    for (const vdot of [30, 40, 50, 60, 70]) {
      const z = paceZonesFromVdot(vdot);
      for (const k of PACE_ZONES) expect(z[k].fastSPerKm).toBeLessThanOrEqual(z[k].slowSPerKm);
      expect(z.E.fastSPerKm).toBeGreaterThan(z.M.slowSPerKm);
      expect(z.M.fastSPerKm).toBeGreaterThan(z.T.slowSPerKm);
      expect(z.T.fastSPerKm).toBeGreaterThan(z.I.slowSPerKm);
      expect(z.I.fastSPerKm).toBeGreaterThan(z.R.slowSPerKm);
    }
  });

  it("match Daniels' table for VDOT 50 within ~10 s/km", () => {
    const z = paceZonesFromVdot(50);
    // Daniels VDOT 50: T ≈ 4:15/km, I ≈ 3:55/km, M ≈ 4:31/km.
    expect((z.T.fastSPerKm + z.T.slowSPerKm) / 2).toBeCloseTo(255, -1);
    expect((z.I.fastSPerKm + z.I.slowSPerKm) / 2).toBeCloseTo(237, -1);
    expect((z.M.fastSPerKm + z.M.slowSPerKm) / 2).toBeCloseTo(271, -1);
  });

  it("assumed zones for estimation get faster with level", () => {
    expect(estimationZones("beginner").E.slowSPerKm).toBeGreaterThan(
      estimationZones("experienced").E.slowSPerKm,
    );
  });
});
