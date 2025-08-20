import API from './api';

class CargaService {
    async procesarExcel(archivo) {
        try {
            const formData = new FormData();
            formData.append('archivo', archivo);
            const response = await API.post('/api/carga/procesar-excel', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error al procesar Excel:', error);
            return { success: false, error: error.response?.data?.error || 'Error al procesar el archivo Excel' };
        }
    }

    async guardarPackingListConQR(datosCompletos) {
        try {
            console.log('🔄 Enviando datos para guardado con QR...', datosCompletos);
            const response = await API.post('/api/carga/guardar-con-qr', datosCompletos);
            console.log('✅ Respuesta del backend recibida:', response);
            return response.data;
        } catch (error) {
            console.error('❌ Error al guardar packing list con QR:', error);
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Error al guardar el packing list con QR'
            };
        }
    }

    async descargarPDFQRs(idCarga) {
        try {
            console.log(`📄 Descargando PDF para carga ${idCarga}...`);
            const response = await API.get(`/api/qr/pdf-carga/${idCarga}`, { responseType: 'blob' });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `QR-Codes-Carga-${idCarga}-${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            console.log('✅ PDF descargado exitosamente');
            return { success: true, message: 'PDF descargado exitosamente' };
        } catch (error) {
            console.error('❌ Error al descargar PDF:', error);
            return { success: false, error: error.response?.data?.message || 'Error al descargar PDF de QRs' };
        }
    }

    async buscarPackingList(codigoCarga) {
        try {
            const response = await API.get(`/api/carga/buscar/${encodeURIComponent(codigoCarga)}`);
            console.log('🔍 Respuesta del backend:', response.data);
            
            if (response.data && response.data.success && response.data.data && response.data.data.length > 0) {
                return { success: true, data: response.data.data, mensaje: response.data.mensaje || `Se encontraron ${response.data.data.length} packing lists` };
            } else {
                return { success: false, data: [], mensaje: response.data.mensaje || 'No se encontraron packing lists con ese código' };
            }
        } catch (error) {
            console.error('Error al buscar packing list:', error);
            if (error.response?.status === 404) {
                return { success: false, data: [], mensaje: 'No se encontraron packing lists con ese código' };
            }
            return { success: false, data: [], error: 'Error al buscar el packing list' };
        }
    }

    async obtenerPackingList(idCarga) {
        try {
            const response = await API.get(`/api/carga/packing-list/${idCarga}`);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error al obtener packing list:', error);
            return { success: false, error: 'Error al obtener el packing list' };
        }
    }

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
}

export default new CargaService();
