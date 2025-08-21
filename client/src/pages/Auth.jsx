import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "../components/RegisterForm";
import LoginForm from "../components/LoginForm";
import "../styles/pages/Auth.css"; 
import API from "../services/api";

const AuthPage = () => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                if (localStorage.getItem('user')) {
                    await API.get('/api/profile');
                    navigate('/dashboard');
                }
            } catch (error) {
                localStorage.removeItem('user');
            } finally {
                setCheckingAuth(false);
            }
        };

        checkAuth();
    }, [navigate]);

    if (checkingAuth) {
        return <div className="auth-loading">Verificando sesión...</div>;
    }

    return (
        <div className="auth-container">
            <div className="auth-content">
                <h1 className="auth-title">888Cargo</h1>
                <div className="auth-forms">
                    <div className="auth-form-container">
                        <RegisterForm />
                    </div>
                    <div className="auth-form-container">
                        <LoginForm />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
