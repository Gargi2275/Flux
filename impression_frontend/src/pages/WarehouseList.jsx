
import { useNavigate } from "react-router-dom";
import { useState, useEffect,useRef} from "react";
import { FaRegEdit, FaRegTrashAlt, FaUserPlus } from "react-icons/fa";
import axios from "axios";
import BASE_URL from "./config";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css";
import { useOutletContext } from "react-router-dom"; // ⬅️ Import hook

export default function WarehouseList() {
  const { selectedCompany } = useOutletContext(); // ⬅️ Get selectedCompany

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [warehouses, setWarehouses] = useState([]);
  const [deleteId, setDeleteId] = useState(null); // For modal
  const userRole=localStorage.getItem("userRole")

const errorToastShown = useRef(false); // to avoid repeated error toasts

  useEffect(() => {
    if (userRole === "superadmin") {
      if (selectedCompany?.id) {
        fetchWarehouses(selectedCompany.id);
      } else {
        setWarehouses([]);
        if (!errorToastShown.current) {
          toast.error("Please select a company");
          errorToastShown.current = true;
        }
      }
    } else if (userRole === "admin") {
      // For admin, call fetchWarehouses only once on mount (or if token changes)
      fetchWarehousesForAdmin();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany]); // selectedCompany dependency for superadmin only

  const fetchWarehouses = async (companyId) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      if (!errorToastShown.current) {
        toast.error("Unauthorized. Please login again.");
        errorToastShown.current = true;
      }
      return;
    }

    try {
      const url = `${BASE_URL}/api/get_warehouse/?company_id=${companyId}`;
      const warehouseRes = await axios.get(url, {
        headers: { Authorization: `Token ${token}` },
      });
      setWarehouses(warehouseRes.data);
      errorToastShown.current = false; // reset error toast flag on success
    } catch (error) {
      console.error(error);
      if (!errorToastShown.current) {
        toast.error("Error fetching warehouses");
        errorToastShown.current = true;
      }
    }
  };

  const fetchWarehousesForAdmin = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      if (!errorToastShown.current) {
        toast.error("Unauthorized. Please login again.");
        errorToastShown.current = true;
      }
      return;
    }

    try {
      const userRes = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const companies = userRes.data.companies;
      if (!companies || companies.length === 0) {
        if (!errorToastShown.current) {
          toast.error("No company assigned to your account.");
          errorToastShown.current = true;
        }
        setWarehouses([]);
        return;
      }
      errorToastShown.current = false; // reset error toast flag on success
      await fetchWarehouses(companies[0]);
    } catch (error) {
      console.error(error);
      if (!errorToastShown.current) {
        toast.error("Error fetching warehouses");
        errorToastShown.current = true;
      }
    }
  };
  
  const handleDeleteConfirm = async () => {
    try {
      const token = localStorage.getItem("authToken");
      await axios.delete(`${BASE_URL}/api/delete_warehouse/${deleteId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      setWarehouses((prev) => prev.filter((w) => w.id !== deleteId));
      setDeleteId(null);
      toast.success("Warehouse deleted successfully!"); // Success toast
    } catch (err) {
      toast.error("Failed to delete warehouse"); // Error toast
    }
  };
  
  const handleEdit = (id) => {
    navigate(`/edit-warehouse/${id}`);
  };

 
  // Filter the warehouses based on the search input
  const filteredWarehouses = warehouses.filter((wh) =>
    `${wh.name} ${wh.code} ${wh.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredWarehouses.length / rowsPerPage);
  const paginatedWarehouses = filteredWarehouses.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };
  return (
    <div className="w-full p-4 sm:p-6 overflow-x-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Warehouses</h2>
      
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 shadow-md"
          onClick={() => navigate("/add-warehouse")}
        >
          <FaUserPlus />
          <span>Add Warehouse</span>
        </button>

        <input
          type="text"
          placeholder="Search warehouses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-72 px-4 py-2 border rounded-md dark:bg-gray-800 dark:text-white"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded shadow">
        <table className="min-w-[600px] w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
            <tr>
              <th className="px-4 py-3">Warehouse Name</th>
              <th className="px-4 py-3">Warehouse Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedWarehouses.map((wh) => (
              <tr key={wh.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                <td className="px-4 py-3">{wh.name}</td>
                <td className="px-4 py-3">{wh.code}</td>
                <td className="px-4 py-3">{wh.description}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-4 text-lg">
                    <button onClick={() => handleEdit(wh.id)} className="text-blue-600 hover:underline">
                      <FaRegEdit />
                    </button>
                    <button
                      className="text-red-600 hover:text-red-400"
                      onClick={() => setDeleteId(wh.id)}
                    >
                      <FaRegTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedWarehouses.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No warehouses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={handleRowsChange}
            className="border px-2 py-1 rounded-md dark:bg-gray-800 dark:text-white dark:border-gray-600 hover:shadow-lg transition-shadow duration-300"
          >
            {[5, 10, 15, 20].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            Next
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow w-80">
            <h4 className="text-lg font-semibold mb-4 dark:text-white">Delete Warehouse?</h4>
            <p className="mb-4 text-gray-600 dark:text-gray-300">Are you sure you want to delete this warehouse?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1 bg-gray-300 rounded"
              >
                No
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1 bg-red-600 text-white rounded"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
