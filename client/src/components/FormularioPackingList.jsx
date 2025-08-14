import React from 'react';

const FormularioPackingList = ({ 
    mostrarFormulario,
    infoCliente,
    infoCarga,
    onCambioCliente,
    onCambioCarga,
    onCerrar,
    onGuardar,
    onGenerarCodigo,
    guardandoBD 
}) => {
    if (!mostrarFormulario) return null;

    return (
        <div>
            <div>
                <h2>Información del Packing List</h2>
                
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
                            />
                        </div>
                        <div>
                            <label>Correo Electrónico</label>
                            <input
                                type="email"
                                name="correo_cliente"
                                value={infoCliente.correo_cliente}
                                onChange={onCambioCliente}
                            />
                        </div>
                        <div>
                            <label>Teléfono</label>
                            <input
                                type="text"
                                name="telefono_cliente"
                                value={infoCliente.telefono_cliente}
                                onChange={onCambioCliente}
                            />
                        </div>
                        <div>
                            <label>Ciudad</label>
                            <input
                                type="text"
                                name="ciudad_cliente"
                                value={infoCliente.ciudad_cliente}
                                onChange={onCambioCliente}
                            />
                        </div>
                        <div>
                            <label>País</label>
                            <input
                                type="text"
                                name="pais_cliente"
                                value={infoCliente.pais_cliente}
                                onChange={onCambioCliente}
                            />
                        </div>
                    </div>
                </div>

                {/* Información de la Carga */}
                <div>
                    <h3>Información de la Carga</h3>
                    <div>
                        <div>
                            <label>Código de Carga *</label>
                            <div>
                                <input
                                    type="text"
                                    name="codigo_carga"
                                    value={infoCarga.codigo_carga}
                                    onChange={onCambioCarga}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={onGenerarCodigo}
                                    title="Generar nuevo código único"
                                >
                                    Nuevo
                                </button>
                            </div>
                        </div>
                        <div>
                            <label>Ciudad Destino</label>
                            <input
                                type="text"
                                name="ciudad_destino"
                                value={infoCarga.ciudad_destino}
                                onChange={onCambioCarga}
                            />
                        </div>
                        <div>
                            <label>Fecha de Inicio *</label>
                            <input
                                type="date"
                                name="fecha_inicio"
                                value={infoCarga.fecha_inicio}
                                onChange={onCambioCarga}
                                required
                            />
                        </div>
                        <div>
                            <label>Fecha de Fin</label>
                            <input
                                type="date"
                                name="fecha_fin"
                                value={infoCarga.fecha_fin}
                                onChange={onCambioCarga}
                            />
                        </div>
                    </div>
                </div>

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
