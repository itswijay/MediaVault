import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  title: string
  value: string | number
  subtitle?: string
  colorClass?: 'cyan' | 'green' | 'amber' | 'blue'
  onClick?: () => void
}

const colorClasses = {
  cyan: 'from-cyan-500 to-cyan-600 text-cyan-400',
  green: 'from-green-500 to-green-600 text-green-400',
  amber: 'from-amber-500 to-amber-600 text-amber-400',
  blue: 'from-blue-500 to-blue-600 text-blue-400',
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  colorClass = 'cyan',
  onClick,
}) => {
  return (
    <Card
      className={`border-slate-700 bg-slate-800/50 backdrop-blur transition-all duration-300 hover:bg-slate-800 ${
        onClick ? 'cursor-pointer hover:border-slate-600' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-400">
            {title}
          </CardTitle>
          <div
            className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-linear-to-br ${colorClasses[colorClass]}`}
          >
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </CardContent>
    </Card>
  )
}
