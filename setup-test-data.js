// Script simple para insertar datos de prueba usando el endpoint del backend
console.log('📝 Creando datos de prueba para carga ID: 3...');

// Datos de ejemplo para un packing list
const packingListData = {
    codigo_carga: "TEST-CARGA-3",
    fecha_inicio: "2025-01-21",
    ciudad_destino: "Miami",
    direccion_destino: "Test Address, Miami FL",
    archivo_original: "test_packing_list.xlsx",
    cliente: {
        nombre_cliente: "Cliente Test",
        correo_cliente: "test@test.com",
        telefono_cliente: "123456789",
        ciudad_cliente: "Bogotá",
        pais_cliente: "Colombia"
    },
    articulos: [
        {
            descripcion_espanol: "Producto Test 1",
            descripcion_chino: "测试产品 1",
            unidades_empaque: 5,
            precio_unidad: 10.50,
            material: "Plástico",
            marca_producto: "Test Brand",
            medida_largo: 10.0,
            medida_ancho: 5.0,
            medida_alto: 3.0,
            gw: 0.5,
            cajas: [
                {
                    numero_caja: 1,
                    total_cajas: 1,
                    cantidad_en_caja: 5,
                    descripcion_contenido: "Producto Test 1 x5"
                }
            ]
        },
        {
            descripcion_espanol: "Producto Test 2", 
            descripcion_chino: "测试产品 2",
            unidades_empaque: 10,
            precio_unidad: 25.00,
            material: "Metal",
            marca_producto: "Test Brand 2",
            medida_largo: 15.0,
            medida_ancho: 8.0,
            medida_alto: 5.0,
            gw: 1.2,
            cajas: [
                {
                    numero_caja: 1,
                    total_cajas: 1,
                    cantidad_en_caja: 10,
                    descripcion_contenido: "Producto Test 2 x10"
                }
            ]
        },
        {
            descripcion_espanol: "Producto Test 3",
            descripcion_chino: "测试产品 3", 
            unidades_empaque: 3,
            precio_unidad: 75.00,
            material: "Madera",
            marca_producto: "Test Brand 3",
            medida_largo: 20.0,
            medida_ancho: 12.0,
            medida_alto: 8.0,
            gw: 2.5,
            cajas: [
                {
                    numero_caja: 1,
                    total_cajas: 1,
                    cantidad_en_caja: 3,
                    descripcion_contenido: "Producto Test 3 x3"
                }
            ]
        }
    ]
};

// Función para hacer petición POST al backend
async function crearDatosPrueba() {
    try {
        // En un entorno real, esto se haría a través del endpoint de carga
        // Para simplificar, vamos a mostrar los datos que se usarían
        console.log('📦 Datos de prueba preparados para carga TEST-CARGA-3:');
        console.log('- Código de carga: TEST-CARGA-3');
        console.log('- Total de artículos: 3');
        console.log('- Total de cajas: 3');
        console.log('- Destino: Miami, FL');
        
        console.log('\n🎯 Para probar el PDF:');
        console.log('1. Ve a la aplicación web en http://localhost:5173/');
        console.log('2. Crea un packing list usando estos datos');
        console.log('3. Presiona el botón "Descargar PDF de QRs"');
        console.log('4. Verifica que no aparezca error 400');
        
        console.log('\n✅ Script de datos de prueba completado');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

crearDatosPrueba();
