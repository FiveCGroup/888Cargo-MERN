import React from 'react';
import { useCrearCarga } from '../hooks/useCrearCarga';
import { CargaLogic } from '../logic/cargaLogic';
import cargaService from '../services/cargaService';
import BusquedaPackingList from './BusquedaPackingList';
import CreacionNuevaCarga from './CreacionNuevaCarga';
import FormularioPackingList from './FormularioPackingList';
import TablasDatos from './TablasDatos';
import './CrearCarga.css';

const CrearCarga = () => {
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
        CargaLogic.prepararFormulario(datosExcel, archivoSeleccionado, formularioSetters);
    };

    const handleCerrarFormulario = () => {
        setMostrarFormulario(false);
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
        <div className="crear-carga">
            <h1>Control de Carga</h1>
            
            <button onClick={volverAlDashboard}>Volver al Dashboard</button>
            
            <div>
                {/* Sección de búsqueda */}
                <BusquedaPackingList
                    codigoCarga={codigoCarga}
                    setCodigoCarga={setCodigoCarga}
                    onBuscar={handleBuscarPackingList}
                    onLimpiar={limpiarBusqueda}
                    onVerDetalles={handleVerDetallesPackingList}
                    busquedaLoading={busquedaLoading}
                    mostrandoResultados={mostrandoResultados}
                    resultadosBusqueda={resultadosBusqueda}
                />

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
                    <div className="error-message">
                        Error: {error}
                    </div>
                )}

                {/* Información del archivo seleccionado */}
                {archivoSeleccionado && (
                    <div>
                        <p>
                            Archivo seleccionado: {archivoSeleccionado.name}
                            {estadisticasCarga.filasExitosas > 0 && (
                                <span>
                                    ✓ {estadisticasCarga.filasExitosas} filas cargadas exitosamente
                                </span>
                            )}
                        </p>
                        {estadisticasCarga.totalFilas > 0 && (
                            <div>
                                Total: {estadisticasCarga.totalFilas} | 
                                Exitosas: {estadisticasCarga.filasExitosas} | 
                                Errores: {estadisticasCarga.filasConError} | 
                                Vacías: {estadisticasCarga.filasVacias}
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
            
            {/* Formulario de packing list */}
            <FormularioPackingList
                mostrarFormulario={mostrarFormulario}
                infoCliente={infoCliente}
                infoCarga={infoCarga}
                onCambioCliente={handleCambioCliente}
                onCambioCarga={handleCambioCarga}
                onCerrar={handleCerrarFormulario}
                onGuardar={handleGuardarEnBD}
                onGenerarCodigo={handleGenerarNuevoCodigo}
                guardandoBD={guardandoBD}
                guardadoExitoso={guardadoExitoso}
                datosGuardado={datosGuardado}
                onDescargarPDF={handleDescargarPDF}
            />
        </div>
    );
};

export default CrearCarga;