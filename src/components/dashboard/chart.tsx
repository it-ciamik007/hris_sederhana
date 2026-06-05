"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const data = [
  { name: "Jan", total: 12 },
  { name: "Feb", total: 25 },
  { name: "Mar", total: 40 },
  { name: "Apr", total: 35 },
  { name: "May", total: 55 },
  { name: "Jun", total: 60 },
  { name: "Jul", total: 45 }
];

export function DashboardChart() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis 
          dataKey="name" 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          stroke="hsl(var(--muted-foreground))" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={(value) => `${value}`} 
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--background))", 
            borderRadius: "8px",
            border: "1px solid hsl(var(--border))",
            boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
          }} 
          itemStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
        />
        <Area 
          type="monotone" 
          dataKey="total" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorTotal)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
