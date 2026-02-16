import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import BASE_URL from "./config";

export default function ChangePassword() {
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        await axios.get(`${BASE_URL}/api/users/me`, {
          headers: { Authorization: `Token ${token}` },
        });
        setLoading(false);
      } catch (err) {
        toast.error("Failed to verify user session");
      }
    };

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const validatePassword = () => {
    const { currentPassword, newPassword, confirmPassword } = form;
    const newErrors = {};

    if (!currentPassword) {
      newErrors.currentPassword = "Current Password is required.";
    }

    if (!newPassword) {
      newErrors.newPassword = "New Password is required.";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "New Password must be at least 8 characters long.";
    } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      newErrors.newPassword = "New Password must contain at least one special character.";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirm New Password is required.";
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "New Password and Confirm New Password do not match.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = form;

    // Validate passwords
    if (!validatePassword()) {
      toast.error("Please fix the errors before submitting.");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      await axios.put(
        `${BASE_URL}/api/users/change-password/`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        {
          headers: { Authorization: `Token ${token}` },
        }
      );
      toast.success("Password updated successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to change password");
    }
  };

  if (loading) return <div className="p-6 text-lg">Loading...</div>;

  return (
    <div className="w-lg bg-white dark:bg-gray-900 p-8 rounded shadow space-y-6 mt-10">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Change Password</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm text-gray-600 dark:text-gray-300">
            Current Password
          </label>
          <input
            type="password"
            name="currentPassword"
            placeholder="Current Password"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full p-3 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          {errors.currentPassword && (
            <p className="text-red-600 text-sm">{errors.currentPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm text-gray-600 dark:text-gray-300">
            New Password
          </label>
          <input
            type="password"
            name="newPassword"
            placeholder="New Password"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full p-3 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          {errors.newPassword && (
            <p className="text-red-600 text-sm">{errors.newPassword}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm text-gray-600 dark:text-gray-300">
            Confirm New Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={form.confirmPassword}
            onChange={handleChange}
            className="w-full p-3 border rounded dark:bg-gray-800 dark:text-white dark:border-gray-600"
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm">{errors.confirmPassword}</p>
          )}
        </div>

        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
