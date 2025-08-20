import React from 'react';

const ModalTest = ({ 
    mostrar, 
    onCerrar,
    infoCliente,
    infoCarga,
    onCambioCliente,
    onCambioCarga,
    onGuardar,
    onGenerarCodigo,
    guardandoBD,
    guardadoExitoso,
    datosGuardado,
    onDescargarPDF 
}) => {
    console.log('🔍 ModalTest renderizado, mostrar:', mostrar);

    if (!mostrar) {
        return null;
    }

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                zIndex: 999999,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
            }}
            onClick={onCerrar}
        >
            <div 
                style={{
                    backgroundColor: 'white',
                    padding: '30px',
                    borderRadius: '8px',
                    border: '3px solid #007bff',
                    fontSize: '16px',
                    textAlign: 'left',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* HEADER */}
                <div style={{ marginBottom: '25px', textAlign: 'center' }}>
                    <h2 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                        📋 Información del Packing List
                    </h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                        Completa los datos del cliente y la carga
                    </p>
                </div>
                
                {/* INFORMACIÓN DEL CLIENTE */}
                <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '18px' }}>
                        👤 Información del Cliente
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Nombre del Cliente *
                        </label>
                        <input
                            type="text"
                            name="nombre_cliente"
                            value={infoCliente?.nombre_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="Nombre completo del cliente"
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Correo Electrónico *
                        </label>
                        <input
                            type="email"
                            name="correo_cliente"
                            value={infoCliente?.correo_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="correo@ejemplo.com"
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Teléfono *
                        </label>
                        <input
                            type="text"
                            name="telefono_cliente"
                            value={infoCliente?.telefono_cliente || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="+1234567890"
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Dirección de Entrega de Mercancía *
                        </label>
                        <textarea
                            name="direccion_entrega"
                            value={infoCliente?.direccion_entrega || ''}
                            onChange={onCambioCliente}
                            required
                            placeholder="Dirección completa donde se recogerá la mercancía"
                            rows="2"
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* INFORMACIÓN DE LA CARGA */}
                <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '18px' }}>
                        📦 Información del Packing List
                    </h3>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Código del Packing List *
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                name="codigo_carga"
                                value={infoCarga?.codigo_carga || ''}
                                onChange={onCambioCarga}
                                required
                                placeholder="Código único del packing list"
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    border: '2px solid #ddd', 
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <button
                                type="button"
                                onClick={onGenerarCodigo}
                                className="btn btn-outline btn-sm"
                                title="Generar nuevo código único"
                                style={{ 
                                    padding: '10px 15px', 
                                    whiteSpace: 'nowrap',
                                    fontSize: '14px',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="fas fa-random"></i> Generar
                            </button>
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' }}>
                            Dirección de Destino *
                        </label>
                        <textarea
                            name="direccion_destino"
                            value={infoCarga?.direccion_destino || ''}
                            onChange={onCambioCarga}
                            required
                            placeholder="Dirección completa donde se entregará la mercancía"
                            rows="2"
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>
                </div>

                {/* MENSAJE DE ÉXITO */}
                {guardadoExitoso && datosGuardado && (
                    <div style={{
                        padding: '15px',
                        backgroundColor: '#d1ecf1',
                        border: '2px solid #007bff',
                        borderRadius: '6px',
                        color: '#0c5460',
                        marginBottom: '20px',
                        textAlign: 'center'
                    }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                            ✅ ¡Packing List guardado exitosamente!
                        </h4>
                        <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
                            Se han generado {datosGuardado.totalQRs} códigos QR para las cajas
                        </p>
                        {datosGuardado.pdfUrl && (
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button
                                    onClick={onDescargarPDF}
                                    className="btn btn-success"
                                    style={{ fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-file-pdf"></i> Descargar PDF con QRs
                                </button>
                                <button
                                    onClick={onCerrar}
                                    className="btn btn-primary"
                                    style={{ fontSize: '14px', cursor: 'pointer' }}
                                >
                                    <i className="fas fa-plus"></i> Crear Nuevo Packing List
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* BOTONES DEL MODAL */}
                <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    justifyContent: 'flex-end', 
                    paddingTop: '20px', 
                    borderTop: '2px solid #eee',
                    flexWrap: 'wrap'
                }}>
                    <button 
                        onClick={onCerrar}
                        className="btn btn-secondary"
                        style={{ fontSize: '14px', cursor: 'pointer' }}
                    >
                        <i className="fas fa-times"></i> Cancelar
                    </button>
                    <button 
                        onClick={onGuardar}
                        className="btn btn-primary" 
                        disabled={guardandoBD}
                        style={{ 
                            fontSize: '14px', 
                            cursor: guardandoBD ? 'not-allowed' : 'pointer',
                            opacity: guardandoBD ? 0.6 : 1
                        }}
                    >
                        <i className="fas fa-save"></i> {guardandoBD ? 'Guardando...' : 'Guardar en Base de Datos'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalTest;
