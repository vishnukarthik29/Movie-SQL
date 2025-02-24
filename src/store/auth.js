// src/store/auth.js
import { ref } from "vue";
import axios from "axios";

const token = ref(localStorage.getItem("token"));
const userId = ref(localStorage.getItem("userId"));

export const useAuth = () => {
  const isAuthenticated = () => !!token.value;

  const login = async (email, password) => {
    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      });
      token.value = response.data.token;
      userId.value = response.data.userId;
      localStorage.setItem("token", token.value);
      localStorage.setItem("userId", userId.value);

      // Update axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;

      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      });
      token.value = response.data.token;
      userId.value = response.data.userId;
      localStorage.setItem("token", token.value);
      localStorage.setItem("userId", userId.value);

      // Update axios default headers
      axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;

      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    }
  };

  const logout = () => {
    token.value = null;
    userId.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    delete axios.defaults.headers.common["Authorization"];
  };

  return {
    isAuthenticated,
    login,
    register,
    logout,
    token,
    userId,
  };
};
