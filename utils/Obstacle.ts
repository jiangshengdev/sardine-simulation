/**
 * 障碍物类
 */
export class Obstacle {
  x: number;
  y: number;
  radius: number;

  /**
   * 创建一个新的障碍物实例
   * @param x - 障碍物的x坐标
   * @param y - 障碍物的y坐标
   * @param radius - 障碍物的半径
   */
  constructor(x: number, y: number, radius: number) {
    this.x = x;
    this.y = y;
    this.radius = radius;
  }
}
