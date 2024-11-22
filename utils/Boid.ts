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
  baseColor: string = 'hsl(210, 50%, 50%)';  // 柔和的蓝色
  panicColor: string = 'hsl(0, 50%, 50%)';   // 柔和的红色
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

  /**
   * 计算对齐行为的力，使当前 Boid 的速度与邻居 Boid 的平均速度对齐。
   * @param boids 周围的 Boid 数组
   * @returns 对齐力向量
   */
  align(boids: Boid[]): [number, number] {
    const perceptionRadius = 50; // 感知半径，Boid 只能感知该范围内的其他 Boid
    let steering: [number, number] = [0, 0]; // 初始化转向力为零向量
    let total = 0; // 感知范围内的 Boid 数量

    // 遍历所有 Boid，计算感知范围内的 Boid 的平均速度
    for (const other of boids) {
      const d = this.distance(other.position); // 计算与其他 Boid 的距离
      if (other !== this && d < perceptionRadius) {
        steering[0] += other.velocity[0]; // 累加邻居 Boid 的速度
        steering[1] += other.velocity[1];
        total++;
      }
    }

    if (total > 0) {
      steering[0] /= total; // 计算速度平均值
      steering[1] /= total;
      steering = this.setMagnitude(steering, this.maxSpeed); // 将平均速度调整为最大速度
      steering[0] -= this.velocity[0]; // 计算转向力（期望速度 - 当前速度）
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce); // 限制转向力的最大值
    }
    return steering; // 返回对齐力向量
  }

  /**
   * 计算凝聚行为的力，使当前 Boid 朝向邻居 Boid 的中心移动。
   * @param boids 周围的 Boid 数组
   * @returns 凝聚力向量
   */
  cohere(boids: Boid[]): [number, number] {
    const perceptionRadius = 100; // 感知半径
    let steering: [number, number] = [0, 0]; // 初始化转向力为零向量
    let total = 0; // 感知范围内的 Boid 数量

    // 遍历所有 Boid，计算感知范围内的 Boid 的平均位置
    for (const other of boids) {
      const d = this.distance(other.position);
      if (other !== this && d < perceptionRadius) {
        steering[0] += other.position[0]; // 累加邻居 Boid 的位置
        steering[1] += other.position[1];
        total++;
      }
    }

    if (total > 0) {
      steering[0] /= total; // 计算位置平均值
      steering[1] /= total;
      steering[0] -= this.position[0]; // 计算朝向质心的向量
      steering[1] -= this.position[1];
      steering = this.setMagnitude(steering, this.maxSpeed); // 将向量调整为最大速度
      steering[0] -= this.velocity[0]; // 计算转向力
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce); // 限制转向力的最大值
    }
    return steering; // 返回凝聚力向量
  }

  /**
   * 计算分离行为的力，使当前 Boid 远离过于靠近的邻居 Boid，避免碰撞。
   * @param boids 周围的 Boid 数组
   * @returns 分离力向量
   */
  separate(boids: Boid[]): [number, number] {
    const perceptionRadius = 30; // 感知半径
    let steering: [number, number] = [0, 0]; // 初始化转向力为零向量
    let total = 0; // 感知范围内的 Boid 数量

    // 遍历所有 Boid，计算远离邻居 Boid 的力
    for (const other of boids) {
      const d = this.distance(other.position);
      if (other !== this && d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - other.position[0],
          this.position[1] - other.position[1]
        ];
        diff = this.normalize(diff); // 归一化方向向量
        diff[0] /= d; // 与距离成反比，距离越近，力越大
        diff[1] /= d;
        steering[0] += diff[0]; // 累加分离力
        steering[1] += diff[1];
        total++;
      }
    }

    if (total > 0) {
      steering[0] /= total; // 计算平均分离力
      steering[1] /= total;
      steering = this.setMagnitude(steering, this.maxSpeed); // 将向量调整为最大速度
      steering[0] -= this.velocity[0]; // 计算转向力
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce); // 限制转向力的最大值
    }
    return steering; // 返回分离力向量
  }

  /**
   * 计算避开鲨鱼的力，当鲨鱼接近时使 Boid 远离鲨鱼。
   * @param sharkPosition 鲨鱼的位置坐标
   * @returns 避开力向量
   */
  avoidShark(sharkPosition: [number, number]): [number, number] {
    const perceptionRadius = 150; // 感知鲨鱼的范围
    let steering: [number, number] = [0, 0];
    const d = this.distance(sharkPosition);

    if (d < perceptionRadius) {
      // 计算远离鲨鱼的方向向量
      let diff: [number, number] = [
        this.position[0] - sharkPosition[0],
        this.position[1] - sharkPosition[1]
      ];
      diff = this.normalize(diff); // 归一化方向向量
      diff[0] /= d; // 与距离成反比，距离越近，力越大
      diff[1] /= d;
      steering[0] += diff[0]; // 累加避开鲨鱼的力
      steering[1] += diff[1];
      steering = this.setMagnitude(steering, this.maxSpeed); // 将向量调整为最大速度
      steering[0] -= this.velocity[0]; // 计算转向力
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce * 2); // 增强避开鲨鱼的力

      // 触发分散行为
      this.isScattering = true;
      this.scatterTime = 100; // 分散持续的时间帧数
      this.maxSpeed = this.fleeMaxSpeed; // 提高最大速度以加速逃离
      this.panicLevel = 1; // 设置恐慌等级为最高
    }
    return steering; // 返回避开力向量
  }

  /**
   * 计算避开障碍物的力，防止 Boid 撞上障碍物。
   * @param obstacles 障碍物数组
   * @returns 避障力向量
   */
  avoidObstacles(obstacles: Obstacle[]): [number, number] {
    const perceptionRadius = 20; // 感知障碍物的范围
    let steering: [number, number] = [0, 0];

    // 遍历所有障碍物，计算避开力
    for (const obstacle of obstacles) {
      const d = this.distance([obstacle.x, obstacle.y]) - obstacle.radius;
      if (d < perceptionRadius) {
        let diff: [number, number] = [
          this.position[0] - obstacle.x,
          this.position[1] - obstacle.y
        ];
        diff = this.normalize(diff); // 归一化方向向量
        diff[0] /= d; // 与距离成反比
        diff[1] /= d;
        steering[0] += diff[0]; // 累加避障力
        steering[1] += diff[1];
      }
    }

    if (steering[0] !== 0 || steering[1] !== 0) {
      steering = this.setMagnitude(steering, this.maxSpeed); // 调整向量至最大速度
      steering[0] -= this.velocity[0]; // 计算转向力
      steering[1] -= this.velocity[1];
      steering = this.limit(steering, this.maxForce * 2); // 增强避障力
    }
    return steering; // 返回避障力向量
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
    obstacles.forEach(obstacle => {
      const dx = this.position[0] - obstacle.x;
      const dy = this.position[1] - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < obstacle.radius + this.size) {
        const angle = Math.atan2(dy, dx);
        // 将 Boid 的位置调整到障碍物表面
        this.position[0] = obstacle.x + (obstacle.radius + this.size) * Math.cos(angle);
        this.position[1] = obstacle.y + (obstacle.radius + this.size) * Math.sin(angle);
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
  private setMagnitude(vector: [number, number], mag: number): [number, number] {
    return this.normalize(vector).map(v => v * mag) as [number, number];
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
      return [vector[0] / mag * max, vector[1] / mag * max];
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
