import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Validar que se hayan ingresado datos antes de intentar iniciar sesión
    if (!formData.email || !formData.password) {
      setError("Por favor ingresa tu correo y contraseña");
      return;
    }
    
    setLoading(true);

    try {
      const response = await API.post("/api/login", formData);

      // Verificación más estricta de la respuesta
      if (response.data && response.data.id) {
        // Guardamos los datos del usuario
        localStorage.setItem("user", JSON.stringify({
          id: response.data.id,
          name: response.data.name,
          email: response.data.email
        }));

        // Usar navigate en lugar de window.location
        navigate("/dashboard");
      } else {
        setError("Datos de inicio de sesión incompletos");
      }
    } catch (error) {
      if (error.response) {
        setError(error.response.data?.message || "Error de autenticación");
      } else if (error.request) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        setError("Error en la solicitud de inicio de sesión");
      }
      console.error("Error al iniciar sesión:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <h2 className="form-title">Iniciar Sesión</h2>
      <input
        name="email"
        value={formData.email}
        onChange={handleChange}
        type="email"
        placeholder="Correo electrónico"
        className="form-input"
        disabled={loading}
        required
      />
      <input
        name="password"
        value={formData.password}
        onChange={handleChange}
        type="password"
        placeholder="Contraseña"
        className="form-input"
        disabled={loading}
        required
      />
      <button
        type="submit"
        className="form-button"
        disabled={loading}
      >
        {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
      </button>
      
      {/* Enlace para recuperación de contraseña */}
      <div className="forgot-password">
        <Link to="/recuperar-password">¿Olvidaste tu contraseña?</Link>
      </div>
      
      {error && <p className="form-error">{error}</p>}
    </form>
  );
};

export default LoginForm;
