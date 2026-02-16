import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css"; // Import Toastify CSS// Ensure correct import for react-hot-toast
import BASE_URL from "./config";

export default function EditWarehouse() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    warehouseName: "",
    warehouseCode: "",
    description: "",
  });
const token=localStorage.getItem("authToken")
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/get_warehouse/${id}/`,{
        headers: {
          Authorization: `Token ${token}`,
        },
      })
      .then((res) => {
        setFormData({
          warehouseName: res.data.name,
          warehouseCode: res.data.code,
          description: res.data.description,
        });
      })
      .catch(() => {
        toast.error("Failed to fetch warehouse data");
      });
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    const { warehouseName, warehouseCode, description } = formData;

    const token = localStorage.getItem("authToken"); // or wherever your token is stored

axios
  .put(
    `${BASE_URL}/api/update_warehouse/${id}/`,
    {
      name: warehouseName,
      code: warehouseCode,
      description,
    },
    {
      headers: {
        Authorization: `Token ${token}`, // Use `Bearer ${token}` if using JWT
      },
    }
  )
  .then(() => {
    toast.success("Warehouse updated successfully");
    navigate("/warehouse");
  })
  .catch(() => {
    toast.error("Failed to update warehouse");
  })
  .finally(() => setLoading(false));

  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 px-4 py-10">
      <div className=" bg-white dark:bg-gray-800 shadow-lg rounded-xl p-8">
        <h2 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">
          Edit Warehouse
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">
              Warehouse Name
            </label>
            <input
              name="warehouseName"
              value={formData.warehouseName}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">
              Warehouse Code
            </label>
            <input
              name="warehouseCode"
              value={formData.warehouseCode}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex justify-start gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`${
                loading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700"
              } text-white px-6 py-2 rounded-md transition duration-200 shadow-md`}
            >
              {loading ? "Saving..." : "Update"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/warehouse")}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-6 py-2 rounded-md transition duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
      {/* <Toaster position="top-right" autoclose={3000} /> */}
    </div>
  );
}
