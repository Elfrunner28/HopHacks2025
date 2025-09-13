import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userData, setUserData] = useState();
  const navigate = useNavigate();


  async function logIn() {

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      console.log("Error logging in.");
    } else {
      navigate("/map")
      setUserData(data);
      console.log(data);
    }
  }


  return (
   <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-teal-400 to-emerald-400">
      <div className="bg-white p-10 rounded-2xl shadow-lg text-center space-y-6 w-full max-w-md mx-4">

        <h2 className="text-2xl font-bold text-gray-700 mb-6 text-center">
          Login
        </h2>

        <input
          type="text"
          name="email"
          placeholder="Email"
          onChange={(e)=>setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={(e)=>setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 mb-4 border rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
        />

        <button
          type="submit"
          className="w-full bg-indigo-500 text-black py-2 rounded-lg font-semibold hover:bg-indigo-600 transition"
          onClick={logIn}
        >
          Login
        </button>
    </div>
     </div>
  );
};

export default Login;
