export class Fish {
  x: number
  y: number
  vx: number
  vy: number
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth
    this.y = Math.random() * canvasHeight
    this.vx = Math.random() * 2 - 1
    this.vy = Math.random() * 2 - 1
  }

  update(fishes: Fish[], shark: { x: number, y: number }) {
    // 规则1: 跟紧前面的鱼
    const ahead = fishes.find(f => 
      f !== this && 
      Math.hypot(f.x - this.x, f.y - this.y) < 30 &&
      Math.hypot(f.vx - this.vx, f.vy - this.vy) < 0.1
    )
    if (ahead) {
      this.vx += (ahead.vx - this.vx) * 0.1
      this.vy += (ahead.vy - this.vy) * 0.1
    }

    // 规则2: 与旁边的鱼保持相等距离
    const neighbors = fishes.filter(f => 
      f !== this && 
      Math.hypot(f.x - this.x, f.y - this.y) < 50
    )
    if (neighbors.length > 0) {
      const avgX = neighbors.reduce((sum, f) => sum + f.x, 0) / neighbors.length
      const avgY = neighbors.reduce((sum, f) => sum + f.y, 0) / neighbors.length
      this.vx += (avgX - this.x) * 0.05
      this.vy += (avgY - this.y) * 0.05
    }

    // 规则3: 让后面的鱼跟上
    const behind = fishes.filter(f => 
      f !== this && 
      Math.hypot(f.x - this.x, f.y - this.y) < 30 &&
      Math.hypot(f.vx - this.vx, f.vy - this.vy) > 0.1
    )
    if (behind.length > 0) {
      this.vx *= 0.9
      this.vy *= 0.9
    }

    // 避开鲨鱼
    const distToShark = Math.hypot(shark.x - this.x, shark.y - this.y)
    if (distToShark < 100) {
      this.vx -= (shark.x - this.x) / distToShark * 0.5
      this.vy -= (shark.y - this.y) / distToShark * 0.5
    }

    // 更新位置
    this.x += this.vx
    this.y += this.vy

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

