// controllers/qr.controller.js
// Controlador para operaciones de códigos QR - Integrado con servicios especializados
import { qrService } from '../services/qr.service.js';
import { auditService } from '../services/audit.service.js';
import { notificationService } from '../services/notification.service.js';

/**
 * Generar QRs para un artículo específico
 */
export const generateQRsForArticle = async (req, res) => {
    try {
        const { articuloId } = req.params;
        const { forceRegenerate = false, notifications = false } = req.body;
        
        // Preparar opciones para el servicio
        const options = {
            forceRegenerate
        };

        // Usar servicio QR directo
        const result = await qrService.generateQRsForArticle(parseInt(articuloId), options);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                data: result.data
            });
        }

        // Registrar en auditoría si hay usuario
        if (req.user?.id) {
            await auditService.logQRGeneration(req.user.id, result.data, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Enviar notificaciones si están habilitadas
        if (notifications && req.user?.email) {
            await notificationService.notifyQRGenerated([req.user.email], result.data);
        }

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error generando QRs para artículo:', error);
        
        // Registrar error en auditoría
        if (req.user?.id) {
            await auditService.logSystemError(error, {
                resource: 'qr_generation',
                articuloId: req.params.articuloId
            }, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Generar QRs en lote para múltiples artículos
 */
export const generateBatchQRs = async (req, res) => {
    try {
        const { articuloIds, forceRegenerate = false, notifications = false } = req.body;

        // Validar entrada
        if (!Array.isArray(articuloIds) || articuloIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere un array de IDs de artículos'
            });
        }

        // Preparar opciones
        const options = {
            forceRegenerate
        };

        // Ejecutar operación en lote
        const result = await qrService.generateBatchQRs(
            articuloIds.map(id => parseInt(id)),
            options
        );

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message,
                data: result.data
            });
        }

        // Registrar operación en lote en auditoría
        if (req.user?.id) {
            await auditService.logBulkOperation(req.user.id, {
                operationType: 'qr_batch_generation',
                total: result.data.summary.total,
                successful: result.data.summary.successful,
                failed: result.data.summary.failed,
                operationId: result.data.operationId
            }, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        // Notificar finalización del lote
        if (notifications && req.user?.email) {
            await notificationService.notifyBulkComplete([req.user.email], result.data.summary);
        }

        res.status(201).json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error generando QRs en lote:', error);
        
        // Registrar error en auditoría
        if (req.user?.id) {
            await auditService.logSystemError(error, {
                resource: 'batch_qr_generation',
                articuloIds: req.body.articuloIds
            }, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtener QRs de un artículo
 */
export const getArticleQRs = async (req, res) => {
    try {
        const { articuloId } = req.params;

        const result = await qrService.getArticleQRs(parseInt(articuloId));

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error obteniendo QRs del artículo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Escanear código QR
 */
export const scanQRCode = async (req, res) => {
    try {
        const { qrContent } = req.body;

        if (!qrContent) {
            return res.status(400).json({
                success: false,
                message: 'Contenido del QR requerido'
            });
        }

        // Procesar escaneo
        const result = await qrService.scanQRCode(qrContent, {
            scanLocation: req.body.location || 'web',
            scanDevice: req.body.device || 'unknown'
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // Registrar escaneo en auditoría
        if (req.user?.id) {
            await auditService.logQRScan(req.user.id, result.data, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }

        res.json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error procesando escaneo QR:', error);
        
        // Registrar error en auditoría
        if (req.user?.id) {
            await auditService.logSystemError(error, {
                resource: 'qr_scan',
                qrContent: req.body.qrContent?.substring(0, 100)
            }, {
                sessionId: req.sessionId || 'web_session',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Obtener estadísticas de QRs
 */
export const getQRStatistics = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            articuloId: req.query.articuloId ? parseInt(req.query.articuloId) : null
        };

        const result = await qrService.getQRStatistics(filters);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        res.json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error obteniendo estadísticas QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Validar contenido de QR
 */
export const validateQRContent = async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({
                success: false,
                message: 'Contenido del QR requerido'
            });
        }

        const validation = await qrService.validateQRContent(content);

        res.json({
            success: true,
            data: validation
        });

    } catch (error) {
        console.error('Error validando contenido QR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Exportar QRs como ZIP
 */
export const exportQRsAsZip = async (req, res) => {
    try {
        const { articuloId } = req.params;

        const result = await qrService.exportQRsAsZip(parseInt(articuloId));

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message
            });
        }

        // En una implementación completa, aquí enviarías el archivo ZIP
        res.json({
            success: true,
            message: result.message,
            data: result.data
        });

    } catch (error) {
        console.error('Error exportando QRs como ZIP:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Dashboard del sistema
 */
export const getSystemDashboard = async (req, res) => {
    try {
        const filters = {
            startDate: req.query.startDate,
            endDate: req.query.endDate
        };

        // Obtener estadísticas de QRs
        const qrStats = await qrService.getQRStatistics(filters);
        
        // Obtener historial de auditoría resumido
        const auditHistory = await auditService.getAuditHistory({
            ...filters,
            limit: 50
        });

        // Validar integridad de auditoría
        const integrityCheck = await auditService.validateAuditIntegrity(filters);

        const dashboard = {
            success: true,
            data: {
                qr: qrStats.success ? qrStats.data : null,
                audit: auditHistory.success ? auditHistory.data : null,
                integrity: integrityCheck.success ? integrityCheck.data : null,
                system: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            },
            message: 'Dashboard del sistema generado exitosamente'
        };

        res.json(dashboard);

    } catch (error) {
        console.error('Error obteniendo dashboard del sistema:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Diagnóstico del sistema
 */
export const runSystemDiagnostics = async (req, res) => {
    try {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            services: {},
            overall: { status: 'healthy', issues: [] }
        };

        // Diagnosticar servicio de QR
        try {
            await qrService.validateQRContent('{"test": true}');
            diagnostics.services.qr = { status: 'healthy', message: 'Servicio QR operativo' };
        } catch (error) {
            diagnostics.services.qr = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio QR no operativo');
        }

        // Diagnosticar servicio de notificaciones
        try {
            notificationService.generateSystemTemplate('test', {});
            diagnostics.services.notification = { status: 'healthy', message: 'Servicio de notificaciones operativo' };
        } catch (error) {
            diagnostics.services.notification = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio de notificaciones no operativo');
        }

        // Diagnosticar servicio de auditoría
        try {
            await auditService.validateAuditFilters({});
            diagnostics.services.audit = { status: 'healthy', message: 'Servicio de auditoría operativo' };
        } catch (error) {
            diagnostics.services.audit = { status: 'error', message: error.message };
            diagnostics.overall.issues.push('Servicio de auditoría no operativo');
        }

        // Determinar estado general
        const hasErrors = Object.values(diagnostics.services).some(service => service.status === 'error');
        diagnostics.overall.status = hasErrors ? 'degraded' : 'healthy';

        res.json({
            success: true,
            data: diagnostics,
            message: `Diagnóstico completado: Sistema ${diagnostics.overall.status}`
        });

    } catch (error) {
        console.error('Error ejecutando diagnósticos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};

/**
 * Generar PDF con QRs de una carga específica
 */
export const generateQRsPDFForCarga = async (req, res) => {
    try {
        const { idCarga } = req.params;
        
        // Usar servicio QR para generar PDF
        const result = await qrService.generatePDFForCarga(parseInt(idCarga));

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: result.message || 'Error al generar PDF'
            });
        }

        // Establecer headers para descarga de PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="QR-Codes-Carga-${idCarga}.pdf"`);
        
        // Enviar el PDF
        res.send(result.data);

    } catch (error) {
        console.error('Error al generar PDF de QRs:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno al generar PDF de QRs'
        });
    }
};
