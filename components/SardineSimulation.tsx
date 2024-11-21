'use client'

import { useEffect, useRef, useState } from 'react'
import { Fish } from '../utils/Fish'
import { Obstacle } from '../utils/Obstacle' // 添加障碍物导入

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const FISH_COUNT = 100

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
        const render = () => {
          ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

          // Update and draw fishes
          newFishes.forEach(fish => {
            fish.update(newFishes, shark, initialObstacles) // 使用initialObstacles
            fish.draw(ctx)
          })

          // Draw obstacles
          initialObstacles.forEach(obstacle => {
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
  }, [shark]) // 移除 obstacles 依赖

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
      className="border border-gray-300"
    />
  )
}
