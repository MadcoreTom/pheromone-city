import { BLANK_TILE, Metric, State, TileType } from "./state";
import { Zone } from "./zone/zone";

enum Direction {
  FWD, LEFT, RIGHT, BKWD
}
const SPEED = 0.002;

export class Car {
  public hidden = false;
  public animation?: CarAnimation;
  public happiness:number = 0.75;
  public yaw: number = Math.PI / 2;
  // delta
  public dx: number = 1;
  public dy: number = 0;
  // tile
  public tx: number;
  public ty: number;
  public constructor(
    public x: number,
    public y: number,
    public target: Metric
  ) {
    this.tx = Math.floor(x);
    this.ty = Math.floor(y);
  }

  public update(state: State, delta: number) {
    // TODO change to a while
    if (!this.hidden && !this.animation) {
        // this.happiness = Math.max(0, this.happiness - 0.01);
      const d = this.findNextDirection(state);
      const { dx, dy } = this;
      switch (d) {
        case Direction.FWD:
          this.animation = straight(this, dx, dy, state);
          break;
        case Direction.LEFT:
          this.animation = left(this);
          break;
        case Direction.RIGHT:
          this.animation = right(this);
          break;
        case Direction.BKWD:
          this.animation = uturn(this);
          this.yaw -= Math.PI;
          break;
      }
    }

    if (this.animation && !this.hidden) {
      const remainder = this.animation(delta);
      if (remainder > 0) {
        this.animation = undefined;
        // TODO use the remainder as a starting offset for the next animation
      }
    }

  }

