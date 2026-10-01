const Database = require('better-sqlite3');
const Firebird = require('node-firebird');

const db = new Database('cotizador.sqlite');

db.exec(`
  DROP TABLE IF EXISTS productos;
  DROP TABLE IF EXISTS ventas;

  CREATE TABLE productos (
    clave TEXT PRIMARY KEY,
    descripcion TEXT,
    precio REAL,
    costo REAL,
    existencia REAL
  );

  CREATE TABLE ventas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    producto TEXT,
    fecha TEXT,
    cantidad REAL,
    precio REAL,
    nota TEXT
  );
`);

const options = {
  host: '127.0.0.1',
  port: 3050,
  database: 'C:/Users/luisb/OneDrive/Documentos/Estadias Recursos/CAJA50.FDB',
  user: 'SYSDBA',
  password: 'masterkey',
  lowercase_keys: false
};

Firebird.attach(options, (err, fbDb) => {
  if (err) {
    console.error("Error conexion Firebird:", err.message);
    return;
  }
  
  console.log("Conectado a Firebird");

  const queryProductos = 'SELECT PRODUCTO, DESCRIPCIO FROM CATINVEN';
  
  fbDb.query(queryProductos, (err, productos) => {
    if (err) {
      console.error("Error productos:", err.message);
      fbDb.detach();
      return;
    }

    const insertProd = db.prepare(`
      INSERT OR REPLACE INTO productos (clave, descripcion, precio, costo, existencia)
      VALUES (?, ?, ?, ?, ?)
    `);

    const migrarProductos = db.transaction((rows) => {
      for (const row of rows) {
        insertProd.run(
          row.PRODUCTO ? row.PRODUCTO.trim() : '',
          row.DESCRIPCIO ? row.DESCRIPCIO.trim() : '',
          0,
          0,
          0
        );
      }
    });

    migrarProductos(productos);
    console.log(`Productos migrados: ${productos.length}`);

    const queryVentas = 'SELECT PRODUCTO, FECHA, CANTIDAD, PRECIO, NOTA FROM DVENTAS';

    fbDb.query(queryVentas, (err, ventas) => {
      if (err) {
        console.error("Error ventas:", err.message);
        fbDb.detach();
        return;
      }

      const insertVenta = db.prepare(`
        INSERT INTO ventas (producto, fecha, cantidad, precio, nota)
        VALUES (?, ?, ?, ?, ?)
      `);

      const migrarVentas = db.transaction((rows) => {
        for (const row of rows) {
          insertVenta.run(
            row.PRODUCTO ? row.PRODUCTO.trim() : '',
            row.FECHA ? row.FECHA.toString() : '',
            row.CANTIDAD || 0,
            row.PRECIO || 0,
            row.NOTA ? row.NOTA.trim() : ''
          );
        }
      });

      migrarVentas(ventas);
      console.log(`Ventas migradas: ${ventas.length}`);

      fbDb.detach();
      console.log("Migracion finalizada");
    });
  });
});