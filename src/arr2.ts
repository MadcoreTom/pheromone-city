
export class Arr2<T> {
    private data: T[][];
    public constructor(
        public readonly width: number,
        public readonly height: number,
        populate: (x: number, y: number) => T
    ) {
        this.data = [];
        let i = 0;
        for (let x = 0; x < width; x++) {
            this.data[x] = [];
            for (let y = 0; y < height; y++) {
                this.data[x][y] = populate(x, y);
            }
        }
    }

    public get(x: number, y: number, defaultVal: T): T {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return defaultVal;
        }
        return this.data[x][y];
    }


    public getIf(x: number, y: number, callback: (v: T) => unknown): void {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return;
        }
        callback(this.data[x][y]);
    }


    public forEach(callback: (x: number, y: number, value: T) => unknown): void {
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                callback(x, y, this.data[x][y]);
            }
        }
    }

    public mapRange(
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        callback: (x: number, y: number, value: T) => T
    ): void {
        ex = Math.min(ex, this.width);
        ey = Math.min(ey, this.height);
        for (let x = Math.max(0, sx); x < ex; x++) {
            for (let y = Math.max(0, sy); y < ey; y++) {
                this.data[x][y] = callback(x, y, this.data[x][y]);
            }
        }
    }

    public forEachRange(
        sx: number,
        sy: number,
        ex: number,
        ey: number,
        callback: (x: number, y: number, value: T) => unknown
    ): void {
        ex = Math.min(ex, this.width);
        ey = Math.min(ey, this.height);
        for (let x = Math.max(0, sx); x < ex; x++) {
            for (let y = Math.max(0, sy); y < ey; y++) {
                callback(x, y, this.data[x][y]);
            }
        }
    }

    public forEachWithNeighbours(
        defaultVal: T,
        callback: (
            x: number,
            y: number,
            value: T,
            left: T,
            up: T,
            right: T,
            down: T
        ) => unknown
    ): void {
        let left: T;
        let up: T;
        let right: T;
        let down: T;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                left = x <= 0 ? defaultVal : this.data[x - 1][y];
                up = y <= 0 ? defaultVal : this.data[x][y - 1];
                right = x >= this.width - 1 ? defaultVal : this.data[x + 1][y];
                down = y >= this.height - 1 ? defaultVal : this.data[x][y + 1];
                callback(x, y, this.data[x][y], left, up, right, down);
            }
        }
    }

    public getNeighboursUDLR(
        x: number,
        y: number,
        defaultVal: T,
    ): [T, T, T, T] {
        let left: T;
        let up: T;
        let right: T;
        let down: T;
        left = x <= 0 ? defaultVal : this.data[x - 1][y];
        up = y <= 0 ? defaultVal : this.data[x][y - 1];
        right = x >= this.width - 1 ? defaultVal : this.data[x + 1][y];
        down = y >= this.height - 1 ? defaultVal : this.data[x][y + 1];
        return [up, down, left, right];
    }
}
