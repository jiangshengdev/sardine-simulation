'use client'

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Boid } from '../utils/Boid';
import { Obstacle } from '../utils/Obstacle';
import { StatsDisplay } from './StatsDisplay';

interface BoidSimulationProps {
  width: number;
  height: number;
  boidCount: number;
}

const BoidSimulation: React.FC<BoidSimulationProps> = ({ width, height, boidCount }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boidsRef = useRef<Boid[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const mousePositionRef = useRef<[number, number]>([width / 2, height / 2]);
  const animationFrameIdRef = useRef<number>();

  const [stats, setStats] = useState({
    boidCount: boidCount,
    averageSpeed: 0,
    density: 0,
    panicLevel: 0,
  });

  // Initialize boids and obstacles
  useEffect(() => {
    boidsRef.current = Array.from({ length: boidCount }, () => 
      new Boid(Math.random() * width, Math.random() * height)
    );
    
    // Create some random obstacles
    obstaclesRef.current = [
      new Obstacle(width * 0.25, height * 0.25, 30),
      new Obstacle(width * 0.75, height * 0.75, 40),
      new Obstacle(width * 0.5, height * 0.5, 50),
    ];
  }, [width, height, boidCount]);

  // Calculate stats
  const calculateStats = useCallback(() => {
    const boids = boidsRef.current;
    let totalSpeed = 0;
    let totalPanicLevel = 0;

    boids.forEach(boid => {
      const speed = Math.sqrt(boid.velocity[0]**2 + boid.velocity[1]**2);
      totalSpeed += speed;
      totalPanicLevel += boid.panicLevel;
    });

    const averageSpeed = totalSpeed / boids.length;
    const density = boids.length / (width * height);
    const averagePanicLevel = totalPanicLevel / boids.length;

    setStats({
      boidCount: boids.length,
      averageSpeed,
      density,
      panicLevel: averagePanicLevel,
    });
  }, [width, height]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, width, height);

      // Update and draw boids
      boidsRef.current.forEach(boid => {
        boid.flock(boidsRef.current, mousePositionRef.current, obstaclesRef.current);
        boid.update();
        boid.edges(width, height);

        // Draw boid with dynamic color
        ctx.fillStyle = boid.color;
        ctx.beginPath();
        const angle = Math.atan2(boid.velocity[1], boid.velocity[0]);
        ctx.moveTo(
          boid.position[0] + Math.cos(angle) * 10,
          boid.position[1] + Math.sin(angle) * 10
        );
        ctx.lineTo(
          boid.position[0] + Math.cos(angle + 2.5) * 5,
          boid.position[1] + Math.sin(angle + 2.5) * 5
        );
        ctx.lineTo(
          boid.position[0] + Math.cos(angle - 2.5) * 5,
          boid.position[1] + Math.sin(angle - 2.5) * 5
        );
        ctx.closePath();
        ctx.fill();
      });

      // Draw obstacles
      obstaclesRef.current.forEach(obstacle => {
        ctx.fillStyle = 'hsl(120, 30%, 50%)';  // 柔和的绿色
        ctx.beginPath();
        ctx.arc(obstacle.position[0], obstacle.position[1], obstacle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw "shark" (mouse pointer)
      ctx.fillStyle = 'hsl(0, 70%, 60%)';  // 稍微鲜艳一点的红色,以便更容易看到
      ctx.beginPath();
      ctx.arc(mousePositionRef.current[0], mousePositionRef.current[1], 10, 0, Math.PI * 2);
      ctx.fill();
    }

    calculateStats();

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [width, height, calculateStats]);

  // Set up and clean up animation
  useEffect(() => {
    animate();
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [animate]);

  // Handle mouse move
  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      mousePositionRef.current = [
        event.clientX - rect.left,
        event.clientY - rect.top
      ];
    }
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseMove={handleMouseMove}
        className="border border-gray-300"
      />
      <StatsDisplay {...stats} />
    </div>
  );
};

export default BoidSimulation;

