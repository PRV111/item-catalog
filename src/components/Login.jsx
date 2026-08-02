import { useState } from "react";

export default function Login({ t, onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: t.bg,
      fontFamily: "'Segoe UI', sans-serif"
    }}>

      {/* Card */}
      <div style={{
        width: 360,
        padding: "28px 26px",
        borderRadius: 20,
        background: t.bgAlt,
        border: `1px solid ${t.accentBorder}`,
        boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
        backdropFilter: "blur(14px)"
      }}>

        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: t.accent,
            marginBottom: 6
          }}>
            Welcome Back
          </div>
          <div style={{
            fontSize: 12,
            color: t.textMuted
          }}>
            Login to your account
          </div>
        </div>

        {/* Username */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            fontSize: 11,
            color: t.textMuted,
            fontWeight: 600
          }}>
            Username
          </label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.inputBg,
              color: t.text,
              fontSize: 12,
              outline: "none"
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 18 }}>
          <label style={{
            fontSize: 11,
            color: t.textMuted,
            fontWeight: 600
          }}>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            style={{
              width: "100%",
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: `1px solid ${t.border}`,
              background: t.inputBg,
              color: t.text,
              fontSize: 12,
              outline: "none"
            }}
          />
        </div>

        {/* Login Button */}
        <button
          onClick={() => onLogin({ username, password })}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 12,
            background: t.accent,
            border: "none",
            color: "#000",
            fontWeight: 800,
            fontSize: 13,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.9}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          🔐 Login
        </button>

        {/* Footer */}
        <div style={{
          marginTop: 16,
          textAlign: "center",
          fontSize: 11,
          color: t.textFaint
        }}>
          Forgot password?
        </div>
      </div>
    </div>
  );
}