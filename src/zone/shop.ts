import { Car } from "../car";
import { TIMING } from "../constants";
import { Metric, State } from "../state";
import { Zone } from "./zone";

export class ShopZone extends Zone {
    private readonly capacity = 1;
    public constructor(x: number, y: number, state: State) {
        super(x, y, 2, 3, state);
    }


    public update(state: State, delta: number) {
        if (this.cars.length < this.capacity) {
            this.emitMetric(state, "shopping");
        }
        

        this.cars.forEach(c=>c[0] -= delta);
        this.releaseCars(state);
    }


    public enter(car:Car){
        this.cars.push([TIMING.SHOP_SHOPPING_MS,car]);
    }


    public providesNeed(metric: Metric): boolean {
        return metric == "shopping" && this.cars.length < this.capacity;
    }

    public getText(): string {
        return `Shop ${this.cars.length}/${this.capacity}`;
    }
}