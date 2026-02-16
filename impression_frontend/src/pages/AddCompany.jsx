import React, { useState } from "react";
import axios from "axios";
import BASE_URL from "./config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function Company() {
  const [formData, setFormData] = useState({
    companyName: "",
    companyLocation: "",
    description: "",
    logo: null,
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!formData.companyName.trim()) {
      formErrors.companyName = "Company name is required!";
      isValid = false;
    }

    if (!formData.companyLocation.trim()) {
      formErrors.companyLocation = "Company location is required!";
      isValid = false;
    }

   

    setErrors(formErrors);
    return isValid;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

const handleLogoChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    // Remove this dimension check entirely
    // So, just accept the file no matter the size:
    setFormData((prev) => ({ ...prev, logo: file }));
    setLogoPreview(img.src);
    setErrors((prev) => ({ ...prev, logo: "" }));
  };
};


  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error("Please fix the errors before submitting.");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");

    const payload = new FormData();
    payload.append("name", formData.companyName);
    payload.append("location", formData.companyLocation);
    payload.append("description", formData.description);
    if (formData.logo instanceof File) {
      payload.append("logo", formData.logo);
    }

    const response = await axios.post(`${BASE_URL}/api/companies/`, payload, {
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    toast.success("Company added successfully!");
    setFormData({
      companyName: "",
      companyLocation: "",
      description: "",
      logo: null,
    });
    setLogoPreview(null);
    setErrors({});
  } catch (error) {
    console.error(error);
    toast.error("Failed to add company.");
  }
};

  const handleCancel = () => {
    setFormData({
      companyName: "",
      companyLocation: "",
      description: "",
      logo: null,
    });
    setLogoPreview(null);
    setErrors({});
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 px-6 sm:px-10 py-10">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Add Company</h2>

      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <InputField
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          label="Company Name"
          required
          error={errors.companyName}
        />
        <InputField
          name="companyLocation"
          value={formData.companyLocation}
          onChange={handleChange}
          label="Company Location"
          required
          error={errors.companyLocation}
        />
        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">Description (Optional)</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Enter description"
            rows={3}
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">Upload Logo (max 200x200 px)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className={`border rounded-md px-3 py-2 ${errors.logo ? "border-red-500" : "border-gray-300"} dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
          />
          {errors.logo && <span className="text-red-500 text-sm mt-1">{errors.logo}</span>}
          {logoPreview && (
            <img src={logoPreview} alt="Logo preview" className="mt-3 w-32 h-32 object-contain border border-gray-300 rounded-md" />
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-6 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Company
          </button>
          <button
              type="button"
              onClick={() => window.history.back()}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold px-6 py-3 rounded-md transition shadow"
            >
              Back
            </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ name, value, onChange, label, type = "text", required, error }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`px-4 py-3 rounded-md border ${error ? "border-red-500" : "border-gray-300"} dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}
