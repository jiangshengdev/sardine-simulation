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
  size: number; // 添加 size 属性

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
    this.size = 5; // 初始化 size
  }

  align(boids: Boid[]): [number, number] {
    const perceptionRadius = 50;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
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
    const perceptionRadius = 100;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
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
    const perceptionRadius = 30;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
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
    const perceptionRadius = 150;
    let steering: [number, number] = [0, 0];
    const d = this.distance(sharkPosition);
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
    const perceptionRadius = 50;
    let steering: [number, number] = [0, 0];
    for (const obstacle of obstacles) {
      // 修改为使用 [obstacle.x, obstacle.y]
      const d = this.distance([obstacle.x, obstacle.y]) - obstacle.radius;
      if (d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - obstacle.x,
          this.position[1] - obstacle.y
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
      steering = this.limit(steering, this.maxForce * 2); // 强化避障力
    }
    return steering;
  }

  flock(boids: Boid[], sharkPosition: [number, number], obstacles: Obstacle[]) {
    const alignment = this.align(boids);
    const cohesion = this.cohere(boids);
    const separation = this.separate(boids);
    const avoidance = this.avoidShark(sharkPosition);
    const obstacleAvoidance = this.avoidObstacles(obstacles);

    const alignmentWeight = this.isScattering ? 0.2 : 1;
    const cohesionWeight = this.isScattering ? 0.2 : 1;
    const separationWeight = this.isScattering ? 2 : 1.5;
    const avoidanceWeight = this.isScattering ? 3 : 2;

    const accelX = alignment[0] * alignmentWeight + 
                   cohesion[0] * cohesionWeight + 
                   separation[0] * separationWeight + 
                   avoidance[0] * avoidanceWeight + 
                   obstacleAvoidance[0] * 2;
    const accelY = alignment[1] * alignmentWeight + 
                   cohesion[1] * cohesionWeight + 
                   separation[1] * separationWeight + 
                   avoidance[1] * avoidanceWeight + 
                   obstacleAvoidance[1] * 2;

    this.acceleration[0] += accelX;
    this.acceleration[1] += accelY;
    this.panicLevel = Math.max(0, this.panicLevel - 0.01); // Gradually reduce panic level
  }

  update(obstacles: Obstacle[]) {
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

    // 检查是否进入障碍物内部
    obstacles.forEach(obstacle => {
      const dx = this.position[0] - obstacle.x;
      const dy = this.position[1] - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < obstacle.radius + this.size) {
        const angle = Math.atan2(dy, dx);
        this.position[0] = obstacle.x + (obstacle.radius + this.size) * Math.cos(angle);
        this.position[1] = obstacle.y + (obstacle.radius + this.size) * Math.sin(angle);
        // 添加推力以帮助鲨鱼脱离障碍物
        this.velocity[0] += Math.cos(angle) * 0.5;
        this.velocity[1] += Math.sin(angle) * 0.5;
      }
    });
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

  // 合并 distance 和 distanceToPoint 函数
  private distance(point: [number, number]): number {
    if (!point || point.length !== 2) {
      console.error('Invalid point provided to distance:', point);
      return Infinity;
    }
    return Math.hypot(this.position[0] - point[0], this.position[1] - point[1]);
  }

  private setMagnitude(vector: [number, number], mag: number): [number, number] {
    return this.normalize(vector).map(v => v * mag) as [number, number];
  }

  private normalize(vector: [number, number]): [number, number] {
    const mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return mag !== 0 ? [vector[0] / mag, vector[1] / mag] : [0, 0];
  }

  // 优化 limit 函数
  private limit(vector: [number, number], max: number): [number, number] {
    const magSq = vector[0] ** 2 + vector[1] ** 2;
    if (magSq > max ** 2) {
      const mag = Math.sqrt(magSq);
      return [vector[0] / mag * max, vector[1] / mag * max]; // 移除第二个元素的额外数组括号
    }
    return vector;
  }

  // 重构 updateColor 方法
  private updateColor() {
    const hue = 210 + (0 - 210) * this.panicLevel;
    this.color = `hsl(${hue}, 50%, 50%)`;
  }
}

