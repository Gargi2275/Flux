// import React, { useState, useMemo, useRef, useCallback } from "react";
// import {
//   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//   PieChart, Pie, Cell, LineChart, Line, LabelList,
//   ResponsiveContainer, AreaChart, Area
// } from "recharts";
// import { toPng } from "html-to-image";

// const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb"];

// const ChartBuilder = ({ data = [], columns = [] })=> {
//   const [title, setTitle] = useState("");
//   const [xAxis, setXAxis] = useState("");
//   const [yAxis, setYAxis] = useState("");
//   const [chartType, setChartType] = useState("Bar");
//   const [limitType, setLimitType] = useState("all");
//   const [limitCount, setLimitCount] = useState(10);
//   const [showGrid, setShowGrid] = useState(true);
//   const [showTooltip, setShowTooltip] = useState(true);
//   const [showLabels, setShowLabels] = useState(false);
//   const chartRef = useRef(null);
  

//   const filtered = useMemo(() => {
//     if (!xAxis || !yAxis) return [];
//     const arr = data.filter(d => typeof d[yAxis] === "number");
//     const sorted = [...arr].sort((a, b) =>
//       limitType === "top" ? b[yAxis] - a[yAxis] :
//       limitType === "bottom" ? a[yAxis] - b[yAxis] :
//       0
//     );
//     return limitType === "all" ? sorted : sorted.slice(0, limitCount);
//   }, [data, xAxis, yAxis, limitType, limitCount]);

//   const handleDownload = useCallback(() => {
//     if (chartRef.current) {
//       toPng(chartRef.current)
//         .then(dataUrl => {
//           const link = document.createElement("a");
//           link.download = `${title || "chart"}.png`;
//           link.href = dataUrl;
//           link.click();
//         })
//         .catch(console.error);
//     }
//   }, [title]);

//   const renderChart = () => {
//     if (!xAxis || !yAxis || filtered.length === 0) {
//       return <div className="py-20 text-center text-gray-500">Select axes and ensure data is available.</div>;
//     }

//     const common = { data: filtered, margin: { top: 20, right: 30, left: 20, bottom: 80 } };
//     const xProps = { dataKey: xAxis, angle: -45, textAnchor: "end", interval: 0, height: 100 };

//     switch (chartType) {
//       case "Bar":
//         return (
//           <BarChart {...common}>
//             {showGrid && <CartesianGrid stroke="#ccc" />}
//             <XAxis {...xProps} />
//             <YAxis />
//             {showTooltip && <Tooltip />}
//             <Legend />
//             <Bar dataKey={yAxis} fill={COLORS[0]}>
//               {showLabels && <LabelList dataKey={yAxis} position="top" />}
//             </Bar>
//           </BarChart>
//         );
//       case "StackedBar":
//         return (
//           <BarChart {...common}>
//             {showGrid && <CartesianGrid stroke="#ccc" />}
//             <XAxis {...xProps} />
//             <YAxis />
//             {showTooltip && <Tooltip />}
//             <Legend />
//             {columns.filter(c => c.field !== xAxis).map((c, i) => (
//               <Bar key={c.field} dataKey={c.field} stackId="a" fill={COLORS[i]}>
//                 {showLabels && <LabelList dataKey={c.field} position="top" />}
//               </Bar>
//             ))}
//           </BarChart>
//         );
//       case "Line":
//         return (
//           <LineChart {...common}>
//             {showGrid && <CartesianGrid stroke="#ccc" />}
//             <XAxis {...xProps} />
//             <YAxis />
//             {showTooltip && <Tooltip />}
//             <Legend />
//             <Line type="monotone" dataKey={yAxis} stroke={COLORS[0]} />
//           </LineChart>
//         );
//       case "Area":
//         return (
//           <AreaChart {...common}>
//             {showGrid && <CartesianGrid stroke="#ccc" />}
//             <XAxis {...xProps} />
//             <YAxis />
//             {showTooltip && <Tooltip />}
//             <Legend />
//             <Area type="monotone" dataKey={yAxis} stroke={COLORS[0]} fill={COLORS[0]} />
//           </AreaChart>
//         );
//       case "Pie":
//         return (
//           <PieChart>
//             <Pie data={filtered} dataKey={yAxis} nameKey={xAxis} cx="50%" cy="50%" outerRadius={120} label>
//               {filtered.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
//             </Pie>
//             {showTooltip && <Tooltip />}
//             <Legend />
//           </PieChart>
//         );
//       default:
//         return <div className="text-red-500">Unsupported chart type</div>;
//     }
//   };

//   return (

//     <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
//       {/* 💠 Controls */}
//       <div className="grid grid-cols-1 md:grid-cols-6 gap-1">
//         <input type="text" placeholder="Chart Title" value={title} onChange={e => setTitle(e.target.value)}
//           className="col-span-2 p-2 border rounded text-sm" />

