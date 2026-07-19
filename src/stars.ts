import { Car } from "./car";
import { State } from "./state";
import { PopupDetail } from "./ui/popups";
import { Zone } from "./zone/zone";

export interface Star {
    /**
     * Given the car's current target, update it't target with logic specific to this star level
     */
    chooseNextCarTarget(state: State, car: Car): void;
    /**
     * Evaluate whether to spawn a new car. If so, return a Zone to spawn them in
     */
    evaluateSpawn(state: State): null | Zone;
    /**
     * Return true if they can progress to the next star
     */
    evaluateNextStar(state: State): Star;
    /**
     * Returns the list of tool names that are enabled for this star level
     */
    listAvailableToolNames(): string[]; // TODO have better typing here
    get stars(): number;
    get popup(): PopupDetail;
}

export class OneStar implements Star {
    public readonly stars:number = 1;
    public readonly popup: PopupDetail = {
        name: "One Star",
        content: `<p><strong>One Star</strong><br>
        Cars only need a job and a home to spawn.<br>
        Reach a population of 10 to get to the next star rating</p>`,
        buttonText: "Continue"
    };
    chooseNextCarTarget(state: State, car: Car): void {
        // Simply go from work to home
        if (car.target == "housing") {
            car.target = "unemployment"
        } else {
            car.target = "housing";
        }
    }
    evaluateSpawn(state: State): null | Zone {
        let emptyHouses = 0;
        let emptyJobs = 0;
        // let emptyShops = 0;
        let houses: Zone[] = [];
        state.zones.forEach(z => {
            if (z.cars.length === 0) {
                if (z.providesNeed("housing")) {
                    emptyHouses++;
                    houses.push(z);
                }
                if (z.providesNeed("unemployment")) {
                    emptyJobs++;
                }
                // if (z.providesNeed("shopping")) {
                //     emptyShops++;
                // }
            }
        });
        if (emptyHouses > 0 && emptyJobs > 0 /*&& emptyShops > 0*/) {
            const carCount = state.cars.length;
            const carsOut = state.cars.filter(c => !c.hidden).length;
            if (carsOut < carCount * 0.5) {
                return houses[Math.floor(Math.random() * houses.length)];
            }
        }
        return null;
    }
    evaluateNextStar(state: State): Star {
        // when a population of 10 is reached
        return state.cars.length >= 10 ? new TwoStar() : this;
    }
    listAvailableToolNames(): string[] {
        throw new Error("Method not implemented.");
    }

}

export class TwoStar extends OneStar {
    public readonly stars = 2;
    public readonly popup: PopupDetail = {
        name: "Two Stars",
        content: `<p><strong>Two Stars</strong><br>
        Cars sometimes drive from their home to shops. Build some shops.<br>
        For new cars to spawn, there must be sufficient jobs, shops and homes</p>`,
        buttonText: "Continue"
    };
    evaluateSpawn(state: State): null | Zone {
        // an empty house, an empty job, and an empty shop, with <50% cars as traffic
        let emptyHouses = 0;
        let emptyJobs = 0;
        let emptyShops = 0;
        let houses: Zone[] = [];
        state.zones.forEach(z => {
            if (z.cars.length === 0) {
                if (z.providesNeed("housing")) {
                    emptyHouses++;
                    houses.push(z);
                }
                if (z.providesNeed("unemployment")) {
                    emptyJobs++;
                }
                if (z.providesNeed("shopping")) {
                    emptyShops++;
                }
            }
        });
        if (emptyHouses > 0 && emptyJobs > 0 && emptyShops > 0) {
            const carCount = state.cars.length;
            const carsOut = state.cars.filter(c => !c.hidden).length;
            if (carsOut < carCount * 0.5) {
                return houses[Math.floor(Math.random() * houses.length)];
            }
        }
        return null;
    }
    evaluateNextStar(state: State): Star {
        // when a population of 10 is reached
        return this;
    }
    chooseNextCarTarget(state: State, car: Car): void {
        // Simply go from work to home (or 20% chance to go to shops)
        if (car.target == "housing") {
            if(Math.random() < 0.2){
                car.target = "shopping";
            } else {
                car.target = "unemployment";
            }
        } else {
            car.target = "housing";
        }
    }
}

export const ALL_STAR_LEVELS : Star[] = [new OneStar(), new TwoStar()];