import React from 'react';

const CreacionNuevaCarga = ({ 
    onDescargarFormato, 
    onSubirArchivo, 
    onGuardarCarga, 
    onGuardarPackingList,
    loading, 
    datosExcel, 
    codigoCarga 
}) => {
    return (
        <div>
            <h3>Crear Nuevo Packing List</h3>
            <div>
                <button onClick={onDescargarFormato} disabled={loading}>
                    {loading ? 'Descargando...' : 'Descargar formato packing list'}
                </button>
                <button onClick={onSubirArchivo} disabled={loading}>
                    {loading ? 'Procesando...' : 'Subir packing list'}
                </button>
                {datosExcel.length > 0 && (
                    <>
                        <button onClick={onGuardarCarga} disabled={loading || !codigoCarga}>
                            {loading ? 'Guardando...' : 'Guardar Carga (Antigua estructura)'}
                        </button>
                        <button onClick={onGuardarPackingList} disabled={loading}>
                            Guardar como Packing List
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default CreacionNuevaCarga;
