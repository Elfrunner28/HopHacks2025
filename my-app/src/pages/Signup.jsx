import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";
const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState();
  const [state, setState] = useState("");

  const states = [
    "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
    "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
    "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
    "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
    "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
    "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
    "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
    "Wisconsin","Wyoming"
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          city,
          state
        },
      },
    });
    if (error) {
      alert("Error signing up!");
    } else {
      alert("Check your email")
      setUserData(data);
      navigate("/login")
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-400 to-emerald-400">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center space-y-6 w-full max-w-md mx-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center">
          Create Account
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
          />
        </div>
            <div>
      <label className="block text-sm font-medium text-gray-600 mb-1">
        State
      </label>
      <select
        value={state}
        onChange={(e) => setState(e.target.value)}
        required
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
      >
        <option value="" disabled>Select your state</option>
        {states.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
    </div>
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none shadow-sm"
          />
        </div>

        <button
          type="submit"
          onClick={signUp}
          className="w-full bg-sky-500 text-black py-3 rounded-lg font-semibold hover:bg-sky-600 transition shadow-md"
        >
          Sign Up
        </button>
      </div>
    </div>
  );
};

export default Signup;
