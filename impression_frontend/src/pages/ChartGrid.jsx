// src/components/ChartGrid.jsx
import React from "react";
import DashboardCard from "./DashboardCards";
import MyChart from "./MyChart";
import { FaDollarSign, FaUsers, FaShoppingCart } from "react-icons/fa";


const ChartGrid = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Top dashboard cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <DashboardCard title="Total Sales" value="$25,000" icon={<FaDollarSign />} />
        <DashboardCard title="New Customers" value="1,200" icon={<FaUsers />} />
        <DashboardCard title="Orders" value="320" icon={<FaShoppingCart />} />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <MyChart type="bar" title="Monthly Sales" />
        <MyChart type="line" title="Growth Over Time" />
        <MyChart type="doughnut" title="Sales Distribution" />
        <MyChart type="bar" title="Revenue Chart" />
      </div>
    </div>
  );
};

export default ChartGrid;