  private findNextDirection(state: State): Direction {
    // console.log("FIND next direction", [this.tx, this.ty], [this.dx, this.dy]);
    const { map } = state;
    const buffer = state.readBuffer;
    const { tx, ty } = this;
    state.map.getIf(tx, ty, v => v.buffers[1 - buffer].traffic += 1);
    const c = map.get(tx, ty, BLANK_TILE).buffers[buffer][this.target];

    const me = this;
    function getRoadMetricAtOffset(dx: number, dy: number): number {
      const t = map.get(tx + dx, ty + dy, BLANK_TILE);
      if (t.type === TileType.ROAD) {
        return t.buffers[buffer][me.target] - c;
      } else {
        return -9999;
      }
    }

    const fwd = getRoadMetricAtOffset(this.dx, this.dy);
    const bkwd = getRoadMetricAtOffset(- this.dx, - this.dy);
    const left = getRoadMetricAtOffset(this.dy, - this.dx);
    const right = getRoadMetricAtOffset(- this.dy, this.dx);

    // if you found a target
    if (c === 0) {
      let nearZone: Zone | undefined = undefined;
      state.map.getIf(tx - 1, ty, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
      state.map.getIf(tx + 1, ty, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
      state.map.getIf(tx, ty - 1, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);
      state.map.getIf(tx, ty + 1, z => nearZone = z.zone && z.zone.providesNeed(this.target) ? z.zone : nearZone);

      if (nearZone !== undefined) {
        this.hidden = true;
        this.animation = undefined;
        (nearZone as Zone).enter(this);
      }
    }

    // If only only one out of fwd/left/right, go that way (not an intersection, jsuta  straight or corner)
    if (fwd >= 0 && left < 0 && right < 0) {
      // console.log("Force forward");
      return Direction.FWD;
    }
    if (left >= 0 && fwd < 0 && right < 0) {
      // console.log("Force left");
      return Direction.LEFT;
    }
    if (right >= 0 && left < 0 && fwd < 0) {
      // console.log("Force right");
      return Direction.RIGHT;
    }
    // console.log("Force (no force))", fwd, left, right);

    const max = Math.max(fwd, bkwd, left, right);
    if(max == BLANK_TILE.buffers[0].housing){
      // turn around
        return Direction.BKWD
    }
    switch (max) {
      case fwd:
        return Direction.FWD;
      case left:
        return Direction.LEFT;
      case right:
        return Direction.RIGHT;
      default:
        console.log("what direction?");
      case bkwd:
        return Direction.BKWD
    }
  }
}

/**
 * takes the current time, returns any remaining time (or zero if none)
 */
type CarAnimation = (time: number) => number;

const RAD_SMALL = 0.25;
const RAD_LARGE = 1 - RAD_SMALL;
const CIRCUMFERENCE_SMALL = 2 * Math.PI * RAD_SMALL / 4;
const CIRCUMFERENCE_LARGE = 2 * Math.PI * RAD_LARGE / 4;


function straight(car: Car, dx: number, dy: number, state:State): CarAnimation {
  const sx = car.tx + (dx < 0 ? 1 : 0);
  const sy = car.ty + (dy < 0 ? 1 : 0);
  const ox = dx == 0 ? (dy > 0 ? RAD_SMALL : RAD_LARGE) : 0;
  const oy = dy == 0 ? (dx < 0 ? RAD_SMALL : RAD_LARGE) : 0;
  const tile = state.map.get(car.tx, car.ty, BLANK_TILE);
  const traffic = Math.abs(tile.type == TileType.GRASS ? 0 : tile.buffers[state.readBuffer].traffic); // no traffic if not a road
  const sMult = Math.max(2 / Math.max(2, traffic), 0.33)
  let time = 0;
  return function (delta: number) {
    let setAngle = time === 0;
    time += delta * sMult;
    car.x = sx + ox + SPEED * time * dx;
    car.y = sy + oy + SPEED * time * dy;
    const r = Math.max(0, time * SPEED - 1);
    if (r > 0) {
      car.tx += dx;
      car.ty += dy;
      car.dx = dx;
      car.dy = dy;
      setAngle = true;
    }
    if (setAngle) {

      if (car.dx == 0) {
        if (car.dy < 0) {      // up
          car.yaw = Math.PI;
        } else {   // down
          car.yaw = 0;
        }
      } else if (car.dx < 0) {   // left
        car.yaw = -Math.PI / 2;
      } else {   // right
        car.yaw = Math.PI / 2;
      }
    }
    return r;
  }
}
function right(car: Car): CarAnimation {
  // pivot around [sx,sy]
  const sx = car.tx + (car.dx < 0 || car.dy < 0 ? 1 : 0);
  const sy = car.ty + (car.dx > 0 || car.dy < 0 ? 1 : 0);
  const radius = RAD_SMALL;
  const startYaw = car.yaw + Math.PI / 2; // TODO sometimes the startYaw is off by Math.PI

  let time = 0;
  return function (delta: number) {
    time += delta / CIRCUMFERENCE_SMALL;
    const a = -time * SPEED * Math.PI / 2 + startYaw; // TODO speed up due to shorter circumference
    car.x = sx + Math.sin(a) * radius;// TODO const for half-pi
    car.y = sy + Math.cos(a) * radius;
    car.yaw = a - Math.PI / 2;
    const r = Math.max(0, time * SPEED - 1);
    if (r > 0) {
      [car.dx, car.dy] = [-car.dy, car.dx]
      car.tx += car.dx;
      car.ty += car.dy;
      // car.yaw -= Math.PI / 2;
    }
    return r;
  }

}

function left(car: Car): CarAnimation {
  // pivot around [sx,sy]
  let sx = car.tx;
  let sy = car.ty;
  if (car.dx == 0) {
    if (car.dy < 0) {
      // up
      sy += 1;
    } else {
      // down
      sx += 1;
    }
  } else if (car.dx < 0) {
    // left
    sx += 1;
    sy += 1;
  } else {
    // right
  }
  const radius = RAD_LARGE;
  const startYaw = car.yaw - Math.PI / 2; // TODO sometimes the startYaw is off by Math.PI

  let time = 0;
  return function (delta: number) {
    time += delta / CIRCUMFERENCE_LARGE;
    const a = time * SPEED * Math.PI / 2 + startYaw; // TODO speed up due to shorter circumference
    car.x = sx + Math.sin(a) * radius;// TODO const for half-pi
    car.y = sy + Math.cos(a) * radius;
    car.yaw = a + Math.PI / 2;
    const r = Math.max(0, time * SPEED - 1);
    if (r > 0) {
      [car.dx, car.dy] = [car.dy, -car.dx]
      car.tx += car.dx;
      car.ty += car.dy;
      // car.yaw += Math.PI / 2;
    }
    return r;
  }

}

// if a car is doing RHS turns right, its doing LHS wrong

function uturn(car: Car): CarAnimation {
  // pivot around [sx,sy]
  // const sx = car.tx + (car.dx < 0 || car.dy < 0 ? 1 : 0);
  const sx = car.tx + (car.dx < 0 ? 1 : (car.dx > 0 ? 0 : 0.5));
  // const sy = car.ty + (car.dx > 0 || car.dy < 0 ? 1 : 0);
  const sy = car.ty + (car.dy < 0 ? 1 : (car.dy > 0 ? 0 : 0.5));
  const radius = RAD_SMALL;
  const startYaw = car.yaw - Math.PI / 2; // TODO sometimes the startYaw is off by Math.PI

  const speed = SPEED * 0.5; // TODO temp
  let time = 0;
  return function (delta: number) {
    time += delta / CIRCUMFERENCE_SMALL;
    const a = time * speed * Math.PI + startYaw; // TODO speed up due to shorter circumference
    car.x = sx + Math.sin(a) * radius;// TODO const for half-pi
    car.y = sy + Math.cos(a) * radius;
    car.yaw = a - Math.PI / 2;
    const r = Math.max(0, time * speed - 1);
    if (r > 0) {
      [car.dx, car.dy] = [-car.dx, -car.dy]
      car.tx += car.dx;
      car.ty += car.dy;
      car.yaw -= Math.PI;
    }
    return r;
  }

}