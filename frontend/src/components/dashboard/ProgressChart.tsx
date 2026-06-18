'use client';

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'W1', value: 20 },
  { name: 'W2', value: 35 },
  { name: 'W3', value: 50 },
  { name: 'W4', value: 65 },
  { name: 'W5', value: 80 },
];

export function ProgressChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(221 83% 22%)" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="hsl(221 83% 22%)" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="hsl(221 83% 22%)"
          strokeWidth={3}
          fillOpacity={1}
          fill="url(#colorProgress)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
