import React, { useState, useEffect } from 'react';
import { useCrearCarga } from '../hooks/useCrearCarga';
import { CargaLogic } from '../logic/cargaLogic';
import cargaService from '../services/cargaService';
import BusquedaPackingList from './BusquedaPackingList';
import CreacionNuevaCarga from './CreacionNuevaCarga';
import TablasDatos from './TablasDatos';
import ModalPackingList from './ModalPackingList';

const CrearCarga = () => {
    const [user, setUser] = useState(null);
    const [mostrarModalTest, setMostrarModalTest] = useState(false);
    const [descargandoPDF, setDescargandoPDF] = useState(false);

    // Obtener información del usuario desde localStorage
    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);
    // Usar el custom hook para manejar el estado
    const {
        // Estados
        codigoCarga, setCodigoCarga,
        archivoSeleccionado, setArchivoSeleccionado,
        datosExcel, setDatosExcel,
        filasConError, setFilasConError,
        estadisticasCarga, setEstadisticasCarga,
        resultadosBusqueda, setResultadosBusqueda,
        mostrandoResultados, setMostrandoResultados,
        busquedaLoading, setBusquedaLoading,
        mostrarFormulario, setMostrarFormulario,
        infoCliente, setInfoCliente,
        infoCarga, setInfoCarga,
        loading, setLoading,
        error, setError,
        guardandoBD, setGuardandoBD,
        guardadoExitoso, setGuardadoExitoso,
        datosGuardado, setDatosGuardado,
        
        // Referencias y funciones
        navigate, fileInputRef,
        limpiarFormulario, limpiarBusqueda,
        handleCambioCliente, handleCambioCarga
    } = useCrearCarga();

    // =============== FUNCIONES DE MANEJO ===============
    
    // Crear objetos de setters para pasar a CargaLogic
    const busquedaSetters = {
        setBusquedaLoading,
        setError,
        setResultadosBusqueda,
        setMostrandoResultados
    };
    
    const archivoSetters = {
        setArchivoSeleccionado,
        setLoading,
        setError,
        setDatosExcel,
        setFilasConError,
        setEstadisticasCarga
    };
    
    const formularioSetters = {
        setError,
        setInfoCliente,
        setInfoCarga,
        setMostrarFormulario
    };
    
    const guardadoSetters = {
        setGuardandoBD,
        setError,
        setGuardadoExitoso,
        setDatosGuardado
    };

    // Funciones de navegación
    const volverAlDashboard = () => {
        navigate('/dashboard');
    };

    // Función para cerrar sesión
    const handleLogout = async () => {
        try {
            localStorage.removeItem('user');
            navigate('/auth');
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    };

    // Funciones de búsqueda
    const handleBuscarPackingList = () => {
        CargaLogic.buscarPackingList(codigoCarga, busquedaSetters);
    };

    const handleVerDetallesPackingList = (idCarga) => {
        CargaLogic.verDetallesPackingList(idCarga, setError);
    };

    // Funciones de archivo
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        CargaLogic.procesarArchivo(file, archivoSetters);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleDescargarFormato = () => {
        CargaLogic.descargarFormato({ setLoading, setError });
    };

    // Funciones de formulario
    const handleMostrarFormulario = () => {
        console.log('🔄 handleMostrarFormulario llamado - USANDO MODAL DE PRUEBA');
        console.log('📊 datosExcel:', datosExcel.length);
        console.log('📁 archivoSeleccionado:', archivoSeleccionado);
        
        // Abrir el modal de prueba que funciona
        setMostrarModalTest(true);
        console.log('✅ setMostrarModalTest(true) ejecutado');
        
        // Luego preparar los datos
        CargaLogic.prepararFormulario(datosExcel, archivoSeleccionado, formularioSetters);
    };

    const handleCerrarFormulario = () => {
        // Cerrar el modal
        setMostrarModalTest(false);
        // Limpiar estados de guardado exitoso cuando se cierra el formulario
        setGuardadoExitoso(false);
        setDatosGuardado(null);
        // Opcional: también limpiar completamente el formulario para un nuevo packing list
        limpiarFormulario();
    };

    const handleGenerarNuevoCodigo = () => {
        CargaLogic.generarNuevoCodigo(setInfoCarga);
    };

    // Función para descargar PDF de QRs
    const handleDescargarPDF = async () => {
        if (datosGuardado && datosGuardado.pdfUrl) {
            setDescargandoPDF(true);
            try {
                // Extraer el ID de la carga de la URL
                const match = datosGuardado.pdfUrl.match(/\/pdf-carga\/(\d+)$/);
                const idCarga = match ? match[1] : datosGuardado.carga?.id;
                
                if (idCarga) {
                    await cargaService.descargarPDFQRs(idCarga);
                } else {
                    setError('No se pudo obtener el ID de la carga para descargar el PDF.');
                }
            } catch (error) {
                console.error('Error al descargar PDF:', error);
                setError('Error al descargar el PDF. Inténtalo de nuevo.');
            } finally {
                setDescargandoPDF(false);
            }
        }
    };

    // Funciones de guardado
    const handleGuardarEnBD = async () => {
        const resultado = await CargaLogic.guardarEnBD(
            datosExcel, 
            infoCliente, 
            infoCarga, 
            guardadoSetters
        );
        
        // No limpiar el formulario automáticamente para permitir ver el mensaje de éxito
        // y el botón de descarga del PDF
        if (resultado && resultado.success) {
            console.log('✅ Guardado exitoso, manteniendo formulario visible para descarga de PDF');
        }
    };

    const handleGuardarCarga = async () => {
        const resultado = await CargaLogic.guardarCarga(
            datosExcel,
            estadisticasCarga,
            codigoCarga,
            archivoSeleccionado,
            { setLoading, setError }
        );
        
        if (resultado && resultado.success) {
            // Limpiar datos después del guardado exitoso
            setCodigoCarga('');
            setArchivoSeleccionado(null);
            setDatosExcel([]);
            setFilasConError([]);
            setEstadisticasCarga({
                filasExitosas: 0,
                filasConError: 0,
                filasVacias: 0,
                totalFilas: 0
            });
        }
    };

    return (
        <>
            <div>
                {/* NAVBAR */}
                <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: '1px solid #ddd' }}>
                    <div>
                        <h1 style={{ margin: 0 }}>888 Cargo - Control de Carga</h1>
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
                    {/* Sección de búsqueda con botón de regreso */}
                    <div style={{ position: 'relative' }}>
                        <BusquedaPackingList
                            codigoCarga={codigoCarga}
                            setCodigoCarga={setCodigoCarga}
                            onBuscar={handleBuscarPackingList}
                            onLimpiar={limpiarBusqueda}
                            onVerDetalles={handleVerDetallesPackingList}
                            busquedaLoading={busquedaLoading}
                            mostrandoResultados={mostrandoResultados}
                            resultadosBusqueda={resultadosBusqueda}
                            botonRegreso={
                                <button 
                                    className="btn-back-icon" 
                                    onClick={volverAlDashboard}
                                    title="Volver al Dashboard"
                                >
                                    <i className="fas fa-arrow-left"></i>
                                </button>
                            }
                        />
                    </div>

                    {/* Sección de creación de nueva carga */}
                    <CreacionNuevaCarga
                        onDescargarFormato={handleDescargarFormato}
                        onSubirArchivo={handleUploadClick}
                        onGuardarCarga={handleGuardarCarga}
                        onGuardarPackingList={handleMostrarFormulario}
                        loading={loading}
                        datosExcel={datosExcel}
                        codigoCarga={codigoCarga}
                    />
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                    />
                    
                    {/* Mensajes de error */}
                    {error && (
                        <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#f8d7da', 
                            border: '1px solid #f5c6cb', 
                            borderRadius: '4px', 
                            color: '#721c24', 
                            marginBottom: '15px' 
                        }}>
                            Error: {error}
                        </div>
                    )}

                    {/* Información del archivo seleccionado */}
                    {archivoSeleccionado && (
                        <div style={{ 
                            padding: '10px', 
                            backgroundColor: '#d1ecf1', 
                            border: '1px solid #bee5eb', 
                            borderRadius: '4px', 
                            color: '#0c5460', 
                            marginBottom: '15px' 
                        }}>
                            <p style={{ margin: '0 0 10px 0' }}>
                                <strong>Archivo seleccionado:</strong> {archivoSeleccionado.name}
                                {estadisticasCarga.filasExitosas > 0 && (
                                    <span style={{ color: '#155724', marginLeft: '10px' }}>
                                        ✓ {estadisticasCarga.filasExitosas} filas cargadas exitosamente
                                    </span>
                                )}
                            </p>
                            {estadisticasCarga.totalFilas > 0 && (
                                <div style={{ fontSize: '14px' }}>
                                    <strong>Total:</strong> {estadisticasCarga.totalFilas} | 
                                    <strong> Exitosas:</strong> {estadisticasCarga.filasExitosas} | 
                                    <strong> Errores:</strong> {estadisticasCarga.filasConError} | 
                                    <strong> Vacías:</strong> {estadisticasCarga.filasVacias}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Tablas de datos */}
                <TablasDatos
                    datosExcel={datosExcel}
                    filasConError={filasConError}
                />
            </div>
        </div>

        {/* Modal de packing list */}
        <ModalPackingList 
            mostrar={mostrarModalTest}
            onCerrar={handleCerrarFormulario}
            infoCliente={infoCliente}
            infoCarga={infoCarga}
            onCambioCliente={handleCambioCliente}
            onCambioCarga={handleCambioCarga}
            onGuardar={handleGuardarEnBD}
            onGenerarCodigo={handleGenerarNuevoCodigo}
            guardandoBD={guardandoBD}
            guardadoExitoso={guardadoExitoso}
            datosGuardado={datosGuardado}
            onDescargarPDF={handleDescargarPDF}
            descargandoPDF={descargandoPDF}
        />
        </>
    );
};

export default CrearCarga;