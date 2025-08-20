import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import QRCode from "qrcode";
import { authRequired } from "../middlewares/validateToken.js";
import * as articuloModel from "../models/articulosPL.model.js";
import { PackingListModel } from "../models/packingList.model.js";
import { createCarga } from "../models/carga.model.js";
import { createCajasForArticulo } from "../models/caja.model.js";
import { createQRForCaja, updateQRImage } from "../models/qr.model.js";
import { query, run, get } from "../db.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Crear directorio para imágenes si no existe
const imageDir = path.join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}

// Crear directorio para QRs si no existe
const QR_IMAGES_DIR = path.join(process.cwd(), 'uploads', 'qr-codes');
if (!fs.existsSync(QR_IMAGES_DIR)) {
    fs.mkdirSync(QR_IMAGES_DIR, { recursive: true });
}

// Función para asegurar que existe el directorio de QRs
async function ensureQRDirectory() {
    if (!fs.existsSync(QR_IMAGES_DIR)) {
        fs.mkdirSync(QR_IMAGES_DIR, { recursive: true });
    }
}

// Función para extraer imágenes del Excel
const extraerImagenesExcel = async (buffer) => {
    try {
        console.log("=== INICIANDO EXTRACCIÓN DE IMÁGENES ===");
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        
        const worksheet = workbook.getWorksheet(1);
        const imagenes = {};
        
        console.log(`Número de worksheets: ${workbook.worksheets.length}`);
        console.log(`Worksheet seleccionado: ${worksheet.name}`);
        
        const worksheetImages = worksheet.getImages();
        console.log(`Total de imágenes encontradas en el worksheet: ${worksheetImages.length}`);
        
        // Primero, encontramos la columna PHTO en los encabezados
        let columnaPHTO = -1;
        for (let col = 1; col <= 30; col++) { // Buscar en las primeras 30 columnas
            const celda = worksheet.getCell(5, col); // Fila 5 es donde están los encabezados
            if (celda.value && celda.value.toString().toLowerCase().trim() === 'phto') {
                columnaPHTO = col;
                console.log(`Columna PHTO encontrada en la columna: ${col}`);
                break;
            }
        }
        
        if (columnaPHTO === -1) {
            console.log("⚠️ Columna PHTO no encontrada en los encabezados");
            return {};
        }
        
        // Procesar todas las imágenes en el worksheet
        worksheetImages.forEach((image, index) => {
            console.log(`Procesando imagen ${index + 1}:`, {
                imageId: image.imageId,
                range: image.range
            });
            
            const img = workbook.model.media[image.imageId];
            if (img) {
                // Determinar la posición de la imagen basada en las coordenadas
                const range = image.range;
                const filaImagen = range.tl.row; // top-left row
                const columnaImagen = range.tl.col; // top-left column (0-indexed)
                
                console.log(`Imagen en fila Excel: ${filaImagen}, columna Excel: ${columnaImagen + 1} (0-indexed: ${columnaImagen})`);
                
                // Verificar si la imagen está cerca de la columna PHTO
                // Permitimos un margen de error de ±2 columnas
                const margenColumna = 2;
                const columnaImagenReal = columnaImagen + 1; // Convertir a 1-indexed
                
                if (Math.abs(columnaImagenReal - columnaPHTO) <= margenColumna) {
                    // Calcular la fila relativa (las filas de datos empiezan desde la fila 6 en Excel)
                    const filaRelativa = filaImagen - 5; // Restamos 5 porque los datos empiezan en fila 6 (0-indexed sería 5)
                    
                    console.log(`Fila relativa calculada: ${filaRelativa}`);
                    
                    // Solo procesar imágenes que están en filas de datos válidas
                    if (filaRelativa > 0) {
                        // Generar nombre único para la imagen
                        const extension = img.extension || 'png';
                        const nombreArchivo = `imagen_fila_${filaRelativa}_${Date.now()}_${index}.${extension}`;
                        
                        // En lugar de guardar en archivo, almacenar los datos para la base de datos
                        imagenes[filaRelativa] = {
                            buffer: img.buffer,
                            nombre: nombreArchivo,
                            tipo: `image/${extension}`,
                            extension: extension,
                            url: null // La URL se generará después cuando se conozca el id_articulo
                        };
                        
                        console.log(`✅ Imagen procesada para base de datos:`, {
                            filaExcel: filaImagen,
                            filaRelativa: filaRelativa,
                            columnaImagen: columnaImagenReal,
                            columnaPHTO: columnaPHTO,
                            archivo: nombreArchivo,
                            tamaño: img.buffer.length,
                            extension: extension
                        });
                    } else {
                        console.log(`⚠️ Imagen descartada - fila fuera del rango de datos: ${filaImagen} (relativa: ${filaRelativa})`);
                    }
                } else {
                    console.log(`⚠️ Imagen descartada - no está cerca de la columna PHTO. Imagen en columna ${columnaImagenReal}, PHTO en columna ${columnaPHTO}`);
                }
            } else {
                console.log(`❌ No se pudo obtener la imagen con ID: ${image.imageId}`);
            }
        });
        
        console.log("=== RESUMEN DE EXTRACCIÓN DE IMÁGENES ===");
        console.log(`Total de imágenes procesadas: ${Object.keys(imagenes).length}`);
        console.log("Mapeo de imágenes:", imagenes);
        console.log("=== FIN DE EXTRACCIÓN DE IMÁGENES ===");
        
        return imagenes;
    } catch (error) {
        console.error('❌ Error al extraer imágenes:', error);
        return {};
    }
};

