import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
        <h3 className="text-xl font-semibold mb-4">File Upload Confirmation</h3>
        <p className="text-sm mb-4">You have already uploaded today's file. Do you want to upload it again?</p>
        <div className="flex justify-end gap-4">
          <button
            onClick={() => {
              onConfirm(true); // Trigger the confirm action
              onClose(); // Close the modal after confirmation
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yes
          </button>
          <button
            onClick={() => {
              onConfirm(false); // Trigger the reject action
              onClose(); // Close the modal if user declines
            }}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
