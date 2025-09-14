import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import bgImage from "../assets/volunteer3.png";

const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState();
  const [state, setState] = useState("");
  const [loading, setLoading] = useState("");

  const states = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const navigate = useNavigate();

  useEffect(() => {
    async function checkAuth() {
      const { data, error } = await supabase.auth.getSession();
      setUserData(data);
    }
    checkAuth();
  }, []);

  async function signUp() {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          city,
          state,
        },
      },
    });
    if (error) {
        setLoading(false);
      alert("Error signing up!");
    } else {
      alert("Check your email");
      setLoading(false);
      setUserData(data);
      //write sms logic
      console.log(data);
    }
  }
  async function logout() {
    const { data, error } = await supabase.auth.signOut();
    setUserData(null);
  }
  return userData?.session != null ? (
    <div>
      <h1>Hello, {userData.session.user.email}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  ) : (
    // 1. MODIFIED: Added 'relative', 'bg-cover', and 'bg-center'
    //    Removed the redundant gradient classes.
    <div
      style={{ backgroundImage: `url(${bgImage})` }}
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
    >
      {/* 2. NEW: Added the dark overlay to match your Welcome page */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* 3. MODIFIED: Added 'relative' and 'z-10' to put this form on TOP of the overlay */}
      <div className="relative z-10 bg-white p-10 rounded-2xl shadow-lg text-center space-y-6 w-full max-w-md mx-4">
        <h2 className="text-3xl font-bold text-gray-800">Create Account</h2>

        <div className="mb-4">
          <label className="text-left block text-sm font-medium text-gray-600 mb-1">
            Username
          </label>
          <input
            type="text"
            name="username"
            placeholder="Enter your username"
            onChange={(e) => {
              setName(e.target.value);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          />
        </div>

        <div>
          <label className="block text-left text-sm font-medium text-gray-600 mb-1">
            Password
          </label>
          <input
            type="password"
            name="password"
            placeholder="Choose your Password"
            onChange={(e) => {
              setPassword(e.target.value);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          />
        </div>

        <div>
          <label className="text-left block text-sm font-medium text-gray-600 mb-1">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            placeholder="Enter phone number"
            onChange={(e) => {
              setPhone(e.target.value);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          />
        </div>

        <div>
          <label className="text-left block text-sm font-medium text-gray-600 mb-1">
            Email
          </label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            onChange={(e) => {
              setEmail(e.target.value);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          />
        </div>

        <div>
          <label className="text-left block text-sm font-medium text-gray-600 mb-1">
            City
          </label>
          <input
            type="text"
            name="city"
            placeholder="Enter your city"
            onChange={(e) => {
              setCity(e.target.value);
            }}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          />
        </div>
        <div>
          <label className="text-left block text-sm font-medium text-gray-600 mb-1">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm text-gray-900"
          >
            <option value="" disabled>
              Select your state
            </option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

         <button
          type="submit"
          className={`w-full bg-teal-500 text-black py-3 rounded-lg font-bold hover:bg-teal-600 transition shadow-md flex items-center justify-center gap-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={signUp}
          disabled={loading}
        >
          Sign up
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
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-teal-600 hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
