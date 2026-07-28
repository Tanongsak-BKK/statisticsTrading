'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MonthlySummary, CurrencyUnit } from '@/types/trade';
import { formatCurrency } from '@/utils/tradeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MonthlyChartProps {
  summaries: MonthlySummary[];
  currency: CurrencyUnit;
}

export const MonthlyChart: React.FC<MonthlyChartProps> = ({ summaries, currency }) => {
  const labels = summaries.map(s => s.label);
  
  let cumulative = 0;
  const cumulativeData = summaries.map(s => {
    cumulative += s.totalPnL;
    return cumulative;
  });

  const data = {
    labels,
    datasets: [
      {
        label: 'Cumulative PnL',
        data: cumulativeData,
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#818cf8',
        pointRadius: 5
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => `Cumulative PnL: ${formatCurrency(ctx.raw, currency)}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#202d42' }
      },
      y: {
        ticks: { color: '#94a3b8' },
        grid: { color: '#202d42' }
      }
    }
  };

  return <Line data={data} options={options} />;
};
