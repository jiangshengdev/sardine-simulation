import { Obstacle } from './Obstacle';

/**
 * 表示一个Boid实体，具有位置、速度、加速度等属性，并包含群居行为的方法。
 */
export class Boid {
  /**
   * 当前位置坐标。
   */
  position: [number, number];

  /**
   * 当前速度向量。
   */
  velocity: [number, number];

  /**
   * 当前加速度向量。
   */
  acceleration: [number, number];
  maxForce: number;
  maxSpeed: number;
  normalMaxSpeed: number;
  fleeMaxSpeed: number;
  color: string;
  isScattering: boolean;
  scatterTime: number;
  baseColor: string = 'hsl(210, 50%, 50%)'; // 柔和的蓝色
  panicLevel: number = 0;
  size: number;
  currentAcceleration: [number, number] = [0, 0];

  /**
   * 构造函数，初始化Boid的属性。
   * @param x 初始x坐标
   * @param y 初始y坐标
   */
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

  private adjustSteering(
    steering: [number, number],
    maxForceMultiplier: number,
  ): [number, number] {
    steering = this.setMagnitude(steering, this.maxSpeed);
    steering[0] -= this.velocity[0];
    steering[1] -= this.velocity[1];
    steering = this.limit(steering, this.maxForce * maxForceMultiplier);
    return steering;
  }

  private calculateSteering(
    boids: Boid[],
    getValue: (other: Boid) => [number, number],
    perceptionRadius: number,
    maxForceMultiplier: number = 1,
    multInverseDistance: boolean = false,
    subtractPosition: boolean = false,
  ): [number, number] {
    let steering: [number, number] = [0, 0];
    let total = 0;

    for (const other of boids) {
      const d = this.distance(other.position);
      if (other !== this && d < perceptionRadius) {
        const value = getValue(other);
        if (multInverseDistance && d !== 0) {
          value[0] /= d;
          value[1] /= d;
        }
        steering[0] += value[0];
        steering[1] += value[1];
        total++;
      }
    }

    if (total > 0) {
      steering[0] /= total;
      steering[1] /= total;

      if (subtractPosition) {
        steering[0] -= this.position[0];
        steering[1] -= this.position[1];
      }

      steering = this.adjustSteering(steering, maxForceMultiplier);
    }
    return steering;
  }

  align(boids: Boid[]): [number, number] {
    return this.calculateSteering(boids, (other) => other.velocity, 50);
  }

  cohere(boids: Boid[]): [number, number] {
    return this.calculateSteering(
      boids,
      (other) => other.position,
      100,
      1,
      false,
      true,
    );
  }

  separate(boids: Boid[]): [number, number] {
    return this.calculateSteering(
      boids,
      (other) => [
        this.position[0] - other.position[0],
        this.position[1] - other.position[1],
      ],
      30,
      1,
      true,
    );
  }

  private avoid(
    positions: [number, number][],
    perceptionRadius: number,
    maxForceMultiplier: number = 2,
  ): [number, number] {
    let steering: [number, number] = [0, 0];

    for (const position of positions) {
      const d = this.distance(position);
      if (d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - position[0],
          this.position[1] - position[1],
        ];
        diff = this.normalize(diff);
        diff[0] /= d;
        diff[1] /= d;
        steering[0] += diff[0];
        steering[1] += diff[1];
      }
    }

