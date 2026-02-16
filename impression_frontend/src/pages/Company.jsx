import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaRegEdit, FaRegTrashAlt, FaPlus } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import BASE_URL from "./config";
import "react-toastify/dist/ReactToastify.css";

export default function Companies() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [companies, setCompanies] = useState([]);
  const [editCompany, setEditCompany] = useState(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  

  const fetchCompanies = () => {
    const token = localStorage.getItem("authToken");

    axios.get(`${BASE_URL}/api/companies/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(res => setCompanies(res.data))
      .catch(() => toast.error("Unauthorized. Please login again."));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  
const filteredCompanies = Array.isArray(companies)
  ? companies.filter((company) =>
      `${company.name} ${company.location}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  : [];


  const totalPages = Math.ceil(filteredCompanies.length / rowsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handleEditSave = () => {
    axios.put(`${BASE_URL}/api/companies/${editCompany.id}/`, editCompany)
      .then(() => {
        setEditCompany(null);
        fetchCompanies();
      })
      .catch(() => toast.error("Failed to update company."));
  };

  const confirmDelete = () => {
    const token = localStorage.getItem("authToken");

    axios.delete(`${BASE_URL}/api/companies/${deleteCompanyId}/`, {
      headers: { Authorization: `Token ${token}` },
    })
      .then(() => {
        setShowDeleteModal(false);
        fetchCompanies();
        toast.success("Company deleted successfully!");
      })
      .catch(() => toast.error("Failed to delete company."));
  };

  return (
    <div className="w-full p-4 sm:p-6 overflow-x-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Companies</h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full sm:w-auto flex items-center justify-center gap-2"
          onClick={() => navigate("/add-company")}
        >
          <FaPlus />
          <span>Add Company</span>
        </button>

        <input
          type="text"
          placeholder="Search companies..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full sm:w-72 px-4 py-2 border rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <table className="min-w-[600px] w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Company Name</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {paginatedCompanies.map((company, idx) => (
              <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="px-4 py-3">{company.name}</td>
                <td className="px-4 py-3">{company.location}</td>
                <td className="px-4 py-3">{company.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4 text-lg">
                    <button onClick={() => navigate(`/companies/edit/${company.id}`)} className="text-blue-600 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300">
  <FaRegEdit />
</button>

                    <button onClick={() => {
                      setDeleteCompanyId(company.id);
                      setShowDeleteModal(true);
                    }} className="text-red-600 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300">
                      <FaRegTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedCompanies.length === 0 && (
              <tr>
                <td colSpan="4" className="text-center px-4 py-3 text-gray-500 dark:text-gray-400">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border px-2 py-1 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {[10, 20, 30].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50">
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Edit Company</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editCompany.name}
                onChange={(e) => setEditCompany({ ...editCompany, name: e.target.value })}
                placeholder="Company Name"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
              />
              <input
                type="text"
                value={editCompany.location}
                onChange={(e) => setEditCompany({ ...editCompany, location: e.target.value })}
                placeholder="Location"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
              />
              <textarea
                value={editCompany.description}
                onChange={(e) => setEditCompany({ ...editCompany, description: e.target.value })}
                placeholder="Description"
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setEditCompany(null)} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded">Cancel</button>
                <button onClick={handleEditSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[400px]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this company?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
