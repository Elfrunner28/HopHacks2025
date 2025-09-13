import React, { useState } from "react";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ phone, city });
  };

  return (
    <div style={styles.container}>
      <div style={styles.box}>
        <h2 style={styles.title}>Welcome</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Phone Number</label>
          <input
            type="tel"
            placeholder="Enter your phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            style={styles.input}
          />

          <label style={styles.label}>City</label>
          <input
            type="text"
            placeholder="Enter your city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            style={styles.input}
          />

          <button type="submit" style={styles.button}>
            Sign up for alert
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100%", // changed from 100vh
    minHeight: "100vh", // ensures it fills viewport
    overflow: "hidden", // prevents scrolling
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    margin: 0,
    padding: 0,
  },
  box: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    padding: "40px 30px",
    borderRadius: "12px",
    boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.2)",
    width: "320px",
    textAlign: "center",
  },
  title: {
    marginBottom: "25px",
    color: "#333",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    textAlign: "left",
    marginBottom: "5px",
    color: "#555",
    fontWeight: 500,
  },
  input: {
    padding: "10px 12px",
    marginBottom: "20px",
    border: "1px solid #ccc",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    transition: "0.2s",
  },
  button: {
    padding: "12px",
    border: "none",
    borderRadius: "6px",
    background: "#6a11cb",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default Login;
