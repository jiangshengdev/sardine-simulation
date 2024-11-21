import { Obstacle } from './Obstacle';

export class Boid {
  position: [number, number];
  velocity: [number, number];
  acceleration: [number, number];
  maxForce: number;
  maxSpeed: number;
  normalMaxSpeed: number;
  fleeMaxSpeed: number;
  color: string;
  isScattering: boolean;
  scatterTime: number;
  baseColor: string = 'hsl(210, 50%, 50%)';  // 柔和的蓝色
  panicColor: string = 'hsl(0, 50%, 50%)';   // 柔和的红色
  panicLevel: number = 0; // Add panicLevel property

  constructor(x: number, y: number) {
    this.position = [x, y];
    this.velocity = [Math.random() * 2 - 1, Math.random() * 2 - 1];
    this.acceleration = [0, 0];
    this.maxForce = 0.2;
    this.normalMaxSpeed = 2;
    this.fleeMaxSpeed = 5;
    this.maxSpeed = this.normalMaxSpeed;
    this.color = this.baseColor; // Initialize color with baseColor
    this.isScattering = false;
    this.scatterTime = 0;
  }

  align(boids: Boid[]): [number, number] {
    let perceptionRadius = 50;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (let other of boids) {
      let d = this.distance(other);
      if (other !== this && d < perceptionRadius) {
        steering[0] += other.velocity[0];
        steering[1] += other.velocity[1];
        total++;
      }
    }
    if (total > 0) {
      steering[0] /= total;
      steering[1] /= total;
      steering = this.setMagnitude(steering, this.maxSpeed);
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  cohere(boids: Boid[]): [number, number] {
    let perceptionRadius = 100;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (let other of boids) {
      let d = this.distance(other);
      if (other !== this && d < perceptionRadius) {
        steering[0] += other.position[0];
        steering[1] += other.position[1];
        total++;
      }
    }
    if (total > 0) {
      steering[0] /= total;
      steering[1] /= total;
      steering[0] -= this.position[0];
      steering[1] -= this.position[1];
      steering = this.setMagnitude(steering, this.maxSpeed);
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  separate(boids: Boid[]): [number, number] {
    let perceptionRadius = 30;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (let other of boids) {
      let d = this.distance(other);
      if (other !== this && d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - other.position[0],
          this.position[1] - other.position[1]
        ];
        diff = this.normalize(diff);
        diff[0] /= d;
        diff[1] /= d;
        steering[0] += diff[0];
        steering[1] += diff[1];
        total++;
      }
    }
    if (total > 0) {
      steering[0] /= total;
      steering[1] /= total;
      steering = this.setMagnitude(steering, this.maxSpeed);
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  avoidShark(sharkPosition: [number, number]): [number, number] {
    let perceptionRadius = 150;
    let steering: [number, number] = [0, 0];
    let d = this.distanceToPoint(sharkPosition);
    if (d < perceptionRadius) {
      let diff: [number, number] = [
        this.position[0] - sharkPosition[0],
        this.position[1] - sharkPosition[1]
      ];
      diff = this.normalize(diff);
      diff[0] /= d;
      diff[1] /= d;
      steering[0] += diff[0];
      steering[1] += diff[1];
      steering = this.setMagnitude(steering, this.maxSpeed);
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce * 2); // Stronger avoidance force
      
      // Trigger scattering behavior
      this.isScattering = true;
      this.scatterTime = 100; // Scatter for 100 frames
      this.maxSpeed = this.fleeMaxSpeed;
      this.panicLevel = 1; // Set panic level to maximum when avoiding shark
    }
    return steering;
  }

  avoidObstacles(obstacles: Obstacle[]): [number, number] {
    let perceptionRadius = 50;
    let steering: [number, number] = [0, 0];
    for (let obstacle of obstacles) {
      let d = this.distanceToPoint(obstacle.position) - obstacle.radius;
      if (d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - obstacle.position[0],
          this.position[1] - obstacle.position[1]
        ];
        diff = this.normalize(diff);
        diff[0] /= d;
        diff[1] /= d;
        steering[0] += diff[0];
        steering[1] += diff[1];
      }
    }
    if (steering[0] !== 0 || steering[1] !== 0) {
      steering = this.setMagnitude(steering, this.maxSpeed);
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce * 2); // Stronger avoidance force
    }
    return steering;
  }

  flock(boids: Boid[], sharkPosition: [number, number], obstacles: Obstacle[]) {
    let alignment = this.align(boids);
    let cohesion = this.cohere(boids);
    let separation = this.separate(boids);
    let avoidance = this.avoidShark(sharkPosition);
    let obstacleAvoidance = this.avoidObstacles(obstacles);

    let alignmentWeight = this.isScattering ? 0.2 : 1;
    let cohesionWeight = this.isScattering ? 0.2 : 1;
    let separationWeight = this.isScattering ? 2 : 1.5;
    let avoidanceWeight = this.isScattering ? 3 : 2;

    this.acceleration[0] += alignment[0] * alignmentWeight + 
                            cohesion[0] * cohesionWeight + 
                            separation[0] * separationWeight + 
                            avoidance[0] * avoidanceWeight + 
                            obstacleAvoidance[0] * 2;
    this.acceleration[1] += alignment[1] * alignmentWeight + 
                            cohesion[1] * cohesionWeight + 
                            separation[1] * separationWeight + 
                            avoidance[1] * avoidanceWeight + 
                            obstacleAvoidance[1] * 2;
    this.panicLevel = Math.max(0, this.panicLevel - 0.01); // Gradually reduce panic level
  }

  update() {
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    this.velocity[0] += this.acceleration[0];
    this.velocity[1] += this.acceleration[1];
    this.velocity = this.limit(this.velocity, this.maxSpeed);
    this.acceleration[0] = 0;
    this.acceleration[1] = 0;

    this.updateColor(); // Call the updateColor method

    if (this.isScattering) {
      this.scatterTime--;
      if (this.scatterTime <= 0) {
        this.isScattering = false;
        this.maxSpeed = this.normalMaxSpeed;
        this.panicLevel = 0; // Reset panic level
      }
    }
  }

  edges(width: number, height: number) {
    if (this.position[0] > width) {
      this.position[0] = 0;
    } else if (this.position[0] < 0) {
      this.position[0] = width;
    }
    if (this.position[1] > height) {
      this.position[1] = 0;
    } else if (this.position[1] < 0) {
      this.position[1] = height;
    }
  }

  private distance(other: Boid): number {
    return Math.sqrt(
      Math.pow(this.position[0] - other.position[0], 2) +
      Math.pow(this.position[1] - other.position[1], 2)
    );
  }

  private distanceToPoint(point: [number, number]): number {
    return Math.sqrt(
      Math.pow(this.position[0] - point[0], 2) +
      Math.pow(this.position[1] - point[1], 2)
    );
  }

  private setMagnitude(vector: [number, number], mag: number): [number, number] {
    return this.normalize(vector).map(v => v * mag) as [number, number];
  }

  private normalize(vector: [number, number]): [number, number] {
    let mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return mag !== 0 ? [vector[0] / mag, vector[1] / mag] : [0, 0];
  }

  private limit(vector: [number, number], max: number): [number, number] {
    let magSq = vector[0] * vector[0] + vector[1] * vector[1];
    if (magSq > max * max) {
      vector = this.normalize(vector).map(v => v * max) as [number, number];
    }
    return vector;
  }

  private updateColor() {
    const baseHue = 210;  // 蓝色的色相
    const panicHue = 0;   // 红色的色相
    const saturation = 50;
    const lightness = 50;

    const hue = baseHue + (panicHue - baseHue) * this.panicLevel;
    this.color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }
}

