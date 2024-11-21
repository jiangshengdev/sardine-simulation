export class Obstacle {
  x: number
  y: number
  radius: number

  constructor(x: number, y: number, radius: number) {
    this.x = x
    this.y = y
    this.radius = radius
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = 'green' // 障碍物颜色
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

