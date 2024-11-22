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
  // 构造函数，初始化Boid的属性。
  constructor(x: number, y: number) {
    // 初始化位置
    this.position = [x, y];
    // 初始化速度为随机向量
    this.velocity = [Math.random() * 2 - 1, Math.random() * 2 - 1];
    // 初始化加速度为零
    this.acceleration = [0, 0];
    // 最大力
    this.maxForce = 0.2;
    // 正常最大速度
    this.normalMaxSpeed = 2;
    // 逃离时的最大速度
    this.fleeMaxSpeed = 5;
    // 当前最大速度设置为正常速度
    this.maxSpeed = this.normalMaxSpeed;
    // 初始化颜色为基础颜色
    this.color = this.baseColor;
    // 是否处于分散状态
    this.isScattering = false;
    // 分散时间计数
    this.scatterTime = 0;
    // Boid的大小
    this.size = 5;
  }

  /**
   * 调整转向向量。
   * @param steering 转向向量
   * @param maxForceMultiplier 最大力的倍数
   * @returns 调整后的转向向量
   */
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

  /**
   * 计算转向向量。
   * @param boids 周围的Boid数组
   * @param getValue 获取Boid属性的函数
   * @param perceptionRadius 感知半径
   * @param maxForceMultiplier 最大力的倍数
   * @param multInverseDistance 是否按距离反比缩放
   * @param subtractPosition 是否减去当前位置
   * @returns 计算后的转向向量
   */
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

  /**
   * 对齐行为。
   * @param boids 周围的Boid数组
   * @returns 对齐力向量
   */
  align(boids: Boid[]): [number, number] {
    return this.calculateSteering(boids, (other) => other.velocity, 50);
  }

  /**
   * 凝聚行为。
   * @param boids 周围的Boid数组
   * @returns 凝聚力向量
   */
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

  /**
   * 分离行为。
   * @param boids 周围的Boid数组
   * @returns 分离力向量
   */
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

  private avoidObstacles(obstacles: Obstacle[]): [number, number] {
    const lookAheadDistance = 50; // 前视距离
    const direction = this.normalize(this.velocity);
    const ahead: [number, number] = [
      this.position[0] + direction[0] * lookAheadDistance,
      this.position[1] + direction[1] * lookAheadDistance,
    ];

    let closestObstacle: Obstacle | null = null;
    let minDistance = Infinity;

    for (const obstacle of obstacles) {
      const d = this.distance(ahead, [obstacle.x, obstacle.y]);
      if (d < obstacle.radius + this.size && d < minDistance) {
        minDistance = d;
        closestObstacle = obstacle;
      }
    }

    if (closestObstacle) {
      const avoidance: [number, number] = [
        ahead[0] - closestObstacle.x,
        ahead[1] - closestObstacle.y,
      ];
      return this.setMagnitude(this.normalize(avoidance), this.maxForce * 2);
    }

    return [0, 0];
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
  // 更新 Boid 的位置和速度。
  update(obstacles: Obstacle[]) {
    // 更新位置
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    // 更新速度
    this.velocity[0] += this.acceleration[0];
    this.velocity[1] += this.acceleration[1];
    // 限制速度
    this.velocity = this.limit(this.velocity, this.maxSpeed);

    // 保存当前加速度
    this.currentAcceleration = [...this.acceleration];
    // 重置加速度
    this.acceleration[0] = 0;
    this.acceleration[1] = 0;

    // 更新颜色
    this.updateColor();

    if (this.isScattering) {
      // 分散时间递减
      this.scatterTime--;
      if (this.scatterTime <= 0) {
        // 结束分散状态
        this.isScattering = false;
        // 恢复正常最大速度
        this.maxSpeed = this.normalMaxSpeed;
        // 重置恐慌等级
        this.panicLevel = 0;
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
   * @param point1 第一个点坐标
   * @param point2 第二个点坐标（默认当前Boid位置）
   * @returns 距离值
   */
  private distance(
    point1: [number, number],
    point2: [number, number] = this.position,
  ): number {
    if (!point1 || point1.length !== 2 || !point2 || point2.length !== 2) {
      console.error('Invalid points provided to distance:', point1, point2);
      return Infinity;
    }
    return Math.hypot(point1[0] - point2[0], point1[1] - point2[1]);
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
