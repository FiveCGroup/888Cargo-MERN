import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import cargaService from '../services/cargaService';

const CrearCarga = () => {
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
    
    // Estados para búsqueda de packing lists
    const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
    const [mostrandoResultados, setMostrandoResultados] = useState(false);
    const [busquedaLoading, setBusquedaLoading] = useState(false);
    
    // Nuevos estados para el formulario de información
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
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [guardandoBD, setGuardandoBD] = useState(false);
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    // Efecto para autocompletar datos del cliente logueado
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

    // Función auxiliar para obtener URL de imagen (simplificada)
    const obtenerUrlImagen = (cellValue) => {
        if (!cellValue) return null;
        
        if (typeof cellValue === 'string') {
            // URL de string
            return cellValue.startsWith('http') ? cellValue : `http://localhost:4000${cellValue}`;
        }
        
        return null;
    };

    const volverAlDashboard = () => {
        navigate('/dashboard');
    };

    // =============== FUNCIONES DE BÚSQUEDA ===============
    
    const handleBuscarPackingList = async () => {
        if (!codigoCarga.trim()) {
            setError('Ingrese un código de carga para buscar');
            return;
        }

        setBusquedaLoading(true);
        setError(null);
        
        try {
            const resultado = await cargaService.buscarPackingList(codigoCarga.trim());
            
            if (resultado.success && resultado.data && resultado.data.length > 0) {
                setResultadosBusqueda(resultado.data);
                setMostrandoResultados(true);
                console.log('🔍 Resultados de búsqueda:', resultado.data);
            } else {
                setError(resultado.mensaje || 'No se encontraron packing lists con ese código');
                setResultadosBusqueda([]);
                setMostrandoResultados(false);
            }
        } catch (error) {
            console.error('Error en búsqueda:', error);
            setError('Error al buscar packing lists');
            setResultadosBusqueda([]);
            setMostrandoResultados(false);
        }
        
        setBusquedaLoading(false);
    };

    const handleVerDetallesPackingList = async (idCarga) => {
        try {
            const resultado = await cargaService.obtenerPackingList(idCarga);
            
            if (resultado.success) {
                // Mostrar los detalles en una ventana modal o expandir la información
                console.log('📦 Detalles del packing list:', resultado.data);
                alert(`Packing List cargado:\n\nCódigo: ${resultado.data.codigo_carga}\nArtículos: ${resultado.data.articulos?.length || 0}\nTotal: $${resultado.data.precio_total || 0}`);
            } else {
                setError('Error al obtener detalles del packing list');
            }
        } catch (error) {
            console.error('Error al obtener detalles:', error);
            setError('Error al cargar detalles del packing list');
        }
    };

    const limpiarBusqueda = () => {
        setResultadosBusqueda([]);
        setMostrandoResultados(false);
        setCodigoCarga('');
        setError(null);
    };

    const formatearMoneda = (valor) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(valor);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return 'N/A';
        return new Date(fecha).toLocaleDateString('es-CO');
    };

    // =============== FIN FUNCIONES DE BÚSQUEDA ===============

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setArchivoSeleccionado(file);
        setLoading(true);
        setError(null);

        const resultado = await cargaService.procesarExcel(file);

        if (resultado.success) {
            setDatosExcel(resultado.data.data);
            setFilasConError(resultado.data.filasConError || []);
            setEstadisticasCarga(resultado.data.estadisticas);
        } else {
            setError(resultado.error);
        }

        setLoading(false);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleDescargarFormato = async () => {
        setLoading(true);
        const resultado = await cargaService.descargarFormato();
        
        if (!resultado.success) {
            setError(resultado.error);
        }
        
        setLoading(false);
    };

    // Nuevas funciones para el formulario de información
    const generarCodigoUnico = () => {
        const fecha = new Date();
        const timestamp = fecha.getTime();
        const random = Math.floor(Math.random() * 1000);
        return `PL-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}-${timestamp.toString().slice(-4)}`;
    };

    const handleMostrarFormulario = () => {
        if (datosExcel.length === 0) {
            setError('Primero debe cargar y procesar un archivo Excel');
            return;
        }
        
        // Prellenar algunos campos basándose en los datos del Excel
        if (datosExcel.length > 1) {
            const primeraFila = datosExcel[1];
            setInfoCliente(prev => ({
                ...prev,
                telefono_cliente: primeraFila[2] || '',
                ciudad_cliente: primeraFila[3] || ''
            }));
            
            setInfoCarga(prev => ({
                ...prev,
                codigo_carga: generarCodigoUnico(), // Generar código automáticamente
                fecha_inicio: primeraFila[0] ? new Date(primeraFila[0]).toISOString().split('T')[0] : '',
                ciudad_destino: primeraFila[3] || '',
                archivo_original: archivoSeleccionado?.name || ''
            }));
        }
        
        setMostrarFormulario(true);
    };

    const handleCerrarFormulario = () => {
        setMostrarFormulario(false);
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

    const handleGuardarEnBD = async () => {
        // Validaciones básicas
        if (!infoCliente.nombre_cliente) {
            setError('El nombre del cliente es requerido');
            return;
        }
        
        if (!infoCarga.codigo_carga) {
            setError('El código de carga es requerido');
            return;
        }
        
        if (!infoCarga.fecha_inicio) {
            setError('La fecha de inicio es requerida');
            return;
        }

        setGuardandoBD(true);
        setError(null);

        try {
            const datosCompletos = {
                datosExcel: datosExcel,
                infoCliente: infoCliente,
                infoCarga: infoCarga
            };

            const resultado = await cargaService.guardarPackingList(datosCompletos);

            console.log('=== DEBUGGING FRONTEND DETALLADO ===');
            console.log('Resultado completo:', resultado);
            console.log('Tipo de resultado:', typeof resultado);
            console.log('resultado.success:', resultado.success);
            console.log('resultado.data:', resultado.data);
            console.log('resultado.message:', resultado.message);
            console.log('JSON del resultado:', JSON.stringify(resultado, null, 2));
            console.log('=== FIN DEBUG FRONTEND ===');

            if (resultado.success) {
                const { data } = resultado;
                
                // Opcional: Recargar datos desde la base de datos para mostrar URLs de imagen actualizadas
                if (data && data.id_carga) {
                    try {
                        const packingListActualizado = await cargaService.obtenerPackingList(data.id_carga);
                        if (packingListActualizado.success) {
                            console.log('📦 Datos actualizados desde BD con imágenes:', packingListActualizado.data);
                            // Aquí podrías actualizar la vista si quisieras mostrar los datos actualizados
                        }
                    } catch (errorRecarga) {
                        console.warn('⚠️ No se pudieron recargar los datos actualizados:', errorRecarga);
                    }
                }
                
                const mensaje = `🎉 Packing List guardado exitosamente!

📋 Resumen:
• Cliente ID: ${data.id_cliente || 'No disponible'}
• Carga ID: ${data.id_carga || 'No disponible'}  
• Código de Carga: ${infoCarga.codigo_carga}
• Artículos creados: ${data.articulos_creados || 0}
• Errores encontrados: ${data.errores?.length || 0}

✅ Los datos han sido guardados en la base de datos correctamente.`;
                
                alert(mensaje);
                
                // Limpiar formulario
                setMostrarFormulario(false);
                setDatosExcel([]);
                setArchivoSeleccionado(null);
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
                
                // Opcional: navegar al dashboard
                // navigate('/dashboard');
            } else {
                // Manejar errores específicos
                console.error('❌ El guardado no fue exitoso. Detalles:', resultado);
                const errorMsg = resultado.error || resultado.message || 'Error desconocido al guardar';
                
                if (errorMsg.includes('código de carga ya existe')) {
                    setError(`${errorMsg}. Presiona "Generar Nuevo Código" para crear uno automáticamente.`);
                } else {
                    setError(errorMsg);
                }
            }
        } catch (error) {
            console.error('Error al guardar:', error);
            setError('Error inesperado al guardar en la base de datos');
        }

        setGuardandoBD(false);
    };

    const handleGuardarCarga = async () => {
        if (datosExcel.length === 0) {
            setError('No hay datos para guardar');
            return;
        }

        setLoading(true);

        const datosCarga = {
            codigoCarga,
            datosExcel,
            estadisticas: estadisticasCarga,
            archivoNombre: archivoSeleccionado?.name
        };

        const resultado = await cargaService.guardarCarga(datosCarga);

        if (resultado.success) {
            alert('Carga guardada exitosamente');
            // Limpiar formulario
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
        } else {
            setError(resultado.error);
        }

        setLoading(false);
    };

    return (
        <div>
            <h1>Control de Carga</h1>
            
            <button onClick={volverAlDashboard}>Volver al Dashboard</button>
            
            <div>
                {/* Sección de búsqueda de packing lists */}
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                    <h3>🔍 Buscar Packing Lists Existentes</h3>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                        <label>
                            Código de Carga:&nbsp;
                            <input
                                type="text"
                                value={codigoCarga}
                                onChange={e => setCodigoCarga(e.target.value)}
                                placeholder="Ingrese código para buscar..."
                                style={{ padding: '5px', minWidth: '200px' }}
                                onKeyPress={(e) => e.key === 'Enter' && handleBuscarPackingList()}
                            />
                        </label>
                        <button 
                            onClick={handleBuscarPackingList} 
                            disabled={busquedaLoading || !codigoCarga.trim()}
                            style={{ 
                                backgroundColor: '#007bff', 
                                color: 'white', 
                                padding: '5px 15px', 
                                border: 'none', 
                                borderRadius: '3px',
                                cursor: 'pointer'
                            }}
                        >
                            {busquedaLoading ? 'Buscando...' : '🔍 Buscar'}
                        </button>
                        {mostrandoResultados && (
                            <button 
                                onClick={limpiarBusqueda}
                                style={{ 
                                    backgroundColor: '#6c757d', 
                                    color: 'white', 
                                    padding: '5px 15px', 
                                    border: 'none', 
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                }}
                            >
                                ✕ Limpiar
                            </button>
                        )}
                    </div>
                    
                    {/* Mostrar resultados de búsqueda */}
                    {mostrandoResultados && resultadosBusqueda.length > 0 && (
                        <div style={{ marginTop: '15px' }}>
                            <h4>📦 Packing Lists Encontrados ({resultadosBusqueda.length})</h4>
                            {resultadosBusqueda.map((packing, index) => (
                                <div key={packing.id_carga} style={{ 
                                    border: '1px solid #e9ecef', 
                                    borderRadius: '5px', 
                                    padding: '15px', 
                                    margin: '10px 0',
                                    backgroundColor: '#f8f9fa'
                                }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <strong>📋 Código:</strong> {packing.codigo_carga}<br/>
                                            <strong>👤 Cliente:</strong> {packing.cliente?.nombre_cliente || 'N/A'}<br/>
                                            <strong>📧 Email:</strong> {packing.cliente?.correo_cliente || 'N/A'}<br/>
                                            <strong>📞 Teléfono:</strong> {packing.cliente?.telefono_cliente || 'N/A'}
                                        </div>
                                        <div>
                                            <strong>📅 Fecha Inicio:</strong> {formatearFecha(packing.fecha_inicio)}<br/>
                                            <strong>📅 Fecha Fin:</strong> {formatearFecha(packing.fecha_fin)}<br/>
                                            <strong>🌍 Destino:</strong> {packing.ciudad_destino || 'N/A'}<br/>
                                            <strong>📄 Archivo:</strong> {packing.archivo_original || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'white', borderRadius: '3px' }}>
                                        <strong>📊 Estadísticas:</strong><br/>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '5px', fontSize: '0.9em' }}>
                                            <span>📦 Artículos: {packing.estadisticas?.articulos_creados || 0}</span>
                                            <span>📋 Total items: {packing.estadisticas?.total_articulos || 0}</span>
                                            <span>💰 Valor: {formatearMoneda(packing.estadisticas?.precio_total_carga || 0)}</span>
                                            <span>📐 CBM: {(packing.estadisticas?.cbm_total || 0).toFixed(2)}</span>
                                            <span>⚖️ Peso: {(packing.estadisticas?.peso_total || 0).toFixed(2)} kg</span>
                                            <span>📦 Cajas: {packing.estadisticas?.total_cajas || 0}</span>
                                        </div>
                                    </div>
                                    
                                    <div style={{ marginTop: '10px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => handleVerDetallesPackingList(packing.id_carga)}
                                            style={{ 
                                                backgroundColor: '#28a745', 
                                                color: 'white', 
                                                padding: '5px 15px', 
                                                border: 'none', 
                                                borderRadius: '3px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            👁️ Ver Detalles
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sección de creación de nuevo packing list */}
                <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '5px' }}>
                    <h3>📝 Crear Nuevo Packing List</h3>
                    <div>
                        <button onClick={handleDescargarFormato} disabled={loading}>
                            {loading ? 'Descargando...' : 'Descargar formato packing list'}
                        </button>
                        <button onClick={handleUploadClick} disabled={loading}>
                            {loading ? 'Procesando...' : 'Subir packing list'}
                        </button>
                        {datosExcel.length > 0 && (
                            <>
                                <button onClick={handleGuardarCarga} disabled={loading || !codigoCarga}>
                                    {loading ? 'Guardando...' : 'Guardar Carga (Antigua estructura)'}
                                </button>
                            <button 
                                onClick={handleMostrarFormulario} 
                                disabled={loading}
                                style={{ 
                                    backgroundColor: '#28a745', 
                                    color: 'white', 
                                    marginLeft: '10px',
                                    padding: '10px 20px',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                📦 Guardar como Packing List
                            </button>
                        </>
                    )}
                </div>
                </div>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls"
                    style={{ display: 'none' }}
                />
                
                {error && (
                    <div>
                        Error: {error}
                    </div>
                )}

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

            {/* Mostrar tabla de filas con errores */}
            {filasConError.length > 0 && (
                <div>
                    <h3>Filas con errores ({filasConError.length})</h3>
                    <table border="1">
                        <thead>
                            <tr>
                                <th>Fila #</th>
                                <th>Errores</th>
                                <th>Datos de la fila</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filasConError.map((filaError, idx) => (
                                <tr key={idx}>
                                    <td>{filaError.numeroFila}</td>
                                    <td>{filaError.errores.join(', ')}</td>
                                    <td>
                                        {filaError.datos.slice(0, 5).map((celda, cidx) => (
                                            <span key={cidx}>
                                                [{cidx}]: {celda || 'vacío'}
                                                {cidx < 4 && ' | '}
                                            </span>
                                        ))}
                                        {filaError.datos.length > 5 && '...'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Mostrar tabla del archivo Excel si hay datos válidos */}
            {datosExcel.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Datos cargados exitosamente</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table border="1" style={{ borderCollapse: 'collapse', width: '100%' }}>
                            <thead>
                                <tr>
                                    {(() => {
                                        const headers = [];
                                        for (let idx = 0; idx < datosExcel[0].length; idx++) {
                                            const col = datosExcel[0][idx];
                                            
                                            if (col && col.toString().toLowerCase().includes('medida')) {
                                                headers.push(
                                                    <th key={idx + '-largo'} style={{ padding: '8px', backgroundColor: '#f5f5f5' }}>Largo</th>,
                                                    <th key={idx + '-ancho'} style={{ padding: '8px', backgroundColor: '#f5f5f5' }}>Ancho</th>,
                                                    <th key={idx + '-alto'} style={{ padding: '8px', backgroundColor: '#f5f5f5' }}>Alto</th>
                                                );
                                                idx += 2; // Saltar las siguientes 2 columnas porque las acabamos de procesar
                                                continue;
                                            }
                                            
                                            headers.push(
                                                <th key={idx} style={{ padding: '8px', backgroundColor: '#f5f5f5' }}>
                                                    {col}
                                                </th>
                                            );
                                        }
                                        return headers;
                                    })()}
                                </tr>
                            </thead>
                            <tbody>
                                {datosExcel.slice(1).map((row, idx) => (
                                    <tr key={idx}>
                                        {(() => {
                                            const cells = [];
                                            
                                            for (let cidx = 0; cidx < row.length; cidx++) {
                                                const header = datosExcel[0][cidx];
                                                const cellValue = row[cidx];
                                                
                                                // Si encontramos la columna de medidas, crear 3 celdas
                                                if (header && header.toString().toLowerCase().includes('medida')) {
                                                    cells.push(
                                                        <td key={cidx + '-largo'} style={{ padding: '8px', textAlign: 'center' }}>{row[cidx] || ''}</td>,
                                                        <td key={cidx + '-ancho'} style={{ padding: '8px', textAlign: 'center' }}>{row[cidx + 1] || ''}</td>,
                                                        <td key={cidx + '-alto'} style={{ padding: '8px', textAlign: 'center' }}>{row[cidx + 2] || ''}</td>
                                                    );
                                                    cidx += 2; // Saltar las siguientes 2 columnas porque las acabamos de procesar
                                                    continue;
                                                }
                                                
                                                // Si es la columna PHTO, mostrar imagen
                                                if (header && header.toString().toLowerCase() === 'phto') {
                                                    const imagenUrl = obtenerUrlImagen(cellValue);
                                                    
                                                    cells.push(
                                                        <td key={cidx} style={{ padding: '8px', textAlign: 'center' }}>
                                                            {imagenUrl ? (
                                                                <img
                                                                    src={imagenUrl}
                                                                    alt="Imagen del producto"
                                                                    style={{
                                                                        maxWidth: '100px',
                                                                        maxHeight: '100px',
                                                                        objectFit: 'contain',
                                                                        border: '1px solid #ddd',
                                                                        borderRadius: '4px'
                                                                    }}
                                                                    onError={(e) => {
                                                                        console.log(`Error cargando imagen: ${imagenUrl}`);
                                                                        e.target.style.display = 'none';
                                                                        e.target.parentNode.innerHTML = '<span style="color: #888; font-size: 12px;">Error de imagen</span>';
                                                                    }}
                                                                    onLoad={() => {
                                                                        console.log(`Imagen cargada exitosamente: ${imagenUrl}`);
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span style={{ color: '#888', fontSize: '12px' }}>Sin imagen</span>
                                                            )}
                                                        </td>
                                                    );
                                                    continue;
                                                }
                                                
                                                // Para cualquier otra columna, mostrar el contenido normal
                                                cells.push(
                                                    <td key={cidx} style={{ padding: '8px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                        {cellValue || ''}
                                                    </td>
                                                );
                                            }
                                            
                                            return cells;
                                        })()}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Modal/Formulario para información adicional */}
            {mostrarFormulario && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '10px',
                        width: '80%',
                        maxWidth: '600px',
                        maxHeight: '80%',
                        overflow: 'auto',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                    }}>
                        <h2 style={{ marginBottom: '20px', color: '#333' }}>📦 Información del Packing List</h2>
                        
                        {/* Información del Cliente */}
                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#555', borderBottom: '2px solid #007bff', paddingBottom: '5px' }}>👤 Información del Cliente</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre del Cliente *</label>
                                    <input
                                        type="text"
                                        name="nombre_cliente"
                                        value={infoCliente.nombre_cliente}
                                        onChange={handleCambioCliente}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Correo Electrónico</label>
                                    <input
                                        type="email"
                                        name="correo_cliente"
                                        value={infoCliente.correo_cliente}
                                        onChange={handleCambioCliente}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Teléfono</label>
                                    <input
                                        type="text"
                                        name="telefono_cliente"
                                        value={infoCliente.telefono_cliente}
                                        onChange={handleCambioCliente}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ciudad</label>
                                    <input
                                        type="text"
                                        name="ciudad_cliente"
                                        value={infoCliente.ciudad_cliente}
                                        onChange={handleCambioCliente}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>País</label>
                                    <input
                                        type="text"
                                        name="pais_cliente"
                                        value={infoCliente.pais_cliente}
                                        onChange={handleCambioCliente}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Información de la Carga */}
                        <div style={{ marginBottom: '25px' }}>
                            <h3 style={{ color: '#555', borderBottom: '2px solid #28a745', paddingBottom: '5px' }}>📦 Información de la Carga</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Código de Carga *</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            name="codigo_carga"
                                            value={infoCarga.codigo_carga}
                                            onChange={handleCambioCarga}
                                            style={{
                                                flex: 1,
                                                padding: '8px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setInfoCarga(prev => ({
                                                ...prev,
                                                codigo_carga: generarCodigoUnico()
                                            }))}
                                            style={{
                                                padding: '8px 12px',
                                                backgroundColor: '#17a2b8',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '12px'
                                            }}
                                            title="Generar nuevo código único"
                                        >
                                            🔄 Nuevo
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Ciudad Destino</label>
                                    <input
                                        type="text"
                                        name="ciudad_destino"
                                        value={infoCarga.ciudad_destino}
                                        onChange={handleCambioCarga}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha de Inicio *</label>
                                    <input
                                        type="date"
                                        name="fecha_inicio"
                                        value={infoCarga.fecha_inicio}
                                        onChange={handleCambioCarga}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Fecha de Fin</label>
                                    <input
                                        type="date"
                                        name="fecha_fin"
                                        value={infoCarga.fecha_fin}
                                        onChange={handleCambioCarga}
                                        style={{
                                            width: '100%',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '4px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                            <button
                                onClick={handleCerrarFormulario}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleGuardarEnBD}
                                disabled={guardandoBD}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: guardandoBD ? '#ccc' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: guardandoBD ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {guardandoBD ? '💾 Guardando...' : '💾 Guardar en Base de Datos'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CrearCarga;