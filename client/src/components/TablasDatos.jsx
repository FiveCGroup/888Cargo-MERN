import React from 'react';
import { obtenerUrlImagen } from '../utils/cargaUtils';

const TablasDatos = ({ datosExcel, filasConError }) => {
    return (
        <>
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
                <div>
                    <h3>Datos cargados exitosamente</h3>
                    <table border="1">
                        <thead>
                            <tr>
                                {(() => {
                                    const headers = [];
                                    for (let idx = 0; idx < datosExcel[0].length; idx++) {
                                        const col = datosExcel[0][idx];
                                        
                                        if (col && col.toString().toLowerCase().includes('medida')) {
                                            headers.push(
                                                <th key={idx + '-largo'}>Largo</th>,
                                                <th key={idx + '-ancho'}>Ancho</th>,
                                                <th key={idx + '-alto'}>Alto</th>
                                            );
                                            idx += 2; // Saltar las siguientes 2 columnas porque las acabamos de procesar
                                            continue;
                                        }
                                        
                                        headers.push(
                                            <th key={idx}>
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
                                                    <td key={cidx + '-largo'}>{row[cidx] || ''}</td>,
                                                    <td key={cidx + '-ancho'}>{row[cidx + 1] || ''}</td>,
                                                    <td key={cidx + '-alto'}>{row[cidx + 2] || ''}</td>
                                                );
                                                cidx += 2; // Saltar las siguientes 2 columnas porque las acabamos de procesar
                                                continue;
                                            }
                                            
                                            // Si es la columna PHTO, mostrar imagen
                                            if (header && header.toString().toLowerCase() === 'phto') {
                                                const imagenUrl = obtenerUrlImagen(cellValue);
                                                
                                                cells.push(
                                                    <td key={cidx}>
                                                        {imagenUrl ? (
                                                            <img
                                                                src={imagenUrl}
                                                                alt="Imagen del producto"
                                                                width="50"
                                                                height="50"
                                                                onError={(e) => {
                                                                    console.log(`Error cargando imagen: ${imagenUrl}`);
                                                                    e.target.style.display = 'none';
                                                                    e.target.parentNode.innerHTML = '<span>Error de imagen</span>';
                                                                }}
                                                                onLoad={() => {
                                                                    console.log(`Imagen cargada exitosamente: ${imagenUrl}`);
                                                                }}
                                                            />
                                                        ) : (
                                                            <span>Sin imagen</span>
                                                        )}
                                                    </td>
                                                );
                                                continue;
                                            }
                                            
                                            // Para cualquier otra columna, mostrar el contenido normal
                                            cells.push(
                                                <td key={cidx}>
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
            )}
        </>
    );
};

export default TablasDatos;
