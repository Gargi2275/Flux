// src/components/PrivateRoute.js
import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem("authToken");
  const location = useLocation();

  useEffect(() => {
    if (!token) {
      toast.error("Unauthorized access. Please login first.");
    }
  }, [token]);

  return token ? children : <Navigate to="/" state={{ from: location }} replace />;
};

export default PrivateRoute;
