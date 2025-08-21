import { Router } from "express";
import { authRequired } from "../middlewares/validateToken.js";
import * as cargaController from "../controllers/carga.controller.js";

const router = Router();

// Rutas de carga delegando al controlador
router.post("/procesar-excel", authRequired, cargaController.upload.single("archivo"), cargaController.procesarExcel);
router.post("/guardar", authRequired, cargaController.guardarCarga);
router.post("/guardar-packing-list", authRequired, cargaController.guardarPackingList);
router.get("/packing-list/:id_carga", authRequired, cargaController.obtenerPackingList);
router.get("/cliente/:id_cliente/cargas", authRequired, cargaController.obtenerCargasCliente);
router.get("/imagenes/:filename", authRequired, cargaController.obtenerImagenArticulo);
router.get("/imagen/:id_articulo", cargaController.obtenerImagenArticulo);
router.get("/buscar/:codigo_carga", cargaController.buscarPackingList);
router.get("/todas", cargaController.obtenerTodasCargas);
router.post("/guardar-con-qr", cargaController.guardarConQR);

export default router;
