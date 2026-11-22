import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceArea } from 'recharts'
import type { TrendMetric } from '@/types'
import { useTheme } from '@/context/ThemeContext'

export function TrendChart({ metric, height = 240 }: { metric: TrendMetric; height?: number }) {
  let isDark = false
  try {
    const { theme } = useTheme()
    isDark = theme === 'dark'
  } catch {
    isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  }

  const gradientId = `gradient-${metric.id}`
  const rawData = metric.data || []

  // If multiple data points have identical date strings, append reading index so each point is distinct
  const formattedData = rawData.map((item, index, arr) => {
    const hasDuplicates = arr.filter((d) => d.date === item.date).length > 1
    const duplicateIndex = arr.slice(0, index + 1).filter((d) => d.date === item.date).length
    return {
      ...item,
      displayDate: hasDuplicates ? `${item.date} (${duplicateIndex})` : item.date,
      value: typeof item.value === 'number' ? item.value : parseFloat(String(item.value)) || 0,
    }
  })

  const normMin = Array.isArray(metric.normalRange) ? metric.normalRange[0] : 0
  const normMax = Array.isArray(metric.normalRange) ? metric.normalRange[1] : 100

  const values = formattedData.map((d) => d.value)
  const dataMin = values.length > 0 ? Math.min(...values) : 0
  const dataMax = values.length > 0 ? Math.max(...values) : 100

  const minVal = Math.min(dataMin, normMin)
  const maxVal = Math.max(dataMax, normMax)
  const padding = (maxVal - minVal) * 0.15 || 10
  const yMin = Math.max(0, Math.floor(minVal - padding))
  const yMax = Math.ceil(maxVal + padding)

  const gridColor = isDark ? '#1e314b' : '#e3e9f0'
  const tickColor = isDark ? '#94a3b8' : '#45566e'
  const dotStroke = isDark ? '#131f33' : '#ffffff'

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formattedData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metric.color || '#0f766e'} stopOpacity={isDark ? 0.3 : 0.35} />
            <stop offset="100%" stopColor={metric.color || '#0f766e'} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
        <ReferenceArea y1={normMin} y2={normMax} fill={metric.color || '#0f766e'} fillOpacity={isDark ? 0.08 : 0.06} />
        <XAxis
          dataKey="displayDate"
          tick={{ fontSize: 11, fill: tickColor }}
          tickLine={false}
          axisLine={{ stroke: gridColor }}
          minTickGap={15}
        />
        <YAxis
          tick={{ fontSize: 11, fill: tickColor }}
          tickLine={false}
          axisLine={false}
          width={45}
          domain={[yMin, yMax]}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 12,
            border: `1px solid ${gridColor}`,
            fontSize: 12,
            boxShadow: isDark ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 12px rgba(11,18,32,0.08)',
            backgroundColor: isDark ? '#131f33' : '#ffffff',
            color: isDark ? '#f1f5f9' : '#0b1220',
          }}
          itemStyle={{
            color: isDark ? '#f1f5f9' : '#0b1220',
          }}
          labelStyle={{
            color: isDark ? '#94a3b8' : '#45566e',
            fontWeight: 600,
          }}
          formatter={(value: any) => [`${value} ${metric.unit}`, metric.name]}
          labelFormatter={(label: any) => `Date: ${label}`}
        />
        <Area
          type="linear"
          dataKey="value"
          stroke={metric.color || '#0f766e'}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 4, fill: metric.color || '#0f766e', stroke: dotStroke, strokeWidth: 1.5 }}
          activeDot={{ r: 6, fill: metric.color || '#0f766e', stroke: dotStroke, strokeWidth: 2 }}
          isAnimationActive
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
