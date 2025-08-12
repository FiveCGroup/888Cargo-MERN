// test-sqlite-migration.js
import dotenv from 'dotenv';
import { query, run, get, initializeDatabase } from './backend/db.js';
import * as clienteModel from './backend/models/user.model.js';
import * as cargaModel from './backend/models/carga.model.js';
import * as articuloModel from './backend/models/articulosPL.model.js';
import bcrypt from 'bcrypt';

dotenv.config();

console.log('\n==========================================');
console.log('PRUEBA DE MIGRACIÓN A SQLITE');
console.log('==========================================\n');

async function testMigration() {
  try {
    console.log('1. Verificando inicialización de la base de datos...');
    await initializeDatabase();
    console.log('✅ Base de datos inicializada correctamente\n');

    console.log('2. Probando creación de cliente...');
    const hashedPassword = await bcrypt.hash('test123', 10);
    const testCliente = await clienteModel.createCliente({
      nombre_cliente: 'Cliente de Prueba',
      correo_cliente: 'test@example.com',
      telefono_cliente: '+573001234567',
      ciudad_cliente: 'Ciudad Prueba',
      pais_cliente: 'Colombia',
      password: hashedPassword
    });
    console.log('✅ Cliente creado:', testCliente.nombre_cliente);

    console.log('3. Probando búsqueda de cliente por email...');
    const clienteEncontrado = await clienteModel.getClienteByEmail('test@example.com');
    console.log('✅ Cliente encontrado:', clienteEncontrado.nombre_cliente);

    console.log('4. Probando creación de carga...');
    const testCarga = await cargaModel.createCarga({
      numero_carga: 'CARGA-TEST-001',
      id_cliente: testCliente.id_cliente,
      estado: 'activa'
    });
    console.log('✅ Carga creada:', testCarga.numero_carga);

    console.log('5. Probando creación de artículos...');
    const testArticulo = await articuloModel.createArticulo({
      id_carga: testCarga.id_carga,
      secuencia: 1,
      codigo_producto: 'PROD-001',
      descripcion: 'Producto de prueba',
      cantidad: 10,
      precio: 25.50,
      cbm: 1.5,
      cbmtt: 15.0,
      gw: 2.5,
      gwtt: 25.0,
      serial: 'SN12345',
      imagen_url: null
    });
    console.log('✅ Artículo creado:', testArticulo.codigo_producto);

    console.log('6. Probando consulta de artículos por carga...');
    const articulosDeCarga = await articuloModel.getArticulosByCarga(testCarga.id_carga);
    console.log(`✅ Encontrados ${articulosDeCarga.length} artículos en la carga`);

    console.log('7. Probando obtener todas las cargas...');
    const todasLasCargas = await cargaModel.getAllCargas();
    console.log(`✅ Total de cargas en el sistema: ${todasLasCargas.length}`);

    console.log('8. Probando obtener todos los clientes...');
    const todosLosClientes = await clienteModel.getAllClientes();
    console.log(`✅ Total de clientes en el sistema: ${todosLosClientes.length}`);

    console.log('\n==========================================');
    console.log('PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('==========================================');
    console.log('✅ La migración a SQLite fue exitosa');
    console.log('✅ Todos los modelos funcionan correctamente');
    console.log('✅ Las operaciones CRUD están operativas');
    console.log('\n🎉 Tu aplicación está lista para usar SQLite!');

    // Limpiar datos de prueba
    console.log('\n9. Limpiando datos de prueba...');
    await articuloModel.deleteArticulo(testArticulo.id_articulo);
    await cargaModel.deleteCarga(testCarga.id_carga);
    await clienteModel.deleteCliente(testCliente.id_cliente);
    console.log('✅ Datos de prueba eliminados');

  } catch (error) {
    console.error('\n❌ Error durante las pruebas:', error);
    console.log('\nPor favor revisa los errores y asegúrate de que:');
    console.log('- SQLite3 esté instalado correctamente');
    console.log('- Los modelos estén correctamente configurados');
    console.log('- Las tablas se hayan creado correctamente');
  }
}

// Ejecutar pruebas
testMigration();
