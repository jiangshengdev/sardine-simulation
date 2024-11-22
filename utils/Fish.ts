import {Obstacle} from "@/utils/Obstacle";

/**
 * 表示模拟中的鱼类。
 */
export class Fish {
  /**
   * 鱼的x坐标。
   */
  x: number
  /**
   * 鱼的y坐标。
   */
  y: number
  /**
   * 鱼在x轴的速度。
   */
  vx: number
  /**
   * 鱼在y轴的速度。
   */
  vy: number
  /**
   * 鱼的大小。
   */
  size: number
  /**
   * 鱼的速度向量。
   */
  velocity: [number, number]

  /**
   * 创建一个新的鱼实例。
   * @param canvasWidth 画布的宽度
   * @param canvasHeight 画布的高度
   */
  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.vx = Math.random() * 2 - 1
    this.vy = Math.random() * 2 - 1
    this.size = 5 // 初始化 size
    this.velocity = [this.vx, this.vy] // 初始化 velocity
  }

  /**
   * 更新鱼的位置和状态。
   * @param fishes 所有鱼的数组
   * @param shark 鲨鱼的位置
   * @param obstacles 障碍物的数组
   */
  update(fishes: Fish[], shark: { x: number, y: number }, obstacles: Obstacle[]) {
    // 合并对fishes的遍历，优化性能
    let ahead: Fish | undefined;
    const neighbors: Fish[] = [];
    let behindCount = 0;

    fishes.forEach(f => {
      if (f === this) return;
      const dx = f.x - this.x;
      const dy = f.y - this.y;
      const distance = Math.hypot(dx, dy);
      const velocityDiff = Math.hypot(f.vx - this.vx, f.vy - this.vy);

      if (distance < 30 && velocityDiff < 0.1) {
        ahead = f;
      }

      if (distance < 50) {
        neighbors.push(f);
      }

      if (distance < 30 && velocityDiff > 0.1) {
        behindCount++;
      }
    });

    if (ahead) {
      this.vx += (ahead.vx - this.vx) * 0.1;
      this.vy += (ahead.vy - this.vy) * 0.1;
    }

    if (neighbors.length > 0) {
      const avgX = neighbors.reduce((sum, f) => sum + f.x, 0) / neighbors.length;
      const avgY = neighbors.reduce((sum, f) => sum + f.y, 0) / neighbors.length;
      this.vx += (avgX - this.x) * 0.05;
      this.vy += (avgY - this.y) * 0.05;
    }

    if (behindCount > 0) {
      this.vx *= 0.9;
      this.vy *= 0.9;
    }

    // 避开鲨鱼
    const distToShark = Math.hypot(shark.x - this.x, shark.y - this.y)
    if (distToShark < 100) {
      this.vx -= (shark.x - this.x) / distToShark * 0.5
      this.vy -= (shark.y - this.y) / distToShark * 0.5
    }

    // 调整避障逻辑，使鱼可以接近障碍物
    obstacles.forEach(obstacle => {
      const dx = obstacle.x - this.x // 修改为 this.x
      const dy = obstacle.y - this.y // 修改为 this.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < obstacle.radius + this.size + 10) { // 将20减少到10
        this.vx += dx / distance // 修改为 this.vx
        this.vy += dy / distance // 修改为 this.vy
        this.velocity = [this.vx, this.vy] // 更新 velocity
      }
    })

    // 更新位置
    this.x += this.vx
    this.y += this.vy

    // 检查是否进入障碍物内部
    obstacles.forEach(obstacle => {
      const dx = this.x - obstacle.x
      const dy = this.y - obstacle.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < obstacle.radius + this.size) {
        const angle = Math.atan2(dy, dx)
        this.x = obstacle.x + (obstacle.radius + this.size) * Math.cos(angle)
        this.y = obstacle.y + (obstacle.radius + this.size) * Math.sin(angle)
        // 添加推力以帮助鱼脱离障碍物
        this.vx += Math.cos(angle) * 0.5
        this.vy += Math.sin(angle) * 0.5
      }
    })

    // 限制速度
    const speed = Math.hypot(this.vx, this.vy)
    if (speed > 2) {
      this.vx = (this.vx / speed) * 2
      this.vy = (this.vy / speed) * 2
    }

    // 边界检查
    if (this.x < 0) this.x = 800
    if (this.x > 800) this.x = 0
    if (this.y < 0) this.y = 600
    if (this.y > 600) this.y = 0
  }

  /**
   * 绘制鱼到画布上。
   * @param ctx 画布的渲染上下文
   */
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'blue'
    ctx.beginPath()
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}
