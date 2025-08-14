/**
 * Utilidades para el manejo de cargas y packing lists
 */

// Función para generar códigos únicos
export const generarCodigoUnico = () => {
    const fecha = new Date();
    const timestamp = fecha.getTime();
    const random = Math.floor(Math.random() * 1000);
    return `PL-${fecha.getFullYear()}${(fecha.getMonth() + 1).toString().padStart(2, '0')}${fecha.getDate().toString().padStart(2, '0')}-${random}-${timestamp.toString().slice(-4)}`;
};

// Función para formatear moneda
export const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(valor);
};

// Función para formatear fechas
export const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-CO');
};

// Función para obtener URL de imagen
export const obtenerUrlImagen = (cellValue) => {
    if (!cellValue) return null;
    
    if (typeof cellValue === 'string') {
        // URL de string
        return cellValue.startsWith('http') ? cellValue : `http://localhost:4000${cellValue}`;
    }
    
    return null;
};

// Validaciones para el formulario
export const validarFormularioCarga = (infoCliente, infoCarga) => {
    const errores = [];

    if (!infoCliente.nombre_cliente) {
        errores.push('El nombre del cliente es requerido');
    }
    
    if (!infoCarga.codigo_carga) {
        errores.push('El código de carga es requerido');
    }
    
    if (!infoCarga.fecha_inicio) {
        errores.push('La fecha de inicio es requerida');
    }

    return {
        esValido: errores.length === 0,
        errores
    };
};

// Función para preparar datos del formulario
export const prepararDatosFormulario = (datosExcel, archivoSeleccionado) => {
    if (datosExcel.length <= 1) return { cliente: {}, carga: {} };

    const primeraFila = datosExcel[1];
    
    const datosCliente = {
        telefono_cliente: primeraFila[2] || '',
        ciudad_cliente: primeraFila[3] || ''
    };

    const datosCarga = {
        codigo_carga: generarCodigoUnico(),
        fecha_inicio: primeraFila[0] ? new Date(primeraFila[0]).toISOString().split('T')[0] : '',
        ciudad_destino: primeraFila[3] || '',
        archivo_original: archivoSeleccionado?.name || ''
    };

    return {
        cliente: datosCliente,
        carga: datosCarga
    };
};
