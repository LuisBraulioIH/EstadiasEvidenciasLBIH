const express = require('express');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

const db = new Database('cotizador.sqlite');

app.use(express.json());

app.get('/api/productos', (req, res) => {
  try {
    const query = req.query.q ? `%${req.query.q.trim()}%` : '%';
    
    const stmt = db.prepare(`
      SELECT clave, descripcion, precio, costo, existencia 
      FROM productos 
      WHERE clave LIKE ? OR descripcion LIKE ? 
      LIMIT 20
    `);
    
    const productos = stmt.all(query, query);
    res.json({ ok: true, data: productos });
  } catch (error) {
    console.error("Error al buscar productos:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/ventas/:producto', (req, res) => {
  try {
    const { producto } = req.params;

    const stmt = db.prepare(`
      SELECT id, producto, fecha, cantidad, precio, nota 
      FROM ventas 
      WHERE producto = ?
      ORDER BY fecha DESC
    `);

    const historial = stmt.all(producto);
    res.json({ ok: true, total: historial.length, data: historial });
  } catch (error) {
    console.error("Error al obtener el historial de ventas:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/predictivo', (req, res) => {
  try {
    const presupuesto = parseFloat(req.query.presupuesto) || 0;

    if (presupuesto <= 0) {
      return res.status(400).json({ ok: false, error: 'Ingresa un presupuesto mayor a 0' });
    }

    const stmt = db.prepare(`
      SELECT 
        p.clave, 
        p.descripcion, 
        COALESCE(AVG(v.precio), p.precio, 0) as precio_calculado,
        COUNT(v.id) as total_ventas
      FROM productos p
      INNER JOIN ventas v ON p.clave = v.producto
      GROUP BY p.clave
      HAVING precio_calculado > 0
      ORDER BY total_ventas DESC, precio_calculado ASC
    `);

    const productosPopulares = stmt.all();

    let acumulado = 0;
    const paqueteSugerido = [];

    for (const prod of productosPopulares) {
      const precioProd = Number(prod.precio_calculado.toFixed(2));
      
      if (acumulado + precioProd <= presupuesto) {
        const unidades = Math.floor((presupuesto - acumulado) / precioProd);
        const unidadesAjustadas = unidades > 5 ? 5 : unidades;

        if (unidadesAjustadas > 0) {
          const subtotal = Number((unidadesAjustadas * precioProd).toFixed(2));
          acumulado += subtotal;

          paqueteSugerido.push({
            clave: prod.clave,
            descripcion: prod.descripcion,
            precio: precioProd,
            cantidad: unidadesAjustadas,
            subtotal: subtotal
          });
        }
      }

      if (acumulado >= presupuesto) break;
    }

    res.json({
      ok: true,
      presupuesto_ingresado: presupuesto,
      total_cotizado: Number(acumulado.toFixed(2)),
      saldo_restante: Number((presupuesto - acumulado).toFixed(2)),
      paquete: paqueteSugerido
    });

  } catch (error) {
    console.error("Error en la cotización predictiva:", error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});