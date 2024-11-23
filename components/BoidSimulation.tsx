'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Boid } from '@/utils/Boid';
import { Obstacle } from '@/utils/Obstacle';
import { StatsDisplay } from './StatsDisplay';

interface BoidSimulationProps {
  width: number;
  height: number;
  boidCount: number;
}

const BoidSimulation: React.FC<BoidSimulationProps> = ({
  width,
  height,
  boidCount,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const mousePositionRef = useRef<[number, number]>([-300, -300]);
  const animationFrameIdRef = useRef<number>();

  const [stats, setStats] = useState({
    boidCount: boidCount,
    averageSpeed: 0,
    averageAcceleration: 0,
    panicLevel: 0,
  });

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

    obstaclesRef.current = [
      new Obstacle(width * 0.25, height * 0.25, 30),
      new Obstacle(width * 0.75, height * 0.75, 40),
      new Obstacle(width * 0.5, height * 0.5, 50),
    ];
  }, [width, height, boidCount]);

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

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      boidsRef.current.forEach((boid) => {
        boid.flock(
          boidsRef.current,
          mousePositionRef.current,
          obstaclesRef.current,
        );
      });

      boidsRef.current.forEach((boid) => {
        boid.update(obstaclesRef.current);
        boid.edges(width, height);

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

      obstaclesRef.current.forEach((obstacle) => {
        ctx.fillStyle = 'hsl(120, 30%, 50%)';
        ctx.beginPath();
        ctx.arc(obstacle.x, obstacle.y, obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

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

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [width, height]);

  useEffect(() => {
    animate();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    const intervalId = setInterval(calculateStats, 160);
    return () => clearInterval(intervalId);
  }, [calculateStats]);

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
          mousePositionRef.current = [-300, -300];
        }}
        className="border border-gray-300 cursor-none"
      />
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
