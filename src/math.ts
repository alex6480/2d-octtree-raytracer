export class Vec {
    public a: number;
    public b: number;

    constructor(a: number, b:number) {
        this.a = a;
        this.b = b;
    }

    public add(b: Vec) {
        return new Vec(this.a + b.a, this.b + b.b);
    }

    public subtract(b: Vec) {
        return new Vec(this.a - b.a, this.b - b.b);
    }

    public addScalar(a: number) {
        return new Vec(this.a + a, this.b + a);
    }

    public multiply(a: number) {
        return new Vec(this.a  * a, this.b * a);
    }

    public length() {
        return Math.sqrt(this.a * this.a + this.b * this.b)
    }

    public norm() {
        const length = this.length();
        return new Vec(this.a / length, this.b / length);
    }
}

export class Box {
    public a: Vec;
    public b: Vec;
}

export class Intersect {
    public tMin: number;
    public tMax: number;
}