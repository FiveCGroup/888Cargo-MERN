import React from 'react';
import { formatearFecha, formatearMoneda } from '../utils/cargaUtils';

const BusquedaPackingList = ({ 
    codigoCarga, 
    setCodigoCarga, 
    onBuscar, 
    onLimpiar, 
    onVerDetalles,
    busquedaLoading, 
    mostrandoResultados, 
    resultadosBusqueda,
    botonRegreso 
}) => {
    return (
        <div className="container-fluid" style={{ marginBottom: '30px' }}>
            {/* Header con botón de regreso */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                {botonRegreso}
                <h3 style={{ margin: 0, color: '#333', fontWeight: '600' }}>Buscar Packing Lists Existentes</h3>
            </div>
            
            {/* Formulario de búsqueda */}
            <div className="row">
                <div className="col-12">
                    <div style={{ 
                        background: '#f8f9fa', 
                        padding: '20px', 
                        borderRadius: '8px', 
                        border: '1px solid #e9ecef',
                        marginBottom: '20px',
                        width: '40%',
                        maxWidth: '500px',
                        minWidth: '350px'
                    }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#495057', fontWeight: '500' }}>
                                Código de Carga:
                            </label>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                                <input
                                    type="text"
                                    className="input-search"
                                    value={codigoCarga}
                                    onChange={e => setCodigoCarga(e.target.value)}
                                    placeholder="Ej: PL-20250820-696-3640"
                                    onKeyPress={(e) => e.key === 'Enter' && onBuscar()}
                                    style={{
                                        flex: '1',
                                        padding: '8px 12px',
                                        border: '1px solid #ced4da',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        minWidth: '150px'
                                    }}
                                />
                                <button 
                                    className="btn btn-primary" 
                                    onClick={onBuscar} 
                                    disabled={busquedaLoading || !codigoCarga.trim()}
                                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                >
                                    <i className="fas fa-search"></i>
                                    {busquedaLoading ? 'Buscando...' : 'Buscar'}
                                </button>
                                {mostrandoResultados && (
                                    <button 
                                        className="btn btn-secondary" 
                                        onClick={onLimpiar}
                                        style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                                    >
                                        <i className="fas fa-broom"></i>Limpiar
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Resultados de búsqueda */}
            {mostrandoResultados && resultadosBusqueda.length > 0 && (
                <div>
                    <h4 style={{ color: '#28a745', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fas fa-check-circle"></i>
                        Packing Lists Encontrados ({resultadosBusqueda.length})
                    </h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {resultadosBusqueda.map((packing) => (
                            <div 
                                key={packing.id_carga}
                                style={{
                                    border: '1px solid #e9ecef',
                                    borderRadius: '8px',
                                    padding: '20px',
                                    background: '#fff',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                    transition: 'box-shadow 0.2s ease'
                                }}
                                onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)'}
                                onMouseLeave={(e) => e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
                            >
                                {/* Header del resultado */}
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    marginBottom: '15px',
                                    paddingBottom: '10px',
                                    borderBottom: '1px solid #e9ecef'
                                }}>
                                    <div>
                                        <h5 style={{ 
                                            margin: 0, 
                                            color: '#007bff', 
                                            fontSize: '18px',
                                            fontWeight: '600'
                                        }}>
                                            {packing.codigo_carga}
                                        </h5>
                                        <p style={{ 
                                            margin: '4px 0 0 0', 
                                            color: '#6c757d', 
                                            fontSize: '14px' 
                                        }}>
                                            Creado: {formatearFecha(packing.fecha_inicio || packing.fecha_creacion)}
                                        </p>
                                    </div>
                                    <button 
                                        className="btn btn-outline btn-sm" 
                                        onClick={() => onVerDetalles(packing.id_carga)}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        <i className="fas fa-eye"></i>Ver Detalles
                                    </button>
                                </div>

                                {/* Información principal */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                    
                                    {/* Información del Cliente */}
                                    <div>
                                        <h6 style={{ 
                                            color: '#495057', 
                                            marginBottom: '8px', 
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="fas fa-user" style={{ marginRight: '6px', color: '#007bff' }}></i>
                                            Cliente
                                        </h6>
                                        <div style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                                            <div><strong>Nombre:</strong> {packing.cliente?.nombre_cliente || 'N/A'}</div>
                                            <div><strong>Email:</strong> {packing.cliente?.correo_cliente || 'N/A'}</div>
                                            <div><strong>Teléfono:</strong> {packing.cliente?.telefono_cliente || 'N/A'}</div>
                                        </div>
                                    </div>

                                    {/* Información de Envío */}
                                    <div>
                                        <h6 style={{ 
                                            color: '#495057', 
                                            marginBottom: '8px', 
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="fas fa-shipping-fast" style={{ marginRight: '6px', color: '#28a745' }}></i>
                                            Envío
                                        </h6>
                                        <div style={{ color: '#6c757d', fontSize: '14px', lineHeight: '1.6' }}>
                                            <div><strong>Destino:</strong> {packing.ciudad_destino || packing.direccion_destino || 'N/A'}</div>
                                            <div><strong>Archivo:</strong> {packing.archivo_original || 'N/A'}</div>
                                            <div><strong>Fecha Fin:</strong> {packing.fecha_fin ? formatearFecha(packing.fecha_fin) : 'No disponible'}</div>
                                        </div>
                                    </div>

                                    {/* Estadísticas */}
                                    <div>
                                        <h6 style={{ 
                                            color: '#495057', 
                                            marginBottom: '8px', 
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px'
                                        }}>
                                            <i className="fas fa-chart-bar" style={{ marginRight: '6px', color: '#ffc107' }}></i>
                                            Estadísticas
                                        </h6>
                                        <div style={{ 
                                            display: 'grid', 
                                            gridTemplateColumns: 'repeat(2, 1fr)', 
                                            gap: '8px',
                                            fontSize: '13px'
                                        }}>
                                            <div style={{
                                                background: '#f8f9fa',
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#007bff' }}>
                                                    {packing.estadisticas?.total_articulos || 0}
                                                </div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>Artículos</div>
                                            </div>
                                            <div style={{
                                                background: '#f8f9fa',
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#28a745' }}>
                                                    {formatearMoneda(packing.estadisticas?.precio_total_carga || 0)}
                                                </div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>Valor</div>
                                            </div>
                                            <div style={{
                                                background: '#f8f9fa',
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#fd7e14' }}>
                                                    {(packing.estadisticas?.cbm_total || 0).toFixed(2)}
                                                </div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>CBM</div>
                                            </div>
                                            <div style={{
                                                background: '#f8f9fa',
                                                padding: '6px 8px',
                                                borderRadius: '4px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#6f42c1' }}>
                                                    {(packing.estadisticas?.peso_total || 0).toFixed(1)} kg
                                                </div>
                                                <div style={{ color: '#6c757d', fontSize: '11px' }}>Peso</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BusquedaPackingList;