// Función para validar una fila
const validarFila = (fila) => {
    const esFilaVacia = fila.every(
        (celda) =>
            celda === null ||
            celda === undefined ||
            celda === "" ||
            String(celda).trim() === ""
    );

    if (esFilaVacia) {
        return { valida: false, esVacia: true, errores: ["Fila vacía"] };
    }

    const errores = [];

    // Validaciones básicas
    if (!fila[0] || String(fila[0]).trim() === "") {
        errores.push("Fecha faltante");
    }

    if (!fila[1] || String(fila[1]).trim() === "") {
        errores.push("Marca del cliente faltante");
    }

    // Validar columnas numéricas
    const columnasNumericas = [10, 11, 14, 15, 16, 17, 19, 20, 21, 22];
    columnasNumericas.forEach((indice) => {
        const valor = fila[indice];
        if (valor !== undefined && valor !== null && valor !== '' && isNaN(Number(valor))) {
            errores.push(`Valor no numérico en columna ${indice + 1}`);
        }
    });

    return {
        valida: errores.length === 0,
        esVacia: false,
        errores,
    };
};

// Función para procesar las filas
const procesarFilas = (filas, imagenes = {}) => {
    const filasValidas = [];
    const filasConError = []; // <-- Nueva array para filas con errores
    let filasExitosas = 0;
    let filasConErrorCount = 0;
    let filasVacias = 0;
    const totalFilas = filas.length - 1;

    console.log("=== INICIANDO PROCESAMIENTO DE ARCHIVO ===");
    console.log(`Total de filas a procesar: ${totalFilas}`);
    console.log(`Imágenes encontradas: ${Object.keys(imagenes).length}`);

    // Encontrar el índice de la columna PHTO
    const indicePHTO = filas[0].findIndex(col => 
        col && col.toString().toLowerCase().trim() === 'phto'
    );
    console.log(`Índice de columna PHTO encontrado: ${indicePHTO}`);

    for (let i = 1; i < filas.length; i++) {
        const fila = filas[i];
        const validacion = validarFila(fila);

        if (validacion.esVacia) {
            filasVacias++;
            console.log(`Fila ${i + 1}: VACÍA - saltando`);
        } else if (validacion.valida) {
            // Crear copia de la fila
            const filaModificada = [...fila];
            
            // Si encontramos imágenes y existe la columna PHTO, guardar imagen y asignar URL
            if (imagenes[i] && indicePHTO !== -1) {
                try {
                    // Guardar imagen físicamente en el directorio
                    const rutaImagen = path.join(imageDir, imagenes[i].nombre);
                    
                    // Crear directorio si no existe
                    if (!fs.existsSync(imageDir)) {
                        fs.mkdirSync(imageDir, { recursive: true });
                    }
                    
                    // Escribir archivo de imagen
                    fs.writeFileSync(rutaImagen, imagenes[i].buffer);
                    
                    // Crear URL de acceso público
                    const urlImagen = `/uploads/images/${imagenes[i].nombre}`;
                    
                    // Almacenar la URL en lugar del objeto imagen
                    filaModificada[indicePHTO] = urlImagen;
                    
                    console.log(`✅ Imagen guardada y URL asignada a PHTO en fila ${i + 1}:`);
                    console.log(`   Archivo: ${rutaImagen}`);
                    console.log(`   URL: ${urlImagen}`);
                    console.log(`   Tamaño: ${imagenes[i].buffer.length} bytes`);
                } catch (error) {
                    console.error(`❌ Error al guardar imagen para fila ${i + 1}:`, error);
                    filaModificada[indicePHTO] = null;
                }
            } else if (indicePHTO !== -1) {
                console.log(`⚠️ No se encontró imagen para fila ${i + 1}, columna PHTO queda con valor: ${filaModificada[indicePHTO]}`);
            } else {
                console.log(`❌ Columna PHTO no encontrada en encabezados`);
            }
            
            filasValidas.push(filaModificada);
            filasExitosas++;
            console.log(`Fila ${i + 1}: CARGADA EXITOSAMENTE`);
        } else {
            // Guardar fila con errores junto con información adicional
            filasConError.push({
                numeroFila: i + 1,
                datos: fila,
                errores: validacion.errores,
            });
            filasConErrorCount++;
            console.log(`Fila ${i + 1}: ERROR - ${validacion.errores.join(", ")}`);
        }
    }

    console.log("=== RESUMEN DE CARGA ===");
    console.log(`Total de filas: ${totalFilas}`);
    console.log(`Filas cargadas exitosamente: ${filasExitosas}`);
    console.log(`Filas con errores: ${filasConErrorCount}`);
    console.log(`Filas vacías: ${filasVacias}`);
    console.log("=== FIN DE PROCESAMIENTO ===");

    return {
        filasValidas: [filas[0], ...filasValidas], // Usar encabezado original
        filasConError: filasConError, // <-- Incluir filas con errores
        estadisticas: {
            filasExitosas,
            filasConError: filasConErrorCount,
            filasVacias,
            totalFilas,
        },
    };
};

