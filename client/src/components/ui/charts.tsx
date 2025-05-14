import React from 'react';
import { 
  LineChart, 
  Line, 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ChartDataItem {
  name?: string;
  value: number;
}

interface AreaChartProps {
  data: number[];
  index: string[];
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: string | number) => string;
  showLegend?: boolean;
  showGridLines?: boolean;
  startEndOnly?: boolean;
  className?: string;
}

// Componente para gráfico de área
export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  index,
  categories,
  colors = ['#3b82f6'],
  valueFormatter = (value) => `${value}`,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
  className = 'h-72'
}) => {
  // Transformar dados para formato compatível com Recharts
  const chartData = data.map((value, i) => ({
    [categories[0]]: value,
    name: index[i]
  }));

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart
          data={chartData}
          margin={{
            top: 10,
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          {showGridLines && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="rgba(255, 255, 255, 0.1)"
            />
          )}
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#9ca3af' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            tickLine={false}
            tickFormatter={(value, index) => {
              if (startEndOnly) {
                if (index === 0 || index === chartData.length - 1) {
                  return value;
                }
                return '';
              }
              return value;
            }}
          />
          <YAxis 
            tick={{ fill: '#9ca3af' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
            tickLine={false}
            tickFormatter={(value) => valueFormatter(value)}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'rgba(17, 24, 39, 0.9)',
              borderColor: 'rgba(75, 85, 99, 0.5)',
              borderRadius: '4px',
              color: '#f3f4f6'
            }}
            formatter={(value: number) => [valueFormatter(value), categories[0]]}
          />
          {showLegend && <Legend />}
          <defs>
            <linearGradient id={`gradient-${categories[0]}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
              <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey={categories[0]}
            stroke={colors[0]}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#gradient-${categories[0]})`}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};