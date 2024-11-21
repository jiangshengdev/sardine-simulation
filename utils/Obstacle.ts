export class Obstacle {
  position: [number, number];
  radius: number;

  constructor(x: number, y: number, radius: number) {
    this.position = [x, y];
    this.radius = radius;
  }
}

