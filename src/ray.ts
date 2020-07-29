import { Vec, Box, Intersect } from "./math";

export default class Ray {
    public origin: Vec;
    public direction: Vec;

    constructor(origin: Vec, direction: Vec) {
        this.origin = origin;
        this.direction = direction.norm();
    }

    public IntersectBox (box: Box): Intersect {
        // Caculate the intersect
        return {
            tMin: Math.max(this.gettx(box.a.a), this.getty(box.a.b)),
            tMax: Math.min(this.gettx(box.b.a), this.getty(box.b.b)),
        }
    }

    public gettx(x: number) {
        return (x - this.origin.a) / this.direction.a;
    }

    public getty(y: number) {
        return (y - this.origin.b) / this.direction.b;
    }

    public absGettx(x: number) {
        return (x - this.origin.a) / Math.abs(this.direction.a);
    }

    public absGetty(y: number) {
        return (y - this.origin.b) / Math.abs(this.direction.b);
    }

    public getPoint(t: number) {
        return this.origin.add(this.direction.multiply(t));
    }
}