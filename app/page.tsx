import BoidSimulation from '../components/BoidSimulation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <p className="mb-4 text-center">
        移动鼠标模拟「鲨鱼」。观察鱼群避开鼠标和绿色障碍物，注意颜色和行为变化。
      </p>
      <BoidSimulation width={800} height={600} boidCount={100} />
    </main>
  );
}
