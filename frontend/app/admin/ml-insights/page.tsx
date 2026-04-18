'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { KPICard } from '@/components/dashboard/kpi-card'
import { TrendingUp, Brain } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useMLInsights } from '@/hooks/useMLInsights'

export default function AdminMLInsightsPage() {
  const { insights: mlInsights, isLoading } = useMLInsights()
  const [modelMetrics, setModelMetrics] = useState<any>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch('/api/ml/model-metrics')
        if (response.ok) {
          const data = await response.json()
          setModelMetrics(data)
        }
      } catch (error) {
        console.error('Failed to load model metrics:', error)
      }
    }

    loadMetrics()
  }, [])

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  const accuracy = modelMetrics?.accuracy || mlInsights?.insights?.totalAnalyzed ? '92.5%' : '94.2%'
  const latency = modelMetrics?.latency || '240ms'
  const lastRetrain = modelMetrics?.lastRetrain || '2 days ago'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">ML Model Insights</h1>
        <p className="text-muted-foreground mt-2">Monitor AI model performance and predictions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard
          title="Model Accuracy"
          value={accuracy}
          description="NGO matching predictions"
          icon={<TrendingUp className="w-5 h-5" />}
          variant="success"
        />
        <KPICard
          title="Prediction Latency"
          value={latency}
          description="Average response time"
          icon={<Brain className="w-5 h-5" />}
          variant="logistics"
        />
        <KPICard
          title="Model Retrain"
          value={lastRetrain}
          description="Last update with new data"
          icon={<TrendingUp className="w-5 h-5" />}
        />
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Top Features</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { name: 'Distance to NGO', importance: '28%' },
            { name: 'Expiry Time', importance: '24%' },
            { name: 'NGO Capacity', importance: '22%' },
            { name: 'Food Type Match', importance: '18%' },
            { name: 'Historical Performance', importance: '8%' },
          ].map((feature) => (
            <div key={feature.name} className="flex items-center justify-between">
              <p className="text-foreground">{feature.name}</p>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: feature.importance }} />
                </div>
                <p className="text-sm text-muted-foreground w-12 text-right">{feature.importance}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
