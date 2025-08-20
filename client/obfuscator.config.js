/**
 * Configuración de ofuscación para código del cliente
 * Este archivo define los parámetros de ofuscación que se aplicarán
 * solo al código que es visible en el navegador
 */

export const obfuscatorConfig = {
  // === CONFIGURACIÓN BÁSICA ===
  compact: true, // Minificar el código
  controlFlowFlattening: true, // Reorganizar el flujo de control
  controlFlowFlatteningThreshold: 0.75, // 75% del código será reorganizado
  
  // === INYECCIÓN DE CÓDIGO MUERTO ===
  deadCodeInjection: true, // Insertar código que nunca se ejecuta
  deadCodeInjectionThreshold: 0.4, // 40% de código muerto
  
  // === PROTECCIÓN DE DEBUGGING ===
  debugProtection: true, // Proteger contra debugging
  debugProtectionInterval: 4000, // Verificar cada 4 segundos
  disableConsoleOutput: true, // Deshabilitar console.log
  
  // === NOMBRES DE IDENTIFICADORES ===
  identifierNamesGenerator: 'hexadecimal', // Usar nombres hexadecimales
  renameGlobals: false, // No renombrar variables globales (evita errores)
  
  // === PROTECCIÓN AVANZADA ===
  selfDefending: true, // Código se auto-protege contra modificaciones
  simplify: true, // Simplificar expresiones
  
  // === OFUSCACIÓN DE STRINGS ===
  splitStrings: true, // Dividir strings largos
  splitStringsChunkLength: 5, // Longitud de cada fragmento
  stringArray: true, // Usar array de strings
  stringArrayCallsTransform: true, // Transformar llamadas al array
  stringArrayEncoding: ['base64'], // Codificar strings en base64
  stringArrayIndexShift: true, // Cambiar índices del array
  stringArrayRotate: true, // Rotar el array
  stringArrayShuffle: true, // Mezclar el array
  stringArrayWrappersCount: 2, // Número de wrappers
  stringArrayWrappersChainedCalls: true, // Llamadas encadenadas
  stringArrayWrappersParametersMaxCount: 4, // Máximo parámetros
  stringArrayWrappersType: 'function', // Tipo de wrapper
  stringArrayThreshold: 0.75, // 75% de strings serán ofuscados
  
  // === TRANSFORMACIONES ADICIONALES ===
  numbersToExpressions: true, // Convertir números a expresiones
  transformObjectKeys: true, // Transformar keys de objetos
  unicodeEscapeSequence: false, // No usar secuencias unicode (mejor compatibilidad)
  
  // === CONFIGURACIÓN DE ARCHIVOS ===
  exclude: [
    /node_modules/, // No ofuscar node_modules
    /\.map$/, // No ofuscar source maps
    /\.test\.|\.spec\./, // No ofuscar archivos de test
    /\.config\./, // No ofuscar archivos de configuración
  ],
  
  include: [
    /\.[jt]sx?$/ // Solo ofuscar archivos JS/JSX/TS/TSX
  ],
  
  // === CONFIGURACIÓN DE LOG ===
  log: false, // No mostrar logs durante ofuscación
  
  // === CONFIGURACIÓN ESPECÍFICA PARA REACT ===
  reservedNames: [
    // Preservar nombres importantes de React
    'React',
    'ReactDOM',
    'useState',
    'useEffect',
    'useContext',
    'useReducer',
    'useCallback',
    'useMemo',
    'useRef',
    'useImperativeHandle',
    'useLayoutEffect',
    'useDebugValue',
    // Preservar nombres de APIs del navegador
    'window',
    'document',
    'localStorage',
    'sessionStorage',
    'fetch',
    'XMLHttpRequest',
    'navigator',
    'location',
    'history'
  ]
};

export default obfuscatorConfig;
