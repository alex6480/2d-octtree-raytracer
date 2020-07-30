import Ray from "./Ray";
import { Vec, AABB, Intersect } from "./math";
import QuadTree from "./QuadTree";
import { Circle } from "./objects";
import PixelQuadTree from "./PixelQuadTree";

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
    ray = new Ray(point1, point2.subtract(point1));
}
window.onmouseup = () => { movingPoint = undefined; }
window.onmousedown = (e: MouseEvent) => {
    const point1Distance = (point1.a - e.clientX) * (point1.a - e.clientX) + (point1.b - e.clientY) * (point1.b - e.clientY);
    const point2Distance = (point2.a - e.clientX) * (point2.a - e.clientX) + (point2.b - e.clientY) * (point2.b - e.clientY);
    movingPoint = point1Distance < point2Distance ? 1 : 2;
}

const image = document.getElementById("terrainImage") as HTMLImageElement;
let tree = new PixelQuadTree(image, 9);


// Draw to screen
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#000000";

    tree.render(ctx, false);

    // Draw 10 parallel rays
    const rayCount = 150;
    for (let i = 0; i < rayCount; i++) {
        const currentRay = new Ray(ray.origin.add(new Vec(-ray.direction.b, ray.direction.a).norm().multiply(10 * (i - rayCount * 0.5))), ray.direction);
        currentRay.length = Number.POSITIVE_INFINITY;
        const tIntersect = currentRay.intersectQuadTree(tree);
        currentRay.length = tIntersect;

        ctx.strokeStyle = "blue";
        ctx.lineWidth = 2;
        drawRay(currentRay);
        ctx.lineWidth = 1;
    }

    // Traverse and draw the quad tree
    //drawQuadTree(Math.pow(2, 9), ray);
    /*const tree = new PixelQuadTree(image);
    tree.maxDepth = 9;
    tree.rootScale = 512;
    tree.origin = new Vec(0, 0);
    tree.addItem(circle);*/

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
    const boundingIntersect = ray.IntersectBox(new AABB(
        new Vec(0, 0),
        new Vec(canvas.width, canvas.height)
    ));
    let intersect: Intersect = ray.length === undefined ? boundingIntersect : {
        tMin: Math.max(Math.min(boundingIntersect.tMin, boundingIntersect.tMax), 0),
        tMax: Math.min(Math.max(boundingIntersect.tMin, boundingIntersect.tMax), ray.length)
    };

    ctx.beginPath();
    const min = ray.getPoint(intersect.tMin);
    ctx.moveTo(min.a, min.b);
    const max = ray.getPoint(intersect.tMax);
    ctx.lineTo(max.a, max.b);

    const numArrows = 10;
    const arrowSize = 3;
    for (let i = 0; i < numArrows; i++) {
        const arrowHead = ray.getPoint(intersect.tMin + (intersect.tMax - intersect.tMin) / numArrows * i);
        const arrowBegin = arrowHead.subtract(ortDir.multiply(arrowSize)).subtract(rayDir.multiply(arrowSize));
        const arrowEnd = arrowHead.add(ortDir.multiply(arrowSize)).subtract(rayDir.multiply(arrowSize));
        ctx.moveTo(arrowBegin.a, arrowBegin.b);
        ctx.lineTo(arrowHead.a, arrowHead.b);
        ctx.lineTo(arrowEnd.a, arrowEnd.b);
    }
    ctx.stroke();
}