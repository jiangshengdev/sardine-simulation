'use client'

import { useEffect, useRef, useState } from 'react'
import { Fish } from '../utils/Fish'
import { Obstacle } from '../utils/Obstacle' // 添加障碍物导入

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const FISH_COUNT = 100

/**
 * SardineSimulation 组件负责渲染沙丁鱼模拟动画。
 */
export default function SardineSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [shark, setShark] = useState({ x: -100, y: -100 })
  const [obstacles, setObstacles] = useState<Obstacle[]>([]) // 添加障碍物状态

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Initialize fishes only once
        const newFishes = Array.from({ length: FISH_COUNT }, () => new Fish(CANVAS_WIDTH, CANVAS_HEIGHT))

        // Initialize obstacles only once
        const initialObstacles = [
          new Obstacle(200, 150, 30),
          new Obstacle(600, 450, 50),
        ]
        setObstacles(initialObstacles)

        // Animation loop
        let animationFrameId: number

        /**
         * render 函数用于更新和绘制画布内容。
         */
        const render = () => {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

          // Update and draw fishes
          newFishes.forEach(fish => {
            fish.update(newFishes, shark, obstacles) // 使用 obstacles
            fish.draw(ctx)
          })

          // Draw obstacles
          obstacles.forEach(obstacle => { // 使用 obstacles
            obstacle.draw(ctx)
          })

          // Draw shark
          ctx.fillStyle = 'gray'
          ctx.beginPath()
          ctx.arc(shark.x, shark.y, 20, 0, Math.PI * 2)
          ctx.fill()

          animationFrameId = requestAnimationFrame(render)
        }
        render()

        // Cleanup
        return () => {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }
  }, [shark, obstacles]) // 添加 obstacles 依赖

  /**
   * 处理鼠标移动事件，更新鲨鱼的位置。
   */
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas) {
      const rect = canvas.getBoundingClientRect()
      setShark({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      })
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onMouseMove={handleMouseMove}
      className="border border-gray-300 cursor-none"
    />
  )
}
