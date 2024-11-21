import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatsDisplayProps {
  boidCount: number;
  averageSpeed: number;
  density: number;
  panicLevel: number;
}

export function StatsDisplay({ boidCount, averageSpeed, density, panicLevel }: StatsDisplayProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">沙丁鱼数量</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{boidCount}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均速度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averageSpeed.toFixed(2)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">密度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{density.toFixed(4)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">恐慌程度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{(panicLevel * 100).toFixed(2)}%</div>
        </CardContent>
      </Card>
    </div>
  )
}