// Ruta para procesar archivo Excel
router.post(
    "/procesar-excel",
    authRequired,
    upload.single("archivo"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "No se ha enviado ningún archivo",
                });
            }

            console.log("Procesando archivo Excel con imágenes...");

            // Primero extraer imágenes con ExcelJS
            const imagenes = await extraerImagenesExcel(req.file.buffer);

            // Luego extraer datos con xlsx
            const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
                range: 4,
            });

            // Procesar las filas incluyendo las imágenes
            const resultado = procesarFilas(jsonData, imagenes);

            res.json({
                success: true,
                data: resultado.filasValidas,
                filasConError: resultado.filasConError, // <-- Incluir filas con errores en la respuesta
                estadisticas: resultado.estadisticas,
            });
        } catch (error) {
            console.error("Error al procesar archivo Excel:", error);
            res.status(500).json({
                success: false,
                message: "Error al procesar el archivo Excel",
            });
        }
    }
);

router.post("/guardar", authRequired, async (req, res) => {
    try {
        const { codigoCarga, datosExcel } = req.body;

        if (!codigoCarga || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "Datos insuficientes para guardar la carga.",
                });
        }

        const encabezado = datosExcel[0];
        const filas = datosExcel.slice(1);

        // Filtrar filas vacías o incompletas
        const filasFiltradas = filas.filter(
            (fila) => Array.isArray(fila) && fila.length >= 25
        );

        if (filasFiltradas.length === 0) {
            return res
                .status(400)
                .json({
                    success: false,
                    message: "No hay filas válidas para guardar.",
                });
        }

        const articulos = filasFiltradas.map((fila) => {
            // Encontrar el índice de la columna PHTO para obtener la URL de la imagen
            const indicePHTO = datosExcel[0].findIndex(col => 
                col && col.toString().toLowerCase().trim() === 'phto'
            );
            
            return {
                fecha: fila[0],
                marca_cliente: fila[1],
                tel_cliente: fila[2],
                ciudad_destino: fila[3],
                cn: fila[4],
                ref_art: fila[5],
                descripcion_espanol: fila[6],
                descripcion_chino: fila[7],
                unidad: fila[8],
                precio_unidad: Number(fila[9]) || 0,
                precio_total: Number(fila[10]) || 0,
                material: fila[11],
                unidades_empaque: Number(fila[12]) || 0,
                marca_producto: fila[13],
                cajas: Number(fila[14]) || 0,
                cant_por_caja: Number(fila[15]) || 0,
                cant_total: Number(fila[16]) || 0,
                medida_caja_largo: Number(fila[17]) || 0,
                medida_caja_ancho: Number(fila[18]) || 0,
                medida_caja_alto: Number(fila[19]) || 0,
                cbm: Number(fila[21]) || 0, // Corregido: era fila[20], ahora fila[21]
                cbmtt: Number(fila[22]) || 0, // Corregido: era fila[21], ahora fila[22]
                gw: Number(fila[23]) || 0, // Corregido: era fila[22], ahora fila[23]
                gwtt: Number(fila[24]) || 0, // Corregido: era fila[23], ahora fila[24]
                serial: fila[25], // Corregido: era fila[24], ahora fila[25]
                imagen_url: indicePHTO !== -1 ? fila[indicePHTO] : null, // Obtener imagen de columna PHTO
                codigoCarga,
            };
        });

        console.log("Artículos a guardar:", articulos);

        // Insertar artículos en PostgreSQL
        for (const articulo of articulos) {
            await articuloModel.createArticulo({
                id_carga: codigoCarga,
                fecha: articulo.fecha,
                cn: articulo.cn,
                ref_art: articulo.ref_art,
                descripcion_espanol: articulo.descripcion_espanol,
                descripcion_chino: articulo.descripcion_chino,
                unidad: articulo.unidad,
                precio_unidad: articulo.precio_unidad,
                precio_total: articulo.precio_total,
                material: articulo.material,
                unidades_empaque: articulo.unidades_empaque,
                marca_producto: articulo.marca_producto,
                serial: articulo.serial
            });
        }

        res.json({ success: true, message: "Artículos guardados en PostgreSQL" });
    } catch (error) {
        console.error("Error al guardar artículos en Mongo:", error);
        res
            .status(500)
            .json({ success: false, message: "Error al guardar en MongoDB" });
    }
});

// Ruta para obtener información sobre imágenes procesadas
router.get("/imagenes/:filename", authRequired, (req, res) => {
    try {
        const filename = req.params.filename;
        const rutaImagen = path.join(imageDir, filename);
        
        if (fs.existsSync(rutaImagen)) {
            res.sendFile(rutaImagen);
        } else {
            res.status(404).json({
                success: false,
                message: "Imagen no encontrada"
            });
        }
    } catch (error) {
        console.error("Error al servir imagen:", error);
        res.status(500).json({
            success: false,
            message: "Error al servir la imagen"
        });
    }
});

