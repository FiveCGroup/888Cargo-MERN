// services/pdf.service.js
// Servicio para generación de PDFs
import puppeteer from "puppeteer";
import path from "path";
import fs from "fs/promises";
import { getCajasByArticulo } from "../models/caja.model.js";
import { getQRsByCaja } from "../models/qr.model.js";

export class PDFService {
    
    /**
     * Generar PDF para un artículo
     * @param {Object} articulo - Datos del artículo
     * @param {Array} cajas - Cajas del artículo
     * @returns {Promise<string>} - HTML del PDF
     */
    static async generarPDFArticulo(articulo, cajas) {
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Códigos QR - ${articulo.ref_art || "Artículo"}</title>
            <style>
                ${this.getBasicStyles()}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Códigos QR</h1>
                <h2>Artículo: ${articulo.ref_art || "Sin referencia"}</h2>
                <p>${articulo.descripcion_espanol || "Sin descripción"}</p>
                <p>Total de cajas: ${cajas[0]?.total_cajas || cajas.length}</p>
            </div>
            <div class="qr-grid">
        `;

        for (const caja of cajas) {
            const qrs = await getQRsByCaja(caja.id_caja);
            if (qrs.length > 0) {
                const qr = qrs[0];
                const imageData = await this.getImageBase64(qr.url_imagen);
                
                htmlContent += `
                <div class="qr-item">
                    <div class="caja-info">Caja ${caja.numero_caja} de ${caja.total_cajas}</div>
                    ${imageData ? 
                        `<img src="data:image/png;base64,${imageData}" class="qr-image" alt="QR Code" />` :
                        `<div class="qr-image no-image">Imagen QR no disponible</div>`
                    }
                    <div class="qr-info">
                        <div class="codigo-qr">${qr.codigo_qr}</div>
                    </div>
                </div>
                `;
            }
        }

        htmlContent += `
            </div>
        </body>
        </html>
        `;

        return htmlContent;
    }

    /**
     * Generar PDF para una carga completa
     * @param {Object} carga - Datos de la carga
     * @param {Array} articulos - Artículos de la carga
     * @param {string} qrImagesDir - Directorio de imágenes QR
     * @returns {Promise<Buffer>} - Buffer del PDF
     */
    static async generarPDFCarga(carga, articulos, qrImagesDir) {
        // Recopilar todos los QRs de la carga
        const todosLosQRs = [];

        for (const articulo of articulos) {
            const cajas = await getCajasByArticulo(articulo.id_articulo);
            
            for (const caja of cajas) {
                const qrs = await getQRsByCaja(caja.id_caja);
                if (qrs.length > 0) {
                    const qr = qrs[0];
                    
                    if (qr.url_imagen) {
                        try {
                            const imagePath = path.join(qrImagesDir, "..", qr.url_imagen);
                            const imageBuffer = await fs.readFile(imagePath);
                            const base64Image = imageBuffer.toString("base64");

                            todosLosQRs.push({
                                codigo_qr: qr.codigo_qr,
                                numero_caja: caja.numero_caja,
                                total_cajas: caja.total_cajas,
                                ref_art: articulo.ref_art,
                                descripcion: articulo.descripcion_espanol,
                                base64Image: base64Image,
                            });
                        } catch (imageError) {
                            console.error(`⚠️ Imagen QR no encontrada: ${qr.url_imagen}`);
                            todosLosQRs.push({
                                codigo_qr: qr.codigo_qr,
                                numero_caja: caja.numero_caja,
                                total_cajas: caja.total_cajas,
                                ref_art: articulo.ref_art,
                                descripcion: articulo.descripcion_espanol,
                                base64Image: null,
                            });
                        }
                    }
                }
            }
        }

        if (todosLosQRs.length === 0) {
            throw new Error("No se encontraron códigos QR para esta carga");
        }

        // Generar HTML
        const htmlContent = this.generarHTMLCarga(carga, todosLosQRs);

        // Generar PDF con Puppeteer
        return await this.htmlToPDF(htmlContent);
    }

    /**
     * Generar HTML para PDF de carga
     * @param {Object} carga - Datos de la carga
     * @param {Array} qrs - QRs a incluir
     * @returns {string} - HTML completo
     */
    static generarHTMLCarga(carga, qrs) {
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Códigos QR - Carga ${carga.codigo_carga}</title>
            <style>
                ${this.getAdvancedStyles()}
            </style>
        </head>
        <body>
        `;

        // Dividir QRs en grupos de 4 para cada página
        const qrsPerPage = 4;
        const totalPages = Math.ceil(qrs.length / qrsPerPage);

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const startIndex = pageIndex * qrsPerPage;
            const endIndex = Math.min(startIndex + qrsPerPage, qrs.length);
            const qrsEnPagina = qrs.slice(startIndex, endIndex);

            htmlContent += `
            <div class="page">
                <div class="header">
                    <h1>Códigos QR - Packing List</h1>
                    <h2>Carga: ${carga.codigo_carga}</h2>
                    <div class="info">
                        <div>Cliente: ${carga.nombre_cliente || "Sin información"}</div>
                        <div>Destino: ${carga.direccion_destino || "Sin información"}</div>
                        <div>Página ${pageIndex + 1} de ${totalPages} - QRs ${startIndex + 1}-${endIndex} de ${qrs.length}</div>
                        <div>Generado: ${new Date().toLocaleString("es-ES")}</div>
                    </div>
                </div>
                
                <div class="qr-grid">
            `;

            // Agregar QRs a la página actual
            for (let i = 0; i < qrsPerPage; i++) {
                if (i < qrsEnPagina.length) {
                    const qr = qrsEnPagina[i];
                    htmlContent += `
                    <div class="qr-item">
                        <div class="caja-title">Caja ${qr.numero_caja} de ${qr.total_cajas}</div>
                        <div class="articulo-info">
                            <div><strong>${qr.ref_art || "Sin referencia"}</strong></div>
                            <div>${qr.descripcion || "Sin descripción"}</div>
                        </div>
                        ${qr.base64Image
                            ? `<img src="data:image/png;base64,${qr.base64Image}" class="qr-image" alt="QR Code" />`
                            : `<div class="qr-image no-image">QR no disponible</div>`
                        }
                        <div class="qr-info">
                            <div class="codigo-qr">${qr.codigo_qr}</div>
                        </div>
                    </div>
                    `;
                } else {
                    // Celda vacía para mantener la estructura de grid
                    htmlContent += `<div class="qr-item empty"></div>`;
                }
            }

            htmlContent += `
                </div>
                
                <div class="footer">
                    888 Cargo - Sistema de Gestión de Packing Lists
                </div>
            </div>
            `;
        }

