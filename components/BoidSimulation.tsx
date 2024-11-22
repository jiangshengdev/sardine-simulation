'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Boid } from '@/utils/Boid';
import { Obstacle } from '@/utils/Obstacle';
import { StatsDisplay } from './StatsDisplay';

/**
 * BoidSimulation 组件的属性定义。
 */
interface BoidSimulationProps {
  width: number;
  height: number;
  boidCount: number;
}

/**
 * BoidSimulation 组件用于渲染鲨鱼模拟。
 *
 * @param {BoidSimulationProps} props - 组件属性，包括宽度、高度和鲨鱼数量。
 * @returns {JSX.Element} 渲染的 React 元素。
 */
const BoidSimulation: React.FC<BoidSimulationProps> = ({
  width,
  height,
  boidCount,
}: BoidSimulationProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const mousePositionRef = useRef<[number, number]>([-100, -100]); // 初始化为远离画布的位置
  const animationFrameIdRef = useRef<number>();

  const [stats, setStats] = useState({
    boidCount: boidCount,
    averageSpeed: 0,
    averageAcceleration: 0, // 添加 averageAcceleration
    panicLevel: 0,
  });

  /**
   * 初始化鲨鱼和障碍物。
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
      }
    }

    boidsRef.current = Array.from(
      { length: boidCount },
      () => new Boid(Math.random() * width, Math.random() * height),
    );

    // Create some random obstacles
    obstaclesRef.current = [
      new Obstacle(width * 0.25, height * 0.25, 30),
      new Obstacle(width * 0.75, height * 0.75, 40),
      new Obstacle(width * 0.5, height * 0.5, 50),
    ];
  }, [width, height, boidCount]);

  /**
   * 计算模拟的统计数据。
   */
  const calculateStats = useCallback(() => {
    const boids = boidsRef.current;
    let totalSpeed = 0;
    let totalPanicLevel = 0;
    let totalAcceleration = 0; // 添加 totalAcceleration

    boids.forEach((boid) => {
      const speed = Math.sqrt(boid.velocity[0] ** 2 + boid.velocity[1] ** 2);
      totalSpeed += speed;
      totalPanicLevel += boid.panicLevel;
      const acceleration = Math.sqrt(
        boid.currentAcceleration[0] ** 2 + boid.currentAcceleration[1] ** 2,
      ); // 使用 currentAcceleration
      totalAcceleration += acceleration;
    });

    const averageSpeed = totalSpeed / boids.length;
    const averageAcceleration = totalAcceleration / boids.length; // 计算平均加速度
    const averagePanicLevel = totalPanicLevel / boids.length;

    setStats({
      boidCount: boids.length,
      averageSpeed,
      averageAcceleration, // 设置 averageAcceleration
      panicLevel: averagePanicLevel,
    });
  }, []);

  /**
   * 动画循环，用于更新和绘制鲨鱼及障碍物。
   */
  const animate = useCallback(() => {
    // 获取画布和上下文
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // 更新 boids 的行为
      boidsRef.current.forEach((boid) => {
        boid.flock(
          boidsRef.current,
          mousePositionRef.current,
          obstaclesRef.current,
        );
      });

      // 更新并绘制 boids
      boidsRef.current.forEach((boid) => {
        boid.update(obstaclesRef.current); // 传入障碍物列表
        boid.edges(width, height);

        // 绘制 boid
        ctx.fillStyle = boid.color;
        ctx.beginPath();
        const angle = Math.atan2(boid.velocity[1], boid.velocity[0]);
        ctx.moveTo(
          boid.position[0] + Math.cos(angle) * 10,
          boid.position[1] + Math.sin(angle) * 10,
        );
        ctx.lineTo(
          boid.position[0] + Math.cos(angle + 2.5) * 5,
          boid.position[1] + Math.sin(angle + 2.5) * 5,
        );
        ctx.lineTo(
          boid.position[0] + Math.cos(angle - 2.5) * 5,
          boid.position[1] + Math.sin(angle - 2.5) * 5,
        );
        ctx.closePath();
        ctx.fill();
      });

      // 绘制障碍物
      obstaclesRef.current.forEach((obstacle) => {
        ctx.fillStyle = 'hsl(120, 30%, 50%)'; // 柔和的绿色
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2); // 绘制圆形障碍物
        ctx.fill();
      });

      // 绘制“鲨鱼”鼠标指针
      ctx.fillStyle = 'hsl(0, 70%, 60%)'; // 稍微鲜艳一点的红色,以便更容易看到
      ctx.beginPath();
      ctx.arc(
        mousePositionRef.current[0],
        mousePositionRef.current[1],
        10,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [width, height]);

  /**
   * 设置和清理动画帧。
   */
  useEffect(() => {
    animate();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animate]);

  // 添加新的 useEffect 来每160毫秒更新一次统计数据
  useEffect(() => {
    const intervalId = setInterval(calculateStats, 160);
    return () => clearInterval(intervalId);
  }, [calculateStats]);

  /**
   * 处理鼠标移动事件，更新鼠标位置。
   *
   * @param {React.MouseEvent<HTMLCanvasElement>} event - 鼠标事件。
   */
  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        mousePositionRef.current = [x, y];
      }
    },
    [],
  );

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          mousePositionRef.current = [-100, -100];
        }} // 鼠标离开时移除鲨鱼
        className="border border-gray-300 cursor-none"
      />
      <StatsDisplay
        boidCount={stats.boidCount}
        averageSpeed={stats.averageSpeed}
        averageAcceleration={stats.averageAcceleration} // 传递 averageAcceleration
        panicLevel={stats.panicLevel}
      />
    </div>
  );
};

export default BoidSimulation;
