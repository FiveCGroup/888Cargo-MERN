import { Router } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";
import { authRequired } from "../middlewares/validateToken.js";
import * as articuloModel from "../models/articulosPL.model.js";
import { PackingListModel } from "../models/packingList.model.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Crear directorio para imágenes si no existe
const imageDir = path.join(process.cwd(), 'uploads', 'images');
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
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

export default router;
