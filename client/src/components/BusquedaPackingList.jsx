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
    resultadosBusqueda 
}) => {
    return (
        <div>
            <h3>Buscar Packing Lists Existentes</h3>
            <div>
                <label>
                    Código de Carga:
                    <input
                        type="text"
                        value={codigoCarga}
                        onChange={e => setCodigoCarga(e.target.value)}
                        placeholder="Ingrese código para buscar..."
                        onKeyPress={(e) => e.key === 'Enter' && onBuscar()}
                    />
                </label>
                <button onClick={onBuscar} disabled={busquedaLoading || !codigoCarga.trim()}>
                    {busquedaLoading ? 'Buscando...' : 'Buscar'}
                </button>
                {mostrandoResultados && (
                    <button onClick={onLimpiar}>
                        Limpiar
                    </button>
                )}
            </div>
            
            {/* Mostrar resultados de búsqueda */}
            {mostrandoResultados && resultadosBusqueda.length > 0 && (
                <div>
                    <h4>Packing Lists Encontrados ({resultadosBusqueda.length})</h4>
                    {resultadosBusqueda.map((packing) => (
                        <div key={packing.id_carga}>
                            <div>
                                <div>
                                    <strong>Código:</strong> {packing.codigo_carga}<br/>
                                    <strong>Cliente:</strong> {packing.cliente?.nombre_cliente || 'N/A'}<br/>
                                    <strong>Email:</strong> {packing.cliente?.correo_cliente || 'N/A'}<br/>
                                    <strong>Teléfono:</strong> {packing.cliente?.telefono_cliente || 'N/A'}
                                </div>
                                <div>
                                    <strong>Fecha Inicio:</strong> {formatearFecha(packing.fecha_inicio)}<br/>
                                    <strong>Fecha Fin:</strong> {formatearFecha(packing.fecha_fin)}<br/>
                                    <strong>Destino:</strong> {packing.ciudad_destino || 'N/A'}<br/>
                                    <strong>Archivo:</strong> {packing.archivo_original || 'N/A'}
                                </div>
                            </div>
                            
                            <div>
                                <strong>Estadísticas:</strong><br/>
                                <div>
                                    <span>Artículos: {packing.estadisticas?.articulos_creados || 0}</span>
                                    <span>Total items: {packing.estadisticas?.total_articulos || 0}</span>
                                    <span>Valor: {formatearMoneda(packing.estadisticas?.precio_total_carga || 0)}</span>
                                    <span>CBM: {(packing.estadisticas?.cbm_total || 0).toFixed(2)}</span>
                                    <span>Peso: {(packing.estadisticas?.peso_total || 0).toFixed(2)} kg</span>
                                    <span>Cajas: {packing.estadisticas?.total_cajas || 0}</span>
                                </div>
                            </div>
                            
                            <div>
                                <button onClick={() => onVerDetalles(packing.id_carga)}>
                                    Ver Detalles
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BusquedaPackingList;
