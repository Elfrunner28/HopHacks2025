import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
const Signup = () => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState();

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
        },
      },
    });
    if (error) {
      alert("Error signing up!");
    } else {
      setUserData(data);
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
    <div class="w-full max-w-xs">
      <h2 className="text-3xl font-bold text-gray-800 text-center">
        Create Account
      </h2>

      <div class="mb-4">
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
        className="w-full bg-sky-500 text-white py-3 rounded-lg font-semibold hover:bg-sky-600 transition shadow-md"
      >
        Sign Up
      </button>
    </div>
  );
};

export default Signup;
