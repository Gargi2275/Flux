import React, { useEffect, useState } from 'react';
import { FaTrash } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import axiosInstance from './axiosconfig'; // Import CreatePermission component

export default function PermissionsManager() {
  const [permissions, setPermissions] = useState([]);
  const [newPermission, setNewPermission] = useState("");
  const [newPermissionCode, setNewPermissionCode] = useState("");
  const [isFormVisible, setIsFormVisible] = useState(false); // To control form visibility
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // For delete modal
  const [deletePermissionId, setDeletePermissionId] = useState(null); // Permission ID for deletion

  // Fetch permissions on initial load
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = () => {
    axiosInstance.get('/api/permissions/').then((res) => setPermissions(res.data));
  };

  const deletePermission = (id) => {
    setDeletePermissionId(id);
    setIsDeleteModalOpen(true); // Open modal when attempting to delete
  };

  const confirmDeletePermission = () => {
    axiosInstance
      .delete(`/api/permissions/${deletePermissionId}/`)
      .then(() => {
        toast.success('Permission deleted!');
        fetchPermissions();
        setIsDeleteModalOpen(false); // Close modal after successful deletion
      })
      .catch(() => {
        toast.error('Failed to delete permission.');
        setIsDeleteModalOpen(false); // Close modal in case of failure
      });
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false); // Close modal without deletion
  };

  const createPermission = (e) => {
    e.preventDefault();
    if (!newPermission.trim() || !newPermissionCode.trim()) {
      toast.error("Both name and code are required.");
      return;
    }

    axiosInstance
      .post("/api/permissions/", {
        name: newPermission,
        code: newPermissionCode,
      })
      .then(() => {
        toast.success("Permission created!");
        setNewPermission("");
        setNewPermissionCode("");
        fetchPermissions();
        setIsFormVisible(false); // Hide form after successful creation
      })
      .catch((err) => {
        toast.error("Failed to create permission.");
      });
  };

  return (
    <div className="p-6 w-full space-y-6 bg-white dark:bg-gray-900 rounded shadow dark:text-white">
      <h1 className="text-2xl font-bold">Permissions Manager</h1>

      {/* Create Permission Button */}
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mb-4"
      >
        Create Permission
      </button>

      {/* Create Permission Form */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isFormVisible ? "max-h-[400px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <form onSubmit={createPermission} className="bg-gray-50 dark:bg-gray-800 p-4 rounded shadow-md space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Permission Name
            </label>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. Edit Product"
              value={newPermission}
              onChange={(e) => setNewPermission(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Permission Code
            </label>
            <input
              type="text"
              className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-gray-700 dark:text-white"
              placeholder="e.g. edit_product"
              value={newPermissionCode}
              onChange={(e) => setNewPermissionCode(e.target.value)}
            />
          </div>

          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
            >
              Create
            </button>
          </div>
        </form>
      </div>

      {/* Permissions Table */}
      <div className="bg-white dark:bg-gray-800 shadow-md rounded overflow-auto mt-6">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700 text-left">
            <tr>
              <th className="px-4 py-2">Permission</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {permissions.map((p) => (
              <tr key={p.id} className="border-t dark:border-gray-700">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => deletePermission(p.id)}
                    className="text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Are you sure you want to delete this permission?</h2>
            <div className="flex space-x-4">
              <button
                onClick={confirmDeletePermission}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes
              </button>
              <button
                onClick={cancelDelete}
                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
