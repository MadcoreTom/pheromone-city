export class OnChange<T> {
    private subscriptions: ((value: T) => unknown)[] = [];

    public constructor(private _value: T) {

    }

    public set value(v: T) {
        if (v !== this._value) {
            this._value = v;
            this.subscriptions.forEach(s => s(v));
        }
    }

    public get value(): T {
        return this._value
    }

    public subscribe(callback: (v: T) => unknown): void {
        this.subscriptions.push(callback);
        callback(this._value);
    }
}

/**
 * Holds up to n of type T. 
 * Notifies subscribers if the most common value changes
 */
export class CommonTag<T> {
    private map: Map<T, number> = new Map();
    private queue: T[] = [];
    public readonly mostCommon: OnChange<T>;

    public constructor(start: T, private readonly length: number) {
        this.queue.push(start);
        this.map.set(start, 1);
        this.mostCommon = new OnChange(start);
    }

    public subscribe(callback: (v: T) => unknown): void {
        this.mostCommon.subscribe(callback);
    }

    public add(v: T) {
        this.queue.push(v);
        this.count(v, 1);
        while (this.queue.length > this.length) {
            const remove = this.queue.shift() as T;
            this.count(remove, -1);
        }
        // find the most common one
        let max = 0;
        let maxVal = this.queue[0];
        
        [...this.map.entries()].forEach(([key, value])=>{
            if(value > max){
                max = value;
                maxVal = key;
            }
        });
        this.mostCommon.value  =maxVal;
    }

    private count(key: T, increment: number) :number{
        const count = this.map.get(key)
        if (count) {
            if (count + increment == 0) {
                this.map.delete(key);
            } else {
                this.map.set(key, count + increment);
            }
           return count + increment;
        }
        return 0;
    }
}