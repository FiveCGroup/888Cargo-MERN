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
            console.error('Error al procesar Excel:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al procesar el archivo Excel'
            };
        }
    }

    /**
     * Descargar formato de Excel
     * @returns {Promise} - Respuesta de la API
     */
    async descargarFormato() {
        try {
            // Descargar directamente desde public/downloads
            const link = document.createElement('a');
            link.href = '/downloads/FORMATO_PACKING_LIST.xlsx';
            link.download = 'FORMATO_PACKING_LIST.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            return { success: true };
        } catch (error) {
            console.error('Error al descargar formato:', error);
            return {
                success: false,
                error: 'Error al descargar el formato'
            };
        }
    }

    /**
     * Guardar carga en la base de datos
     * @param {Object} datosCarga - Datos de la carga
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
                error: error.response?.data?.error || 'Error al guardar la carga'
            };
        }
    }

    /**
     * Obtener historial de cargas
     * @returns {Promise} - Respuesta de la API
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
                error: 'Error al obtener el historial'
            };
        }
    }

    /**
     * Guardar packing list
     * @param {Object} datosCompletos - Datos completos del packing list
     * @returns {Promise} - Respuesta de la API
     */
    async guardarPackingList(datosCompletos) {
        try {
            const response = await API.post('/api/carga/guardar-packing-list', datosCompletos);
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al guardar packing list:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al guardar el packing list'
            };
        }
    }

    /**
     * Guardar packing list con archivo
     * @param {File} archivo - Archivo Excel
     * @param {Object} datosAdicionales - Datos adicionales
     * @returns {Promise} - Respuesta de la API
     */
    async guardarPackingListConArchivo(archivo, datosAdicionales) {
        try {
            const formData = new FormData();
            formData.append('archivo', archivo);
            formData.append('datosAdicionales', JSON.stringify(datosAdicionales));

            const response = await API.post('/api/carga/guardar-packing-list-con-archivo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al guardar packing list con archivo:', error);
            return {
                success: false,
                error: error.response?.data?.error || 'Error al guardar el packing list'
            };
        }
    }

    /**
     * Obtener packing list por ID
     * @param {number} idCarga - ID de la carga
     * @returns {Promise} - Respuesta de la API
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
                error: 'Error al obtener el packing list'
            };
        }
    }

    /**
     * Obtener cargas por cliente
     * @param {number} idCliente - ID del cliente
     * @returns {Promise} - Respuesta de la API
     */
    async obtenerCargasPorCliente(idCliente) {
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
                error: 'Error al obtener las cargas del cliente'
            };
        }
    }

    /**
     * Buscar packing list por código
     * @param {string} codigoCarga - Código de la carga
     * @returns {Promise} - Respuesta de la API
     */
    async buscarPackingList(codigoCarga) {
        try {
            const response = await API.get(`/api/carga/buscar/${encodeURIComponent(codigoCarga)}`);
            
            if (response.data && response.data.length > 0) {
                return {
                    success: true,
                    data: response.data,
                    mensaje: `Se encontraron ${response.data.length} packing lists`
                };
            } else {
                return {
                    success: false,
                    data: [],
                    mensaje: 'No se encontraron packing lists con ese código'
                };
            }
        } catch (error) {
            console.error('Error al buscar packing list:', error);
            
            if (error.response?.status === 404) {
                return {
                    success: false,
                    data: [],
                    mensaje: 'No se encontraron packing lists con ese código'
                };
            }
            
            return {
                success: false,
                data: [],
                error: 'Error al buscar el packing list'
            };
        }
    }

    /**
     * Obtener todas las cargas
     * @returns {Promise} - Respuesta de la API
     */
    async obtenerTodasLasCargas() {
        try {
            const response = await API.get('/api/carga/todas');
            return {
                success: true,
                data: response.data
            };
        } catch (error) {
            console.error('Error al obtener todas las cargas:', error);
            return {
                success: false,
                error: 'Error al obtener las cargas'
            };
        }
    }

    /**
     * Guardar packing list con generación automática de QRs
     * @param {Object} datosCompletos - Datos completos del packing list
     * @returns {Promise} - Respuesta de la API con QRs generados
     */
    async guardarPackingListConQR(datosCompletos) {
        try {
            console.log('🔄 Enviando datos para guardado con QR...', datosCompletos);
            const response = await API.post('/api/carga/guardar-con-qr', datosCompletos);
            console.log('✅ Respuesta del backend recibida:', response);
            console.log('📦 Datos de respuesta:', response.data);
            return response.data; // El backend ya devuelve el formato correcto
        } catch (error) {
            console.error('❌ Error al guardar packing list con QR:', error);
            console.error('📄 Respuesta de error:', error.response?.data);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list con QR'
            };
        }
    }

    /**
     * Descargar PDF con todos los QRs de una carga
     * @param {number} idCarga - ID de la carga
     * @returns {Promise} - Resultado de la descarga
     */
    async descargarPDFQRs(idCarga) {
        try {
            console.log(`📄 Descargando PDF para carga ${idCarga}...`);
            
            const response = await API.get(`/api/qr/pdf-carga/${idCarga}`, {
                responseType: 'blob' // Importante para manejar archivos binarios
            });
            
            // Crear URL de descarga
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            
            // Crear link de descarga
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR-Codes-Carga-${idCarga}-${Date.now()}.pdf`;
            
            // Trigger descarga
            document.body.appendChild(link);
            link.click();
            
            // Limpiar
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            console.log('✅ PDF descargado exitosamente');
            return { success: true, message: 'PDF descargado exitosamente' };
            
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            return { 
                success: false, 
                error: error.response?.data?.message || 'Error al descargar PDF de QRs' 
            };
        }
    }
}

export default new CargaService();
