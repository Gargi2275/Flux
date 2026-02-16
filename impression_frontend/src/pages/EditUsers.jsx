import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "./config";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { components } from "react-select";


export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    role: "",
    password: "",
    confirmPassword: "",
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [companies, setCompanies] = useState([]);
const [companyOptions, setCompanyOptions] = useState([]);
const [selectedCompanies, setSelectedCompanies] = useState([]);
const [isTechAdmin, setIsTechAdmin] = useState(false);
const CustomValueContainer = ({ children, ...props }) => {
  const selectedCount = props.getValue().length;
  return (
    <components.ValueContainer {...props}>
      <div className="pl-2 text-gray-800 dark:text-white">
        {selectedCount} selected
      </div>
      {children[1]} {/* This renders the search input */}
    </components.ValueContainer>
  );
};


useEffect(() => {
  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const authHeader = { headers: { Authorization: `Token ${token}` } };

      // Fetch user being edited and roles
      const [userRes, rolesRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/users/${id}/`, authHeader),
        axios.get(`${BASE_URL}/api/roles/get/`, authHeader),
      ]);

      setFormData({
  username: userRes.data.username,
  firstName: userRes.data.first_name,
  lastName: userRes.data.last_name,
  role: userRes.data.role,
  password: "",
  confirmPassword: "",
});


      // Fetch current logged-in user role from ${BASE_URL}/api/users/me/
      const meRes = await axios.get(`${BASE_URL}/api/users/me/`, authHeader);
      const currentUserRole = meRes.data.role;

      setIsTechAdmin(currentUserRole === "techadmin");

      if (currentUserRole === "techadmin") {
        await fetchCompanies();
        setSelectedCompanies(userRes.data.companies || []);
      }

      setRoles(rolesRes.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch user or roles.");
    }
  };

  fetchUser();
}, [id]);



  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

const fetchCompanies = async () => {
  try {
    const token = localStorage.getItem("authToken");
    const authHeader = { headers: { Authorization: `Token ${token}` } };
    const res = await axios.get(`${BASE_URL}/api/companies/`, authHeader);
    setCompanies(res.data);
    setCompanyOptions(
      res.data.map((c) => ({ label: c.name, value: c.id }))
    );
  } catch (error) {
    toast.error("Failed to fetch companies.");
  }
};


  const validateForm = () => {
    const errors = {};
    if (!formData.username || formData.username.trim() === "") {
      errors.username = "Username is required!";
    }
    if (formData.password && formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long!";
    }
    if (formData.password && !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      errors.password = "Password must contain at least one special character!";
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match!";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");

      const updateData = {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: formData.role,
      };

      if (formData.password && formData.confirmPassword) {
        updateData.password = formData.password;
      }
if (isTechAdmin) {
  updateData.companies = selectedCompanies;
}


      const response = await axios.put(
        `${BASE_URL}/api/users/${id}/update/`,
        updateData,
        {
          headers: {
            Authorization: `Token ${token}`,
          },
        }
      );

      if (response.status === 200 || response.status === 204) {
        toast.success("User updated successfully!");
        navigate("/users");
      } else {
        toast.error("Unexpected response from the server.");
      }
    } catch (error) {

      if (error.response) {
        if (error.response.data.username) {
          toast.error(error.response.data.username);
        } else {
          const errorMsg =
            error.response.data?.detail || error.response.data?.message || "Failed to update user.";
          toast.error(errorMsg);
        }
      } else {
        toast.error("Failed to update user. Please try again.");
      }
    }
  };

  if (loading) return <div className="p-6 text-lg">Loading...</div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 px-0 py-10 overflow-y-auto">

      <div className="w-full w-3xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg p-8">
        <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-3">
          Edit User
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
            {formErrors.username && (
              <p className="text-red-600 text-sm">{formErrors.username}</p>
            )}
          </div>

          {/* First Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">First Name</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Last Name */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Role */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>
                Select a role
              </option>
              {roles.length > 0 ? (
                roles.map((r) => (
                  <option key={r.id} value={r.role}>
                    {r.role}
                  </option>
                ))
              ) : (
                <option disabled>No roles available</option>
              )}
            </select>
          </div>

   {isTechAdmin && (
  <div className="flex flex-col">
    <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">Select Companies</label>
   <Select
  options={companyOptions}
  isMulti
value={companyOptions.filter((opt) => selectedCompanies.includes(opt.value)) || []}

  onChange={(selected) => {
    setSelectedCompanies(selected ? selected.map(opt => opt.value) : []);
  }}
  className="react-select-container"
  classNamePrefix="react-select"
  placeholder="Search and select companies..."
  closeMenuOnSelect={false}
  hideSelectedOptions={false}
  isClearable={false}
  components={{
    MultiValueContainer: () => null,
    MultiValueLabel: () => null,
    MultiValueRemove: () => null,
    ValueContainer: CustomValueContainer, // use fixed component
  }}
  styles={{
    control: (base) => ({
      ...base,
      backgroundColor: 'white',
      borderColor: '#d1d5db',
      color: 'black',
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  }}
/>

  </div>
)}


          {/* Password */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep unchanged"
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {formErrors.password && (
              <p className="text-red-600 text-sm">{formErrors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="flex flex-col">
            <label className="text-gray-700 dark:text-gray-300 mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Leave blank to keep unchanged"
              className="px-4 py-3 border rounded-md bg-white dark:bg-gray-700 dark:text-white dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {formErrors.confirmPassword && (
              <p className="text-red-600 text-sm">{formErrors.confirmPassword}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-md shadow-md"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="bg-gray-400 hover:bg-gray-500 text-white px-6 py-3 rounded-md shadow-md"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
