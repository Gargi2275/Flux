import { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import BASE_URL from "./config";
import { Edit, Trash2 } from "lucide-react";

export default function AddRole() {
  const [formData, setFormData] = useState({ role: "" });
  const [roles, setRoles] = useState([]);
  const [editingRoleId, setEditingRoleId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isFormVisible, setIsFormVisible] = useState(false); // Added state for form visibility

  const token = localStorage.getItem("authToken");
  const authHeader = {
    headers: {
      Authorization: `Token ${token}`,
    },
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/roles/get/`, authHeader);
      setRoles(res.data);
    } catch (err) {
      toast.error("❌ Unauthorized or failed to fetch roles.");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = formData.role.trim();
    const normalized = trimmed.toLowerCase().replace(/\s+/g, "");
  
    if (!trimmed) return;
  
    const userRole = localStorage.getItem("role")?.toLowerCase();
  
    // ✅ 1. Check for duplicates
    const roleExists = roles.some((r) => r.role.toLowerCase() === normalized);
    if (roleExists && !editingRoleId) {
      toast.warning("⚠️ Role already exists.");
      return;
    }
  
    // ✅ 2. Prevent user from creating their own role again
    if (userRole === normalized) {
      toast.error(`🚫 You cannot create your own role again (${userRole})`);
      return;
    }
  
    // ✅ 3. Prevent superadmin from creating techadmin
    if (userRole === "superadmin" && normalized === "techadmin") {
      toast.error("🚫 superadmin is not allowed to create techadmin");
      return;
    }
  
    try {
      if (editingRoleId) {
        await axios.put(
          `${BASE_URL}/api/roles/update/${editingRoleId}/`,
          { role: trimmed },
          authHeader
        );
        toast.success("✅ Role updated!");
        setEditingRoleId(null);
      } else {
        await axios.post(
          `${BASE_URL}/api/roles/create/`,
          { role: trimmed },
          authHeader
        );
        toast.success("🎉 Role added!");
      }
  
      setFormData({ role: "" });
      fetchRoles();
    } catch (error) {
      const statusCode = error.response?.status;
      const errorData = error.response?.data;
  
      if (statusCode === 400 && errorData?.role) {
        toast.warning(`⚠️ ${errorData.role}`);
      } else if (statusCode === 403 && errorData?.detail) {
        toast.error(`🚫 ${errorData.detail}`);
      } else {
        toast.error("❌ Operation failed.");
      }
    }
  };

  const handleEdit = (role) => {
    setFormData({ role: role.role });
    setEditingRoleId(role.id);
  };

  const handleCancelEdit = () => {
    setFormData({ role: "" });
    setEditingRoleId(null);
  };

  const confirmDelete = (id) => {
    setDeleteConfirmId(id);
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/roles/delete/${deleteConfirmId}/`, authHeader);
      toast.success("🗑️ Role deleted!");
      setDeleteConfirmId(null);
      fetchRoles();
    } catch (err) {
      toast.error("❌ Failed to delete role.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-gray-900 px-6 py-8">
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          {/* Create Role Button */}
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            {isFormVisible ? "Create Role" : "Create Role"}
          </button>
        </div>

        {/* Form Section with Smooth Collapse/Expand */}
        <div
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isFormVisible ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="role"
                className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Role
              </label>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="Enter role"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                {editingRoleId ? "Update" : "Submit"}
              </button>
              {editingRoleId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Role Table */}
        <div className="mt-8">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Existing Roles
          </h3>
          <table className="min-w-full table-auto bg-white-100 dark:bg-gray-700 rounded-lg shadow-lg">
  <thead className="bg-gray-200 dark:bg-gray-900 text-gray-600">
    <tr>
      <th className="px-4 py-2 text-left">Role</th>
      <th className="px-4 py-2 text-left">Actions</th>
    </tr>
  </thead>
  <tbody>
    {roles.map((role) => (
      <tr
        key={role.id}
        className="border-b border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-600"
>
        <td className="px-4 py-2">{role.role}</td>
        <td className="px-4 py-2 flex gap-3">
          {/* <button
            onClick={() => handleEdit(role)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button> */}
          <button
            onClick={() => confirmDelete(role.id)}
            className="text-red-600 dark:text-red-400 hover:text-red-800"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>

        </div>
      </div>

      {/* Confirm Delete Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Are you sure you want to delete this role?
            </h3>
            <div className="flex justify-end gap-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
