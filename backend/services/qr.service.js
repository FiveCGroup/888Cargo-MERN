// services/qr.service.js
// Servicio especializado para generación y gestión de códigos QR
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs/promises';
import { BaseService } from './base.service.js';
import { qrRepository, articlesRepository } from '../repositories/index.js';
import { UPLOAD_CONFIG } from '../config.js';

/**
 * Servicio especializado para operaciones de códigos QR
 * Maneja generación, validación y gestión de QRs
 */
export class QRService extends BaseService {
    constructor() {
        super('QRService');
        this.qrOptions = {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            }
        };
    }

    /**
     * Generar QRs para todas las cajas de un artículo
     */
    async generateQRsForArticle(articuloId, options = {}) {
        try {
            this.logger.info(`Iniciando generación de QRs para artículo ${articuloId}`);
            
            // Obtener información del artículo
            const articulo = await articlesRepository.findById(articuloId);
            if (!articulo) {
                throw new Error(`Artículo ${articuloId} no encontrado`);
            }

            // Validar que no existan QRs ya generados
            const existingQRs = await qrRepository.findByArticleId(articuloId);
            if (existingQRs.length > 0 && !options.forceRegenerate) {
                this.logger.warn(`Artículo ${articuloId} ya tiene ${existingQRs.length} QRs generados`);
                return this.createServiceResponse(false, null, 'El artículo ya tiene QRs generados. Use forceRegenerate=true para regenerar.');
            }

            // Eliminar QRs existentes si se fuerza regeneración
            if (options.forceRegenerate && existingQRs.length > 0) {
                await qrRepository.deleteByArticleId(articuloId);
                this.logger.info(`Eliminados ${existingQRs.length} QRs existentes`);
            }

            const operationId = this.generateOperationId();
            
            // Generar QRs en base de datos
            const qrCodes = await this.measureExecutionTime(
                'Generación de QRs en BD',
                () => qrRepository.generateQRsForArticle(
                    articuloId, 
                    articulo.cantidad_cajas, 
                    articulo.codigo_carga
                )
            );

            // Generar imágenes QR
            const qrImages = await this.generateQRImages(qrCodes, options);

            this.logger.success(`Generados ${qrCodes.length} QRs para artículo ${articuloId}`);

            return this.createServiceResponse(true, {
                articulo: {
                    id: articulo.id,
                    codigo_carga: articulo.codigo_carga,
                    numero_fila: articulo.numero_fila,
                    descripcion: articulo.descripcion,
                    cantidad_cajas: articulo.cantidad_cajas
                },
                qrCodes,
                qrImages,
                summary: {
                    totalGenerados: qrCodes.length,
                    imagenesGeneradas: qrImages.length,
                    operationId
                }
            }, `Generados ${qrCodes.length} códigos QR exitosamente`);

        } catch (error) {
            return this.createErrorResponse(error, 'Error generando QRs para artículo');
        }
    }

    /**
     * Generar imágenes QR físicas
     */
    async generateQRImages(qrCodes, options = {}) {
        try {
            this.logger.info(`Generando ${qrCodes.length} imágenes QR`);
            
            const imagesDir = path.join(UPLOAD_CONFIG.UPLOAD_PATH, 'qr-codes');
            await this.ensureDirectoryExists(imagesDir);

            const imagePromises = qrCodes.map(async (qrCode) => {
                const qrContent = JSON.stringify({
                    qr_id: qrCode.id,
                    codigo_unico: qrCode.codigo_unico,
                    numero_caja: qrCode.numero_caja,
                    codigo_carga: qrCode.codigo_carga,
                    timestamp: new Date().toISOString()
                });

                const fileName = `qr_${qrCode.codigo_unico}.png`;
                const filePath = path.join(imagesDir, fileName);

                await QRCode.toFile(filePath, qrContent, {
                    ...this.qrOptions,
                    ...options.qrOptions
                });

                // Actualizar ruta en base de datos
                const imagePath = `/uploads/qr-codes/${fileName}`;
                await qrRepository.updateImagePath(qrCode.id, imagePath);

                return {
                    qr_id: qrCode.id,
                    codigo_unico: qrCode.codigo_unico,
                    numero_caja: qrCode.numero_caja,
                    image_path: imagePath,
                    file_name: fileName
                };
            });

            const results = await Promise.all(imagePromises);
            this.logger.success(`Generadas ${results.length} imágenes QR`);
            
            return results;

        } catch (error) {
            this.logger.error('Error generando imágenes QR:', error);
            throw error;
        }
    }

    /**
     * Validar y procesar escaneo de QR
     */
    async scanQRCode(qrContent, scannerInfo = {}) {
        try {
            this.logger.info('Procesando escaneo de QR');

            // Validar contenido QR
            const qrData = await this.validateQRContent(qrContent);
            if (!qrData.isValid) {
                return this.createServiceResponse(false, null, qrData.error);
            }

            // Registrar escaneo
            const scanResult = await qrRepository.registerScan(
                qrData.qr_id,
                scannerInfo
            );

            // Obtener información completa del QR
            const qrInfo = await qrRepository.findById(qrData.qr_id);
            
            this.logger.success(`QR ${qrData.codigo_unico} escaneado exitosamente`);

            return this.createServiceResponse(true, {
                scan: scanResult,
                qr: qrInfo,
                timestamp: new Date().toISOString()
            }, 'QR escaneado exitosamente');

        } catch (error) {
            return this.createErrorResponse(error, 'Error procesando escaneo QR');
        }
    }

    /**
     * Obtener estadísticas de QRs
     */
    async getQRStatistics(filters = {}) {
        try {
            this.logger.info('Obteniendo estadísticas de QRs');

            const stats = await qrRepository.getStatistics(filters);
            
            return this.createServiceResponse(true, {
                statistics: stats,
                filters,
                generated_at: new Date().toISOString()
            }, 'Estadísticas obtenidas exitosamente');

        } catch (error) {
            return this.createErrorResponse(error, 'Error obteniendo estadísticas QR');
        }
    }

    /**
     * Validar contenido de QR
     */
    async validateQRContent(content) {
        try {
            // Intentar parsear JSON
            const qrData = JSON.parse(content);

            // Validar campos requeridos
            const requiredFields = ['qr_id', 'codigo_unico'];
            for (const field of requiredFields) {
                if (!qrData[field]) {
                    return {
                        isValid: false,
                        error: `Campo requerido faltante: ${field}`
                    };
                }
            }

            // Verificar que el QR existe en la base de datos
            const qrExists = await qrRepository.findById(qrData.qr_id);
            if (!qrExists) {
                return {
                    isValid: false,
                    error: 'QR no encontrado en el sistema'
                };
            }

            // Verificar código único
            if (qrExists.codigo_unico !== qrData.codigo_unico) {
                return {
                    isValid: false,
                    error: 'Código único no coincide'
                };
            }

            return {
                isValid: true,
                qr_id: qrData.qr_id,
                codigo_unico: qrData.codigo_unico,
                data: qrData
            };

        } catch (error) {
            return {
                isValid: false,
                error: 'Contenido QR inválido: ' + error.message
            };
        }
    }

    /**
     * Asegurar que directorio existe
     */
    async ensureDirectoryExists(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
            this.logger.info(`Directorio creado: ${dirPath}`);
        }
    }

    /**
     * Generar QRs en lote para múltiples artículos
     */
    async generateBatchQRs(articuloIds, options = {}) {
        try {
            this.logger.info(`Iniciando generación en lote para ${articuloIds.length} artículos`);

            const operationId = this.generateOperationId();
            const results = [];

            for (const articuloId of articuloIds) {
                try {
                    const result = await this.generateQRsForArticle(articuloId, options);
                    results.push({
                        articuloId,
                        success: result.success,
                        data: result.data,
                        message: result.message
                    });
                } catch (error) {
                    results.push({
                        articuloId,
                        success: false,
                        error: error.message
                    });
                }
            }

            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;

            this.logger.info(`Lote completado: ${successful} exitosos, ${failed} fallos`);

            return this.createServiceResponse(true, {
                operationId,
                results,
                summary: {
                    total: articuloIds.length,
                    successful,
                    failed
                }
            }, `Proceso en lote completado: ${successful}/${articuloIds.length} exitosos`);

        } catch (error) {
            return this.createErrorResponse(error, 'Error en generación de QRs en lote');
        }
    }

    /**
     * Obtener QRs de un artículo específico
     */
    async getArticleQRs(articuloId) {
        try {
            this.logger.info(`Obteniendo QRs para artículo ${articuloId}`);

            const qrCodes = await qrRepository.findByArticleId(articuloId);
            const articulo = await articlesRepository.findById(articuloId);

            if (!articulo) {
                throw new Error(`Artículo ${articuloId} no encontrado`);
            }

            return this.createServiceResponse(true, {
                articulo,
                qrCodes,
                total: qrCodes.length
            }, `Encontrados ${qrCodes.length} QRs para el artículo`);

        } catch (error) {
            return this.createErrorResponse(error, 'Error obteniendo QRs del artículo');
        }
    }

    /**
     * Generar PDF con QRs de una carga específica
     */
    async generatePDFForCarga(idCarga) {
        try {
            this.logger.info(`Generando PDF para carga ${idCarga}`);
            
            // Obtener QRs de la carga
            const qrCodes = await qrRepository.findByCargaId(idCarga);
            
            this.logger.info(`QRs encontrados: ${qrCodes.length}`);
            
            if (!qrCodes || qrCodes.length === 0) {
                this.logger.warn(`No se encontraron QRs para carga ${idCarga}`);
                return this.createServiceResponse(false, null, 'No se encontraron QRs para esta carga');
            }

            this.logger.info(`Iniciando generación de PDF con ${qrCodes.length} QRs`);
            
            // Generar PDF real con PDFKit
            const pdfBuffer = await this.createPDFWithQRs(qrCodes, idCarga);
            
            this.logger.info(`PDF generado exitosamente para carga ${idCarga}`);
            
            return this.createServiceResponse(true, pdfBuffer, `PDF generado exitosamente para ${qrCodes.length} QRs`);
            
        } catch (error) {
            this.logger.error(`Error generando PDF para carga ${idCarga}:`, error);
            return this.createErrorResponse(error, 'Error generando PDF de QRs');
        }
    }

    /**
     * Crear PDF con códigos QR usando PDFKit
     */
    async createPDFWithQRs(qrCodes, idCarga) {
        try {
            this.logger.info(`Iniciando importación de PDFKit`);
            const PDFDocument = (await import('pdfkit')).default;
            this.logger.info(`PDFKit importado exitosamente`);
            
            return new Promise((resolve, reject) => {
                try {
                    this.logger.info(`Creando documento PDF`);
                    const doc = new PDFDocument({ margin: 50 });
                    const chunks = [];

                    // Capturar datos del PDF
                    doc.on('data', chunk => chunks.push(chunk));
                    doc.on('end', () => {
                        this.logger.info(`PDF completado con ${chunks.length} chunks`);
                        resolve(Buffer.concat(chunks));
                    });

                    this.logger.info(`Agregando contenido al PDF`);
                    
                    // Título del documento
                    doc.fontSize(20)
                       .text(`Códigos QR - Carga ${idCarga}`, { align: 'center' })
                       .moveDown();

                    doc.fontSize(12)
                       .text(`Generado el: ${new Date().toLocaleString('es-ES')}`, { align: 'center' })
                       .text(`Total de QRs: ${qrCodes.length}`, { align: 'center' })
                       .moveDown(2);

                    // Configuración de la tabla
                    const tableTop = doc.y;
                    const cellHeight = 30;
                    const colWidths = [60, 120, 80, 80, 150];
                    const colPositions = [50, 110, 230, 310, 390];

                    // Encabezados de la tabla
                    doc.fontSize(10)
                       .font('Helvetica-Bold');

                    const headers = ['ID', 'Código QR', 'Artículo', 'Caja', 'Descripción'];
                    headers.forEach((header, i) => {
                        doc.text(header, colPositions[i], tableTop, { width: colWidths[i], align: 'center' });
                    });

                    // Línea separadora
                    doc.moveTo(50, tableTop + 15)
                       .lineTo(540, tableTop + 15)
                       .stroke();

                    // Datos de la tabla
                    doc.font('Helvetica').fontSize(9);
                    let currentY = tableTop + 20;

                    this.logger.info(`Procesando ${qrCodes.length} QRs para el PDF`);

                    qrCodes.forEach((qr, index) => {
                        // Verificar si necesitamos una nueva página
                        if (currentY > 750) {
                            doc.addPage();
                            currentY = 50;
                            
                            // Re-escribir encabezados en nueva página
                            doc.fontSize(10).font('Helvetica-Bold');
                            headers.forEach((header, i) => {
                                doc.text(header, colPositions[i], currentY, { width: colWidths[i], align: 'center' });
                            });
                            
                            doc.moveTo(50, currentY + 15)
                               .lineTo(540, currentY + 15)
                               .stroke();
                            
                            currentY += 20;
                            doc.font('Helvetica').fontSize(9);
                        }

                        // Datos de la fila
                        const rowData = [
                            qr.id_qr?.toString() || '',
                            qr.codigo_qr?.substring(0, 18) + '...' || '',
                            qr.id_caja?.toString() || '',
                            qr.numero_caja?.toString() || '',
                            (qr.descripcion_espanol || '').substring(0, 20) + '...'
                        ];

                        rowData.forEach((data, i) => {
                            doc.text(data, colPositions[i], currentY, { 
                                width: colWidths[i], 
                                align: i === 0 || i === 2 || i === 3 ? 'center' : 'left',
                                height: cellHeight
                            });
                        });

                        currentY += cellHeight;

                        // Línea separadora cada 5 filas
                        if ((index + 1) % 5 === 0) {
                            doc.moveTo(50, currentY - 5)
                               .lineTo(540, currentY - 5)
                               .stroke();
                        }
                    });

                    // Pie de página
                    doc.fontSize(8)
                       .text('Generado por Sistema 888Cargo', 50, 750, { align: 'center' });

                    this.logger.info(`Finalizando documento PDF`);
                    // Finalizar el documento
                    doc.end();

                } catch (error) {
                    this.logger.error(`Error en creación de PDF:`, error);
                    reject(error);
                }
            });
        } catch (error) {
            this.logger.error(`Error importando PDFKit:`, error);
            throw error;
        }
    }
}

// Instancia singleton del servicio
export const qrService = new QRService();
