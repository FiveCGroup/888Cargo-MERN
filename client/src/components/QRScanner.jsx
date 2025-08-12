import React, { useState, useEffect } from "react";
import QrScanner from "react-qr-scanner";
import { useNavigate } from "react-router-dom";

const QRScanner = () => {
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    // Estado para manejar permisos de cámara
    const [cameraPermission, setCameraPermission] = useState("asking");
    const navigate = useNavigate();

    const handleScan = (data) => {
        if (data) {
            setResult(data.text);
            //console.log('Escaneado:', data.text);
        }
    };

    // Manejo de errores al escanear
    const handleError = (err) => {
        console.error(err);
        setError("Error al acceder a la cámara. Asegúrate de dar permisos.");
        setCameraPermission("denied");
    };

    useEffect(() => {
        // Verificar si el navegador soporta mediaDevices
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices
                .getUserMedia({ video: true })
                .then(() => {
                    setCameraPermission("granted");
                })
                .catch((err) => {
                    console.error("Error al obtener permisos de cámara:", err);
                    setCameraPermission("denied");
                    setError("No se pudo acceder a la cámara. Verifica los permisos.");
                });
        } else {
            setCameraPermission("not-supported");
            setError("Tu navegador no soporta acceso a la cámara.");
        }

        // Limpieza al desmontar
        return () => {
            // Detener la cámara si está activa
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const tracks = document.querySelector("video")?.srcObject?.getTracks();
                tracks?.forEach((track) => track.stop());
            }
        };
    }, []);
    // Función para manejar el botón de volver al dashboard
    const handleGoBack = () => {
        navigate("/dashboard");
    };

    return (
        <div className="qr-scanner-container">
            <div className="qr-scanner-header">
                <h1>Escanear Código QR</h1>
                <button className="back-button" onClick={handleGoBack}>
                    Volver al Dashboard
                </button>
            </div>
            //Funcion para manejar el escaneo de QR
            <div className="scanner-content">
                {cameraPermission === "asking" && (
                    <div className="permission-message">
                        <p>Solicitando acceso a la cámara...</p>
                    </div>
                )}

                {cameraPermission === "granted" && (
                    <div className="scanner-wrapper">
                        <div className="scanner-overlay">
                            <div className="scanner-border"></div>
                        </div>
                        <QrScanner
                            delay={300}
                            onError={handleError}
                            onScan={handleScan}
                            style={{ width: "100%" }}
                            constraints={{
                                video: {
                                    facingMode: "environment", // Usar cámara trasera en móviles
                                },
                            }}
                        />
                        <p className="scanner-instructions">
                            Centra el código QR en el recuadro para escanearlo
                        </p>
                    </div>
                )}

                {cameraPermission === "denied" && (
                    <div className="permission-error">
                        <p>
                            {error ||
                                "Por favor, permite el acceso a la cámara para escanear códigos QR."}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="retry-button"
                        >
                            Reintentar
                        </button>
                    </div>
                )}

                {cameraPermission === "not-supported" && (
                    <div className="permission-error">
                        <p>{error}</p>
                    </div>
                )}

                {result && (
                    <div className="result-container">
                        <h2>Resultado:</h2>
                        <div className="result-box">
                            <p>{result}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
