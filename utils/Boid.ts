// 导入 Obstacle 类，用于表示障碍物
import { Obstacle } from './Obstacle';

// 定义 Boid 类，表示鱼群中的个体
export class Boid {
  // 位置，Boid 在二维空间的坐标 [x, y]
  position: [number, number];
  // 速度，Boid 的移动速度矢量 [vx, vy]
  velocity: [number, number];
  // 加速度，Boid 的当前加速度矢量 [ax, ay]
  acceleration: [number, number];
  // 最大受力，限制 Boid 的加速度，防止突然加速过大
  maxForce: number;
  // 最大速度，限制 Boid 的速度，防止移动过快
  maxSpeed: number;
  // 正常最大速度，Boid 在正常情况下的最大速度
  normalMaxSpeed: number;
  // 逃离时最大速度，Boid 在受惊时的最大速度
  fleeMaxSpeed: number;
  // 颜色，用于绘制 Boid
  color: string;
  // 是否正在散开，表示 Boid 是否处于受惊状态
  isScattering: boolean;
  // 散开时间，Boid 处于受惊状态的剩余时间帧数
  scatterTime: number;
  // 基础颜色，Boid 在正常状态下的颜色
  baseColor: string = 'hsl(210, 50%, 50%)';
  // 惊慌程度，0 表示镇定，1 表示极度惊慌，用于计算颜色
  panicLevel: number = 0;
  // 大小，用于绘制 Boid 的尺寸
  size: number;
  // 当前加速度，用于记录 Boid 本次更新的加速度
  currentAcceleration: [number, number] = [0, 0];

  // 构造函数，初始化 Boid 实例
  constructor(x: number, y: number) {
    // 设置初始位置为传入的坐标
    this.position = [x, y];
    // 初始化速度为随机方向，确保 Boid 在开始时有运动
    this.velocity = [Math.random() * 2 - 1, Math.random() * 2 - 1];
    // 初始加速度为零向量
    this.acceleration = [0, 0];
    // 设置最大受力和速度参数
    this.maxForce = 0.2;
    this.normalMaxSpeed = 2;
    this.fleeMaxSpeed = 5;
    // 将最大速度设置为正常最大速度
    this.maxSpeed = this.normalMaxSpeed;
    // 设置初始颜色和状态
    this.color = this.baseColor;
    this.isScattering = false;
    this.scatterTime = 0;
    // 设置 Boid 的大小
    this.size = 5;
  }

