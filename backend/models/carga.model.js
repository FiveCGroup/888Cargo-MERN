import { query, run, get } from '../db.js';

// Crear una nueva carga
export async function createCarga(cargaData) {
  const {
    numero_carga,
    id_cliente,
    estado = 'pendiente'
  } = cargaData;

  try {
    const result = await run(
      `INSERT INTO carga (numero_carga, id_cliente, estado) VALUES (?, ?, ?)`,
      [numero_carga, id_cliente, estado]
    );
    
    // Obtener la carga recién creada
    const newCarga = await get('SELECT * FROM carga WHERE id_carga = ?', [result.id]);
    return newCarga;
  } catch (error) {
    console.error('Error al crear carga:', error);
    throw error;
  }
}

// Obtener todas las cargas
export async function getAllCargas() {
  try {
    const result = await query(`
      SELECT c.*, cli.nombre_cliente 
      FROM carga c
      LEFT JOIN cliente cli ON c.id_cliente = cli.id_cliente
      ORDER BY c.fecha_creacion DESC
    `);
    return result;
  } catch (error) {
    console.error('Error al obtener todas las cargas:', error);
    throw error;
  }
}

// Obtener una carga por ID
export async function getCargaById(id_carga) {
  try {
    const result = await get('SELECT * FROM carga WHERE id_carga = ?', [id_carga]);
    return result;
  } catch (error) {
    console.error('Error al buscar carga por ID:', error);
    throw error;
  }
}

// Obtener una carga por su número
export async function getCargaByNumero(numero_carga) {
  try {
    const result = await get('SELECT * FROM carga WHERE numero_carga = ?', [numero_carga]);
    return result;
  } catch (error) {
    console.error('Error al buscar carga por número:', error);
    throw error;
  }
}

// Obtener cargas por cliente
export async function getCargasByCliente(id_cliente) {
  try {
    const result = await query(
      'SELECT * FROM carga WHERE id_cliente = ? ORDER BY fecha_creacion DESC',
      [id_cliente]
    );
    return result;
  } catch (error) {
    console.error('Error al obtener cargas por cliente:', error);
    throw error;
  }
}

// Actualizar una carga existente
export async function updateCarga(id_carga, cargaData) {
  const {
    numero_carga,
    estado
  } = cargaData;

  try {
    await run(
      `UPDATE carga SET numero_carga = ?, estado = ? WHERE id_carga = ?`,
      [numero_carga, estado, id_carga]
    );
    
    // Obtener la carga actualizada
    const updatedCarga = await getCargaById(id_carga);
    return updatedCarga;
  } catch (error) {
    console.error('Error al actualizar carga:', error);
    throw error;
  }
}

// Eliminar una carga
export async function deleteCarga(id_carga) {
  try {
    const cargaToDelete = await getCargaById(id_carga);
    
    // Primero eliminamos los artículos relacionados
    await run('DELETE FROM articulo_packing_list WHERE id_carga = ?', [id_carga]);
    
    // Luego eliminamos la carga
    await run('DELETE FROM carga WHERE id_carga = ?', [id_carga]);
    return cargaToDelete;
  } catch (error) {
    console.error('Error al eliminar carga:', error);
    throw error;
  }
}
