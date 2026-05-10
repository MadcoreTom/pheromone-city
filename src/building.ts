import { Car } from "./car";
import { BLANK_TILE, Metric, State } from "./state";

export abstract class Building {
  public constructor(
    public readonly x: number,
    public readonly y: number
  ) {
    console.log("B", x, y);
  }

  public update(state: State, writeBuffer: 0 | 1) {}

  public carArrives(car: Car) {
    car.dead = true;
  }

  public abstract getText(): string;
}

export class StandardBuilding extends Building {
  private people: number[] = []; // stores time remaining

  public constructor(
      x: number,
      y: number,
      public readonly capacity:number,
      public readonly produces: Metric,
      public readonly doNext: Metric
  ) {
    super(x,y)
  }

  public update(state: State, writeBuffer: 0 | 1) {
    if (this.people.length < this.capacity) {
      // console.log("DFg")
        state.map.get(this.x, this.y, BLANK_TILE).buffers[writeBuffer][this.produces] = 0;
    }
    this.people = this.people.map((w) => w - 1);
    if (this.people.length > 0 && this.people[0] < 0) {
      this.people.shift();
      state.cars.push(new Car(this.x + 0.5, this.y + 0.5, this.doNext));
    }
  }

  public carArrives(car: Car) {
    if (this.people.length < this.capacity) {
      car.dead = true;
      this.people.push(500);
    }
  }

  public getText(): string {
    return this.produces + ":" +this.people.length + "/" + this.capacity;
  }
}