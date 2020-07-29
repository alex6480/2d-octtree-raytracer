import Ray from "./ray";
import { Vec, Box, Intersect } from "./math";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d");

// Automatically fill screen with canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.onresize = resizeCanvas;
resizeCanvas();

ctx.fillStyle = "333";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Define objects
let point1 = new Vec(100, 100);
let point2 = new Vec(500, 500);
let ray = new Ray(point1, point1.subtract(point2));
let movingPoint: 1 | 2 | undefined = undefined;

window.onmousemove = (e: MouseEvent) => {
    // Rays cannot be perfectly vertical or horizontal or intersection will not work
    if (movingPoint === 1) {
        point1 = new Vec(e.clientX, e. clientY);
    } else if(movingPoint === 2) {
        point2 = new Vec(e.clientX, e.clientY);
    }
    ray = new Ray(point1, point1.subtract(point2));
}
window.onmouseup = () => { movingPoint = undefined; }
window.onmousedown = (e: MouseEvent) => {
    const point1Distance = (point1.a - e.clientX) * (point1.a - e.clientX) + (point1.b - e.clientY) * (point1.b - e.clientY);
    const point2Distance = (point2.a - e.clientX) * (point2.a - e.clientX) + (point2.b - e.clientY) * (point2.b - e.clientY);
    movingPoint = point1Distance < point2Distance ? 1 : 2;
}

// Draw to screen
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";

    // Draw the ray
    drawRay(ray);

    // Traverse and draw the quad tree
    drawQuadTree(Math.pow(2, 9), ray);

    // Draw the points
    ctx.fillStyle = "red";
    ctx.beginPath();
    ctx.arc(point1.a, point1.b, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point2.a, point2.b, 5, 0, 2 * Math.PI);
    ctx.fill();

    requestAnimationFrame(draw);
}
requestAnimationFrame(draw);

function drawRay(ray: Ray) {
    const rayDir = ray.direction;
    const ortDir = new Vec(-rayDir.b, rayDir.a);
    // First intersect the ray with the bounding box
    var intersect = ray.IntersectBox({
        a: new Vec(0, 0),
        b: new Vec(canvas.width, canvas.height)
    });

    ctx.beginPath();
    const min = ray.getPoint(intersect.tMin);
    ctx.moveTo(min.a, min.b);
    const max = ray.getPoint(intersect.tMax);
    ctx.lineTo(max.a, max.b);

    const numArrows = 10;
    for (let i = 0; i < numArrows; i++) {
        const arrowHead = ray.getPoint(intersect.tMin + (intersect.tMax - intersect.tMin) / 10 * i);
        const arrowBegin = arrowHead.subtract(ortDir.multiply(5)).subtract(rayDir.multiply(5));
        const arrowEnd = arrowHead.add(ortDir.multiply(5)).subtract(rayDir.multiply(5));
        ctx.moveTo(arrowBegin.a, arrowBegin.b);
        ctx.lineTo(arrowHead.a, arrowHead.b);
        ctx.lineTo(arrowEnd.a, arrowEnd.b);
    }
    ctx.stroke();
}

type QuadNode = {
    index: number,
    origin: Vec,
    mayDescend: boolean,
};

function drawQuadTree(rootSize: number, ray: Ray) {
    // Ray mirrored so it enters the box from the top left.
    // This allows implementing code, assuming that this is the case and using a bitmask to get correct code
    const tlRay = new Ray(
        new Vec(ray.direction.a < 0 ? -ray.origin.a + rootSize : ray.origin.a, ray.direction.b < 0 ? -ray.origin.b + rootSize : ray.origin.b),
        new Vec(Math.abs(ray.direction.a), Math.abs(ray.direction.b)));

    // Bitmask use to fix child indices if ray isn't traveling in +/+ direction
    const childIndexMask = (ray.direction.a > 0 ? 0 : 1) + (ray.direction.b > 0 ? 0 : 2);

    const maxDepth = 9;
    currentNode = 0;

    // Draw the root node
    drawTreeNode(new Vec(0, 0), rootSize, rootSize, childIndexMask);

    let stack: QuadNode[] = [];

    // Push the root node to the stack
    // In a real implementation mayDescend would be determined by whether or not the node has any children
    stack.push({
        index: 0,
        origin: new Vec(0, 0),
        mayDescend: true,
    });

    do {
        const scale = rootSize / Math.pow(2, stack.length - 1);
        const currentNode = stack[stack.length - 1];

        // Descend to the first child
        if (currentNode.mayDescend) {
            let childIndex = getFirstChildIndex(tlRay, currentNode, scale);
            // Since the tree is traversed using a mirrored ray, the actual child index is childIndex ^ childIndexMask
            let childOrigin = getChildOrigin(currentNode.origin, scale, childIndex);
            stack.push({
                index: childIndex,
                origin: childOrigin,
                mayDescend: stack.length + 1 < maxDepth
            });
            drawTreeNode(childOrigin, scale * 0.5, rootSize, childIndexMask);
        } else {
            // We are at the max depth. Attempt to move on to the adjacent child instead
            const childIndex = getNextChildIndex(currentNode.origin, scale, currentNode.index, tlRay);

            if (childIndex !== null) {
                // Adjacent child was found
                stack[stack.length - 1] = {
                    index: childIndex,
                    origin: getChildOrigin(stack[stack.length - 2].origin, scale * 2, childIndex),
                    mayDescend: stack.length < maxDepth,
                }
                drawTreeNode(stack[stack.length - 1].origin, scale, rootSize, childIndexMask);
            } else {
                // No adjacent child was found.
                stack.pop();
                stack[stack.length - 1].mayDescend = false;
            }
        }
    } while (stack.length > 1);
}

