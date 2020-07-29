import { Vec, Box, Intersect } from "./math";

export default class Ray {
    public origin: Vec;
    public direction: Vec;

    public inverseDirection: Vec;

    constructor(origin: Vec, direction: Vec) {
        this.origin = origin;
        this.direction = direction.norm();
        this.inverseDirection = new Vec(1 / this.direction.a, 1 / this.direction.b);
    }

    public IntersectBox (box: Box): Intersect {
        // Caculate the intersect
        return {
            tMin: Math.max(this.gettx(box.a.a), this.getty(box.a.b)),
            tMax: Math.min(this.gettx(box.b.a), this.getty(box.b.b)),
        }
    }

    public gettx(x: number) {
        return (x - this.origin.a) * this.inverseDirection.a;
    }

    public getty(y: number) {
        return (y - this.origin.b) * this.inverseDirection.b;
    }

    public getPoint(t: number) {
        return this.origin.add(this.direction.multiply(t));
    }
}