  // 对齐行为，使 Boid 的速度与周围个体的平均速度对齐
  align(boids: Boid[]): [number, number] {
    // 感知范围半径，Boid 只能感知到该范围内的其他个体
    const perceptionRadius = 50;
    // 转向向量，用于调整 Boid 的速度
    let steering: [number, number] = [0, 0];
    // 周围邻居的数量
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
      // 检查其他 Boid 是否在感知范围内且不是自身
      if (other !== this && d < perceptionRadius) {
        // 累加邻居的速度向量
        steering[0] += other.velocity[0];
        steering[1] += other.velocity[1];
        total++;
      }
    }
    if (total > 0) {
      // 计算邻居的平均速度向量
      steering[0] /= total;
      steering[1] /= total;
      // 将平均速度调整为 Boid 的最大速度方向
      steering = this.setMagnitude(steering, this.maxSpeed);
      // 计算需要的转向力，即期望速度减去当前速度
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      // 限制转向力度为最大受力
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  // 凝聚行为，使 Boid 移向周围个体的中心位置
  cohere(boids: Boid[]): [number, number] {
    // 感知范围半径，影响凝聚程度
    const perceptionRadius = 100;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
      if (other !== this && d < perceptionRadius) {
        // 累加邻居的位置坐标
        steering[0] += other.position[0];
        steering[1] += other.position[1];
        total++;
      }
    }
    if (total > 0) {
      // 计算邻居的平均位置
      steering[0] /= total;
      steering[1] /= total;
      // 生成指向邻居平均位置的向量
      steering[0] -= this.position[0];
      steering[1] -= this.position[1];
      // 将向量调整为最大速度方向
      steering = this.setMagnitude(steering, this.maxSpeed);
      // 计算需要的转向力
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      // 限制转向力度
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  // 分离行为，避免 Boid 与周围个体过于靠近
  separate(boids: Boid[]): [number, number] {
    // 感知范围半径，影响分离的强度
    const perceptionRadius = 30;
    let steering: [number, number] = [0, 0];
    let total = 0;
    for (const other of boids) {
      const d = this.distance(other.position);
      if (other !== this && d < perceptionRadius) {
        // 计算远离邻居的向量
        let diff: [number, number] = [
          this.position[0] - other.position[0],
          this.position[1] - other.position[1],
        ];
        diff = this.normalize(diff);
        // 距离越近，分离力越大
        diff[0] /= d;
        diff[1] /= d;
        steering[0] += diff[0];
        steering[1] += diff[1];
        total++;
      }
    }
    if (total > 0) {
      // 计算平均分离向量
      steering[0] /= total;
      steering[1] /= total;
      // 调整向量为最大速度方向
      steering = this.setMagnitude(steering, this.maxSpeed);
      // 计算需要的转向力
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      // 限制转向力度
      steering = this.limit(steering, this.maxForce);
    }
    return steering;
  }

  // 避免鲨鱼，远离鲨鱼的位置
  avoidShark(sharkPosition: [number, number]): [number, number] {
    // 感知鲨鱼的范围半径，影响避让行为
    const perceptionRadius = 150;
    let steering: [number, number] = [0, 0];
    const d = this.distance(sharkPosition);
    if (d < perceptionRadius) {
      // 计算远离鲨鱼的向量
      let diff: [number, number] = [
        this.position[0] - sharkPosition[0],
        this.position[1] - sharkPosition[1],
      ];
      diff = this.normalize(diff);
      // 距离越近，避让力度越大
      diff[0] /= d;
      diff[1] /= d;
      steering[0] += diff[0];
      steering[1] += diff[1];
      // 调整向量为最大速度方向
      steering = this.setMagnitude(steering, this.maxSpeed);
      // 计算需要的转向力
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      // 增加最大受力以快速避让鲨鱼
      steering = this.limit(steering, this.maxForce * 2);

      // 更新 Boid 的状态为散开状态，设置散开时间和惊慌程度
      this.isScattering = true;
      this.scatterTime = 100;
      this.maxSpeed = this.fleeMaxSpeed;
      this.panicLevel = 1;
    }
    return steering;
  }

  // 避开障碍物
  avoidObstacles(obstacles: Obstacle[]): [number, number] {
    // 感知障碍物的范围半径
    const perceptionRadius = 20;
    let steering: [number, number] = [0, 0];
    for (const obstacle of obstacles) {
      // 计算到障碍物边缘的距离
      const d = this.distance([obstacle.x, obstacle.y]) - obstacle.radius;
      if (d < perceptionRadius) {
        // 计算远离障碍物的向量
        let diff: [number, number] = [
          this.position[0] - obstacle.x,
          this.position[1] - obstacle.y,
        ];
        diff = this.normalize(diff);
        // 距离越近，避让力度越大
        diff[0] /= d;
        diff[1] /= d;
        steering[0] += diff[0];
        steering[1] += diff[1];
      }
    }
    if (steering[0] !== 0 || steering[1] !== 0) {
      // 调整向量为最大速度方向
      steering = this.setMagnitude(steering, this.maxSpeed);
      // 计算需要的转向力
      steering[0] -= this.velocity[0];
      steering[1] -= this.velocity[1];
      // 增加最大受力以快速避开障碍物
      steering = this.limit(steering, this.maxForce * 2);
    }
    return steering;
  }

  // 群集行为，综合对齐、凝聚和分离的结果
  flock(boids: Boid[], sharkPosition: [number, number], obstacles: Obstacle[]) {
    // 计算各个行为的转向力
    const alignment = this.align(boids);
    const cohesion = this.cohere(boids);
    const separation = this.separate(boids);
    const avoidance = this.avoidShark(sharkPosition);
    const obstacleAvoidance = this.avoidObstacles(obstacles);

    // 根据 Boid 的状态调整各个行为的权重
    const alignmentWeight = this.isScattering ? 0.2 : 1;
    const cohesionWeight = this.isScattering ? 0.2 : 1;
    const separationWeight = this.isScattering ? 2 : 1.5;
    const avoidanceWeight = this.isScattering ? 3 : 2;

    // 组合所有行为的加速度，得到最终的转向力
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

    // 更新 Boid 的加速度
    this.acceleration[0] += accelX;
    this.acceleration[1] += accelY;
    // 随时间降低惊慌程度，使 Boid 慢慢恢复平静
    this.panicLevel = Math.max(0, this.panicLevel - 0.01);
  }

  // 更新位置和速度
  update(obstacles: Obstacle[]) {
    // 更新位置，根据当前速度移动
    this.position[0] += this.velocity[0];
    this.position[1] += this.velocity[1];
    // 更新速度，根据当前加速度改变速度
    this.velocity[0] += this.acceleration[0];
    this.velocity[1] += this.acceleration[1];
    // 限制速度为最大速度
    this.velocity = this.limit(this.velocity, this.maxSpeed);
    // 记录当前的加速度，用于绘制或其他用途
    this.currentAcceleration = [...this.acceleration];
    // 重置加速度，为下一帧计算做准备
    this.acceleration[0] = 0;
    this.acceleration[1] = 0;

    // 更新 Boid 的颜色，根据惊慌程度调整
    this.updateColor();

    if (this.isScattering) {
      // 减少散开时间
      this.scatterTime--;
      if (this.scatterTime <= 0) {
        // 散开时间结束，恢复正常状态
        this.isScattering = false;
        this.maxSpeed = this.normalMaxSpeed;
        this.panicLevel = 0;
      }
    }

    // 处理与障碍物的碰撞
    obstacles.forEach((obstacle) => {
      const dx = this.position[0] - obstacle.x;
      const dy = this.position[1] - obstacle.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < obstacle.radius + this.size) {
        // 计算碰撞角度
        const angle = Math.atan2(dy, dx);
        // 调整 Boid 的位置，使其刚好位于障碍物边缘
        this.position[0] =
          obstacle.x + (obstacle.radius + this.size) * Math.cos(angle);
        this.position[1] =
          obstacle.y + (obstacle.radius + this.size) * Math.sin(angle);
        // 反弹效果，略微改变速度方向
        this.velocity[0] += Math.cos(angle) * 0.5;
        this.velocity[1] += Math.sin(angle) * 0.5;
      }
    });
  }

  // 处理边界情况，使 Boid 可以从屏幕另一侧进入，实现循环空间
  edges(width: number, height: number) {
    // 水平边界处理
    if (this.position[0] > width) {
      this.position[0] = 0;
    } else if (this.position[0] < 0) {
      this.position[0] = width;
    }
    // 垂直边界处理
    if (this.position[1] > height) {
      this.position[1] = 0;
    } else if (this.position[1] < 0) {
      this.position[1] = height;
    }
  }

  // 计算与指定点的距离
  private distance(point: [number, number]): number {
    if (!point || point.length !== 2) {
      console.error('Invalid point provided to distance:', point);
      return Infinity;
    }
    // 使用勾股定理计算两点间的距离
    return Math.hypot(this.position[0] - point[0], this.position[1] - point[1]);
  }

  // 设置向量的大小，将向量调整为指定的模长
  private setMagnitude(
    vector: [number, number],
    mag: number,
  ): [number, number] {
    // 归一化向量并乘以新的模长
    return this.normalize(vector).map((v) => v * mag) as [number, number];
  }

  // 归一化向量，将向量调整为单位长度
  private normalize(vector: [number, number]): [number, number] {
    const mag = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);
    // 防止除以零
    return mag !== 0 ? [vector[0] / mag, vector[1] / mag] : [0, 0];
  }

  // 限制向量的大小，如果向量的模长超过最大值，则缩放到最大值
  private limit(vector: [number, number], max: number): [number, number] {
    const magSq = vector[0] ** 2 + vector[1] ** 2;
    if (magSq > max ** 2) {
      const mag = Math.sqrt(magSq);
      return [(vector[0] / mag) * max, (vector[1] / mag) * max];
    }
    return vector;
  }

  // 更新颜色，根据惊慌程度调整色调
  private updateColor() {
    // 根据 panicLevel 线性插值计算色相，惊慌程度越高，颜色越偏红
    const hue = 210 + (0 - 210) * this.panicLevel;
    this.color = `hsl(${hue}, 50%, 50%)`;
  }
}