//         <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="p-2 border rounded">
//           <option value="">X-Axis</option>
//           {columns.map(c => <option key={c.field} value={c.field}>{c.headerName}</option>)}
//         </select>

//         <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="p-2 border rounded">
//           <option value="">Y-Axis</option>
//           {columns.map(c => <option key={c.field} value={c.field}>{c.headerName}</option>)}
//         </select>

//         <select value={chartType} onChange={e => setChartType(e.target.value)} className="p-2 border rounded">
//           {["Bar", "StackedBar", "Line", "Area", "Pie"].map(t => <option key={t} value={t}>{t}</option>)}
//         </select>

//         <select value={limitType} onChange={e => setLimitType(e.target.value)} className="p-2 border rounded">
//           <option value="all">All</option>
//           <option value="top">Top</option>
//           <option value="bottom">Bottom</option>
//         </select>

//         {limitType !== "all" && (
//           <input type="number" min="1" value={limitCount} onChange={e => setLimitCount(+e.target.value)}
//             className="p-2 border rounded w-full" />
//         )}
//       </div>

//       {/* 🛠️ Toggles */}
//       <div className="flex space-x-4">
//         <label className="inline-flex items-center space-x-1">
//           <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(prev => !prev)} />
//           <span>Grid</span>
//         </label>
//         <label className="inline-flex items-center space-x-1">
//           <input type="checkbox" checked={showTooltip} onChange={() => setShowTooltip(prev => !prev)} />
//           <span>Tooltip</span>
//         </label>
//         <label className="inline-flex items-center space-x-1">
//           <input type="checkbox" checked={showLabels} onChange={() => setShowLabels(prev => !prev)} />
//           <span>Data Labels</span>
//         </label>
//         <button onClick={handleDownload}
//           className="ml-auto px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
//           Download PNG
//         </button>
//       </div>

//       {/* 📊 Chart Container */}
//       {title && <h2 className="text-xl font-semibold">{title}</h2>}
//       <div className="overflow-auto w-full">
//         <div ref={chartRef} style={{ width: `${Math.max(filtered.length * 80, 600)}px`, height: "400px" }}>
//           <ResponsiveContainer width="100%" height="100%">{renderChart()}</ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChartBuilder;




