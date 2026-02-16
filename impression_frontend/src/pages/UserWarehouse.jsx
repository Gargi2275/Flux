import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "./config";
import { useOutletContext } from "react-router-dom";

const UserWarehouse = () => {
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
 const [currentUser, setCurrentUser] = useState(null);
const [warehouses, setWarehouses] = useState([]);
const [users, setUsers] = useState([]);
const { selectedCompany } = useOutletContext(); // ✅ Still correct

useEffect(() => {
  const fetchInitialData = async () => {
    try {
      axios.defaults.headers.common[
        "Authorization"
      ] = `Token ${localStorage.getItem("authToken")}`;

      // Get current user info
      const userRes = await axios.get(`${BASE_URL}/api/users/me/`);
      const user = userRes.data;
      setCurrentUser(user);

      // Determine initial company id
      let companyId = null;

      if (user.role === "superadmin") {
        if (selectedCompany && selectedCompany.id) {
          companyId = selectedCompany.id;
        } else if (user.companies && user.companies.length > 0) {
          companyId = user.companies[0];
        }
      } else {
        if (user.companies && user.companies.length > 0) {
          companyId = user.companies[0];
        }
      }

      if (!companyId) return; // no company to fetch for

      // Fetch warehouses and users for that company
      const [warehouseRes, userListRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/get_warehouse/?company_id=${companyId}`),
        axios.get(`${BASE_URL}/api/users/?company_id=${companyId}`),
      ]);

      const onlyUsers = userListRes.data
        .filter((u) => u.role === "User")
        .map((u) => {
          const userMap = { ...u };
          (u.warehouses || []).forEach((wid) => {
            userMap[wid] = true;
          });
          return userMap;
        });

      setWarehouses(warehouseRes.data);
      setUsers(onlyUsers);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  fetchInitialData();
}, [selectedCompany]); // ✅ Re-run when selectedCompany changes


  const filteredUsers = users.filter((u) =>
    u.username && typeof u.username === "string"
      ? u.username.toLowerCase().includes(searchTerm.toLowerCase())
      : false
  );

  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const visibleData = filteredUsers.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  const handleCheckboxToggle = async (userIndex, warehouseId) => {
    const user = users[userIndex];
    const action = user[warehouseId] ? "remove" : "add";

    try {
      const response = await axios.post(
        `${BASE_URL}/api/update_user_warehouse/`,
        {
          user_id: user.id,
          warehouse_id: warehouseId,
          action,
        }
      );

      if (response.data.status === "success") {
        const updatedUsers = [...users];
        updatedUsers[userIndex][warehouseId] =
          !updatedUsers[userIndex][warehouseId];
        setUsers(updatedUsers);
      }
    } catch (error) {}
  };

  return (
    <div className="p-4 md:p-6 bg-white dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100">
      <h1 className="text-2xl font-bold mb-6">User Warehouse</h1>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        <div>
          <label className="mr-2 font-medium">Search:</label>
          <input
            type="text"
            placeholder="Search"
            className="border dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded px-3 py-1"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div>
          <label className="mr-2 font-medium">Rows per page:</label>
          <input
            type="number"
            min={1}
            value={entriesPerPage}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "") {
                setEntriesPerPage("");
              } else {
                const numberValue = Math.max(1, Number(value));
                setEntriesPerPage(numberValue);
              }
            }}
            onBlur={() => {
              if (entriesPerPage === "") {
                setEntriesPerPage(1);
              }
            }}
            className="w-20 px-2 py-1 border dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow border border-gray-200 dark:border-gray-700">
        <table className="min-w-[1200px] w-full text-sm text-left">
          <thead className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 uppercase text-xs sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3">User</th>
              {warehouses.map((warehouse) => (
                <th key={warehouse.id} className="px-4 py-3">
                  {warehouse.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {visibleData.map((user, rowIndex) => (
              <tr
                key={user.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 font-semibold">{user.username}</td>
                {warehouses.map((warehouse) => (
                  <td key={warehouse.id} className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={!!user[warehouse.id]}
                      onChange={() =>
                        handleCheckboxToggle(
                          rowIndex + startIndex,
                          warehouse.id
                        )
                      }
                      className="w-4 h-4 accent-blue-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <span className="text-sm text-gray-600 dark:text-gray-300">
          Showing {startIndex + 1} to{" "}
          {Math.min(startIndex + entriesPerPage, filteredUsers.length)} of{" "}
          {filteredUsers.length} entries
        </span>
        <div className="flex gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600"
          >
            Previous
          </button>
          <span className="px-4 py-1 border rounded text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800">
            {currentPage}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 disabled:bg-gray-300 dark:disabled:bg-gray-600"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserWarehouse;
