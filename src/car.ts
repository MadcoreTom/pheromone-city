import { BLANK_TILE, Metric, State } from "./state";
import { Zone } from "./zone";

export class Car {
  private dx = 0;
  private dy = 0;
  private first = true;
  public dead = false;
  public constructor(
    public x: number,
    public y: number,
    public target: Metric
  ) {}

  public chooseNextTarget() {
    switch (this.target) {
      case "shopping":
      case "housing":
        this.target = "unemployment";
        break;
      case "unemployment":
        this.target = Math.random() < 0.3 ? "shopping" : "housing";
    }
  }

  public update(buffer: 0 | 1, state: State) {
    const { map } = state;
    const rx = Math.round(this.x);
    const ry = Math.round(this.y);

    this.x += this.dx * 0.04;
    this.y += this.dy * 0.04;

    const nx = Math.round(this.x);
    const ny = Math.round(this.y);

    if (rx != nx || ry != ny || this.first) {
      const tx = Math.floor(this.x);
      const ty = Math.floor(this.y);
      this.first = false;
      const c = map.get(tx, ty, BLANK_TILE).buffers[buffer][this.target];
      const u =
        map.get(tx, ty - 1, BLANK_TILE).buffers[buffer][this.target] - c;
      const d =
        map.get(tx, ty + 1, BLANK_TILE).buffers[buffer][this.target] - c;
      const l =
        map.get(tx - 1, ty, BLANK_TILE).buffers[buffer][this.target] - c;
      const r =
        map.get(tx + 1, ty, BLANK_TILE).buffers[buffer][this.target] - c;

      // if you found a target
      if (c === 0) {
        let nearZone: Zone | undefined = undefined;
        state.map.getIf(tx - 1, ty, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
        state.map.getIf(tx + 1, ty, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
        state.map.getIf(tx, ty - 1, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
        state.map.getIf(tx, ty + 1, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
        // TODO kill the car
        if (nearZone !== undefined) {
          // const b = state.buildings.filter((j) => j.x == tx && j.y == ty)[0];
          // if (b) {
          //   b.carArrives(this);
          //   console.log("Reached the end at", tx, ty);
          // } else {
          //   console.log("Nothing there", rx, ty)
          // }
          this.dead = true;
          (nearZone as Zone).enter(this);
        }
      }
      this.dx = 0;
      this.dy = 0;
      const max = Math.max(u, d, l, r);
      if (u == max) {
        this.dy = -1;
      } else if (d == max) {
        this.dy = 1;
      } else if (l == max) {
        this.dx = -1;
      } else if (r == max) {
        this.dx = 1;
      } else {
        this.first = true;
      }
    }
  }
}