// Nueva ruta para guardar con la estructura de Packing List
router.post("/guardar-packing-list", authRequired, async (req, res) => {
    try {
        const { 
            datosExcel, 
            infoCliente, 
            infoCarga 
        } = req.body;

        // Validar datos requeridos
        if (!datosExcel || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Datos de Excel insuficientes"
            });
        }

        if (!infoCliente || !infoCarga) {
            return res.status(400).json({
                success: false,
                message: "Información de cliente y carga requerida"
            });
        }

        console.log("=== INICIANDO GUARDADO EN PACKING LIST ===");
        
        // 1. Crear o buscar cliente
        let clienteId;
        if (infoCliente.correo_cliente) {
            const clienteExistente = await PackingListModel.obtenerClientePorCorreo(infoCliente.correo_cliente);
            if (clienteExistente) {
                clienteId = clienteExistente.id_cliente;
                console.log(`✅ Cliente existente encontrado: ${clienteId}`);
            } else {
                clienteId = await PackingListModel.crearCliente(infoCliente);
                console.log(`✅ Nuevo cliente creado: ${clienteId}`);
            }
        } else {
            clienteId = await PackingListModel.crearCliente(infoCliente);
            console.log(`✅ Cliente creado sin correo: ${clienteId}`);
        }

        // 2. Crear carga
        const cargaData = {
            ...infoCarga,
            id_cliente: clienteId
        };
        
        // Validar código único
        const codigoUnico = await PackingListModel.validarCodigoCargaUnico(cargaData.codigo_carga);
        if (!codigoUnico) {
            return res.status(400).json({
                success: false,
                message: "El código de carga ya existe"
            });
        }
        
        const cargaId = await PackingListModel.crearCarga(cargaData);
        console.log(`✅ Carga creada: ${cargaId}`);

        // 3. Procesar artículos del Excel
        const encabezados = datosExcel[0];
        const filasArticulos = datosExcel.slice(1);
        
        let articulosCreados = 0;
        let errores = [];

        // Mapear columnas del Excel a la estructura de BD
        const mapeoColumnas = {
            fecha: 0,                    // 'Fecha'
            marca_cliente: 1,            // 'MARCA DEL CLIENTE'
            telefono: 2,                 // '# TEL./ CLIENTE'
            ciudad_destino: 3,           // 'CIUDADDESTINO'
            phto: 4,                     // 'PHTO' (imagen)
            cn: 5,                       // 'C/N'
            ref_art: 6,                  // 'REF.ART'
            descripcion_espanol: 7,      // 'DESCRIPCION ESPAÑOL'
            descripcion_chino: 8,        // 'DESCRIPCION CHINO'
            unidad: 9,                   // 'UNIT'
            precio_unidad: 10,           // 'PRECIO. UNIT'
            precio_total: 11,            // 'PRECIO. TOTAL'
            material: 12,                // 'MATERIAL'
            unidades_empaque: 13,        // 'UNIDADES X EMPAQUE'
            marca_producto: 14,          // 'MARCA DEL PRODUCTO'
            cajas: 15,                   // 'CAJAS'
            cant_por_caja: 16,           // 'CANT POR CAJA'
            cant_total: 17,              // 'CANT. TOTAL'
            medida_largo: 18,            // 'MEDIDA DE CAJA' (Largo)
            medida_ancho: 19,            // Ancho (columna siguiente)
            medida_alto: 20,             // Alto (columna siguiente)
            cbm: 21,                     // 'CBM'
            cbm_total: 22,               // 'CBM.TT'
            gw: 23,                      // 'G.W.'
            gw_total: 24,                // 'G.W.TT'
            serial: 25                   // 'Serial'
        };

        for (let i = 0; i < filasArticulos.length; i++) {
            try {
                const fila = filasArticulos[i];
                
                // Saltar filas vacías o con datos insuficientes
                if (!fila || fila.length < 10) {
                    continue;
                }

                // Construir objeto artículo
                const phtoData = fila[mapeoColumnas.phto];
                let imagenData = {};
                
                // Si hay una imagen asociada (objeto con buffer, nombre, tipo)
                if (phtoData && typeof phtoData === 'object' && phtoData.buffer) {
                    imagenData = {
                        imagen_url: null, // Se actualizará después de crear el artículo
                        imagen_data: phtoData.buffer,
                        imagen_nombre: phtoData.nombre,
                        imagen_tipo: phtoData.tipo
                    };
                    console.log(`📷 Imagen detectada para artículo: ${phtoData.nombre}`);
                } else if (phtoData && typeof phtoData === 'string') {
                    // Si es una URL de imagen tradicional
                    imagenData = {
                        imagen_url: phtoData,
                        imagen_data: null,
                        imagen_nombre: null,
                        imagen_tipo: null
                    };
                } else {
                    // Sin imagen
                    imagenData = {
                        imagen_url: null,
                        imagen_data: null,
                        imagen_nombre: null,
                        imagen_tipo: null
                    };
                }

                const articuloData = {
                    id_carga: cargaId,
                    fecha: fila[mapeoColumnas.fecha] || null,
                    cn: fila[mapeoColumnas.cn] || null,
                    ref_art: fila[mapeoColumnas.ref_art] || null,
                    descripcion_espanol: fila[mapeoColumnas.descripcion_espanol] || null,
                    descripcion_chino: fila[mapeoColumnas.descripcion_chino] || null,
                    unidad: fila[mapeoColumnas.unidad] || null,
                    precio_unidad: parseFloat(fila[mapeoColumnas.precio_unidad]) || 0,
                    precio_total: parseFloat(fila[mapeoColumnas.precio_total]) || 0,
                    material: fila[mapeoColumnas.material] || null,
                    unidades_empaque: parseInt(fila[mapeoColumnas.unidades_empaque]) || 0,
                    marca_producto: fila[mapeoColumnas.marca_producto] || null,
                    serial: fila[mapeoColumnas.serial] || null,
                    medida_largo: parseFloat(fila[mapeoColumnas.medida_largo]) || 0,
                    medida_ancho: parseFloat(fila[mapeoColumnas.medida_ancho]) || 0,
                    medida_alto: parseFloat(fila[mapeoColumnas.medida_alto]) || 0,
                    cbm: parseFloat(fila[mapeoColumnas.cbm]) || 0,
                    gw: parseFloat(fila[mapeoColumnas.gw]) || 0,
                    ...imagenData
                };

                const articuloId = await PackingListModel.crearArticulo(articuloData);
                
                // Si hay datos de imagen, actualizar la URL con el ID del artículo
                if (imagenData.imagen_data) {
                    const urlImagen = `/api/carga/imagen/${articuloId}`;
                    await PackingListModel.actualizarUrlImagen(articuloId, urlImagen);
                    console.log(`🔗 URL de imagen actualizada: ${urlImagen}`);
                }
                
                // 4. Crear cajas si hay datos de cajas
                const numCajas = parseInt(fila[mapeoColumnas.cajas]) || 0;
                const cantPorCaja = parseInt(fila[mapeoColumnas.cant_por_caja]) || 0;
                
                if (numCajas > 0 && cantPorCaja > 0) {
                    const cbmPorCaja = articuloData.cbm / numCajas;
                    const gwPorCaja = articuloData.gw / numCajas;
                    
                    for (let numeroCaja = 1; numeroCaja <= numCajas; numeroCaja++) {
                        const cajaData = {
                            id_articulo: articuloId,
                            numero_caja: numeroCaja,
                            cantidad_en_caja: cantPorCaja,
                            cbm: cbmPorCaja,
                            gw: gwPorCaja
                        };
                        
                        await PackingListModel.crearCaja(cajaData);
                    }
                }
                
                articulosCreados++;
                
            } catch (error) {
                console.error(`Error procesando fila ${i + 1}:`, error);
                errores.push(`Fila ${i + 1}: ${error.message}`);
            }
        }

        // 5. Calcular estadísticas finales
        const estadisticas = await PackingListModel.calcularEstadisticasCarga(cargaId);
        
        console.log("=== RESUMEN DE GUARDADO ===");
        console.log(`Cliente ID: ${clienteId} (tipo: ${typeof clienteId})`);
        console.log(`Carga ID: ${cargaId} (tipo: ${typeof cargaId})`);
        console.log(`Artículos creados: ${articulosCreados} (tipo: ${typeof articulosCreados})`);
        console.log(`Errores: ${errores.length}`);
        console.log('Estadísticas:', estadisticas);
        console.log("=== FIN GUARDADO ===");

        const respuesta = {
            success: true,
            message: "Packing List guardado exitosamente",
            data: {
                id_cliente: clienteId,
                id_carga: cargaId,
                articulos_creados: articulosCreados,
                errores: errores,
                estadisticas: estadisticas
            }
        };
        
        console.log('=== RESPUESTA FINAL ===');
        console.log(JSON.stringify(respuesta, null, 2));
        console.log('=== FIN RESPUESTA ===');

        res.json(respuesta);

    } catch (error) {
        console.error("Error al guardar packing list:", error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor al guardar",
            error: error.message
        });
    }
});

