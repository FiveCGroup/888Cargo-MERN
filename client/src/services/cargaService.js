import API from './api';

class CargaService {
    /**
     * Procesar archivo Excel
     * @param {File} archivo - Archivo Excel a procesar
     * @returns {Promise} - Respuesta de la API
     */
    async procesarExcel(archivo) {
        try {
            const formData = new FormData();
            formData.append('archivo', archivo);

            const response = await API.post('/api/carga/procesar-excel', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al procesar archivo Excel:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al procesar el archivo'
            };
        }
    }

    /**
     * Descargar formato de packing list
     * @returns {Promise} - Archivo de formato
     */
    async descargarFormato() {
        try {
            const response = await API.get('/api/carga/descargar-formato', {
                responseType: 'blob'
            });

            // Crear enlace de descarga
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'formato-packing-list.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return { success: true };
        } catch (error) {
            console.error('Error al descargar formato:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al descargar el formato'
            };
        }
    }

    /**
     * Guardar datos procesados en la base de datos
     * @param {Object} datosCarga - Datos de la carga procesada
     * @returns {Promise} - Respuesta de la API
     */
    async guardarCarga(datosCarga) {
        try {
            const response = await API.post('/api/carga/guardar', datosCarga);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al guardar carga:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al guardar la carga'
            };
        }
    }

    /**
     * Obtener historial de cargas
     * @returns {Promise} - Lista de cargas anteriores
     */
    async obtenerHistorial() {
        try {
            const response = await API.get('/api/carga/historial');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al obtener historial:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener el historial'
            };
        }
    }

    /**
     * Guardar packing list con nueva estructura de BD
     * @param {Object} datosCompletos - Datos completos del packing list
     * @returns {Promise} - Respuesta de la API
     */
    async guardarPackingList(datosCompletos) {
        try {
            console.log('🔄 Enviando datos al backend...', datosCompletos);
            const response = await API.post('/api/carga/guardar-packing-list', datosCompletos);
            console.log('✅ Respuesta del backend recibida:', response);
            console.log('📦 Datos de respuesta:', response.data);
            return response.data; // El backend ya devuelve el formato correcto
        } catch (error) {
            console.error('❌ Error al guardar packing list:', error);
            console.error('📄 Respuesta de error:', error.response?.data);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list'
            };
        }
    }

    /**
     * Guardar packing list con archivo original (para procesar imágenes)
     * @param {FormData} formData - FormData con archivo y datos adicionales
     * @returns {Promise} - Respuesta de la API
     */
    async guardarPackingListConArchivo(formData) {
        try {
            console.log('🔄 Enviando archivo + datos al backend...');
            const response = await API.post('/api/carga/guardar-packing-list-con-archivo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('✅ Respuesta del backend recibida:', response);
            console.log('📦 Datos de respuesta:', response.data);
            return response.data;
        } catch (error) {
            console.error('❌ Error al guardar packing list con archivo:', error);
            console.error('📄 Respuesta de error:', error.response?.data);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list'
            };
        }
    }

    /**
     * Obtener packing list completo por ID de carga
     * @param {number} idCarga - ID de la carga
     * @returns {Promise} - Packing list completo
     */
    async obtenerPackingList(idCarga) {
        try {
            const response = await API.get(`/api/carga/packing-list/${idCarga}`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al obtener packing list:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener el packing list'
            };
        }
    }

    /**
     * Obtener cargas de un cliente específico
     * @param {number} idCliente - ID del cliente
     * @returns {Promise} - Lista de cargas del cliente
     */
    async obtenerCargasCliente(idCliente) {
        try {
            const response = await API.get(`/api/carga/cliente/${idCliente}/cargas`);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al obtener cargas del cliente:', error);
            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener las cargas del cliente'
            };
        }
    }
}

export default new CargaService();