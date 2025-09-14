import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bgImage from "../assets/volunteer4.png";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState(); // This state isn't really used after login, consider removing
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function logIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) {
      setLoading(false);
      console.log("Error logging in.");
      alert("Error: Invalid email or password."); // Give user feedback
    } else {
      console.log({ data });
      // This fetch call can be removed if you handle the logic on the /home page
      const response = await fetch("http://localhost:5000/check-state", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          state: data?.user?.user_metadata?.state,
          userEmail: email,
          name: data?.user?.user_metadata?.name,
        }),
      });

      if (!response.ok) {
        setLoading(false);
        throw new Error("Network response was not ok");
      }
      setLoading(false);
      navigate("/home");
      localStorage.setItem("user", JSON.stringify({ data }));
      // setUserData(data); // This doesn't do much since you navigate away immediately
      console.log(data);
    }
  }

  return (
    // 1. MODIFIED CONTAINER: Added flex-col to stack the title and card
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* 2. NEW: Added the huge title outside the box */}
      <h1 className="relative z-10 text-5xl font-bold text-white mb-8 text-center">
        Hi👋 Do you need resources?
      </h1>

      {/* 3. This is the main login card */}
      <div className="relative z-10 bg-white p-10 rounded-2xl shadow-lg text-center space-y-6 w-full max-w-sm mx-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center">Login</h2>

        {/* Using a form tag for better semantics */}
        <form className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={email} // 4. ADDED value prop
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none shadow-sm text-gray-900 placeholder-gray-500" // 5. ADDED text-gray-900
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={password} // 4. ADDED value prop
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none shadow-sm text-gray-900 placeholder-gray-500" // 5. ADDED text-gray-900
          />
        </form>

        <button
          type="submit"
          className={`w-full bg-teal-500 text-black py-3 rounded-lg font-bold hover:bg-teal-600 transition shadow-md flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={logIn}
          disabled={loading}
        >
          Login
          {loading && (
            <svg
              className="animate-spin h-5 w-5 text-black"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8z"
              ></path>
            </svg>
          )}
        </button>

        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-teal-600 hover:underline"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
