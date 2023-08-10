"use client"

import prisma from 'prisma/instance';
import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';

export default function Home({
  count,
  CountByType,
  last100Transactions,
  histogramData,
  }) {

  const chartRef = useRef(null);
  let chartInstance;

  useEffect(() => {
    if (histogramData && chartRef.current) {
      const ctx = chartRef.current.getContext('2d');

      Chart.register(...registerables);

      if (chartInstance) {
        chartInstance.destroy();
      }

      const labels = histogramData.map(interval => interval.label);

      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: '',
              data: histogramData.map(interval => interval.frequency),
              backgroundColor: 'rgba(54, 162, 235, 0.5)', // Adjust the color as needed
            },
          ],
        },
        options: {
          scales: {
            x: {
              title: {
                display: true,
                text: 'Money Intervals',
              },
            },
            y: {
              title: {
                display: true,
                text: 'Money',
              },
              type: 'linear',
              beginAtZero: true,
            },
          },
        },
      });
    }
  }, [histogramData]);

  return (
    <main>
      <h1> OPERACIONES RECIBIDAS: {count} </h1>
      <h1> TIPO DE OPERACIÓN: ENVÍO DE FONDOS </h1>
{/*       {CountByType[1] && <p>Cantidad de Operaciones: {CountByType[1]._count.type}</p>} */}
{/*       {CountByType[1] && <p>Monto Total: ${CountByType[1]._sum.money}</p>} */}
      <h1> TIPO DE OPERACIÓN: REVERSA DE TRANSACCIÓN </h1>
{/*       {CountByType[0] && <p>Cantidad de Operaciones: {CountByType[0]._count.type}</p>} */}
{/*       {CountByType[0] && <p>Monto Total: ${CountByType[0]._sum.money}</p>} */}
      <h1>100 ÚLTIMAS TRANSACCIONES</h1>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Type</th>
            <th>Bank Origin</th>
            <th>Account Origin</th>
            <th>Bank Destination</th>
            <th>Account Destination</th>
            <th>Amount</th>
            <th>Date</th>
          </tr>
        </thead>
{/*         <tbody>
          {last100Transactions.map(transaction => (
             <tr key={transaction.id}>
              <td>{transaction.id}</td>
              <td>{transaction.type}</td>
              <td>{transaction.bank_origin}</td>
              <td>{transaction.acc_origin}</td>
              <td>{transaction.bank_dest}</td>
              <td>{transaction.acc_dest}</td>
              <td>{transaction.money}</td>
              <td>{transaction.date}</td>
            </tr>
           ))}
        </tbody> */}
      </table>
      <canvas ref={chartRef} width={400} height={200}></canvas>
  
    </main>
  )
}

export async function getServerSideProps() {
  const count = await prisma.bank_info.count();

  const data = await prisma.bank_info.findMany({
    select: {
      id: true,
      type: true,
      bank_origin: true,
      acc_origin: true,
      bank_dest: true,
      acc_dest: true,
      money: true,
      date: true,
    },
  });

  const formattedData = data.map(item => ({
    ...item,
    id: item.id.toString(),
    acc_origin: item.acc_origin.toString(),
    money: item.money.toString(),
    acc_dest: item.acc_dest.toString(),
    date: item.date.toString(),
  }));

  const CountByType = await prisma.bank_info.groupBy({
    by: ["type"],
    _count: {
      type: true,
    },
    _sum: {
      money: true,
    },
  });
  const formattedCountByType = CountByType.map(item => ({
    ...item,
    _sum: {
      money: Number(item._sum.money),
    },
  }));

  const conciliation = await prisma.bank_info.groupBy({
    by: ["bank_origin", "bank_dest"],
    _sum: {
      money: true,
    },
  });

  const formattedConciliation = conciliation.map(item => ({
    ...item,
    _sum: {
      money: Number(item._sum.money),
    },
  }));

  const last100Transactions = await prisma.bank_info.findMany({
    orderBy: {
      id: 'asc' 
    },
    take: 100
  });

  const formattedTransaction = last100Transactions.map(item => ({
    ...item,
    id: item.id.toString(),
    acc_origin: item.acc_origin.toString(),
    money: item.money.toString(),
    acc_dest: item.acc_dest.toString(),
    date: item.date.toString(),
  }));

  const histogramData = await prisma.bank_info.groupBy({
    by: ['bank_origin'],
    _sum: {
      money: true,
    },
  });

  const formattedHistogramData = histogramData.map(item => ({
    ...item,
    _sum: {
      money: Number(item._sum.money),
    },
  }));

  const intervals = [
    { min: 0, max: 10000, label: 'Menor a $10.000' },
    { min: 10000, max: 49999, label: 'Entre $10.000 y $49.999' },
    { min: 50000, max: 99999, label: 'Entre $50.000 y $99.999' },
    { min: 100000, max: 499999, label: 'Entre $100.000 y $499.999' },
    { min: 500000, max: 999999, label: 'Entre $500.000 y $999.999' },
    { min: 1000000, max: 9999999, label: 'Entre $1.000.000 y $9.999.999' },
    { min: 10000000, max: -1, label: 'Más de $9.999.999' },
  ];

  for (let i = 0; i < intervals.length; i++) {
    const interval = intervals[i];
    let frequency;
    if (interval.max === -1) {
      frequency = await prisma.bank_info.findMany({
        where: {
          money: {
            gte: interval.min,
          },
        },
      });
    } else {
      frequency = await prisma.bank_info.findMany({
        where: {
          money: {
            gte: interval.min,
            lte: interval.max,
          },
        },
      });
    }
    interval.frequency = frequency.length;
  }
  
  return {
    props: {
      count,
      data: formattedData,
      CountByType: formattedCountByType,
      conciliation: formattedConciliation,
      last100Transactions: formattedTransaction,
      histogramData: intervals,
    },
  };
}