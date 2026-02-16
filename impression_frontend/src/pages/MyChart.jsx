// src/components/MyChart.jsx
import React, { useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  ArcElement,
  DoughnutController,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  ArcElement,
  DoughnutController,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const MyChart = ({ type = "bar", title = "Colorful Chart" }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    // 🎨 Create colorful gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "#60a5fa"); // blue-400
    gradient.addColorStop(0.5, "#34d399"); // green-400
    gradient.addColorStop(1, "#f87171"); // red-400

    chartInstanceRef.current = new ChartJS(ctx, {
      type: type,
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr"],
        datasets: [
          {
            label: "Sales",
            data: [30, 50, 70, 90],
            backgroundColor: gradient,
            borderColor: "#3b82f6",
            borderWidth: 2,
            hoverBackgroundColor: "#facc15", // yellow-400 on hover
            borderRadius: 12,
          },
          {
            label: "Revenue",
            data: [40, 60, 80, 100],
            backgroundColor: "#f472b6", // pink-400
            borderColor: "#ec4899",
            borderWidth: 2,
            hoverBackgroundColor: "#fb923c", // orange-400 on hover
            borderRadius: 12,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1200,
          easing: "easeOutQuart",
        },
        plugins: {
          legend: {
            labels: {
              color: "rgb(107 114 128)", // Tailwind gray-500
            },
            position: "top",
          },
          title: {
            display: true,
            text: title,
            color: "rgb(55 65 81)", // Tailwind gray-700
            font: {
              size: 20,
              weight: "bold",
            },
          },
          tooltip: {
            backgroundColor: "#111827", // dark tooltip
            titleColor: "#f9fafb",
            bodyColor: "#d1d5db",
            borderColor: "#3b82f6",
            borderWidth: 1,
          },
        },
        scales: {
          x: {
            ticks: {
              color: "rgb(107 114 128)",
            },
            grid: {
              color: "rgba(156,163,175,0.1)",
            },
          },
          y: {
            ticks: {
              color: "rgb(107 114 128)",
            },
            grid: {
              color: "rgba(156,163,175,0.1)",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [type, title]);

  return (
    <div className="w-full rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 bg-white dark:bg-gray-900 p-6">
      <div className="h-80">
        <canvas ref={chartRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default MyChart;
