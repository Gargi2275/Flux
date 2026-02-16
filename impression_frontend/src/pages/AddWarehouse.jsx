import BASE_URL from "./config";
import React, { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom"; // <-- import useOutletContext
import axios from "axios";
import { toast, ToastContainer } from "react-toastify"; // Import Toastify
import "react-toastify/dist/ReactToastify.css";

export default function AddWarehouse() {
  // Get selected company from parent route context
  const { selectedCompany } = useOutletContext(); // assuming parent provides { selectedCompany: companyId }

  const [formData, setFormData] = useState({
    warehouseName: "",
    warehouseCode: "",
    description: "",
  });

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const userRole = localStorage.getItem("userRole");
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (loading) return;

  setLoading(true);

  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Unauthorized. Please login again.");
      setLoading(false);
      return;
    }

    let companyId;
    if (userRole === "superadmin") {
      if (!selectedCompany || !selectedCompany.id) {
        toast.error("Please select a company before adding a warehouse.");
        setLoading(false);
        return;
      }
      companyId = selectedCompany.id;
    } else if (userRole === "admin") {
      const userResponse = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Token ${token}` },
      });
      const companies = userResponse.data?.companies;
      if (!companies || companies.length === 0) {
        toast.error("No company found for your user.");
        setLoading(false);
        return;
      }
      companyId = companies[0]; // <-- Correctly using the company ID directly
    } else {
      toast.error("You are not authorized to add a warehouse.");
      setLoading(false);
      return;
    }

    const data = {
      name: formData.warehouseName,
      code: formData.warehouseCode,
      description: formData.description,
      company_id: companyId,
    };

    await axios.post(`${BASE_URL}/api/add_warehouse/`, data, {
      headers: { Authorization: `Token ${token}` },
    });

    toast.success("Warehouse added successfully!");
    setFormData({
      warehouseName: "",
      warehouseCode: "",
      description: "",
    });
  } catch (error) {
    if (error.response) {
      const errorMessage = error.response.data?.error || "Server error";
      toast.error(errorMessage);
    } else if (error.request) {
      toast.error("No response from server");
    } else {
      toast.error("Something went wrong");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 px-6 sm:px-10 py-10 overflow-y-auto">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-3">
        Add Warehouse
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        {/* Warehouse Name */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Warehouse Name
          </label>
          <input
            type="text"
            name="warehouseName"
            value={formData.warehouseName}
            onChange={handleChange}
            placeholder="Enter warehouse name"
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            required
          />
        </div>

        {/* Warehouse Code */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Warehouse Code
          </label>
          <input
            type="text"
            name="warehouseCode"
            value={formData.warehouseCode}
            onChange={handleChange}
            placeholder="Enter warehouse code"
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter warehouse description"
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows="4"
            required
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-indigo-400 cursor-not-allowed"
                : "bg-indigo-600 hover:bg-indigo-700"
            } text-white font-semibold px-6 py-3 rounded-md transition shadow`}
          >
            {loading ? "Submitting..." : "Submit"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/warehouse")}
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold px-6 py-3 rounded-md transition shadow"
          >
            Back
          </button>
        </div>
      </form>

      <ToastContainer />
    </div>
  );
}
