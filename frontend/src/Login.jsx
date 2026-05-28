import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api";

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (mode === "register") {
        await axios.post(`${API_URL}/register/`, { username, email, password });
        setMessage("Account created. You can log in now.");
        setMode("login");
        return;
      }

      const response = await axios.post(`${API_URL}/token/`, { username, password });
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      onLogin();
    } catch (error) {
      setMessage(error.response?.data?.message || "Please check your details and try again.");
    }
  };

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-brand">
          <div className="brand-mark">N</div>
          <div>
            <h1>Notiva</h1>
            <p>Organize notes, reminders, tags, and revision work.</p>
          </div>
        </div>
        <h2>{mode === "login" ? "Login" : "Create Account"}</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        {mode === "register" && (
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {message && <p className="auth-message">{message}</p>}
        <button className="primary" type="submit">{mode === "login" ? "Login" : "Register"}</button>
        <button className="ghost" type="button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Need an account? Register" : "Already registered? Login"}
        </button>
      </form>
    </main>
  );
}

export default Login;
