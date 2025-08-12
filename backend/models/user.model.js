import { query, run, get } from '../db.js';

// Obtener un cliente por correo electrónico
export async function getClienteByEmail(email) {
  try {
    const result = await get('SELECT * FROM cliente WHERE correo_cliente = ?', [email]);
    return result;
  } catch (error) {
    console.error('Error al buscar cliente por email:', error);
    throw error;
  }
}

// Obtener un cliente por ID
export async function getClienteById(id) {
  try {
    const result = await get('SELECT * FROM cliente WHERE id_cliente = ?', [id]);
    return result;
  } catch (error) {
    console.error('Error al buscar cliente por ID:', error);
    throw error;
  }
}

// Crear un nuevo cliente
export async function createCliente(clienteData) {
  const {
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    ciudad_cliente,
    pais_cliente,
    password
  } = clienteData;

  try {
    const result = await run(
      `INSERT INTO cliente 
      (nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, password) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, password]
    );
    
    // Obtener el cliente recién creado
    const newCliente = await getClienteById(result.id);
    return newCliente;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
}

// Actualizar un cliente existente
export async function updateCliente(id_cliente, clienteData) {
  const {
    nombre_cliente,
    correo_cliente,
    telefono_cliente,
    ciudad_cliente,
    pais_cliente
  } = clienteData;

  try {
    await run(
      `UPDATE cliente 
       SET nombre_cliente = ?, correo_cliente = ?, telefono_cliente = ?, 
           ciudad_cliente = ?, pais_cliente = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id_cliente = ?`,
      [nombre_cliente, correo_cliente, telefono_cliente, ciudad_cliente, pais_cliente, id_cliente]
    );
    
    // Obtener el cliente actualizado
    const updatedCliente = await getClienteById(id_cliente);
    return updatedCliente;
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    throw error;
  }
}

// Obtener todos los clientes
export async function getAllClientes() {
  try {
    const result = await query('SELECT * FROM cliente ORDER BY nombre_cliente');
    return result;
  } catch (error) {
    console.error('Error al obtener todos los clientes:', error);
    throw error;
  }
}

// Eliminar un cliente
export async function deleteCliente(id_cliente) {
  try {
    const clienteToDelete = await getClienteById(id_cliente);
    await run('DELETE FROM cliente WHERE id_cliente = ?', [id_cliente]);
    return clienteToDelete;
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    throw error;
  }
}
