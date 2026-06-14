import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface TrendDataPoint {
  month: string;
  popularity: number;
}

interface MarketTrendsChartProps {
  data?: TrendDataPoint[];
}

export default function MarketTrendsChart({ data }: MarketTrendsChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full h-[240px] mt-2 mb-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPopularity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1497F3" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#1497F3" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" vertical={false} />
          <XAxis 
            dataKey="month" 
            stroke="#ffffff66" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10}
          />
          <YAxis 
            stroke="#ffffff66" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dx={-10}
            domain={[0, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#ffffff1a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#89E4FF' }}
            cursor={{ stroke: '#ffffff33', strokeWidth: 1 }}
          />
          <Area 
            type="monotone" 
            dataKey="popularity" 
            stroke="#1497F3" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPopularity)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
