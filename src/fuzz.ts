import { Editor, JsonArray, TLDrawShape, TLShapeId, useEditor } from "@tldraw/tldraw";
import p5 from "p5";

export class FuzzyCanvas {
  editor: Editor
  p5Instance: p5
  constructor() {
    this.editor = window.editor as Editor
    console.log('constructing fuzzy canvas');

    this.p5Instance = new p5((sketch: p5) => {
      sketch.setup = () => {
        sketch.createCanvas(window.innerWidth, window.innerHeight);
        // canvas.parent('root'); // Specify the parent element's ID
        sketch.background(255);
      };
      sketch.draw = () => {
        sketch.background(255); // Clear the background each frame
        const shapes = this.editor.getCurrentPageShapes();
        this.drawHeatmap(sketch, shapes);
      };
    });

    this.editor.store.onAfterChange = (prev, next, _) => {
      if (next.typeName === "pointer") return
      if (next.typeName === "instance") return
      console.log('changing');
      this.p5Instance.redraw();

      // const shapes = this.editor.getCurrentPageShapes()
      // this.p5Instance.clear();
      // Object.values(shapes).forEach(shape => {
      //   const x = shape.x
      //   const y = shape.y
      //   this.p5Instance.fill('orange'); // Set fill color to blue
      //   this.p5Instance.rect(x, y, shape.props.w, shape.props.h); // Draw an ellipse at the shape's position
      // });
      // return;
    }

  }
  drawHeatmap(sketch: p5, shapes: TLDrawShape[]) {
    const gridSize = 6; // Smaller grid size for a smoother effect
    // Initialize a 2D array to accumulate heat values, each cell starts as 0
    let heatMap = Array(Math.ceil(sketch.width / gridSize)).fill(0)
      .map(() => Array(Math.ceil(sketch.height / gridSize)).fill(0));

    shapes.forEach((shape) => {
      for (let x = 0; x < sketch.width; x += gridSize) {
        for (let y = 0; y < sketch.height; y += gridSize) {
          // Calculate distances to the edges of the rectangle
          const leftEdge = shape.x;
          const rightEdge = shape.x + shape.props.w;
          const topEdge = shape.y;
          const bottomEdge = shape.y + shape.props.h;

          // Find the closest x and y coordinates on the rectangle to the point (x, y)
          const closestX = Math.max(leftEdge, Math.min(x, rightEdge));
          const closestY = Math.max(topEdge, Math.min(y, bottomEdge));

          // Calculate the distance from the point to the closest point on the rectangle
          const dist = sketch.dist(x, y, closestX, closestY);

          // Use an exponential falloff for heat based on distance
          const heat = Math.exp(-dist / 60); // Adjust the divisor for falloff rate

          // Accumulate the heat in the cell
          heatMap[Math.floor(x / gridSize)][Math.floor(y / gridSize)] += heat;
        }
      }
    });

    // Draw the heatmap based on accumulated heat exceeding a threshold
    for (let x = 0; x < sketch.width; x += gridSize) {
      for (let y = 0; y < sketch.height; y += gridSize) {
        const heat = heatMap[Math.floor(x / gridSize)][Math.floor(y / gridSize)];
        // Adjust the threshold and color mapping as needed
        if (heat > 0.3) { // Lower threshold for visualizing proximity
          // Map heat to color more dynamically
          const colorIntensity = Math.min(255, heat * 255); // Scale and cap color intensity
          sketch.fill(255, 100, 0, colorIntensity);
          sketch.noStroke();
          sketch.rect(x, y, gridSize, gridSize);
        }
      }
    }
  }
}