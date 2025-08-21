import fetch from 'node-fetch';

const BASE_URL = 'http://127.0.0.1:4000';

async function testServerConnection() {
    try {
        console.log('🔍 Probando conexión al servidor...');
        const response = await fetch(`${BASE_URL}/api/qr-test-direct`);
        
        if (response.ok) {
            const data = await response.text();
            console.log('✅ Servidor responde correctamente');
            console.log('📄 Respuesta:', data);
        } else {
            console.log('❌ Error en respuesta:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
    }
}

async function testPDFEndpoint() {
    try {
        console.log('🔍 Probando endpoint de PDF sin autenticación...');
        const response = await fetch(`${BASE_URL}/api/qr/pdf-test/3`);
        
        if (response.ok) {
            console.log('✅ Endpoint PDF responde correctamente');
            console.log('📄 Content-Type:', response.headers.get('content-type'));
        } else {
            const errorText = await response.text();
            console.log('❌ Error en PDF:', response.status, response.statusText);
            console.log('📄 Error body:', errorText);
        }
    } catch (error) {
        console.error('❌ Error en PDF:', error.message);
    }
}

// Ejecutar tests
console.log('🚀 Iniciando tests del servidor...\n');

testServerConnection()
    .then(() => {
        console.log('\n');
        return testPDFEndpoint();
    })
    .then(() => {
        console.log('\n✅ Tests completados');
    })
    .catch(error => {
        console.error('❌ Error en tests:', error);
    });
