import React, { useState, useEffect } from "react";
import axios from "axios";
import BASE_URL from "./config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";
import { components } from "react-select";
import { useOutletContext } from "react-router-dom";

export default function UserDetailsForm({ user }) {
  const { selectedCompany } = useOutletContext();
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  const [roles, setRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [errors, setErrors] = useState({});
  const [companies, setCompanies] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]); // ✅ add this
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [isTechAdmin, setIsTechAdmin] = useState(false);
  const [userDetails, setUserDetails] = useState(null);


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

  const validateForm = () => {
    let formErrors = {};
    let isValid = true;

    if (!formData.username.trim()) {
      formErrors.username = "Username is required!";
      isValid = false;
    } else if (formData.username.includes(" ")) {
      formErrors.username = "Username must not contain spaces!";
      isValid = false;
    }

    if (!formData.firstName.trim()) {
      formErrors.firstName = "First name is required!";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      formErrors.lastName = "Last name is required!";
      isValid = false;
    }

    if (!formData.password || formData.password.length < 8) {
      formErrors.password = "Password must be at least 8 characters!";
      isValid = false;
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)) {
      formErrors.password = "Password must include one special character!";
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      formErrors.confirmPassword = "Passwords do not match!";
      isValid = false;
    }

    if (!formData.role) {
      formErrors.role = "Please select a role!";
      isValid = false;
    }

    setErrors(formErrors);
    return isValid;
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("authToken");

      const rolesRes = await axios.get(`${BASE_URL}/api/roles/get/`, {
        headers: { Authorization: `Token ${token}` },
      });
   

      setRoles(rolesRes.data || []);
      setLoadingRoles(false);

      const userRes = await axios.get(`${BASE_URL}/api/users/me/`, {
        headers: { Authorization: `Token ${token}` },
      });
   setUserDetails(userRes.data);
      const userRole = userRes.data.role;

      setIsTechAdmin(userRole === "techadmin"); // Adjust this string based on your backend
      if (userRole === "techadmin") {
        const companyRes = await axios.get(`${BASE_URL}/api/companies/`, {
          headers: { Authorization: `Token ${token}` },
        });

        const companyList = companyRes.data || [];
        setCompanies(companyList);

        // 👉 Convert companies to dropdown-friendly format
        const options = companyList.map((c) => ({
          value: c.id,
          label: c.name,
        }));
        setCompanyOptions(options); // This line assumes you have: const [companyOptions, setCompanyOptions] = useState([]);
      }

      const userRoleId = userRes.data.role_id;
      if (userRoleId) {
        const permRes = await axios.get(
          `${BASE_URL}/api/get_role_permissions/${userRoleId}/`,
          {
            headers: { Authorization: `Token ${token}` },
          }
        );
        setUserPermissions(permRes.data.assigned_permissions || []);
      } else {
        toast.error("User role not found.");
      }
    } catch (error) {
      toast.error("Failed to load roles or permissions.");
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validateForm()) {
    toast.error("Please fix the errors before submitting.");
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const selectedRoleObj = roles.find(r => String(r.id) === formData.role);

    // Use selectedCompany from context for non-techadmin users
    // For techadmin use selectedCompanies multi-select values
 const companiesPayload = isTechAdmin
  ? selectedCompanies.map(c => c.value).filter(Boolean)
  : selectedCompany?.id
    ? [selectedCompany.id]
    : userDetails?.companies?.length
      ? [userDetails.companies[0]]
      : [];



    const payload = {
      username: formData.username,
      first_name: formData.firstName,
      last_name: formData.lastName,
      password: formData.password,
      role: selectedRoleObj?.role,
      companies: companiesPayload,
    };

    const response = await axios.post(`${BASE_URL}/api/users/create/`, payload, {
      headers: { Authorization: `Token ${token}` },
    });

    if (response.data.type === "error") {
      toast.error(response.data.message || "Something went wrong.");
    } else {
      toast.success(response.data.message || "User created successfully.");
      fetchRoles();

      setFormData({
        username: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        role: "",
      });
      setErrors({});
      setSelectedCompanies([]); // clear multi-select on success
    }
  } catch (error) {
    if (error.response?.data) {
      const serverErrors = error.response.data;
      const fieldErrors = {};
      for (let key in serverErrors) {
        fieldErrors[key] = Array.isArray(serverErrors[key])
          ? serverErrors[key][0]
          : serverErrors[key];
      }
      setErrors(fieldErrors);
      toast.error("Failed to create user. Please fix the errors.");
    } else {
      toast.error("Something went wrong. Please try again later.");
    }
  }
};


  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-100 dark:bg-gray-900 px-6 sm:px-10 py-10 overflow-y-auto">
      <h2 className="text-4xl font-bold text-gray-800 dark:text-white mb-8 border-b pb-3">
        Add User
      </h2>

      {loadingRoles ? (
        <div className="text-center text-gray-600">Loading roles...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6 w-full">
          <InputField
            name="username"
            value={formData.username}
            onChange={handleChange}
            label="Username"
            required
            error={errors.username}
          />
          <InputField
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            label="First Name"
            required
            error={errors.firstName}
          />
          <InputField
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            label="Last Name"
            required
            error={errors.lastName}
          />
          <InputField
            name="password"
            value={formData.password}
            onChange={handleChange}
            label="Password"
            type="password"
            required
            error={errors.password}
          />
          <InputField
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            label="Confirm Password"
            type="password"
            required
            error={errors.confirmPassword}
          />

          <div className="flex flex-col">
            <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`px-4 py-3 rounded-md border ${
                errors.role ? "border-red-500" : "border-gray-300"
              } dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
              disabled={roles.length === 0}
            >
              <option value="">-- Select a role --</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.role}
                </option>
              ))}
            </select>
            {errors.role && (
              <span className="text-red-500 text-sm mt-1">{errors.role}</span>
            )}
          </div>

          {isTechAdmin && (
            <div className="flex flex-col">
              <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
                Select Companies
              </label>
              <Select
                options={companyOptions}
                isMulti
                value={selectedCompanies}
                onChange={(selected) => {
                  setSelectedCompanies(selected || []);
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
                    backgroundColor: "white",
                    borderColor: "#d1d5db",
                    color: "black",
                  }),
                  menu: (base) => ({
                    ...base,
                    zIndex: 9999,
                  }),
                }}
              />
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-3 rounded-md transition shadow"
              disabled={roles.length === 0 || formData.role === ""}
            >
              Submit
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
      )}
    </div>
  );
}

// Input Field Component
function InputField({
  name,
  value,
  onChange,
  label,
  type = "text",
  required = false,
  error,
}) {
  return (
    <div className="flex flex-col">
      <label className="mb-1 font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label.toLowerCase()}`}
        required={required}
        className={`px-4 py-3 rounded-md border ${
          error ? "border-red-500" : "border-gray-300"
        } dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none`}
      />
      {error && <span className="text-red-500 text-sm mt-1">{error}</span>}
    </div>
  );
}