// Ruta para obtener un packing list completo
router.get("/packing-list/:id_carga", authRequired, async (req, res) => {
    try {
        const { id_carga } = req.params;
        
        const packingList = await PackingListModel.obtenerPackingListCompleto(id_carga);
        const estadisticas = await PackingListModel.calcularEstadisticasCarga(id_carga);
        
        res.json({
            success: true,
            data: {
                items: packingList,
                estadisticas: estadisticas
            }
        });
        
    } catch (error) {
        console.error("Error al obtener packing list:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener packing list"
        });
    }
});

// Ruta para obtener cargas de un cliente
router.get("/cliente/:id_cliente/cargas", authRequired, async (req, res) => {
    try {
        const { id_cliente } = req.params;
        
        const cargas = await PackingListModel.obtenerCargasPorCliente(id_cliente);
        
        res.json({
            success: true,
            data: cargas
        });
        
    } catch (error) {
        console.error("Error al obtener cargas del cliente:", error);
        res.status(500).json({
            success: false,
            message: "Error al obtener cargas del cliente"
        });
    }
});

// Nueva ruta para servir imágenes desde la base de datos
router.get('/imagen/:id_articulo', async (req, res) => {
    try {
        const { id_articulo } = req.params;
        
        const imagenData = await PackingListModel.obtenerImagenArticulo(id_articulo);
        
        if (!imagenData || !imagenData.imagen_data) {
            return res.status(404).json({ error: 'Imagen no encontrada' });
        }
        
        // Configurar headers apropiados
        res.set({
            'Content-Type': imagenData.imagen_tipo || 'image/png',
            'Content-Length': imagenData.imagen_data.length,
            'Cache-Control': 'public, max-age=86400' // Cache por 24 horas
        });
        
        // Enviar los datos de la imagen
        res.send(imagenData.imagen_data);
    } catch (error) {
        console.error('Error al obtener imagen:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Ruta para buscar packing lists por código de carga
router.get("/buscar/:codigo_carga", async (req, res) => {
    try {
        const { codigo_carga } = req.params;
        
        // Prevenir caching del navegador
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        console.log(`🔍 Buscando packing list con código: ${codigo_carga}`);
        
        // Buscar cargas que coincidan con el código (búsqueda parcial)
        const cargas = await PackingListModel.buscarCargasPorCodigo(codigo_carga);
        
        if (!cargas || cargas.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: 'No se encontraron packing lists con ese código' 
            });
        }
        
        // Para cada carga, obtener estadísticas y información completa
        const resultados = [];
        for (const carga of cargas) {
            const estadisticas = await PackingListModel.obtenerEstadisticasCarga(carga.id_carga);
            const articulosCount = await PackingListModel.contarArticulosCarga(carga.id_carga);
            
            resultados.push({
                id_carga: carga.id_carga,
                codigo_carga: carga.codigo_carga,
                fecha_inicio: carga.fecha_inicio,
                fecha_fin: carga.fecha_fin,
                ciudad_destino: carga.ciudad_destino,
                archivo_original: carga.archivo_original,
                cliente: {
                    id_cliente: carga.id_cliente,
                    nombre_cliente: carga.nombre_cliente,
                    correo_cliente: carga.correo_cliente,
                    telefono_cliente: carga.telefono_cliente
                },
                estadisticas: {
                    articulos_creados: articulosCount,
                    total_articulos: estadisticas.total_articulos || 0,
                    precio_total_carga: estadisticas.precio_total_carga || 0,
                    cbm_total: estadisticas.cbm_total || 0,
                    peso_total: estadisticas.peso_total || 0,
                    total_cajas: estadisticas.total_cajas || 0
                }
            });
        }
        
        console.log(`✅ Encontradas ${resultados.length} cargas`);
        
        // Forzar status 200 y agregar timestamp para evitar cache
        res.status(200).json({
            success: true,
            data: resultados,
            mensaje: `Se encontraron ${resultados.length} packing list(s) con el código "${codigo_carga}"`,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al buscar packing lists:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Ruta para obtener todas las cargas con información básica
router.get("/todas", async (req, res) => {
    try {
        // Prevenir caching del navegador
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });
        
        console.log('📋 Obteniendo todas las cargas');
        
        const cargas = await PackingListModel.obtenerTodasLasCargas();
        
        if (!cargas || cargas.length === 0) {
            return res.json({
                success: true,
                data: [],
                mensaje: 'No hay packing lists guardados'
            });
        }
        
        // Agregar estadísticas a cada carga
        const cargasConEstadisticas = [];
        for (const carga of cargas) {
            const estadisticas = await PackingListModel.obtenerEstadisticasCarga(carga.id_carga);
            const articulosCount = await PackingListModel.contarArticulosCarga(carga.id_carga);
            
            cargasConEstadisticas.push({
                ...carga,
                estadisticas: {
                    articulos_creados: articulosCount,
                    total_articulos: estadisticas.total_articulos || 0,
                    precio_total_carga: estadisticas.precio_total_carga || 0,
                    cbm_total: estadisticas.cbm_total || 0,
                    peso_total: estadisticas.peso_total || 0,
                    total_cajas: estadisticas.total_cajas || 0
                }
            });
        }
        
        console.log(`✅ Obtenidas ${cargasConEstadisticas.length} cargas`);
        
        // Forzar status 200 y agregar timestamp para evitar cache
        res.status(200).json({
            success: true,
            data: cargasConEstadisticas,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error al obtener todas las cargas:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error interno del servidor',
            details: error.message 
        });
    }
});

// Nuevo endpoint integrado: Guardar Packing List + Generar QRs automáticamente
router.post("/guardar-con-qr", async (req, res) => {
    try {
        const { 
            datosExcel, 
            infoCliente, 
            infoCarga 
        } = req.body;

        console.log('🚀 Iniciando proceso integrado de guardado con QR...');
        console.log('📋 Info Cliente:', infoCliente);
        console.log('📦 Info Carga:', infoCarga);

        // Validar datos requeridos
        if (!datosExcel || !Array.isArray(datosExcel) || datosExcel.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Datos de Excel insuficientes"
            });
        }

        if (!infoCliente?.nombre_cliente || !infoCliente?.correo_cliente || !infoCliente?.telefono_cliente || !infoCliente?.direccion_entrega) {
            return res.status(400).json({
                success: false,
                message: "Información del cliente incompleta (nombre, correo, teléfono y dirección de entrega son obligatorios)"
            });
        }

        if (!infoCarga?.codigo_carga || !infoCarga?.direccion_destino) {
            return res.status(400).json({
                success: false,
                message: "Información de carga incompleta (código y dirección de destino son obligatorios)"
            });
        }

        // === PASO 1: CREAR/OBTENER CLIENTE ===
        console.log('👤 Procesando cliente...');
        let clienteId;
        
        // Verificar si el cliente ya existe por correo
        const clienteExistente = await get(
            'SELECT * FROM cliente WHERE correo_cliente = ?',
            [infoCliente.correo_cliente]
        );

        if (clienteExistente) {
            clienteId = clienteExistente.id_cliente;
            console.log(`✅ Cliente existente encontrado: ${clienteId}`);
            
            // Actualizar información del cliente
            await run(`
                UPDATE cliente 
                SET nombre_cliente = ?, telefono_cliente = ?, direccion_entrega = ?, updated_at = datetime('now')
                WHERE id_cliente = ?
            `, [infoCliente.nombre_cliente, infoCliente.telefono_cliente, infoCliente.direccion_entrega, clienteId]);
            
        } else {
            // Crear nuevo cliente
            const resultCliente = await run(`
                INSERT INTO cliente (nombre_cliente, correo_cliente, telefono_cliente, direccion_entrega) 
                VALUES (?, ?, ?, ?)
            `, [infoCliente.nombre_cliente, infoCliente.correo_cliente, infoCliente.telefono_cliente, infoCliente.direccion_entrega]);
            
            clienteId = resultCliente.id;
            console.log(`✅ Nuevo cliente creado: ${clienteId}`);
        }

        // === PASO 2: CREAR CARGA ===
        console.log('📦 Creando carga...');
        
        // Verificar que el código de carga sea único
        const cargaExistente = await get(
            'SELECT * FROM carga WHERE codigo_carga = ?',
            [infoCarga.codigo_carga]
        );

        if (cargaExistente) {
            return res.status(400).json({
                success: false,
                message: `El código de carga "${infoCarga.codigo_carga}" ya existe`
            });
        }

        const cargaData = {
            codigo_carga: infoCarga.codigo_carga,
            direccion_destino: infoCarga.direccion_destino,
            archivo_original: infoCarga.archivo_original || 'packing-list.xlsx',
            id_cliente: clienteId
        };

        const nuevaCarga = await createCarga(cargaData);
        console.log(`✅ Carga creada: ${nuevaCarga.id_carga} (${nuevaCarga.codigo_carga})`);

        // === PASO 3: PROCESAR ARTÍCULOS DEL EXCEL ===
        console.log('📝 Procesando artículos del Excel...');
        
        const encabezados = datosExcel[0];
        const filasArticulos = datosExcel.slice(1);
        
        let articulosCreados = 0;
        let articulosIds = [];
        let articulosConIndices = []; // Nuevo array para guardar ID y índice de fila original
        
        for (let i = 0; i < filasArticulos.length; i++) {
            try {
                const fila = filasArticulos[i];
                
                // Saltar filas vacías
                if (!fila || fila.length < 5 || !fila[5]) { // Verificar que al menos tenga REF.ART
                    continue;
                }

                // Construir datos del artículo con la estructura de la nueva tabla
                const articuloData = {
                    id_carga: nuevaCarga.id_carga,
                    fecha: fila[0] || null,
                    cn: fila[5] || null,  // C/N está en columna 5
                    ref_art: fila[6] || null,  // REF.ART está en columna 6
                    descripcion_espanol: fila[7] || null,
                    descripcion_chino: fila[8] || null,
                    unidad: fila[9] || null,
                    precio_unidad: parseFloat(fila[10]) || 0,
                    precio_total: parseFloat(fila[11]) || 0,
                    material: fila[12] || null,
                    unidades_empaque: parseInt(fila[13]) || 0,
                    marca_producto: fila[14] || null,
                    serial: fila[25] || null,
                    medida_largo: parseFloat(fila[18]) || 0,
                    medida_ancho: parseFloat(fila[19]) || 0,
                    medida_alto: parseFloat(fila[20]) || 0,
                    cbm: parseFloat(fila[21]) || 0,
                    gw: parseFloat(fila[23]) || 0,
                    imagen_url: fila[4] || null,  // PHTO está en columna 4
                    imagen_data: null,
                    imagen_nombre: null,
                    imagen_tipo: null
                };

                // Insertar artículo en la base de datos
                const articuloResult = await run(`
                    INSERT INTO articulo_packing_list (
                        id_carga, fecha, cn, ref_art, descripcion_espanol, descripcion_chino,
                        unidad, precio_unidad, precio_total, material, unidades_empaque,
                        marca_producto, serial, medida_largo, medida_ancho, medida_alto,
                        cbm, gw, imagen_url, imagen_data, imagen_nombre, imagen_tipo
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    articuloData.id_carga, articuloData.fecha, articuloData.cn, articuloData.ref_art,
                    articuloData.descripcion_espanol, articuloData.descripcion_chino, articuloData.unidad,
                    articuloData.precio_unidad, articuloData.precio_total, articuloData.material,
                    articuloData.unidades_empaque, articuloData.marca_producto, articuloData.serial,
                    articuloData.medida_largo, articuloData.medida_ancho, articuloData.medida_alto,
                    articuloData.cbm, articuloData.gw, articuloData.imagen_url, articuloData.imagen_data,
                    articuloData.imagen_nombre, articuloData.imagen_tipo
                ]);

                articulosIds.push(articuloResult.id);
                articulosConIndices.push({ id: articuloResult.id, filaIndex: i }); // Guardar ID y índice original
                articulosCreados++;
                
                console.log(`  ✅ Artículo ${articulosCreados}: ${articuloData.ref_art} (ID: ${articuloResult.id}, Fila: ${i})`);
                
            } catch (error) {
                console.error(`  ❌ Error procesando artículo ${i + 1}:`, error);
            }
        }

        console.log(`✅ Total de artículos creados: ${articulosCreados}`);

        // === PASO 4: GENERAR CAJAS Y QRS AUTOMÁTICAMENTE ===
        console.log('📦 Generando cajas y QRs automáticamente...');
        
        let totalCajasGeneradas = 0;
        let totalQRsGenerados = 0;

        for (let articuloIndex = 0; articuloIndex < articulosConIndices.length; articuloIndex++) {
            const articuloInfo = articulosConIndices[articuloIndex];
            const articuloId = articuloInfo.id;
            const filaOriginalIndex = articuloInfo.filaIndex;
            
            try {
                // Obtener información del artículo desde los datos originales del Excel
                const filaArticulo = filasArticulos[filaOriginalIndex]; // Usar el índice original correcto
                
                // Mapeo de columnas del Excel
                const mapeoColumnas = {
                    fecha: 1,
                    cn: 2,
                    ref_art: 3,
                    descripcion_espanol: 4,
                    descripcion_chino: 5,
                    unidad: 6,
                    precio_unidad: 7,
                    precio_total: 8,
                    material: 9,
                    unidades_empaque: 10,
                    marca_producto: 11,
                    cajas: 15,                   // 'CAJAS'
                    cant_por_caja: 16,           // 'CANT. POR CAJA'
                    cant_total: 17,              // 'CANT. TOTAL'
                    medida_largo: 18,            // 'MEDIDA DE CAJA' (Largo)
                    medida_ancho: 19,            // Ancho (columna siguiente)
                    medida_alto: 20,             // Alto (columna siguiente)
                    cbm: 21,                     // 'CBM'
                    cbm_total: 22,               // 'CBM.TT'
                    gw: 23,                      // 'G.W.'
                    gw_total: 24,                // 'G.W.TT'
                    serial: 25                   // 'Serial'
                };
                
                // Leer número de cajas del Excel
                const numCajas = parseInt(filaArticulo[mapeoColumnas.cajas]) || 1;
                const cantPorCaja = parseInt(filaArticulo[mapeoColumnas.cant_por_caja]) || 0;
                
                console.log(`  📋 Artículo ${articuloId} (Fila ${filaOriginalIndex}): ${numCajas} cajas, ${cantPorCaja} items por caja`);
                
                const cajasCreadas = await createCajasForArticulo(articuloId, numCajas);
                totalCajasGeneradas += cajasCreadas.length;
                
                console.log(`  📦 ${cajasCreadas.length} cajas creadas para artículo ${articuloId}`);
                
                // Generar QR para cada caja
                await ensureQRDirectory();
                
                for (const caja of cajasCreadas) {
                    try {
                        // Crear QR en la base de datos
                        const qrCreado = await createQRForCaja(caja.id_caja);
                        
                        // Obtener información del artículo para el QR
                        const articuloCompleto = await get(
                            "SELECT * FROM articulo_packing_list WHERE id_articulo = ?",
                            [articuloId]
                        );
                        
                        // Datos para mostrar en el QR
                        const qrInfo = {
                            codigo: qrCreado.codigo_qr,
                            caja: `${caja.numero_caja} de ${caja.total_cajas}`,
                            articulo: articuloCompleto.ref_art || "Sin referencia",
                            descripcion: articuloCompleto.descripcion_espanol || "Sin descripción",
                        };

                        // Texto para el QR (JSON con la información)
                        const qrText = JSON.stringify(qrInfo);

                        // Nombre del archivo de imagen
                        const fileName = `qr-${qrCreado.codigo_qr}.png`;
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
                        await updateQRImage(qrCreado.id_qr, `/uploads/qr-codes/${fileName}`);
                        
                        totalQRsGenerados++;
                        console.log(`  🏷️  QR generado: ${qrCreado.codigo_qr}`);
                    } catch (qrError) {
                        console.error(`  ❌ Error generando QR para caja ${caja.id_caja}:`, qrError);
                    }
                }
                
            } catch (error) {
                console.error(`  ❌ Error generando cajas/QRs para artículo ${articuloId}:`, error);
            }
        }

        // === PASO 5: CALCULAR ESTADÍSTICAS FINALES ===
        console.log('📊 Calculando estadísticas...');
        
        const estadisticas = {
            cliente_id: clienteId,
            carga_id: nuevaCarga.id_carga,
            codigo_carga: nuevaCarga.codigo_carga,
            articulos_creados: articulosCreados,
            cajas_generadas: totalCajasGeneradas,
            qrs_generados: totalQRsGenerados,
            fecha_creacion: nuevaCarga.fecha_creacion
        };

        console.log('🎉 Proceso completado exitosamente!');
        console.log('📊 Estadísticas finales:', estadisticas);

        // === RESPUESTA FINAL ===
        res.json({
            success: true,
            message: "Packing List guardado y QRs generados exitosamente",
            data: {
                cliente: {
                    id: clienteId,
                    nombre: infoCliente.nombre_cliente,
                    correo: infoCliente.correo_cliente
                },
                carga: {
                    id: nuevaCarga.id_carga,
                    codigo: nuevaCarga.codigo_carga,
                    direccion_destino: infoCarga.direccion_destino
                },
                estadisticas: estadisticas,
                pdfDisponible: true,
                pdfUrl: `/api/qr/pdf-carga/${nuevaCarga.id_carga}`,
                siguientePaso: `PDF con QRs disponible en: GET /api/qr/pdf-carga/${nuevaCarga.id_carga}`
            }
        });

    } catch (error) {
        console.error('❌ Error en proceso integrado:', error);
        res.status(500).json({
            success: false,
            message: "Error interno del servidor",
            error: error.message
        });
    }
});

export default router;
