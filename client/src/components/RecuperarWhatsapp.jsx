// src/components/RecuperarWhatsapp.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";

const RecuperarWhatsapp = () => {
    const [telefono, setTelefono] = useState("");
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMensaje(null);

        try {
            // Validar formato de teléfono
            if (!telefono.match(/^\+?[0-9]{10,15}$/)) {
                throw new Error("Por favor ingresa un número válido (ej: +573001112233)");
            }

            // Asegurar que el número tenga el + al inicio
            const numeroFormateado = telefono.startsWith('+') ? telefono : `+${telefono}`;

            const response = await API.post("/api/recuperacion/enviar-enlace", {
                telefono: numeroFormateado,
            });

            setMensaje(response.data.message);
        } catch (error) {
            console.error("Error al enviar enlace:", error);
            setError(
                error.response?.data?.message || 
                error.message || 
                "No se pudo enviar el mensaje. Intenta nuevamente."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2>Recuperar contraseña</h2>
            <p>
                Te enviaremos un enlace a tu WhatsApp para restablecer tu contraseña.
            </p>
            
            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="telefono">Número de WhatsApp:</label>
                    <input
                        id="telefono"
                        type="text"
                        value={telefono}
                        onChange={(e) => setTelefono(e.target.value)}
                        placeholder="Ej: +573001112233"
                        disabled={loading}
                        required
                    />
                    <small>
                        Ingresa tu número con código de país (ej: +57 para Colombia)
                    </small>
                </div>

                <button 
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Enviando..." : "Enviar enlace"}
                </button>

                {error && <div>{error}</div>}
                {mensaje && <div>{mensaje}</div>}

                <div>
                    <Link to="/auth">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default RecuperarWhatsapp;
