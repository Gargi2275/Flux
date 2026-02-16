import axios from "axios";
import BASE_URL from "./config";

// Function to get the token (modify based on your token storage method)
const getAuthToken = () => localStorage.getItem("authToken"); // or use your own method

// Function to refresh the token
const refreshAuthToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refreshToken");
    const response = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh: refreshToken });
    const { access } = response.data;
    localStorage.setItem("authToken", access); // Update the access token in localStorage
    return access;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return null;
  }
};

// Create an axios instance
const axiosInstance = axios.create({
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Token ${getAuthToken()}`,
  },
});

// Add a request interceptor to handle token expiration
axiosInstance.interceptors.request.use(
  async (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers["Authorization"] = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle 401 errors (token expiration)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        // Retry the original request with the new token
        error.config.headers["Authorization"] = `Token ${newToken}`;
        return axiosInstance(error.config);
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
