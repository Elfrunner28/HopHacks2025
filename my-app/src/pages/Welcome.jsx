import React from "react";
import { useNavigate } from "react-router-dom";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-400 to-emerald-400">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center space-y-6 w-full max-w-md mx-4">
        <h1 className="text-3xl font-bold text-gray-700">Welcome</h1>
        <p className="text-gray-500">Choose an option to continue</p>

        <div className="space-y-4">
          <button
            onClick={() => navigate("/signup")}
            className="w-full bg-teal-500 text-black rounded-lg font-semibold hover:bg-teal-600 transition"
          >
            Signup
          </button>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-emerald-500 text-black py-3 rounded-lg font-semibold hover:bg-emerald-600 transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>


)
};

export default Welcome
