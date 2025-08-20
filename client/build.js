#!/usr/bin/env node

/**
 * Script de build personalizado para ofuscación del cliente
 * Este script construye la aplicación de diferentes maneras según el entorno
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const buildType = args[0] || 'production';

console.log('🔧 Iniciando proceso de build...');
console.log(`📦 Tipo de build: ${buildType}`);

try {
    // Limpiar directorio dist si existe
    if (fs.existsSync('dist')) {
        console.log('🧹 Limpiando directorio dist...');
        fs.rmSync('dist', { recursive: true, force: true });
    }

    switch (buildType) {
        case 'development':
        case 'dev':
            console.log('🚀 Construyendo para desarrollo (sin ofuscación)...');
            process.env.NODE_ENV = 'development';
            execSync('npm run build:dev', { stdio: 'inherit' });
            break;

        case 'production':
        case 'prod':
            console.log('🔒 Construyendo para producción (con ofuscación)...');
            process.env.NODE_ENV = 'production';
            execSync('npm run build:obfuscated', { stdio: 'inherit' });
            break;

        case 'preview':
            console.log('👀 Construyendo para preview...');
            process.env.NODE_ENV = 'production';
            execSync('npm run build:obfuscated', { stdio: 'inherit' });
            console.log('🌐 Iniciando servidor de preview...');
            execSync('npm run preview', { stdio: 'inherit' });
            break;

        default:
            console.error('❌ Tipo de build no válido. Usa: development, production, o preview');
            process.exit(1);
    }

    // Mostrar información del build
    if (fs.existsSync('dist')) {
        const stats = fs.statSync('dist');
        console.log('✅ Build completado exitosamente!');
        console.log(`📁 Directorio: dist/`);
        console.log(`📅 Fecha: ${stats.mtime}`);
        
        // Listar archivos principales
        const files = fs.readdirSync('dist');
        console.log('📄 Archivos generados:');
        files.forEach(file => {
            const filePath = path.join('dist', file);
            const stat = fs.statSync(filePath);
            const size = (stat.size / 1024).toFixed(2);
            console.log(`   ${file} (${size} KB)`);
        });

        if (buildType === 'production' || buildType === 'prod') {
            console.log('🔒 El código ha sido ofuscado para protección');
        } else {
            console.log('🔓 El código NO ha sido ofuscado (build de desarrollo)');
        }
    }

} catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
}
