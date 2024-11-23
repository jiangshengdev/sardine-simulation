// 使用 'use client' 指令，使组件在客户端渲染
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Boid } from '@/utils/Boid';
import { Obstacle } from '@/utils/Obstacle';
import { StatsDisplay } from './StatsDisplay';

// BoidSimulation 组件的属性接口
interface BoidSimulationProps {
  width: number; // 画布宽度
  height: number; // 画布高度
  boidCount: number; // Boid 的数量
}

// BoidSimulation 组件
const BoidSimulation: React.FC<BoidSimulationProps> = ({
  width,
  height,
  boidCount,
}) => {
  // 画布的引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Boid 实例数组的引用
  const boidsRef = useRef<Boid[]>([]);
  // 障碍物数组的引用
  const obstaclesRef = useRef<Obstacle[]>([]);
  // 鼠标位置的引用，初始化在画布外
  const mousePositionRef = useRef<[number, number]>([-300, -300]);
  // 动画帧 ID 的引用
  const animationFrameIdRef = useRef<number>();

  // 状态，用于存储统计数据
  const [stats, setStats] = useState({
    boidCount: boidCount,
    averageSpeed: 0,
    averageAcceleration: 0,
    panicLevel: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      // 设置画布的大小和缩放，以支持高分辨率屏幕
      const scale = window.devicePixelRatio || 1;
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
      }
    }

    // 初始化 Boid 实例数组，在随机位置生成
    boidsRef.current = Array.from(
      { length: boidCount },
      () => new Boid(Math.random() * width, Math.random() * height),
    );

    // 初始化障碍物
    obstaclesRef.current = [
      new Obstacle(width * 0.25, height * 0.25, 30),
      new Obstacle(width * 0.75, height * 0.75, 40),
      new Obstacle(width * 0.5, height * 0.5, 50),
    ];
  }, [width, height, boidCount]);

  // 计算统计数据的函数
  const calculateStats = useCallback(() => {
    const boids = boidsRef.current;
    let totalSpeed = 0;
    let totalPanicLevel = 0;
    let totalAcceleration = 0;

    boids.forEach((boid) => {
      const speed = Math.sqrt(boid.velocity[0] ** 2 + boid.velocity[1] ** 2);
      totalSpeed += speed;
      totalPanicLevel += boid.panicLevel;
      const acceleration = Math.sqrt(
        boid.currentAcceleration[0] ** 2 + boid.currentAcceleration[1] ** 2,
      );
      totalAcceleration += acceleration;
    });

    const averageSpeed = totalSpeed / boids.length;
    const averageAcceleration = totalAcceleration / boids.length;
    const averagePanicLevel = totalPanicLevel / boids.length;

    setStats({
      boidCount: boids.length,
      averageSpeed,
      averageAcceleration,
      panicLevel: averagePanicLevel,
    });
  }, []);

  // 动画循环函数，更新和绘制 Boid 和障碍物
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      // 清除画布
      ctx.clearRect(0, 0, width, height);

      // 计算 Boid 的行为
      boidsRef.current.forEach((boid) => {
        boid.flock(
          boidsRef.current,
          mousePositionRef.current,
          obstaclesRef.current,
        );
      });

      // 更新 Boid 的位置并绘制
      boidsRef.current.forEach((boid) => {
        boid.update(obstaclesRef.current);
        boid.edges(width, height);

        // 绘制 Boid
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
        ctx.fillStyle = 'hsl(120, 30%, 50%)';
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 绘制鼠标位置（红色圆点）
      ctx.fillStyle = 'hsl(0, 70%, 60%)';
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

    // 请求下一帧动画
    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [width, height]);

  useEffect(() => {
    // 启动动画
    animate();
    return () => {
      // 组件卸载时取消动画帧
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    // 定时计算统计数据
    const intervalId = setInterval(calculateStats, 160);
    return () => clearInterval(intervalId);
  }, [calculateStats]);

  // 处理鼠标移动的事件，更新鼠标位置
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
      {/* 绘制 Boid 的画布 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          // 鼠标离开时，将鼠标位置重置到画布外
          mousePositionRef.current = [-300, -300];
        }}
        className="border border-gray-300 cursor-none"
      />
      {/* 显示统计数据的组件 */}
      <StatsDisplay
        boidCount={stats.boidCount}
        averageSpeed={stats.averageSpeed}
        averageAcceleration={stats.averageAcceleration}
        panicLevel={stats.panicLevel}
      />
    </div>
  );
};

export default BoidSimulation;
