import express from "express";
import QRCode from "qrcode";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";
import { getCajasByArticulo } from "../models/caja.model.js";
import {
    createQRForCaja,
    getQRsByCaja,
    updateQRImage,
} from "../models/qr.model.js";
import { get, query } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Endpoint de prueba para verificar que las rutas QR funcionan
router.get("/test", (req, res) => {
    res.json({
        message: "Rutas QR funcionando correctamente",
        timestamp: new Date().toISOString(),
    });
});

// Directorio para almacenar imágenes QR
const QR_IMAGES_DIR = path.join(__dirname, "../../uploads/qr-codes");

// Asegurar que el directorio existe
async function ensureQRDirectory() {
    try {
        await fs.access(QR_IMAGES_DIR);
    } catch {
        await fs.mkdir(QR_IMAGES_DIR, { recursive: true });
        console.log("📁 Directorio QR creado:", QR_IMAGES_DIR);
    }
}

// Generar QR para un artículo completo
router.post("/generar-qrs-articulo/:id_articulo", async (req, res) => {
    try {
        const { id_articulo } = req.params;

        console.log(`🎯 Generando QRs para artículo ${id_articulo}...`);

        // Obtener información del artículo
        const articulo = await get(
            "SELECT * FROM articulo_packing_list WHERE id_articulo = ?",
            [id_articulo]
        );

        if (!articulo) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        // Obtener las cajas del artículo
        const cajas = await getCajasByArticulo(id_articulo);

        if (!cajas || cajas.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron cajas para este artículo" });
        }

        await ensureQRDirectory();

        const qrsGenerados = [];

        for (const caja of cajas) {
            try {
                // Crear o obtener QR para la caja
                let qrData = await createQRForCaja(caja.id_caja);

                // Datos para mostrar en el QR
                const qrInfo = {
                    codigo: qrData.codigo_qr,
                    caja: `${caja.numero_caja} de ${caja.total_cajas}`,
                    articulo: articulo.ref_art || "Sin referencia",
                    descripcion: articulo.descripcion_espanol || "Sin descripción",
                };

                // Texto para el QR (JSON con la información)
                const qrText = JSON.stringify(qrInfo);

                // Nombre del archivo de imagen
                const fileName = `qr-${qrData.codigo_qr}.png`;
                const imagePath = path.join(QR_IMAGES_DIR, fileName);

                // Generar imagen QR
                await QRCode.toFile(imagePath, qrText, {
                    width: 300,
                    margin: 2,
                    color: {
                        dark: "#000000",
                        light: "#FFFFFF",
                    },
                });

                // Actualizar la base de datos con la ruta de la imagen
                await updateQRImage(qrData.id_qr, `/uploads/qr-codes/${fileName}`);

                qrsGenerados.push({
                    id_caja: caja.id_caja,
                    numero_caja: caja.numero_caja,
                    total_cajas: caja.total_cajas,
                    codigo_qr: qrData.codigo_qr,
                    imagen_url: `/uploads/qr-codes/${fileName}`,
                    qr_info: qrInfo,
                });

                console.log(
                    `✅ QR generado para caja ${caja.numero_caja}/${caja.total_cajas}: ${qrData.codigo_qr}`
                );
            } catch (error) {
                console.error(
                    `❌ Error al generar QR para caja ${caja.id_caja}:`,
                    error
                );
            }
        }

        res.json({
            success: true,
            message: `${qrsGenerados.length} códigos QR generados exitosamente`,
            articulo: {
                id_articulo: articulo.id_articulo,
                ref_art: articulo.ref_art,
                descripcion: articulo.descripcion_espanol,
            },
            qrs: qrsGenerados,
        });
    } catch (error) {
        console.error("❌ Error al generar QRs:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
});

// Obtener QRs de un artículo
router.get("/qrs-articulo/:id_articulo", async (req, res) => {
    try {
        const { id_articulo } = req.params;

        // Obtener cajas y sus QRs
        const cajas = await getCajasByArticulo(id_articulo);

        if (!cajas || cajas.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron cajas para este artículo" });
        }

        const qrsInfo = [];

        for (const caja of cajas) {
            const qrs = await getQRsByCaja(caja.id_caja);
            if (qrs.length > 0) {
                const qr = qrs[0]; // Tomar el primer QR de la caja
                qrsInfo.push({
                    id_caja: caja.id_caja,
                    numero_caja: caja.numero_caja,
                    total_cajas: caja.total_cajas,
                    codigo_qr: qr.codigo_qr,
                    imagen_url: qr.url_imagen,
                    fecha_generacion: qr.fecha_generacion,
                    estado: qr.estado,
                });
            }
        }

        res.json({
            success: true,
            articulo_id: id_articulo,
            total_qrs: qrsInfo.length,
            qrs: qrsInfo,
        });
    } catch (error) {
        console.error("❌ Error al obtener QRs:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
});

// Generar PDF con todos los QRs de un artículo
router.get("/pdf-qrs-articulo/:id_articulo", async (req, res) => {
    try {
        const { id_articulo } = req.params;

        // Obtener información del artículo
        const articulo = await get(
            "SELECT * FROM articulo_packing_list WHERE id_articulo = ?",
            [id_articulo]
        );

        if (!articulo) {
            return res.status(404).json({ error: "Artículo no encontrado" });
        }

        // Obtener QRs del artículo
        const cajas = await getCajasByArticulo(id_articulo);

        if (!cajas || cajas.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron cajas para este artículo" });
        }

        // HTML para el PDF
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Códigos QR - ${articulo.ref_art || "Artículo"}</title>
            <style>
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
                @media print {
                    .qr-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
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

                // Convertir la imagen a base64 para incluir en el HTML
                const imagePath = path.join(__dirname, "../../", qr.url_imagen);
                try {
                    const imageBuffer = await fs.readFile(imagePath);
                    const base64Image = imageBuffer.toString("base64");

                    htmlContent += `
                    <div class="qr-item">
                        <div class="caja-info">Caja ${caja.numero_caja} de ${caja.total_cajas}</div>
                        <img src="data:image/png;base64,${base64Image}" class="qr-image" alt="QR Code" />
                        <div class="qr-info">
                            <div class="codigo-qr">${qr.codigo_qr}</div>
                        </div>
                    </div>
                    `;
                } catch (imageError) {
                    console.error(`❌ Error al leer imagen QR: ${imagePath}`, imageError);
                    htmlContent += `
                    <div class="qr-item">
                        <div class="caja-info">Caja ${caja.numero_caja} de ${caja.total_cajas}</div>
                        <div style="color: red;">Imagen QR no disponible</div>
                        <div class="qr-info">
                            <div class="codigo-qr">${qr.codigo_qr}</div>
                        </div>
                    </div>
                    `;
                }
            }
        }

        htmlContent += `
            </div>
        </body>
        </html>
        `;

        // Enviar HTML para que el cliente lo convierta a PDF
        res.setHeader("Content-Type", "text/html");
        res.send(htmlContent);
    } catch (error) {
        console.error("❌ Error al generar PDF:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
});

// Generar PDF con todos los QRs de una carga (4 QRs por página)
router.get("/pdf-carga/:id_carga", async (req, res) => {
    try {
        const { id_carga } = req.params;

        console.log(`📄 Generando PDF para carga ID: ${id_carga}`);

        // Obtener información de la carga
        const carga = await get(
            `SELECT c.*, cl.nombre_cliente, cl.correo_cliente 
             FROM carga c 
             LEFT JOIN cliente cl ON c.id_cliente = cl.id_cliente 
             WHERE c.id_carga = ?`,
            [id_carga]
        );

        console.log(
            `📄 Resultado de consulta de carga:`,
            carga ? "Encontrada" : "No encontrada"
        );

        if (!carga) {
            console.log(`❌ Carga ${id_carga} no encontrada`);
            return res.status(404).json({ error: "Carga no encontrada" });
        }

        // Obtener todos los artículos de la carga
        let articulos;
        try {
            console.log("📄 Consultando artículos para carga:", id_carga);
            articulos = await query(
                "SELECT * FROM articulo_packing_list WHERE id_carga = ?",
                [id_carga]
            );
            console.log("📄 Consulta de artículos exitosa");
        } catch (error) {
            console.error("❌ Error en consulta de artículos:", error);
            return res.status(500).json({ error: "Error al consultar artículos" });
        }

        console.log("📄 Resultado de consulta de artículos:", articulos);
        console.log("📄 Tipo de resultado:", typeof articulos);
        console.log("📄 Es array:", Array.isArray(articulos));
        console.log("📄 Length:", articulos ? articulos.length : 'No tiene length');

        // Asegurar que articulos es un array
        let articulosArray = Array.isArray(articulos) ? articulos : [];
        
        if (!Array.isArray(articulos)) {
            console.log("❌ El resultado de artículos no es un array, convirtiendo...");
            articulosArray = articulos ? [articulos] : [];
            console.log("📄 Array convertido:", articulosArray);
            console.log("📄 Es array ahora:", Array.isArray(articulosArray));
        }

        if (!articulosArray || articulosArray.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron artículos para esta carga" });
        }

        console.log("📄 Procesando", articulosArray.length, "artículos");

        // Recopilar todos los QRs de la carga
        const todosLosQRs = [];

        console.log("📄 DEBUG: Iniciando procesamiento de artículos");
        console.log("📄 DEBUG: articulosArray:", articulosArray);
        console.log("📄 DEBUG: Es array?", Array.isArray(articulosArray));
        console.log("📄 DEBUG: Longitud:", articulosArray.length);

        for (const articulo of articulosArray) {
            console.log(`📄 DEBUG: Procesando artículo ${articulo.id_articulo} - ${articulo.ref_art}`);
            const cajas = await getCajasByArticulo(articulo.id_articulo);
            console.log(`📄 DEBUG: Encontradas ${cajas.length} cajas para artículo ${articulo.id_articulo}`);

            for (const caja of cajas) {
                console.log(`📄 DEBUG: Procesando caja ${caja.id_caja} - ${caja.numero_caja}`);
                const qrs = await getQRsByCaja(caja.id_caja);
                console.log(`📄 DEBUG: Encontrados ${qrs.length} QRs para caja ${caja.id_caja}`);
                if (qrs.length > 0) {
                    const qr = qrs[0];
                    console.log(`📄 DEBUG: QR encontrado: ${qr.codigo_qr} con imagen: ${qr.url_imagen}`);

                    // Verificar que la URL de imagen no sea null
                    if (!qr.url_imagen) {
                        console.log(`⚠️ QR ${qr.codigo_qr} no tiene imagen asociada, saltando...`);
                        continue;
                    }

                    // Verificar que existe la imagen QR
                    const imagePath = path.join(__dirname, "../../", qr.url_imagen);
                    try {
                        await fs.access(imagePath);
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
                        console.log(`✅ QR ${qr.codigo_qr} agregado al PDF`);
                    } catch (imageError) {
                        console.error(`⚠️ Imagen QR no encontrada: ${imagePath}`);
                        // Agregar QR sin imagen
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

        if (todosLosQRs.length === 0) {
            return res
                .status(404)
                .json({ error: "No se encontraron códigos QR para esta carga" });
        }

        console.log(`📊 Generando PDF con ${todosLosQRs.length} QRs...`);

        // Generar HTML con 4 QRs por página
        let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Códigos QR - Carga ${carga.codigo_carga}</title>
            <style>
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
                    height: calc(297mm - 40mm - 100mm); /* Altura total - padding - header */
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
                
                .qr-image {
                    width: 120px;
                    height: 120px;
                    margin: 10px 0;
                    border: 1px solid #ddd;
                    border-radius: 5px;
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
            </style>
        </head>
        <body>
        `;

        // Dividir QRs en grupos de 4 para cada página
        const qrsPerPage = 4;
        const totalPages = Math.ceil(todosLosQRs.length / qrsPerPage);

        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            const startIndex = pageIndex * qrsPerPage;
            const endIndex = Math.min(startIndex + qrsPerPage, todosLosQRs.length);
            const qrsEnPagina = todosLosQRs.slice(startIndex, endIndex);

            htmlContent += `
            <div class="page">
                <div class="header">
                    <h1>Códigos QR - Packing List</h1>
                    <h2>Carga: ${carga.codigo_carga}</h2>
                    <div class="info">
                        <div>Cliente: ${carga.nombre_cliente || "Sin información"
                }</div>
                        <div>Destino: ${carga.direccion_destino || "Sin información"
                }</div>
                        <div>Página ${pageIndex + 1} de ${totalPages} - QRs ${startIndex + 1
                }-${endIndex} de ${todosLosQRs.length}</div>
                        <div>Generado: ${new Date().toLocaleString(
                    "es-ES"
                )}</div>
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
                        <div class="caja-title">Caja ${qr.numero_caja} de ${qr.total_cajas
                        }</div>
                        <div class="articulo-info">
                            <div><strong>${qr.ref_art || "Sin referencia"
                        }</strong></div>
                            <div>${qr.descripcion || "Sin descripción"}</div>
                        </div>
                        ${qr.base64Image
                            ? `<img src="data:image/png;base64,${qr.base64Image}" class="qr-image" alt="QR Code" />`
                            : `<div class="qr-image" style="display: flex; align-items: center; justify-content: center; background: #ecf0f1; color: #7f8c8d;">QR no disponible</div>`
                        }
                        <div class="qr-info">
                            <div class="codigo-qr">${qr.codigo_qr}</div>
                        </div>
                    </div>
                    `;
                } else {
                    // Celda vacía para mantener la estructura de grid
                    htmlContent += `<div class="qr-item" style="border: none; background: transparent;"></div>`;
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

        // Generar PDF usando Puppeteer
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

        // Configurar headers para descarga
        const fileName = `QR-Codes-${carga.codigo_carga}-${Date.now()}.pdf`;

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        res.setHeader("Content-Length", pdfBuffer.length);

        // Enviar PDF
        res.send(pdfBuffer);
    } catch (error) {
        console.error("❌ Error al generar PDF de carga:", error);
        res.status(500).json({
            error: "Error interno del servidor",
            details: error.message,
        });
    }
});

export default router;