let currentNode = 0;
function drawTreeNode(origin: Vec, size: number, rootSize: number, childIndexMask: number) {
    let x0 = origin.a;
    let y0 = origin.b;
    if ((childIndexMask & 1) !== 0) {
        // Mirror the position of the node horizontally relatively to the root
        x0 = rootSize - origin.a - size;
    }
    if ((childIndexMask & 2) !== 0) {
        // Mirror the position of the node horizontally relatively to the root
        y0 = rootSize - origin.b - size;
    }

    ctx.textBaseline = "top";
    ctx.font = "20px Verdana";
    // ctx.fillText(currentNode.toString(), x0, y0);
    ctx.strokeRect(x0, y0, size, size);

    currentNode += 1;
}

function getParentOrigin(childOrigin: Vec, rootOrigin: Vec, parentSize: number) {
    // Get position relative to rootOrigin
    const pos = childOrigin.subtract(rootOrigin);
    const parentOrigin = new Vec(
        Math.floor(pos.a / parentSize) * parentSize + rootOrigin.a,
        Math.floor(pos.b / parentSize) * parentSize + rootOrigin.b,
    );
    return parentOrigin;
}

/**
 * Gets the index of the first child the ray enters in the quad-node.
 * Assumes that the ray has a x+, y+ direction. Other rays must be mirrored to become x+, y+ and the mask can be used to get the correct result
 * @param ray The ray entering the quad-node. The ray must originate from top left.
 * @param parentNode The parent node
 * @param parentScale The scale of the parent node
 * @param mask If the ray didn't originally come from top left, the mask can be used to get the correct index for the orientaiton
 */
function getFirstChildIndex(ray: Ray, parentNode: QuadNode, parentScale: number) {
    const tx0 = ray.gettx(parentNode.origin.a);
    const tx1 = ray.gettx(parentNode.origin.a + parentScale * 0.5);
    const ty0 = ray.getty(parentNode.origin.b);
    const ty1 = ray.getty(parentNode.origin.b + parentScale * 0.5);

    // The ray enters in one of the top two squares
    // ty1 < tx0 -> The ray enters square 2 (from the left side)
    // tx1 < ty0 -> The ray enters square 1 (from the top side)
    // If neither, the ray enters square 0

    return ((ty1 < tx0 ? 1 : 0) * 2 + (tx1 < ty0 ? 1 : 0));
}

function getChildOrigin(parentOrigin: Vec, parentScale: number, childIndex: number) {
    return new Vec(
        (childIndex & 1) * parentScale * 0.5,
        (childIndex & 2) * 0.5 * parentScale * 0.5,
    ).add(parentOrigin);
}

function getNextChildIndex(currentChildOrigin: Vec, childSize: number, currentChildIndex: number, ray: Ray): number | null {
    // Since it is assumed that the ray moves in the +/+ direction
    // The ray can only exit the current child below or to the right
    const tRight = ray.gettx(currentChildOrigin.a + childSize);
    const tBottom = ray.getty(currentChildOrigin.b + childSize);

    const nextChildIndex = currentChildIndex | (tRight < tBottom ? 1 : 2);
    if (nextChildIndex === currentChildIndex) {
        return null;
    }
    return nextChildIndex;
}