import { Vec } from "./math";

export default class PixelQuadtree {
    private image: HTMLImageElement;

    public origin: Vec = new Vec(0, 0);
    public rootNode: PixelQuadTreeNode;
    public maxDepth: number;
    public rootScale: number;

    constructor (image: HTMLImageElement, maxDepth: number) {
        this.maxDepth = maxDepth;
        this.rootScale = Math.max(image.width, image.height);
        this.image = image;
        this.build();
    }

    private build() {
        const canvas = document.createElement("canvas");
        canvas.width = this.rootScale;
        canvas.height = this.rootScale;
        
        const ctx = canvas.getContext("2d");
        ctx.drawImage(this.image, 0, 0, this.image.width, this.image.height);
        
        const data = ctx.getImageData(0, 0, this.image.width, this.image.height);

        this.rootNode = new PixelQuadTreeNode();
        this.rootNode.build(data, this.origin, this.rootScale, 0, this.maxDepth);
    }

    public render(ctx: CanvasRenderingContext2D, renderNodes: boolean) {
        ctx.drawImage(this.image, this.origin.a, this.origin.b, this.image.width, this.image.height);
        if (renderNodes) {
            this.rootNode.render(ctx, this.origin, this.rootScale);
        }
    }
}

export class PixelQuadTreeNode {
    public solid: boolean;
    public childNodes?: PixelQuadTreeNode[];

    get isDivided(): boolean {
        return this.childNodes !== undefined;
    }

    public render(ctx: CanvasRenderingContext2D, origin: Vec, scale: number) {
        ctx.strokeStyle = this.solid ? "red" : "black";
        ctx.lineWidth = 1;

        ctx.strokeRect(origin.a, origin.b, scale, scale);

        if (this.isDivided) {
            const childScale = scale * 0.5;
            this.childNodes[0].render(ctx, origin, childScale);
            this.childNodes[1].render(ctx, origin.add(new Vec(childScale, 0)), childScale);
            this.childNodes[2].render(ctx, origin.add(new Vec(0, childScale)), childScale);
            this.childNodes[3].render(ctx, origin.addScalar(childScale), childScale);
        }
    }

    public build(data: ImageData, origin: Vec, scale: number, depth: number, maxDepth: number) {
        let solidFound = 0;
        let nonSolidFound = 0;
        for (let x = Math.floor(origin.a); x < origin.a + scale; x++) {
            for (let y = Math.floor(origin.b); y < origin.b + scale; y++) {
                const pixel = data.data[(y * data.width + x) * 4];
                if (pixel < 256 / 2) {
                    // This pixel is black
                    solidFound++
                } else {
                    nonSolidFound++;
                }
            }
        }

        if (nonSolidFound === 0) {
            // Only solid pixels where found
            this.solid = true;
            return;
        } else if (solidFound === 0) {
            // Only non-solid pixels where found
            this.solid = false;
            return;
        } else {
            // Both where found
            // Define solid depending on what was most common
            this.solid = solidFound >= nonSolidFound;
            if (depth < maxDepth) {
                // Divide the node, if possible
                const childScale = scale * 0.5;
                this.childNodes = [];
                this.childNodes.push(this.buildChild(data, origin,                             depth + 1, childScale, maxDepth));
                this.childNodes.push(this.buildChild(data, origin.add(new Vec(childScale, 0)), depth + 1, childScale, maxDepth));
                this.childNodes.push(this.buildChild(data, origin.add(new Vec(0, childScale)), depth + 1, childScale, maxDepth));
                this.childNodes.push(this.buildChild(data, origin.addScalar(childScale),       depth + 1, childScale, maxDepth));
            }
        }
    }

    private buildChild(data: ImageData, origin: Vec, depth: number, scale: number, maxDepth: number): PixelQuadTreeNode {
        const child = new PixelQuadTreeNode();
        child.build(data, origin, scale, depth, maxDepth);
        return child;
    }
}