// src/components/Login.js
import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Check if this is the superadmin email
      if (email.toLowerCase() === 'akshay@gmail.com') {
        // Store superadmin data in localStorage
        localStorage.setItem('superAdmin', JSON.stringify({
          email: user.email,
          uid: user.uid,
          role: 'superadmin'
        }));
        
        // Small delay to ensure localStorage is set, then redirect
        setTimeout(() => {
          navigate('/superadmin');
        }, 100);
        return; // Prevent normal auth flow
      }
      // For regular users, success will be handled by auth state change in App.js
    } catch (error) {
      if (isMounted) {
        setError('Invalid email or password. Please try again.');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-bg">
      <div className="login-box">
        <div className="login-logo">Navratna Distributors</div>
        <h2>Log in to your account</h2>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            disabled={loading}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
          />

          {error && <div className="error">{error}</div>}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        {/* <div className="login-footer">
          <a href="#">Can't log in?</a>
          <p>Privacy policy • Terms of use</p>
        </div> */}
      </div>
    </div>
  );
};

export default Login;