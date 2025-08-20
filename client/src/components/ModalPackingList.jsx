import React from 'react';

// Componente de animación de carga (spinner)
const LoadingSpinner = ({ size = '16px', color = 'white' }) => (
    <div 
        style={{
            display: 'inline-block',
            width: size,
            height: size,
            border: `2px solid transparent`,
            borderTop: `2px solid ${color}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '8px'
        }}
    />
);

// Overlay de carga para el proceso de guardado
const LoadingOverlay = ({ message }) => (
    <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        borderRadius: '8px'
    }}>
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '30px'
        }}>
            <div style={{
                width: '50px',
                height: '50px',
                border: '4px solid #f3f3f3',
                borderTop: '4px solid #007bff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '20px'
            }} />
            <h3 style={{ margin: '0 0 10px 0', color: '#007bff' }}>
                {message}
            </h3>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                Por favor espera, esto puede tomar unos momentos...
            </p>
        </div>
    </div>
);

// Agregar los keyframes CSS para la animación
const spinKeyframes = `
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Insertar CSS en el documento
if (typeof document !== 'undefined' && !document.querySelector('#spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = spinKeyframes;
    document.head.appendChild(style);
}

const ModalPackingList = ({ 
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
    onDescargarPDF,
    descargandoPDF
}) => {
    console.log('🔍 ModalPackingList renderizado, mostrar:', mostrar);

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
                    overflow: 'auto',
                    position: 'relative'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Overlay de carga para el guardado en BD */}
                {guardandoBD && (
                    <LoadingOverlay message="Guardando en Base de Datos" />
                )}
                
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
                            disabled={guardadoExitoso}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                color: guardadoExitoso ? '#6c757d' : 'inherit',
                                cursor: guardadoExitoso ? 'not-allowed' : 'text'
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
                            disabled={guardadoExitoso}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                color: guardadoExitoso ? '#6c757d' : 'inherit',
                                cursor: guardadoExitoso ? 'not-allowed' : 'text'
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
                            disabled={guardadoExitoso}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                color: guardadoExitoso ? '#6c757d' : 'inherit',
                                cursor: guardadoExitoso ? 'not-allowed' : 'text'
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
                            disabled={guardadoExitoso}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                color: guardadoExitoso ? '#6c757d' : 'inherit',
                                cursor: guardadoExitoso ? 'not-allowed' : 'text'
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
                                disabled={guardadoExitoso}
                                style={{ 
                                    flex: 1, 
                                    padding: '10px', 
                                    border: '2px solid #ddd', 
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                    color: guardadoExitoso ? '#6c757d' : 'inherit',
                                    cursor: guardadoExitoso ? 'not-allowed' : 'text'
                                }}
                            />
                            <button
                                type="button"
                                onClick={onGenerarCodigo}
                                className="btn btn-outline btn-sm"
                                title="Generar nuevo código único"
                                disabled={guardadoExitoso}
                                style={{ 
                                    padding: '10px 15px', 
                                    whiteSpace: 'nowrap',
                                    fontSize: '14px',
                                    cursor: guardadoExitoso ? 'not-allowed' : 'pointer',
                                    opacity: guardadoExitoso ? 0.6 : 1
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
                            disabled={guardadoExitoso}
                            style={{ 
                                width: '100%', 
                                padding: '10px', 
                                border: '2px solid #ddd', 
                                borderRadius: '4px',
                                fontSize: '14px',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                                backgroundColor: guardadoExitoso ? '#f8f9fa' : 'white',
                                color: guardadoExitoso ? '#6c757d' : 'inherit',
                                cursor: guardadoExitoso ? 'not-allowed' : 'text'
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
                                    disabled={descargandoPDF}
                                    style={{ 
                                        fontSize: '14px', 
                                        cursor: descargandoPDF ? 'not-allowed' : 'pointer',
                                        backgroundColor: descargandoPDF ? '#6c757d' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '10px 20px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(40,167,69,0.3)',
                                        transition: 'all 0.2s ease',
                                        opacity: descargandoPDF ? 0.7 : 1
                                    }}
                                    onMouseOver={(e) => {
                                        if (!descargandoPDF) e.target.style.backgroundColor = '#218838'
                                    }}
                                    onMouseOut={(e) => {
                                        if (!descargandoPDF) e.target.style.backgroundColor = '#28a745'
                                    }}
                                >
                                    {descargandoPDF ? (
                                        <>
                                            <LoadingSpinner size="14px" color="white" />
                                            Descargando PDF...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-file-pdf"></i> Descargar PDF con QRs
                                        </>
                                    )}
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
                        <i className={guardadoExitoso ? "fas fa-check" : "fas fa-times"}></i> 
                        {guardadoExitoso ? ' Cerrar' : ' Cancelar'}
                    </button>
                    
                    {/* Solo mostrar el botón de guardar si no se ha guardado exitosamente */}
                    {!guardadoExitoso && (
                        <button 
                            onClick={onGuardar}
                            className="btn btn-primary" 
                            disabled={guardandoBD}
                            style={{ 
                                fontSize: '14px', 
                                cursor: guardandoBD ? 'not-allowed' : 'pointer',
                                opacity: guardandoBD ? 0.8 : 1
                            }}
                        >
                            {guardandoBD ? (
                                <>
                                    <LoadingSpinner size="16px" color="white" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save"></i> Guardar en Base de Datos
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ModalPackingList;
