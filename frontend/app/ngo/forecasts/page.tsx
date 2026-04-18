'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const forecastData = [
  { day: 'Mon', predicted: 120, actual: 115 },
  { day: 'Tue', predicted: 150, actual: 148 },
  { day: 'Wed', predicted: 130, actual: 125 },
  { day: 'Thu', predicted: 170, actual: 165 },
  { day: 'Fri', predicted: 200, actual: 210 },
  { day: 'Sat', predicted: 180, actual: null },
  { day: 'Sun', predicted: 160, actual: null },
]

export default function NGOForecastsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Demand Forecasts</h1>
        <p className="text-muted-foreground mt-2">AI predictions for upcoming food availability and demand</p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Weekly Forecast</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" stroke="var(--color-muted-foreground)" />
              <YAxis stroke="var(--color-muted-foreground)" />
              <Tooltip contentStyle={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="predicted" stroke="var(--color-primary)" strokeWidth={2} name="Predicted" />
              <Line type="monotone" dataKey="actual" stroke="var(--color-success)" strokeWidth={2} name="Actual" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">This Week Predicted</p>
            <p className="text-2xl font-bold text-primary mt-2">1,080 kg</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Current Capacity</p>
            <p className="text-2xl font-bold text-logistics mt-2">78%</p>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Shortage Risk</p>
            <p className="text-2xl font-bold text-success mt-2">Low</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
