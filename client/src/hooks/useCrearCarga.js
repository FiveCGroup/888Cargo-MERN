import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cargaService from '../services/cargaService';

export const useCrearCarga = () => {
    // Estados principales
    const [codigoCarga, setCodigoCarga] = useState('');
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [datosExcel, setDatosExcel] = useState([]);
    const [filasConError, setFilasConError] = useState([]);
    const [estadisticasCarga, setEstadisticasCarga] = useState({
        filasExitosas: 0,
        filasConError: 0,
        filasVacias: 0,
        totalFilas: 0
    });
    
    // Estados para búsqueda
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [mostrandoResultados, setMostrandoResultados] = useState(false);
    const [busquedaLoading, setBusquedaLoading] = useState(false);
    
    // Estados para formulario
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [infoCliente, setInfoCliente] = useState({
        nombre_cliente: '',
        correo_cliente: '',
        telefono_cliente: '',
        ciudad_cliente: '',
        pais_cliente: ''
    });
    const [infoCarga, setInfoCarga] = useState({
        codigo_carga: '',
        fecha_inicio: '',
        fecha_fin: '',
        ciudad_destino: '',
        archivo_original: ''
    });
    
    // Estados de control
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [guardandoBD, setGuardandoBD] = useState(false);
    
    // Referencias y navegación
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Efecto para cargar datos del usuario
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                setInfoCliente(prev => ({
                    ...prev,
                    nombre_cliente: user.name || '',
                    correo_cliente: user.email || ''
                }));
            } catch (error) {
                console.error('Error al obtener datos del usuario:', error);
            }
        }
    }, []);

    // Funciones de manipulación de estado
    const limpiarFormulario = () => {
        setMostrarFormulario(false);
        setDatosExcel([]);
        setArchivoSeleccionado(null);
        setFilasConError([]);
        setEstadisticasCarga({
            filasExitosas: 0,
            filasConError: 0,
            filasVacias: 0,
            totalFilas: 0
        });
        setInfoCliente({
            nombre_cliente: '',
            correo_cliente: '',
            telefono_cliente: '',
            ciudad_cliente: '',
            pais_cliente: ''
        });
        setInfoCarga({
            codigo_carga: '',
            fecha_inicio: '',
            fecha_fin: '',
            ciudad_destino: '',
            archivo_original: ''
        });
    };

    const limpiarBusqueda = () => {
        setResultadosBusqueda([]);
        setMostrandoResultados(false);
        setCodigoCarga('');
        setError(null);
    };

    const handleCambioCliente = (e) => {
        const { name, value } = e.target;
        setInfoCliente(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCambioCarga = (e) => {
        const { name, value } = e.target;
        setInfoCarga(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return {
        // Estados
        codigoCarga,
        setCodigoCarga,
        archivoSeleccionado,
        setArchivoSeleccionado,
        datosExcel,
        setDatosExcel,
        filasConError,
        setFilasConError,
        estadisticasCarga,
        setEstadisticasCarga,
        resultadosBusqueda,
        setResultadosBusqueda,
        mostrandoResultados,
        setMostrandoResultados,
        busquedaLoading,
        setBusquedaLoading,
        mostrarFormulario,
        setMostrarFormulario,
        infoCliente,
        setInfoCliente,
        infoCarga,
        setInfoCarga,
        loading,
        setLoading,
        error,
        setError,
        guardandoBD,
        setGuardandoBD,
        
        // Referencias
        navigate,
        fileInputRef,
        
        // Funciones de estado
        limpiarFormulario,
        limpiarBusqueda,
        handleCambioCliente,
        handleCambioCarga
    };
};
