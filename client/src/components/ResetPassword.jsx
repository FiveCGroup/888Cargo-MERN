import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import API from "../services/api";

const ResetPassword = () => {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);
    
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Extraer token de la URL
        const queryParams = new URLSearchParams(location.search);
        const tokenFromUrl = queryParams.get("token");
        
        if (!tokenFromUrl) {
            setError("Token no proporcionado. Solicita un nuevo enlace de recuperación.");
            setVerifying(false);
            return;
        }
        
        setToken(tokenFromUrl);
        
        // Verificar validez del token
        const verifyToken = async () => {
            try {
                const response = await API.get(`/api/recuperacion/verificar-token/${tokenFromUrl}`);
                if (response.data.valid) {
                    setTokenValid(true);
                } else {
                    setError("El enlace ha expirado o no es válido. Solicita un nuevo enlace.");
                }
            } catch (error) {
                setError("El enlace ha expirado o no es válido. Solicita un nuevo enlace.");
            } finally {
                setVerifying(false);
            }
        };
        
        verifyToken();
    }, [location]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMensaje(null);
        
        // Validar contraseñas
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            setLoading(false);
            return;
        }
        
        // Validar seguridad de la contraseña
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{6,}$/;
        if (!passwordRegex.test(password)) {
            setError("La contraseña debe tener al menos 6 caracteres, incluyendo mayúsculas, minúsculas, números y caracteres especiales");
            setLoading(false);
            return;
        }
        
        try {
            const response = await API.post("/api/recuperacion/cambiar-password", {
                token,
                newPassword: password
            });
            
            setMensaje(response.data.message);
            
            // Redireccionar después de 3 segundos
            setTimeout(() => {
                navigate("/auth");
            }, 3000);
        } catch (error) {
            console.error("Error al cambiar contraseña:", error);
            setError(
                error.response?.data?.message || 
                "No se pudo actualizar la contraseña. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    if (verifying) {
        return (
            <div className="reset-container">
                <div className="loading-message">
                    Verificando enlace de recuperación...
                </div>
            </div>
        );
    }

    if (!tokenValid && !verifying) {
        return (
            <div className="reset-container">
                <div className="error-panel">
                    <h2>Enlace inválido</h2>
                    <p>{error}</p>
                    <button 
                        onClick={() => navigate("/recuperar-password")}
                        className="recuperar-button"
                    >
                        Solicitar nuevo enlace
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="reset-container">
            <h2 className="reset-title">Establecer nueva contraseña</h2>
            
            <form onSubmit={handleSubmit} className="reset-form">
                <div className="form-group">
                    <label htmlFor="password">Nueva contraseña:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Ingresa tu nueva contraseña"
                        disabled={loading}
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirmar contraseña:</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirma tu nueva contraseña"
                        disabled={loading}
                        required
                        className="form-input"
                    />
                    <small className="form-helper">
                        La contraseña debe tener al menos 6 caracteres, incluyendo mayúsculas, 
                        minúsculas, números y caracteres especiales.
                    </small>
                </div>

                <button 
                    type="submit" 
                    className="reset-button"
                    disabled={loading}
                >
                    {loading ? "Actualizando..." : "Actualizar contraseña"}
                </button>

                {error && <div className="error-message">{error}</div>}
                {mensaje && <div className="success-message">{mensaje}</div>}
            </form>
        </div>
    );
};

export default ResetPassword;