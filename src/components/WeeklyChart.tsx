'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { WeeklySummary, CurrencyUnit } from '@/types/trade';
import { formatCurrency } from '@/utils/tradeUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeeklyChartProps {
  summaries: WeeklySummary[];
  currency: CurrencyUnit;
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ summaries, currency }) => {
  const labels = summaries.map(s => s.label);
  const dataPnL = summaries.map(s => s.totalPnL);
  const barColors = dataPnL.map(val => (val >= 0 ? '#10b981' : '#f43f5e'));

  const data = {
    labels,
    datasets: [
      {
        label: 'Weekly Net PnL',
        data: dataPnL,
        backgroundColor: barColors,
        borderRadius: 6
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
          label: (ctx: any) => `PnL: ${formatCurrency(ctx.raw, currency)}`
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

  return <Bar data={data} options={options} />;
};