    if (steering[0] !== 0 || steering[1] !== 0) {
      steering = this.adjustSteering(steering, maxForceMultiplier);
    }
    return steering;
  }

  avoidShark(sharkPosition: [number, number]): [number, number] {
    const steering = this.avoid([sharkPosition], 150);

    if (steering[0] !== 0 || steering[1] !== 0) {
      this.isScattering = true;
      this.scatterTime = 100;
      this.maxSpeed = this.fleeMaxSpeed;
      this.panicLevel = 1;
    }
    return steering;
  }

  avoidObstacles(obstacles: Obstacle[]): [number, number] {
    const positions: [number, number][] = obstacles.map(
      (obstacle) => [obstacle.x, obstacle.y] as [number, number],
    );
    return this.avoid(positions, 20);
  }

  /**
   * 计算并应用所有群居行为的加速度。
   * @param boids 周围的 Boid 数组
   * @param sharkPosition 鲨鱼的位置坐标
   * @param obstacles 障碍物数组
   */
  flock(boids: Boid[], sharkPosition: [number, number], obstacles: Obstacle[]) {
    const alignment = this.align(boids); // 对齐力
    const cohesion = this.cohere(boids); // 凝聚力
    const separation = this.separate(boids); // 分离力
    const avoidance = this.avoidShark(sharkPosition); // 避开鲨鱼的力
    const obstacleAvoidance = this.avoidObstacles(obstacles); // 避障力

    const alignmentWeight = this.isScattering ? 0.2 : 1; // 对齐力权重
    const cohesionWeight = this.isScattering ? 0.2 : 1; // 凝聚力权重
    const separationWeight = this.isScattering ? 2 : 1.5; // 分离力权重
    const avoidanceWeight = this.isScattering ? 3 : 2; // 避开鲨鱼的力权重

    // 计算总加速度，增加避障权重以应对复杂环境
    const accelX =
      alignment[0] * alignmentWeight +
      cohesion[0] * cohesionWeight +
      separation[0] * separationWeight +
      avoidance[0] * avoidanceWeight +
      obstacleAvoidance[0] * 2;
    const accelY =
      alignment[1] * alignmentWeight +
      cohesion[1] * cohesionWeight +
      separation[1] * separationWeight +
      avoidance[1] * avoidanceWeight +
      obstacleAvoidance[1] * 2;

    this.acceleration[0] += accelX; // 更新加速度 X 分量
    this.acceleration[1] += accelY; // 更新加速度 Y 分量
    this.panicLevel = Math.max(0, this.panicLevel - 0.01); // 逐渐降低恐慌等级
  }

  /**
   * 更新 Boid 的位置和速度。
   * @param obstacles 障碍物数组
   */
  update(obstacles: Obstacle[]) {
    this.position[0] += this.velocity[0]; // 更新位置 X 坐标
    this.position[1] += this.velocity[1]; // 更新位置 Y 坐标
    this.velocity[0] += this.acceleration[0]; // 更新速度 X 分量
    this.velocity[1] += this.acceleration[1]; // 更新速度 Y 分量
    this.velocity = this.limit(this.velocity, this.maxSpeed); // 限制速度的大小

    this.currentAcceleration = [...this.acceleration]; // 保存当前加速度
    this.acceleration[0] = 0; // 重置加速度 X 分量
    this.acceleration[1] = 0; // 重置加速度 Y 分量

    this.updateColor(); // 更新 Boid 的颜色

    if (this.isScattering) {
      this.scatterTime--; // 分散时间递减
      if (this.scatterTime <= 0) {
        this.isScattering = false; // 结束分散状态
        this.maxSpeed = this.normalMaxSpeed; // 恢复正常最大速度
        this.panicLevel = 0; // 重置恐慌等级
      }
    }

    // 检查是否进入障碍物内部
    obstacles.forEach((obstacle) => {
      const dx = this.position[0] - obstacle.x;
      const dy = this.position[1] - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < obstacle.radius + this.size) {
        const angle = Math.atan2(dy, dx);
        // 将 Boid 的位置调整到障碍物表面
        this.position[0] =
          obstacle.x + (obstacle.radius + this.size) * Math.cos(angle);
        this.position[1] =
          obstacle.y + (obstacle.radius + this.size) * Math.sin(angle);
        // 添加推力以帮助脱离障碍物
        this.velocity[0] += Math.cos(angle) * 0.5;
        this.velocity[1] += Math.sin(angle) * 0.5;
      }
    });
  }

  /**
   * 处理Boid到达边界时的位置循环。
   * @param width 画布宽度
   * @param height 画布高度
   */
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

  /**
   * 计算当前Boid与给定点之间的距离。
   * @param point 目标点坐标
   * @returns 距离值
   */
  private distance(point: [number, number]): number {
    if (!point || point.length !== 2) {
      console.error('Invalid point provided to distance:', point);
      return Infinity;
    }
    return Math.hypot(this.position[0] - point[0], this.position[1] - point[1]);
  }

  /**
   * 设置向量的大小。
   * @param vector 原始向量
   * @param mag 目标大小
   * @returns 调整后的向量
   */
  private setMagnitude(
    vector: [number, number],
    mag: number,
  ): [number, number] {
    return this.normalize(vector).map((v) => v * mag) as [number, number];
  }

  /**
   * 标准化向量。
   * @param vector 原始向量
   * @returns 标准化后的向量
   */
  private normalize(vector: [number, number]): [number, number] {
    const mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    return mag !== 0 ? [vector[0] / mag, vector[1] / mag] : [0, 0];
  }

  /**
   * 限制向量的大小不超过最大值。
   * @param vector 原始向量
   * @param max 最大允许的大小
   * @returns 限制后的向量
   */
  private limit(vector: [number, number], max: number): [number, number] {
    const magSq = vector[0] ** 2 + vector[1] ** 2;
    if (magSq > max ** 2) {
      const mag = Math.sqrt(magSq);
      return [(vector[0] / mag) * max, (vector[1] / mag) * max];
    }
    return vector;
  }

  /**
   * 更新 Boid 的颜色，根据恐慌等级调整颜色的色调。
   */
  private updateColor() {
    const hue = 210 + (0 - 210) * this.panicLevel; // 计算颜色的色调
    this.color = `hsl(${hue}, 50%, 50%)`; // 设置 Boid 的颜色
  }
}
