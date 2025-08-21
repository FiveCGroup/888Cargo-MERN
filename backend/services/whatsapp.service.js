// services/whatsapp.service.js
// Servicio para integración con WhatsApp Business API
import axios from 'axios';

export class WhatsAppService {
    
    static WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || 'TU_TOKEN_DE_ACCESO';
    static PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID || 'TU_PHONE_NUMBER_ID';
    static API_BASE_URL = 'https://graph.facebook.com/v19.0';

    /**
     * Enviar mensaje de texto por WhatsApp
     * @param {string} phoneNumber - Número de teléfono destino
     * @param {string} message - Mensaje a enviar
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async sendTextMessage(phoneNumber, message) {
        try {
            const response = await axios.post(
                `${this.API_BASE_URL}/${this.PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: phoneNumber,
                    type: "text",
                    text: { body: message }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Mensaje WhatsApp enviado exitosamente:', phoneNumber);
            return response.data;

        } catch (error) {
            console.error('❌ Error al enviar mensaje WhatsApp:', error.response?.data || error.message);
            throw new Error('Error al enviar mensaje por WhatsApp');
        }
    }

    /**
     * Enviar mensaje con template por WhatsApp
     * @param {string} phoneNumber - Número de teléfono destino
     * @param {string} templateName - Nombre del template
     * @param {Array} parameters - Parámetros del template
     * @returns {Promise<Object>} - Respuesta de la API
     */
    static async sendTemplateMessage(phoneNumber, templateName, parameters = []) {
        try {
            const response = await axios.post(
                `${this.API_BASE_URL}/${this.PHONE_NUMBER_ID}/messages`,
                {
                    messaging_product: "whatsapp",
                    to: phoneNumber,
                    type: "template",
                    template: {
                        name: templateName,
                        language: { code: "es" },
                        components: [
                            {
                                type: "body",
                                parameters: parameters.map(param => ({
                                    type: "text",
                                    text: param
                                }))
                            }
                        ]
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.WHATSAPP_TOKEN}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log('✅ Template WhatsApp enviado exitosamente:', phoneNumber);
            return response.data;

        } catch (error) {
            console.error('❌ Error al enviar template WhatsApp:', error.response?.data || error.message);
            throw new Error('Error al enviar template por WhatsApp');
        }
    }

    /**
     * Verificar configuración de WhatsApp
     * @returns {boolean} - True si está configurado
     */
    static isConfigured() {
        return this.WHATSAPP_TOKEN !== 'TU_TOKEN_DE_ACCESO' && 
               this.PHONE_NUMBER_ID !== 'TU_PHONE_NUMBER_ID';
    }

    /**
     * Obtener estado de configuración
     * @returns {Object} - Estado de la configuración
     */
    static getConfigurationStatus() {
        return {
            configured: this.isConfigured(),
            hasToken: this.WHATSAPP_TOKEN !== 'TU_TOKEN_DE_ACCESO',
            hasPhoneId: this.PHONE_NUMBER_ID !== 'TU_PHONE_NUMBER_ID'
        };
    }
}
