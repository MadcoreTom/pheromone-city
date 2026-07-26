import { Car } from "../car";
import { TIMING } from "../constants";
import { updateSceneRange } from "../scene/util";
import { BLANK_TILE, Metric, State } from "../state";
import { Zone } from "./zone";

export class ParkZone extends Zone {
    private readonly capacity = 3;
    public height:number = 0;
    public constructor(x: number, y: number, state: State) {
        super(x, y, 2, 1, state);
    }


    public update(state: State, delta: number) {
        if (this.cars.length < this.capacity) {
            this.emitMetric(state, "entertainment");
        }


        this.cars.forEach(c=>c[0] -= delta);
        this.releaseCars(state);

        if (this.cars.length != this.height){
            this.height = this.cars.length;
            
            updateSceneRange(state, this.x, this.y, this.w, this.h);
        }

    }

    public enter(car:Car){
        this.cars.push([100,car]); // TODO temp timing
    }

    public providesNeed(metric: Metric): boolean {
        return metric == "entertainment" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `Park ${this.cars.length}/${this.capacity}`;
    }
}
