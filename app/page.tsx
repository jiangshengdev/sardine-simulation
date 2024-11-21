import BoidSimulation from '../components/BoidSimulation';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-8">
      <h1 className="text-4xl font-bold mb-4">增强的Boid模拟 - 带障碍物和实时统计</h1>
      <p className="mb-4 text-center">
        移动鼠标来模拟"鲨鱼"的存在。<br />
        观察鱼群如何避开鼠标指针和绿色障碍物!<br />
        注意鱼群在鲨鱼接近时的颜色变化和行为改变。
      </p>
      <BoidSimulation width={800} height={600} boidCount={100} />
    </main>
  );
}

