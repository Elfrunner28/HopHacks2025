import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const User = () => {
  const [user, setUser] = useState(null);
    const navigate = useNavigate();

  useEffect(() => {
    const storedData = localStorage.getItem("user");
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        const userMetadata = parsedData.user?.user_metadata || {};
        setUser({
          name: userMetadata.name,
          email: userMetadata.email,
          phone: userMetadata.phone,
          city: userMetadata.city,
          state: userMetadata.state,
        });
      } catch (err) {
        console.error("Failed to parse user data from localStorage", err);
      }
    }
  }, []);

  if (!user) return <p>Loading user data...</p>;

  return (
   <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 w-full max-w-md bg-white shadow rounded">
        <button
        onClick={() => navigate("/home")}
        className="mb-4 px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
      >
        &larr; Back
      </button>
      <h2 className="text-xl font-semibold mb-4">User Profile</h2>
      <div className="mb-2">
        <strong>Name:</strong> {user.name || "-"}
      </div>
      <div className="mb-2">
        <strong>Email:</strong> {user.email || "-"}
      </div>
      <div className="mb-2">
        <strong>Phone:</strong> {user.phone || "-"}
      </div>
      <div className="mb-2">
        <strong>City:</strong> {user.city || "-"}
      </div>
      <div className="mb-2">
        <strong>State:</strong> {user.state || "-"}
      </div>
    </div>
     </div>
  );
};

export default User;