import React, { useState, useMemo, useRef, useCallback, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { toPng } from "html-to-image";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb"];

const ChartBuilder = ({ data = [], columns = [] }) => {
  const [title, setTitle] = useState("");
  const [xAxis, setXAxis] = useState("");
  const [yAxis, setYAxis] = useState("");
  const [chartType, setChartType] = useState("Bar");
  const [limitType, setLimitType] = useState("all");
  const [limitCount, setLimitCount] = useState(10);
  const [showGrid, setShowGrid] = useState(true);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showLabels, setShowLabels] = useState(false);

  const chartRef = useRef(null);

  useEffect(() => {
    if (columns.length > 1 && !xAxis && !yAxis) {
      setXAxis(columns[0].field);
      setYAxis(columns[1].field);
    }
  }, [columns, xAxis, yAxis]);


const filtered = useMemo(() => {
  if (!xAxis || !yAxis) return [];

  const map = new Map();

  data.forEach(row => {
    const x = row[xAxis];
    const y = parseFloat(row[yAxis]);
    if (!x || isNaN(y)) return;

    if (map.has(x)) {
      map.set(x, map.get(x) + y);
    } else {
      map.set(x, y);
    }
  });

  // Convert map to array for sorting
  const aggArray = Array.from(map.entries()).map(([key, value]) => ({
    [xAxis]: key,
    [yAxis]: value,
  }));

  // Sort + limit
  const sorted = [...aggArray].sort((a, b) =>
    limitType === "top" ? b[yAxis] - a[yAxis] :
    limitType === "bottom" ? a[yAxis] - b[yAxis] : 0
  );

  return limitType === "all" ? sorted : sorted.slice(0, limitCount);
}, [data, xAxis, yAxis, limitType, limitCount]);


useEffect(() => {
  console.log("Filtered row data:", filtered);
  console.log("xAxis:", xAxis);
  console.log("yAxis:", yAxis);
  console.log("Filtered[0]:", filtered[0]);
}, [filtered, xAxis, yAxis]);



  const handleDownload = useCallback(() => {
    if (!chartRef.current) return;
    toPng(chartRef.current)
      .then(dataUrl => {
        const link = document.createElement("a");
        link.download = `${title || "chart"}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(console.error);
  }, [title]);

  const getOption = () => {
    const xData = filtered.map(d => d[xAxis]);
    const baseSeries = [];

    switch (chartType) {
      case "Bar":
        baseSeries.push({
          type: "bar",
          large: true,
largeThreshold: 1000, // reduce threshold to enable optimization earlier

          data: filtered.map(d => d[yAxis]),
          itemStyle: { color: COLORS[0] },
          label: showLabels ? { show: true, position: "top" } : undefined,
        });
        break;

      case "StackedBar":
        columns
          .filter(c => c.field !== xAxis)
          .forEach((c, i) => {
            baseSeries.push({
              name: c.headerName,
              type: "bar",
              stack: "stack",
              data: filtered.map(d => d[c.field] ?? 0),
              itemStyle: { color: COLORS[i % COLORS.length] },
              label: showLabels ? { show: true, position: "top" } : undefined,
            });
          });
        break;

      case "Line":
        baseSeries.push({
          type: "line",
          smooth: true,
          data: filtered.map(d => d[yAxis]),
          lineStyle: { color: COLORS[0] },
          label: showLabels ? { show: true } : undefined,
        });
        break;

      case "Area":
        baseSeries.push({
          type: "line",
          smooth: true,
          areaStyle: {},
          data: filtered.map(d => d[yAxis]),
          lineStyle: { color: COLORS[0] },
          label: showLabels ? { show: true } : undefined,
        });
        break;

      case "Pie":
        baseSeries.push({
          type: "pie",
          radius: "60%",
          data: filtered.map((d, i) => ({
            name: d[xAxis],
            value: d[yAxis],
            itemStyle: { color: COLORS[i % COLORS.length] },
            label: showLabels ? { show: true } : undefined,
          })),
        });
        break;

      default:
        break;
    }

    return {
      title: { text: title, left: "center" },
      tooltip: showTooltip ? {} : undefined,
      legend: chartType === "Pie" ? { top: "bottom" } : { top: "top" },
      grid: chartType === "Pie" ? undefined : {
        left: "5%", right: "5%", bottom: "20%",
        show: showGrid, containLabel: true,
      },
      xAxis: chartType === "Pie" ? undefined : {
        type: "category", data: xData,
        axisLabel: { rotate: -45 }
      },
      yAxis: chartType === "Pie" ? undefined : { type: "value" },
      series: baseSeries,
      dataZoom: chartType === "Pie" ? [] : [{ type: "inside" }, { type: "slider" }],
    };
  };


  return (
    <div className="p-6 bg-white rounded-lg shadow-lg space-y-4">
      {/* 🎛 Controls */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-1">
        <input
          type="text"
          placeholder="Chart Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="col-span-2 p-2 border rounded text-sm"
        />
        <select value={xAxis} onChange={e => setXAxis(e.target.value)} className="p-2 border rounded">
          <option value="">X-Axis</option>
          {columns.map(c => <option key={c.field} value={c.field}>{c.headerName}</option>)}
        </select>
        <select value={yAxis} onChange={e => setYAxis(e.target.value)} className="p-2 border rounded">
          <option value="">Y-Axis</option>
          {columns.map(c => <option key={c.field} value={c.field}>{c.headerName}</option>)}
        </select>
        <select value={chartType} onChange={e => setChartType(e.target.value)} className="p-2 border rounded">
          {["Bar", "StackedBar", "Line", "Area", "Pie"].map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select value={limitType} onChange={e => setLimitType(e.target.value)} className="p-2 border rounded">
          <option value="all">All</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
        {limitType !== "all" && (
          <input
            type="number"
            min="1"
            value={limitCount}
            onChange={e => setLimitCount(+e.target.value)}
            className="p-2 border rounded w-full"
          />
        )}
      </div>

      {/* 🔘 Toggles */}
      <div className="flex space-x-4 items-center">
        <label className="inline-flex items-center space-x-1">
          <input type="checkbox" checked={showGrid} onChange={() => setShowGrid(prev => !prev)} />
          <span>Grid</span>
        </label>
        <label className="inline-flex items-center space-x-1">
          <input type="checkbox" checked={showTooltip} onChange={() => setShowTooltip(prev => !prev)} />
          <span>Tooltip</span>
        </label>
        <label className="inline-flex items-center space-x-1">
          <input type="checkbox" checked={showLabels} onChange={() => setShowLabels(prev => !prev)} />
          <span>Data Labels</span>
        </label>
        <button
          onClick={handleDownload}
          className="ml-auto px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Download PNG
        </button>
      </div>

      {/* 📈 Chart */}
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
 <div className="overflow-auto w-full">
  <div
    ref={chartRef}
    style={{
      minHeight: "520px",        // 🔒 ensures vertical room
      height: "420px",           // 🔒 set fixed height (not auto)
      minWidth: "100%",          // 💡 Ensures child chart fits
    }}
  >
    <ReactECharts
    key={chartType}
      option={getOption()}
      style={{
        height: "100%",          // 👈 matches parent height
        minWidth: `${Math.max(filtered.length * 80, 600)}px`, // ✅ scrolling
      }}
      opts={{ renderer: "canvas" }}
    />
  </div>
</div>


    </div>
  );
};

export default ChartBuilder;
