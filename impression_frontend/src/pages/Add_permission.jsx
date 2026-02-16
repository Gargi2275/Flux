import React, { useEffect, useState } from "react";
import { Switch } from "@headlessui/react";
import { toast } from "react-hot-toast";
import axiosInstance from "./axiosconfig"; // Import the axios instance

export default function PermissionsManager() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [assignToAll, setAssignToAll] = useState(true);
  const [users, setUsers] = useState([]);
  const [rolePermissionIds, setRolePermissionIds] = useState([]);
  const [userPermissions, setUserPermissions] = useState({});

  useEffect(() => {
    if (selectedRoleId) {
      axiosInstance.get(`/api/roles/${selectedRoleId}/users/`).then((res) => setUsers(res.data));
      axiosInstance.get(`/api/get_role_permissions/${selectedRoleId}/`).then((res) => {
        setRolePermissionIds(res.data.assigned_permissions || []);
      });
    }
  }, [selectedRoleId]);

  useEffect(() => {
    if (selectedRoleId) {
      if (assignToAll) {
        // Re-fetch role permissions
        axiosInstance.get(`/api/get_role_permissions/${selectedRoleId}/`).then((res) => {
          setRolePermissionIds(res.data.assigned_permissions || []);
        });
      } else {
        // Re-fetch user permissions
        loadUserOverrides();
      }
    }
  }, [assignToAll]);

  useEffect(() => {
    axiosInstance.get("/api/permissions/").then((res) => setPermissions(res.data));
    axiosInstance.get("/api/roles/get/")
      .then((res) => {
        // console.log(res.data); // Check the response structure here
        if (Array.isArray(res.data)) {
          setRoles(res.data);
        } else {
          console.error("Expected an array of roles, but received:", res.data);
          setRoles([]); // Default to an empty array if the response isn't correct
        }
      })
      .catch((err) => console.error("Error fetching roles", err));
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      axiosInstance.get(`/api/roles/${selectedRoleId}/users/`).then((res) => setUsers(res.data));
      axiosInstance.get(`/api/get_role_permissions/${selectedRoleId}/`).then((res) => {
        setRolePermissionIds(res.data.assigned_permissions || []);
      });
    }
  }, [selectedRoleId]);

  useEffect(() => {
    if (users.length > 0) {
      loadUserOverrides();
    }
  }, [users]);

  const handlePermissionToggle = (permissionId, isChecked) => {
    const updatedPermissions = isChecked
      ? [...rolePermissionIds, permissionId]
      : rolePermissionIds.filter(id => id !== permissionId);

    setRolePermissionIds(updatedPermissions);

    axiosInstance
      .post("/api/permissions/assign/", {
        role_id: selectedRoleId,
        permission_ids: [permissionId],
        assign_to_all_role_users: assignToAll,
      })
      .then(() => {
        toast.success(isChecked ? "Permission assigned!" : "Permission removed!");
      })
      .catch((error) => {
        toast.error("Error updating permission!");
      });
  };

  const handleUserPermissionToggle = (userId, permissionId, isChecked) => {
    const updatedPermissions = isChecked
      ? [...(userPermissions[userId] || []), permissionId]
      : userPermissions[userId]?.filter(id => id !== permissionId);

    setUserPermissions(prevState => ({
      ...prevState,
      [userId]: updatedPermissions,
    }));

    axiosInstance
      .post("/api/permissions/toggle/", {
        role_id: selectedRoleId,
        user_ids: [userId],
        permission_id: permissionId,
        allow: isChecked, // Explicitly tell backend to grant or remove
      })
      .then(() => {
        toast.success(isChecked ? "User permission assigned!" : "User permission removed!");
      })
      .catch((error) => {
        toast.error("Error updating user permission!");
      });
  };

  const loadUserOverrides = () => {
    const promises = users.map((user) =>
      axiosInstance
        .get(`/api/users/${user.id}/effective-permissions/`)
        .then((res) => ({
          uid: user.id,
          permissions: res.data.effective_permissions || [],
        }))
    );

    Promise.all(promises).then((results) => {
      const map = {};
      results.forEach((r) => {
        map[r.uid] = r.permissions;
      });
      setUserPermissions(map);
    });
  };

  return (
    <div className="p-8 bg-gray-50 dark:bg-gray-900 rounded-lg shadow-lg">
      <h1 className="text-3xl font-semibold text-gray-800 dark:text-white mb-6">Permissions Manager</h1>

      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 font-medium mb-2">Select Role:</label>
        <select
          className="p-3 border border-gray-300 dark:border-gray-700 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
          value={selectedRoleId || ""}
          onChange={(e) => setSelectedRoleId(e.target.value)}
        >
          <option value="" disabled>Select role</option>
          {Array.isArray(roles) && roles.length > 0 ? (
            roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.role}
              </option>
            ))
          ) : (
            <option disabled>No roles available</option>
          )}
        </select>


      </div>

      <div className="mb-6 flex items-center justify-between">
        <span className="font-medium text-gray-700 dark:text-gray-300">Assign to all users of role</span>
        <Switch
          checked={assignToAll}
          onChange={setAssignToAll}
          className={`${assignToAll ? "bg-blue-600" : "bg-gray-300"} relative inline-flex h-7 w-12 items-center rounded-full transition-colors`}
        >
          <span className={`${assignToAll ? "translate-x-5" : "translate-x-1"} inline-block h-5 w-5 transform rounded-full bg-white transition`} />
        </Switch>
      </div>

      {selectedRoleId && (
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          {assignToAll ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Role Permissions</h2>
              {permissions.map((p) => (
                <label key={p.id} className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    checked={rolePermissionIds.includes(p.id)} // Check if permission is assigned
                    onChange={(e) => handlePermissionToggle(p.id, e.target.checked)} // Toggle onChange
                    className="form-checkbox text-blue-600"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{p.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">User Permissions</h2>
              {users.map((user) => (
                <div key={user.id} className="border-b pb-4 mb-4">
                  <p className="font-medium text-lg text-gray-800 dark:text-white">{user.username}</p>
                  <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map((p) => (
                      <label key={p.id} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={userPermissions[user.id]?.includes(p.id) || false} // Check if user has permission
                          onChange={(e) => handleUserPermissionToggle(user.id, p.id, e.target.checked)} // Toggle onChange
                          className="form-checkbox text-blue-600"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
