
import { useNavigate, useOutletContext } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaRegEdit, FaRegTrashAlt, FaUserPlus } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import BASE_URL from "./config";
import "react-toastify/dist/ReactToastify.css";

export default function Users() {
  const { selectedCompany } = useOutletContext();
const userRole=localStorage.getItem("userRole")

  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // const fetchUsers = () => {
  //   const token = localStorage.getItem("authToken");

  //   axios.get(`${BASE_URL}/api/users/`, {
  //     headers: {
  //       Authorization: `Token ${token}`,
  //     },
  //   })
  //     .then(response => setUsers(response.data))
  //     .catch(error => {
  //       toast.error("Unauthorized. Please login again.");
  //     });
  // };

const fetchUsers = () => {
  const token = localStorage.getItem("authToken");

  let url = `${BASE_URL}/api/users/`;

  if (userRole === 'superadmin' && selectedCompany?.id) {
    url += `?company_id=${selectedCompany.id}`;
  }

  axios.get(url, {
    headers: { Authorization: `Token ${token}` }
  })
  .then(response => {
    setUsers(response.data);
  })
  .catch(() => {
    toast.error("Unauthorized. Please login again.");
  });
};



useEffect(() => {
  if (!userRole) return;

  // For superadmin, only fetch if company is selected
  if (userRole === 'superadmin' && selectedCompany) {
    fetchUsers();
  }

  // For admin or others, fetch users anyway
  if (userRole !== 'superadmin') {
    fetchUsers();
  }
}, [userRole, selectedCompany]);


  const filteredUsers = users.filter((user) =>
    `${user.username} ${user.firstName} ${user.lastName}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleRowsChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const handleEditClick = (user) => {
    setEditUser(user);
  };

  const handleEditSave = () => {
    axios.put(`${BASE_URL}/api/users/${editUser.id}/`, editUser)
      .then(() => {
        setEditUser(null);
        fetchUsers();
      })
      .catch((err) => console.error(err));
  };

  const handleDeleteClick = (userId) => {
    setDeleteUserId(userId);
    setShowDeleteModal(true);
  };


  const confirmDelete = () => {
    const token = localStorage.getItem("authToken");

    axios.delete(`${BASE_URL}/api/users/${deleteUserId}/delete/`, {
      headers: {
        Authorization: `Token ${token}`,
      },
    })
      .then(() => {
        setShowDeleteModal(false);
        fetchUsers();
        toast.success("User deleted successfully!");
      })
      .catch((err) => {
        toast.error("Failed to delete user.");
      });
  };



  return (
    <div className="w-full p-4 sm:p-6 overflow-x-auto bg-white dark:bg-gray-900 shadow-lg rounded-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Users</h2>
        {/* <div className="flex items-center flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-300">
          <span onClick={() => navigate("/dashboard")} className="hover:text-blue-500 dark:hover:text-blue-400 cursor-pointer">Home</span>
          <span className="text-gray-400 dark:text-gray-600">/</span>
          <span className="text-gray-800 dark:text-white">Users</span>
        </div> */}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md w-full sm:w-auto flex items-center justify-center gap-2"
          onClick={() => navigate("/add-user")}
        >
          <FaUserPlus />
          <span>Add User</span>
        </button>

        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1); // Reset page
          }}
          className="w-full sm:w-72 px-4 py-2 border rounded-md shadow-sm bg-white text-gray-900 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

      </div>

      <div className="w-full overflow-x-auto rounded-lg bg-white dark:bg-gray-800 shadow-md">
        <table className="min-w-[600px] w-full text-sm text-left text-gray-700 dark:text-gray-300">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">First Name</th>
              <th className="px-4 py-3">Last Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {paginatedUsers.map((user, idx) => (
              <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                <td className="px-4 py-3">{user.username}</td>
                <td className="px-4 py-3">{user.first_name}</td>
                <td className="px-4 py-3">{user.last_name}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-4 text-lg">
                    {userRole !== 'admin' && (
  <button
    onClick={() => navigate(`/edit-user/${user.id}`)}
    className="text-blue-600 hover:text-blue-400 dark:text-blue-400 dark:hover:text-blue-300"
  >
    <FaRegEdit />
  </button>
)}


                    <button onClick={() => handleDeleteClick(user.id)} className="text-red-600 hover:text-red-400 dark:text-red-400 dark:hover:text-red-300">
                      <FaRegTrashAlt />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedUsers.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center px-4 py-3 text-gray-500 dark:text-gray-400">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Rows per page:</label>
          <select
            value={rowsPerPage}
            onChange={handleRowsChange}
            className="border px-2 py-1 rounded-md bg-white dark:bg-gray-800 dark:text-white dark:border-gray-600"
          >
            {[10, 20, 30, 40, 50].map((num) => (
              <option key={num} value={num}>{num}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[400px]">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Edit User</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={editUser.username}
                onChange={(e) => setEditUser({ ...editUser, username: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Username"
              />
              <input
                type="text"
                value={editUser.first_name}
                onChange={(e) => setEditUser({ ...editUser, first_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="First Name"
              />
              <input
                type="text"
                value={editUser.last_name}
                onChange={(e) => setEditUser({ ...editUser, last_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Last Name"
              />
              <input
                type="text"
                value={editUser.role}
                onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:text-white dark:border-gray-700"
                placeholder="Role"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button onClick={() => setEditUser(null)} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded">Cancel</button>
                <button onClick={handleEditSave} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-[90%] sm:w-[400px]">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">Are you sure you want to delete this user?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
