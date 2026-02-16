// src/components/DashboardCard.jsx
import React from "react";

const DashboardCard = ({ title, value, icon }) => {
  return (
    <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
      <div className="flex flex-col">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h4>
        <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      </div>
      <div className="text-4xl text-blue-500 dark:text-blue-400">
        {icon}
      </div>
    </div>
  );
};

export default DashboardCard;
