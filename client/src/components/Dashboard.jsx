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
            <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #ddd' }}>
                <div>
                    <h1 style={{ margin: 0 }}>888 Cargo</h1>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div>🔔</div>
                    <div>{user?.name}</div>
                    <div>👤</div>
                    <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                        <i className="fas fa-sign-out-alt"></i>Cerrar Sesión
                    </button>
                </div>
            </nav>

            {/* CONTENIDO PRINCIPAL */}
            <div style={{ padding: '20px' }}>
                <div>
                    <h2>Hola, {user?.name}</h2>
                    <h1>Soluciones de Logística y Transporte</h1>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '20px' }}>
                    <button 
                        className="btn btn-outline"                               
                        //onClick={goToCrearCarga}
                    >
                        <i className="fas fa-calculator"></i>
                        Cotiza tu envío
                    </button>

                    <button 
                        className="btn btn-primary"                                
                        onClick={goToCrearCarga}
                    >
                        <i className="fas fa-plus-circle"></i>
                        Crear carga
                    </button>
                    
                    <button 
                        className="btn btn-outline"                                
                        //onClick={goToCrearCarga}
                    >
                        <i className="fas fa-clipboard-list"></i>
                        Control de carga
                    </button>
                    
                    <button 
                        className="btn btn-outline"                                
                        // onClick={goToCrearCarga}
                    >
                        <i className="fas fa-lock"></i>
                        Locker
                    </button>
                    
                    <button 
                        className="btn btn-secondary"                                
                        onClick={goToQRScanner}
                    >
                        <i className="fas fa-qrcode"></i>
                        Escanear código QR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
