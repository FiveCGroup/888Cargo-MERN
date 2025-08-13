import { PackingListModel } from './models/packingList.model.js';
import { query } from './db.js';

console.log('🔍 Probando búsqueda en la base de datos...');

try {
    // Primero, vamos a ver todas las cargas
    console.log('\n📋 Obteniendo todas las cargas...');
    const todasLasCargas = await PackingListModel.obtenerTodasLasCargas();
    console.log('Total de cargas encontradas:', todasLasCargas.length);
    
    if (todasLasCargas.length > 0) {
        console.log('\nPrimeras cargas encontradas:');
        todasLasCargas.slice(0, 3).forEach((carga, index) => {
            console.log(`${index + 1}. Código: ${carga.codigo_carga}, ID: ${carga.id_carga}, Cliente: ${carga.nombre_cliente}`);
        });
    }
    
    // Ahora vamos a probar la búsqueda específica
    console.log('\n🔍 Probando búsqueda específica...');
    const resultado = await PackingListModel.buscarCargasPorCodigo('PL-20250812-735-6782');
    console.log('Resultado de búsqueda específica:', resultado);
    
    // También probemos una búsqueda parcial
    console.log('\n🔍 Probando búsqueda parcial...');
    const resultadoParcial = await PackingListModel.buscarCargasPorCodigo('PL-');
    console.log('Resultado de búsqueda parcial:', resultadoParcial);
    
} catch (error) {
    console.error('❌ Error en las pruebas:', error);
}

process.exit(0);
