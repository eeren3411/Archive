import React, { useState } from "react";

const App = () => {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Password:", password);
  };

  return (
    <div className="container">
      <div className="main-rectangle">
        <h1 className="title">Master Password</h1>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="password-input"
              placeholder="Enter your password"
            />
            <span className="eye-icon">eye</span> {/* TODO: eye */}
          </div>
          <button type="submit" className="submit-button">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default App;
