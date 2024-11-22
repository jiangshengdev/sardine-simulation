import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * 组件属性接口
 */
interface StatsDisplayProps {
  /**
   * 沙丁鱼的数量
   */
  boidCount: number;
  /**
   * 平均速度
   */
  averageSpeed: number;
  /**
   * 平均加速度
   */
  averageAcceleration: number;
  /**
   * 恐慌程度
   */
  panicLevel: number;
}

/**
 * 显示统计信息的组件
 */
export function StatsDisplay({ boidCount, averageSpeed, averageAcceleration, panicLevel }: StatsDisplayProps) {
  const stats = [
    { label: '沙丁鱼数量', value: boidCount },
    { label: '平均速度', value: averageSpeed.toFixed(1) },
    { label: '平均加速度', value: averageAcceleration.toFixed(2) }, // 确保显示平均加速度
    { label: '恐慌程度', value: (panicLevel * 100).toFixed(1) + '%' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map(stat => (
        <Card className="min-w-[200px]" key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
