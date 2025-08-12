import React, { useEffect, useState } from 'react';
import API from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css'; // Asegúrate de importar los estilos

const Dashboard = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    //Funcion para activar la navegacion entre paginas
    const navigate = useNavigate();

    // Función para ir al escáner QR
    const goToQRScanner = () => {
        navigate('/qr-scanner');
    };

    // Función para ir a crear carga
    const goToCrearCarga = () => {
        navigate('/crear-carga');
    };

    // Efecto para obtener el perfil del usuario al cargar el componente
    // Se usa el hook useEffect para hacer la llamada a la API y actualizar el estado
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const response = await API.get('/api/profile');
                setUser(response.data);
            } catch (error) {
                console.error('Error al obtener perfil:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, []);

    // Función para cerrar sesión
    // Se usa la función handleLogout para hacer la llamada a la API y redirigir al usuario
    const handleLogout = async () => {
        try {
            await API.post('/api/logout');
            localStorage.removeItem('user');
            navigate('/auth');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Si el usuario no está cargando, se muestra un mensaje de carga
    // Se usa un condicional para mostrar un mensaje de carga mientras se obtiene el perfil del usuario
    if (loading) return <div>Cargando...</div>;

    return (
        <div>
            <nav>
                <div>
                    <div>888 Cargo</div>
                </div>
                <div>
                    <div>🔔</div>
                    <div>{user?.name}</div>
                    <div>👤</div>
                    <button onClick={handleLogout}>Cerrar Sesión</button>
                </div>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <div>
                {/* COLUMNA IZQUIERDA */}
                <div>
                    <h2>Hola, {user?.name}</h2>
                    <h1>Soluciones de Logística y Transporte</h1>
                </div>

                {/* COLUMNA DERECHA - CARDS */}
                <div>
                    <div>
                        <div>
                            <button                                 
                                //onClick={goToCrearCarga}
                            >
                                <span></span>
                                Cotiza tu envío
                            </button>
                        </div>

                        <div>
                            <button                                 
                                onClick={goToCrearCarga}
                            >
                                <span></span>
                                Crear carga
                            </button>
                        </div>
                        
                        <div>
                            <button                                 
                                //onClick={goToCrearCarga}
                            >
                                <span></span>
                                Control de carga
                            </button>
                        </div>
                        <div>
                            <button                                 
                                // onClick={goToCrearCarga}
                            >
                                <span></span>
                                Locker
                            </button>
                        </div>                        
                        
                        <div>
                            <button                                 
                                onClick={goToQRScanner}
                            >
                                <span>📷</span>
                                Escanear código QR
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
