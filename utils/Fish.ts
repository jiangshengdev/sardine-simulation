import {Obstacle} from "@/utils/Obstacle";

export class Fish {
  x: number
  y: number
  vx: number
  vy: number
  size: number // 添加 size 属性
  velocity: [number, number] // 添加 velocity 属性

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.vx = Math.random() * 2 - 1
    this.vy = Math.random() * 2 - 1
    this.size = 5 // 初始化 size
    this.velocity = [this.vx, this.vy] // 初始化 velocity
  }

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
      if (distance < obstacle.radius + this.size + 50) { // 使用 this.size
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

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'blue'
    ctx.beginPath()
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2)
    ctx.fill()
  }
}

