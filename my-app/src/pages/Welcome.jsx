import React from "react";
import { useNavigate } from "react-router-dom";
import bgImage from "../assets/volunteer2.png";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    // 1. Main container: Set to relative, add the background image URL, cover, and center.
    //    We removed the gradient classes.
    <div
      className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* 2. Overlay: This adds a dark layer on top of the image to make text readable. */}
      <div className="absolute inset-0 bg-black/60"></div>

      {/* 3. Content Wrapper: This is now the main content holder, set to stack items vertically (flex-col).
           It must be relative and have a z-index to appear on top of the overlay.
      */}
      <div className="relative z-10 flex flex-col items-center space-y-10 p-4">
        {/* 4. NEW: Big text block for your project name and slogan */}
        <div className="text-center text-white">
          <h1 className="text-5xl md:text-10xl font-extrabold tracking-tight drop-shadow-lg">
            SafeZone
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-light text-gray-200 drop-shadow-md">
            One Map, Powered by Officials, Verified by Community. Safety for All
          </p>
        </div>

        {/* 5. Your original card (unchanged, just placed inside the new wrapper) */}
        <button
          onClick={() => navigate("/signup")}
          className="w-full py-4 bg-white text-black rounded-4xl font-semibold hover:bg-emerald-600 transition text-xl"
        >
          Signup
        </button>

        <button
          onClick={() => navigate("/login")}
          className="w-full bg-white text-black py-4 rounded-4xl font-semibold hover:bg-teal-600 transition text-xl"
        >
          Login
        </button>
      </div>
    </div>
  );
};

export default Welcome;
