// src/pages/LoginPage.jsx (Version A - Improved)
import React, { useState } from 'react';

export const LoginPage = ({ onLogin, onGoogleLogin }) => {
  // Pinagsama natin sa isang object para mas malinis ang state management
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { type, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Hihintayin natin matapos yung login process
      await onLogin(formData);
    } catch (error) {
      console.error("Login failed:", error);
    } finally {
      setIsLoading(false); // Babalik sa normal ang button kahit mag-success o error
    }
  };

  return (
    <div className="auth-card">
      <h2>Welcome Back</h2>
      <form onSubmit={handleSubmit}>
        <input 
          type="email" 
          placeholder="Email Address" 
          value={formData.email} 
          onChange={handleChange} 
          disabled={isLoading} // Hindi pwedeng i-edit habang naglo-load
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={formData.password} 
          onChange={handleChange} 
          disabled={isLoading}
          required 
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </form>
      
      <div className="divider">or</div>
      
      <button 
        onClick={onGoogleLogin} 
        className="google-btn"
        disabled={isLoading}
      >
        Continue with Google
      </button>
    </div>
  );
};