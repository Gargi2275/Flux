import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import BASE_URL from "./config";
import { FaRegEdit, FaRegEye, FaRegTrashAlt } from "react-icons/fa";

export default function ReportSettings() {
  const [reports, setReports] = useState([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/reports/`);
      setReports(res.data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    }
  };

  const handleToggleHide = async (id) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    try {
      await axios.put(`${BASE_URL}/api/reports/${id}/`, {
        ...report,
        hidden: !report.hidden,
      });
      fetchReports();
    } catch (err) {
      console.error("Failed to update report visibility", err);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${BASE_URL}/api/reports/${confirmDeleteId}/`);
      setConfirmDeleteId(null);
      fetchReports();
    } catch (err) {
      console.error("Failed to delete report", err);
    }
  };

  const handleView = (id) => navigate(`/reports/${id}`);
  const handleEdit = (id) => navigate(`/edit-report/${id}`);
  const handleAddReport = () => navigate(`/create-report`);

  const totalReports = reports.length;
  const activeReports = reports.filter((r) => !r.hidden).length;
  const inactiveReports = totalReports - activeReports;

  return (
    <div className="min-h-screen bg-gray-100 pt-0 px-0 pb-0 sm:pb-6">


      {/* Header + Summary */}
      <div className="bg-white border border-gray-300 rounded-lg shadow p-4 sm:p-6 mb-2 flex flex-col gap-3">
        <h2 className="text-xl font-semibold text-gray-800">📊 Report Settings</h2>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="bg-gray-50 px-4 py-2 rounded border shadow-sm">
              🔢 <strong>Total:</strong> {totalReports}
            </div>
            <div className="bg-green-50 px-4 py-2 rounded border shadow-sm">
              ✅ <strong>Active:</strong> {activeReports}
            </div>
            <div className="bg-red-50 px-4 py-2 rounded border shadow-sm">
              🚫 <strong>Inactive:</strong> {inactiveReports}
            </div>
          </div>
          <button
            onClick={handleAddReport}
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition"
          >
            ➕ Add Report
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="bg-white border border-gray-300 rounded-lg shadow p-4 sm:p-6">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="text-left py-3 px-4 border-b">Report Name</th>
                <th className="text-left py-3 px-4 border-b">Created</th>
                <th className="text-left py-3 px-4 border-b">Hide</th>
                <th className="text-left py-3 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4">{report.name}</td>
                  <td className="py-3 px-4">{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-4">
                    <label className="inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={!report.hidden}
                        onChange={() => handleToggleHide(report.id)}
                      />
                      <div className="w-10 h-5 bg-gray-300 rounded-full relative transition">
                        <div
                          className={`absolute w-5 h-5 bg-white rounded-full shadow transform duration-300 ${
                            report.hidden ? "translate-x-0" : "translate-x-5"
                          }`}
                        ></div>
                      </div>
                    </label>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => handleView(report.id)}
                        title="View"
                      >
                        <FaRegEye size={18} />
                      </button>
                      <button
                        className="text-yellow-600 hover:text-yellow-800"
                        onClick={() => handleEdit(report.id)}
                        title="Edit"
                      >
                        <FaRegEdit size={18} />
                      </button>
                      <button
                        className="text-red-600 hover:text-red-800"
                        onClick={() => setConfirmDeleteId(report.id)}
                        title="Delete"
                      >
                        <FaRegTrashAlt size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-sm">
            <p className="text-gray-800 mb-4">Are you sure you want to delete this report?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
