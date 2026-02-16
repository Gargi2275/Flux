// // Keep your imports
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { FaEdit, FaTrash, FaPlus, FaTimes } from "react-icons/fa";
// import BASE_URL from "./config";
// export default function SuperadminManager({ user }) {
//   const [superadmins, setSuperadmins] = useState([]);
//   const [form, setForm] = useState({
//     username: "",
//     password: "",
//     confirmPassword: "",
//     first_name: "",
//     last_name: "",
//   });
//   const [editingId, setEditingId] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [deleteId, setDeleteId] = useState(null);
//   const [error, setError] = useState("");

//   const token = localStorage.getItem("authToken");

//   useEffect(() => {
//     if (user?.role === "techadmin") fetchSuperadmins();
//   }, [user]);

//   const fetchSuperadmins = () => {
//     axios
//       .get(`${BASE_URL}/api/superadmins/`, {
//         headers: { Authorization: `Token ${token}` },
//       })
//       .then((res) => setSuperadmins(res.data))
//       .catch((err) => console.error(err));
//   };

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//     setError(""); // Clear error as user types
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!editingId && form.password !== form.confirmPassword) {
//       return setError("❌ Passwords do not match.");
//     }

//     const payload = {
//       username: form.username,
//       first_name: form.first_name,
//       last_name: form.last_name,
//     };
//     if (!editingId) payload.password = form.password;

//     const url = editingId
//       ? `${BASE_URL}/api/superadmins/${editingId}/update/`
//       : `${BASE_URL}/api/superadmins/create/`;
//     const method = editingId ? "put" : "post";

//     try {
//       await axios[method](url, payload, {
//         headers: { Authorization: `Token ${token}` },
//       });
//       resetForm();
//       fetchSuperadmins();
//     } catch (err) {
//       const res = err.response;
//       if (res?.data?.username?.[0]?.includes("already exists")) {
//         setError("❌ Username already exists.");
//       } else {
//         setError("❌ Something went wrong.");
//       }
//     }
//   };

//   const handleEdit = (admin) => {
//     setForm({
//       username: admin.username,
//       password: "",
//       confirmPassword: "",
//       first_name: admin.first_name,
//       last_name: admin.last_name,
//     });
//     setEditingId(admin.id);
//     setShowModal(true);
//     setError("");
//   };

//   const handleDelete = async () => {
//     try {
//       await axios.delete(`${BASE_URL}/api/superadmins/${deleteId}/delete/`, {
//         headers: { Authorization: `Token ${token}` },
//       });
//       setDeleteId(null);
//       fetchSuperadmins();
//     } catch (err) {
//       alert("❌ Error deleting superadmin.");
//     }
//   };

//   const resetForm = () => {
//     setForm({
//       username: "",
//       password: "",
//       confirmPassword: "",
//       first_name: "",
//       last_name: "",
//     });
//     setEditingId(null);
//     setShowModal(false);
//     setError("");
//   };

//   if (user?.role !== "techadmin") {
//     return (
//       <div className="text-center mt-10 text-gray-600">
//         You are not authorized to view this page.
//       </div>
//     );
//   }

//   return (
//     <div className="w-full p-4 bg-white min-h-screen">
//       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
//         <h2 className="text-2xl font-bold">Superadmin Management</h2>
//         <button
//           onClick={() => {
//             resetForm();
//             setShowModal(true);
//           }}
//           className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//         >
//           <FaPlus /> Add Superadmin
//         </button>
//       </div>

//       <div className="overflow-x-auto bg-white rounded shadow">
//         <table className="min-w-full text-sm text-left">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="p-3">Username</th>
//               <th className="p-3">First Name</th>
//               <th className="p-3">Last Name</th>
//               <th className="p-3">Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {superadmins.map((sa) => (
//               <tr key={sa.id} className="border-t hover:bg-gray-50">
//                 <td className="p-3">{sa.username}</td>
//                 <td className="p-3">{sa.first_name}</td>
//                 <td className="p-3">{sa.last_name}</td>
//                 <td className="p-3 flex gap-2">
//                   <button onClick={() => handleEdit(sa)} className="text-blue-600 hover:text-blue-800">
//                     <FaEdit />
//                   </button>
//                   <button onClick={() => setDeleteId(sa.id)} className="text-red-600 hover:text-red-800">
//                     <FaTrash />
//                   </button>
//                 </td>
//               </tr>
//             ))}
//             {superadmins.length === 0 && (
//               <tr>
//                 <td colSpan="4" className="text-center py-4 text-gray-500">
//                   No superadmins found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Form Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
//           <div className="bg-white w-full max-w-xl rounded-lg p-6 relative shadow-xl">
//             <button
//               className="absolute top-3 right-3 text-gray-500 hover:text-black"
//               onClick={resetForm}
//             >
//               <FaTimes />
//             </button>
//             <h3 className="text-xl font-semibold mb-4">
//               {editingId ? "Edit Superadmin" : "Add Superadmin"}
//             </h3>
//             {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
//             <form onSubmit={handleSubmit} className="grid gap-4">
//               <div>
//                 <label className="block text-sm font-medium">Username</label>
//                 <input
//                   name="username"
//                   value={form.username}
//                   onChange={handleChange}
//                   className="w-full border rounded px-3 py-2"
//                   required
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">First Name</label>
//                 <input
//                   name="first_name"
//                   value={form.first_name}
//                   onChange={handleChange}
//                   className="w-full border rounded px-3 py-2"
//                 />
//               </div>
//               <div>
//                 <label className="block text-sm font-medium">Last Name</label>
//                 <input
//                   name="last_name"
//                   value={form.last_name}
//                   onChange={handleChange}
//                   className="w-full border rounded px-3 py-2"
//                 />
//               </div>
//               {!editingId && (
//                 <>
//                   <div>
//                     <label className="block text-sm font-medium">Password</label>
//                     <input
//                       type="password"
//                       name="password"
//                       value={form.password}
//                       onChange={handleChange}
//                       className="w-full border rounded px-3 py-2"
//                       required
//                     />
//                   </div>
//                   <div>
//                     <label className="block text-sm font-medium">Confirm Password</label>
//                     <input
//                       type="password"
//                       name="confirmPassword"
//                       value={form.confirmPassword}
//                       onChange={handleChange}
//                       className="w-full border rounded px-3 py-2"
//                       required
//                     />
//                   </div>
//                 </>
//               )}
//               <div className="flex justify-end gap-3 mt-2">
//                 <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
//                   {editingId ? "Update" : "Create"}
//                 </button>
//                 <button type="button" onClick={resetForm} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       {deleteId && (
//         <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
//           <div className="bg-white p-6 rounded-lg max-w-sm text-center shadow-lg">
//             <p className="mb-4 text-lg">Are you sure you want to delete this superadmin?</p>
//             <div className="flex justify-center gap-4">
//               <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
//                 Delete
//               </button>
//               <button onClick={() => setDeleteId(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }










// UserManager.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import BASE_URL from "./config";

export default function UserManager({ user }) {
  const [users, setUsers] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const token = localStorage.getItem("authToken");
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === "techadmin" || user?.role === "superadmin") {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = () => {
    axios
      .get(`${BASE_URL}/api/users/`, {
        headers: { Authorization: `Token ${token}` },
      })
      .then((res) => setUsers(res.data))
      .catch((err) => (err));
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/users/${deleteId}/delete/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setDeleteId(null);
      fetchUsers();
    } catch (err) {
      alert("❌ Error deleting user.");
    }
  };

  if (user?.role !== "techadmin" && user?.role !== "superadmin") {
    return (
      <div className="text-center mt-10 text-gray-600">
        You are not authorized to view this page.
      </div>
    );
  }

  return (
    <div className="w-full p-4 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold">User Management</h2>
        <button
          onClick={() => navigate("/add-user")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <FaPlus /> Add User
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">First Name</th>
              <th className="p-3">Last Name</th>
              <th className="p-3">Role</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{u.username}</td>
                <td className="p-3">{u.first_name}</td>
                <td className="p-3">{u.last_name}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={() => navigate(`/edit-user/${u.id}`)} className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => setDeleteId(u.id)} className="text-red-600 hover:text-red-800">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm text-center shadow-lg">
            <p className="mb-4 text-lg">Are you sure you want to delete this user?</p>
            <div className="flex justify-center gap-4">
              <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Delete
              </button>
              <button onClick={() => setDeleteId(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
