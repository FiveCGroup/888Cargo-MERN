import React, { useEffect, useState } from 'react';

const FormularioPackingList = ({ 
    mostrarFormulario,
    infoCliente,
    infoCarga,
    onCambioCliente,
    onCambioCarga,
    onCerrar,
    onGuardar,
    onGenerarCodigo,
    guardandoBD,
    guardadoExitoso,
    datosGuardado,
    onDescargarPDF 
}) => {
    const [datosAutocompletados, setDatosAutocompletados] = useState(false);

    // Efecto para mostrar indicador cuando los datos se autocompletar
    useEffect(() => {
        if (mostrarFormulario && (infoCliente.nombre_cliente || infoCliente.correo_cliente)) {
            setDatosAutocompletados(true);
            // Ocultar el indicador después de 3 segundos
            const timer = setTimeout(() => {
                setDatosAutocompletados(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [mostrarFormulario, infoCliente.nombre_cliente, infoCliente.correo_cliente]);

    if (!mostrarFormulario) return null;

    return (
        <div>
            <div>
                <h2>Información del Packing List</h2>
                
                {/* Indicador de autocompletado */}
                {datosAutocompletados && (
                    <div style={{
                        padding: '8px 12px',
                        backgroundColor: '#d4edda',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        color: '#155724',
                        fontSize: '14px',
                        marginBottom: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>✅</span>
                        <span>Datos del cliente autocompletados desde tu perfil</span>
                    </div>
                )}
                
                {/* Información del Cliente */}
                <div>
                    <h3>Información del Cliente</h3>
                    <div>
                        <div>
                            <label>Nombre del Cliente *</label>
                            <input
                                type="text"
                                name="nombre_cliente"
                                value={infoCliente.nombre_cliente}
                                onChange={onCambioCliente}
                                required
                                placeholder="Nombre completo del cliente"
                            />
                        </div>
                        <div>
                            <label>Correo Electrónico *</label>
                            <input
                                type="email"
                                name="correo_cliente"
                                value={infoCliente.correo_cliente}
                                onChange={onCambioCliente}
                                required
                                placeholder="correo@ejemplo.com"
                            />
                        </div>
                        <div>
                            <label>Teléfono *</label>
                            <input
                                type="text"
                                name="telefono_cliente"
                                value={infoCliente.telefono_cliente}
                                onChange={onCambioCliente}
                                required
                                placeholder="+1234567890"
                            />
                        </div>
                        <div>
                            <label>Dirección de Entrega de Mercancía *</label>
                            <textarea
                                name="direccion_entrega"
                                value={infoCliente.direccion_entrega}
                                onChange={onCambioCliente}
                                required
                                placeholder="Dirección completa donde se recogerá la mercancía"
                                rows="2"
                            />
                        </div>
                    </div>
                </div>

                {/* Información de la Carga */}
                <div>
                    <h3>Información del Packing List</h3>
                    <div>
                        <div>
                            <label>Código del Packing List *</label>
                            <div>
                                <input
                                    type="text"
                                    name="codigo_carga"
                                    value={infoCarga.codigo_carga}
                                    onChange={onCambioCarga}
                                    required
                                    placeholder="Código único del packing list"
                                />
                                <button
                                    type="button"
                                    onClick={onGenerarCodigo}
                                    title="Generar nuevo código único"
                                >
                                    Generar Código
                                </button>
                            </div>
                        </div>
                        <div>
                            <label>Dirección de Destino *</label>
                            <textarea
                                name="direccion_destino"
                                value={infoCarga.direccion_destino}
                                onChange={onCambioCarga}
                                required
                                placeholder="Dirección completa donde se entregará la mercancía"
                                rows="2"
                            />
                        </div>
                    </div>
                </div>

                {/* Mensaje de éxito y botón de descarga */}
                {guardadoExitoso && datosGuardado && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#d1ecf1',
                        border: '1px solid #bee5eb',
                        borderRadius: '4px',
                        color: '#0c5460',
                        marginBottom: '15px',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>
                            ✅ ¡Packing List guardado exitosamente!
                        </h4>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                            Se han generado {datosGuardado.totalQRs} códigos QR para las cajas
                        </p>
                        {datosGuardado.pdfUrl && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <button
                                    onClick={onDescargarPDF}
                                    style={{
                                        backgroundColor: '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    📄 Descargar PDF con QRs
                                </button>
                                <button
                                    onClick={onCerrar}
                                    style={{
                                        backgroundColor: '#007bff',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    📋 Crear Nuevo Packing List
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Botones */}
                <div>
                    <button onClick={onCerrar}>
                        Cancelar
                    </button>
                    <button onClick={onGuardar} disabled={guardandoBD}>
                        {guardandoBD ? 'Guardando...' : 'Guardar en Base de Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FormularioPackingList;
