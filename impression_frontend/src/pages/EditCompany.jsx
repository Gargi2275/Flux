import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import BASE_URL from "./config";
import { toast } from "react-toastify";

export default function EditCompany() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    description: "",
    logo: null,
  });
  const [logoPreview, setLogoPreview] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await axios.get(`${BASE_URL}/api/companies/${id}/`, {
          headers: { Authorization: `Token ${token}` },
        });

        setFormData({
          name: res.data.name || "",
          location: res.data.location || "",
          description: res.data.description || "",
          logo: null,
        });

        if (res.data.logo) {
          setLogoPreview(res.data.logo);
        }
      } catch (err) {
        toast.error("Failed to load company data.");
      }
    };

    fetchCompany();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData((prev) => ({ ...prev, logo: file }));
      setLogoPreview(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("authToken");
      const payload = new FormData();
      payload.append("name", formData.name);
      payload.append("location", formData.location);
      payload.append("description", formData.description);

      if (formData.logo instanceof File) {
        payload.append("logo", formData.logo);
      } else if (removeLogo) {
        payload.append("remove_logo", "true");
      }

      await axios.put(`${BASE_URL}/api/companies/${id}/`, payload, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Company updated successfully!");
      navigate("/company");
    } catch (err) {
      toast.error("Failed to update company.");
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 px-6 sm:px-10 py-10">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Edit Company</h2>
      <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
        <InputField
          name="name"
          label="Company Name"
          value={formData.name}
          onChange={handleChange}
        />
        <InputField
          name="location"
          label="Company Location"
          value={formData.location}
          onChange={handleChange}
        />

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-col">
          <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">Logo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleLogoChange}
            className="border rounded-md px-3 py-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          {logoPreview && (
            <div className="mt-3 flex items-center gap-4">
              <img
                src={logoPreview}
                alt="Logo preview"
                className="w-32 h-32 object-contain border border-gray-300 rounded-md"
              />
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, logo: null }));
                  setLogoPreview(null);
                  setRemoveLogo(true);
                }}
                className="text-red-600 hover:text-red-800 font-medium underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md px-6 py-3"
          >
            Update Company
          </button>
          <button
            type="button"
            onClick={() => navigate("/company")}
            className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-semibold px-6 py-3 rounded-md"
          >
            Back
          </button>
        </div>
      </form>
    </div>
  );
}

function InputField({ name, value, onChange, label, type = "text" }) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
      />
    </div>
  );
}
