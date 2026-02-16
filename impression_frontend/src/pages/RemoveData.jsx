import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BASE_URL from './config';
import { useOutletContext } from 'react-router-dom';


const RemoveData = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [action, setAction] = useState('');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const { selectedCompany } = useOutletContext();


const fetchWarehouses = async () => {
  try {
    const token = localStorage.getItem('authToken');
    const userRes = await fetch(`${BASE_URL}/api/users/me/`, {
      headers: { Authorization: `token ${token}` },
    });
    const user = await userRes.json();

    let companyId = null;
    if (user.role === 'superadmin') {
      if (selectedCompany?.id) {
        companyId = selectedCompany.id;
      } else if (user.companies?.length > 0) {
        companyId = user.companies[0];
      }
    } else {
      if (user.companies?.length > 0) {
        companyId = user.companies[0];
      }
    }

    if (!companyId) return;

    const response = await fetch(`${BASE_URL}/api/get_warehouse/?company_id=${companyId}`, {
      headers: {
        'Authorization': `token ${token}`,
      },
    });
    const data = await response.json();
    setWarehouses(data);
  } catch (err) {
    console.error("Failed to fetch warehouses", err);
  }
};


  const handleRemove = async () => {
    if (!selectedDate || !action) {
      alert("Please select a date and action.");
      return;
    }
  
    const token = localStorage.getItem("authToken");
  
    try {
       const userRes = await fetch(`${BASE_URL}/api/users/me/`, {
      headers: { Authorization: `token ${token}` },
    });
    const user = await userRes.json();

    // Get company_id using superadmin logic
    let companyId = null;
    if (user.role === "superadmin") {
      if (selectedCompany?.id) {
        companyId = selectedCompany.id;
      } else if (user.companies?.length > 0) {
        companyId = user.companies[0];
      }
    } else {
      if (user.companies?.length > 0) {
        companyId = user.companies[0];
      }
    }

    if (!companyId) {
      alert("No associated company found.");
      return;
    }

      let response;
      const url = `${BASE_URL}/api/remove_product_column/`;
  
      const requestData = {
        date: selectedDate,
        action: action,
        warehouse_id: selectedWarehouse,
        company_id: companyId,
      };
  
      // If action is "Tally", handle column deletion
      if (action === "Tally") {
        response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${token}`,
          },
          body: JSON.stringify(requestData),
        });
      } 
      // If action is "Count", handle product stock deletion
      else if (action === "Count") {
        if (!selectedWarehouse) {
          alert("Please select a warehouse for Count action.");
          return;
        }
        
        response = await fetch(url, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `token ${token}`,
          },
          body: JSON.stringify(requestData),
        });
      }
  
      const result = await response.json();
  
      if (response.ok) {
        alert(result.message);
  
        // ✅ Clear selected inputs after successful delete
        setSelectedDate('');
        setAction('');
        setSelectedWarehouse('');
        setWarehouses([]);
      } else {
        alert(result.error || "Something went wrong.");
      }
    } catch (err) {
      alert("Failed to remove data.");
    }
  };
  
  

  return (
    <div className="bg-gray-100 dark:bg-gray-950 min-h-screen px-4 py-10">
      {/* Page Header (outside of card) */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Remove Data</h1>
      </div>

      {/* Card Container */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-6 md:p-8">
        {/* Select Date */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            placeholder="dd-mm-yyyy"
            className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Select Action */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Select Action</label>
          <div className="flex items-center gap-6">
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                value="Tally"
                checked={action === 'Tally'}
                onChange={() => setAction('Tally')}
                className="mr-2"
              />
              Tally
            </label>
            <label className="flex items-center text-sm text-gray-700 dark:text-gray-300">
              <input
                type="radio"
                value="Count"
                checked={action === 'Count'}
                onChange={() => {
                  setAction('Count');
                  fetchWarehouses();
                }}

                className="mr-2"
              />
              Count
            </label>
          </div>
        </div>
        {action === 'Count' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Select Warehouse</label>
            <select
              value={selectedWarehouse}
              onChange={(e) => setSelectedWarehouse(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>{wh.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleRemove}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Remove
          </button>
          <button
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveData;
