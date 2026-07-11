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