        htmlContent += `
        </body>
        </html>
        `;

        return htmlContent;
    }

    /**
     * Convertir HTML a PDF usando Puppeteer
     * @param {string} htmlContent - HTML a convertir
     * @returns {Promise<Buffer>} - Buffer del PDF
     */
    static async htmlToPDF(htmlContent) {
        console.log("🖨️ Generando PDF con Puppeteer...");

        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent);

        const pdfBuffer = await page.pdf({
            format: "A4",
            printBackground: true,
            margin: {
                top: "10mm",
                right: "10mm",
                bottom: "10mm",
                left: "10mm",
            },
        });

        await browser.close();

        console.log(`✅ PDF generado exitosamente (${pdfBuffer.length} bytes)`);
        return pdfBuffer;
    }

    /**
     * Obtener imagen en base64
     * @param {string} imagePath - Ruta de la imagen
     * @returns {Promise<string|null>} - Imagen en base64 o null
     */
    static async getImageBase64(imagePath) {
        try {
            const fullPath = path.join(process.cwd(), imagePath);
            const imageBuffer = await fs.readFile(fullPath);
            return imageBuffer.toString("base64");
        } catch (error) {
            console.error(`❌ Error al leer imagen: ${imagePath}`, error);
            return null;
        }
    }

    /**
     * Estilos básicos para PDFs simples
     * @returns {string} - CSS
     */
    static getBasicStyles() {
        return `
            body { 
                font-family: Arial, sans-serif; 
                margin: 20px;
                background: white;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #333;
                padding-bottom: 20px;
            }
            .qr-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
                margin-top: 20px;
            }
            .qr-item {
                border: 2px solid #333;
                padding: 20px;
                text-align: center;
                border-radius: 10px;
                background: #f9f9f9;
            }
            .qr-image {
                max-width: 200px;
                height: auto;
                margin: 10px 0;
            }
            .no-image {
                width: 200px;
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f0f0f0;
                color: #666;
                margin: 10px auto;
            }
            .qr-info {
                font-size: 14px;
                margin-top: 10px;
            }
            .caja-info {
                font-weight: bold;
                font-size: 18px;
                color: #333;
            }
            .codigo-qr {
                font-family: monospace;
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }
        `;
    }

    /**
     * Estilos avanzados para PDFs complejos
     * @returns {string} - CSS
     */
    static getAdvancedStyles() {
        return `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body { 
                font-family: Arial, sans-serif;
                color: #333;
            }
            
            .page {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0 auto;
                background: white;
                page-break-after: always;
            }
            
            .page:last-child {
                page-break-after: auto;
            }
            
            .header {
                text-align: center;
                margin-bottom: 30px;
                padding-bottom: 15px;
                border-bottom: 3px solid #333;
            }
            
            .header h1 {
                font-size: 24px;
                margin-bottom: 10px;
                color: #2c3e50;
            }
            
            .header h2 {
                font-size: 18px;
                margin-bottom: 5px;
                color: #34495e;
            }
            
            .header .info {
                font-size: 14px;
                color: #7f8c8d;
                margin-top: 10px;
            }
            
            .qr-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                grid-template-rows: repeat(2, 1fr);
                gap: 20mm;
                height: calc(297mm - 40mm - 100mm);
            }
            
            .qr-item {
                border: 2px solid #2c3e50;
                border-radius: 10px;
                padding: 15px;
                text-align: center;
                background: #f8f9fa;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }
            
            .qr-item.empty {
                border: none;
                background: transparent;
            }
            
            .qr-image {
                width: 120px;
                height: 120px;
                margin: 10px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            
            .no-image {
                width: 120px;
                height: 120px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #ecf0f1;
                color: #7f8c8d;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 12px;
            }
            
            .qr-info {
                margin-top: 10px;
                text-align: center;
            }
            
            .caja-title {
                font-weight: bold;
                font-size: 16px;
                color: #2c3e50;
                margin-bottom: 5px;
            }
            
            .articulo-info {
                font-size: 12px;
                color: #34495e;
                margin-bottom: 5px;
            }
            
            .codigo-qr {
                font-family: 'Courier New', monospace;
                font-size: 10px;
                color: #7f8c8d;
                background: #ecf0f1;
                padding: 3px 6px;
                border-radius: 3px;
                margin-top: 5px;
            }
            
            .footer {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #bdc3c7;
                text-align: center;
                font-size: 12px;
                color: #7f8c8d;
            }
            
            @media print {
                .page {
                    margin: 0;
                    width: auto;
                    min-height: auto;
                }
            }
        `;
    }
}
