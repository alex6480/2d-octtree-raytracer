import { QuadTreeNode, IQuadTreeItem } from "./QuadTree";
import { Vec, AABB } from "./math";

export class Circle implements IQuadTreeItem {
    public origin: Vec;
    public radius: number;

    public render(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.origin.a, this.origin.b, this.radius, 0, Math.PI * 2);
        ctx.stroke();
    }

    get boundingBox () { 
        return new AABB(this.origin.addScalar(-this.radius), this.origin.addScalar(this.radius));
    }
}