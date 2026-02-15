// Register.jsx - Updated to work with your AuthContext
import React, { useState, useContext } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;


const Register = () => {
  const [step, setStep] = useState("form");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  // ✅ AuthContext se saveAuth ke liye login function use karenge
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { name, email, password } = formData;
      const res = await axios.post(`${API_BASE_URL}/api/users/register`, {
        name,
        email,
        password,
      });

      if (res.status === 201) {
        setInfo("OTP sent to your email. Please check your inbox (and spam).");
        setStep("otp");
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch (err) {
      const message =
        err.response?.data?.message || "Registration failed. Please try again later.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verify OTP and auto-login - FIXED VERSION
  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { email } = formData;
      const res = await axios.post(`${API_BASE_URL}/api/users/verify-email`, {
        email,
        otp,
      });

      const { token, user } = res.data;
      if (!token || !user) throw new Error("Invalid server response.");

      console.log("✅ OTP Verification successful:", { user, token });

      // ✅ OPTION 1: Direct login function use karo AuthContext se
      try {
        // AuthContext ka login function use karo
        await login(email, formData.password);
        
        setInfo("Verification successful! Redirecting to home...");
        
        // ✅ Navigate immediately
        setTimeout(() => {
          navigate("/");
        }, 1000);
        
      } catch (loginErr) {
        console.error("Login after OTP failed:", loginErr);
        // ✅ OPTION 2: Agar login fail ho toh manually auth set karo
        const authData = { user, token };
        localStorage.setItem("auth", JSON.stringify(authData));
        
        setInfo("Verification successful! Redirecting to home...");
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
      
    } catch (err) {
      const message =
        err.response?.data?.message || "OTP verification failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ALTERNATIVE: Direct auth save function - More reliable
  const handleVerifyDirect = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    try {
      const { email, password } = formData;
      const res = await axios.post(`${API_BASE_URL}/api/users/verify-email`, {
        email,
        otp,
      });

      const { token, user } = res.data;
      if (!token || !user) throw new Error("Invalid server response.");

      console.log("✅ OTP Verification successful, saving auth...");

      // ✅ DIRECT APPROACH: Manually save to localStorage and trigger page reload
      const authData = { 
        user: {
          id: user.id || user._id,
          name: user.name,
          email: user.email,
          coinsBalance: Number(user.coinsBalance ?? 0),
        }, 
        token 
      };
      
      localStorage.setItem("auth", JSON.stringify(authData));
      
      // ✅ Set authorization header for future requests
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      setInfo("Verification successful! Redirecting to home...");
      
      // ✅ Short delay for user to see success message, then navigate
      setTimeout(() => {
        navigate("/");
        // ✅ Optional: Page refresh to ensure AuthContext picks up the new auth
        window.location.reload();
      }, 1500);
      
    } catch (err) {
      const message =
        err.response?.data?.message || "OTP verification failed. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResend = async () => {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      await axios.post(`${API_BASE_URL}/api/users/resend-otp`, {
        email: formData.email,
      });
      setInfo("A new OTP has been sent to your email.");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to resend OTP.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 md:mt-2 ">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        {step === "form" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Hello, Welcome!</h1>
              <p className="text-gray-600">Already have an account?</p>
              <Link 
                to="/login" 
                className="inline-block mt-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Login
              </Link>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {info}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  type="email"
                  placeholder="Enter your email"
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 pr-12"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m9.02 9.02l3.83 3.83M15.828 15.828l3.83-3.83" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 ${
                  loading
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Registering...
                  </div>
                ) : (
                  "Register"
                )}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Login here
                </Link>
              </p>
            </div>
          </>
        )}

        {step === "otp" && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
              <p className="text-gray-600">
                Enter the 6-digit code sent to{" "}
                <span className="font-medium text-gray-700">{formData.email}</span>
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}
            {info && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
                {info}
              </div>
            )}

            {/* ✅ handleVerifyDirect use karo for more reliability */}
            <form onSubmit={handleVerifyDirect} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter 6-digit OTP"
                  className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-500 text-center tracking-widest text-lg font-semibold"
                  maxLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-white font-semibold rounded-xl transition-all duration-200 ${
                  loading
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg"
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify & Continue"
                )}
              </button>
            </form>

            <div className="mt-6 flex justify-between items-center">
              <button
                onClick={handleResend}
                disabled={loading}
                className="text-blue-600 hover:text-blue-700 font-medium disabled:text-blue-300 transition-colors"
              >
                Resend OTP
              </button>
              <button
                onClick={() => setStep("form")}
                disabled={loading}
                className="text-gray-600 hover:text-gray-700 font-medium disabled:text-gray-400 transition-colors"
              >
                Edit Email
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Register;