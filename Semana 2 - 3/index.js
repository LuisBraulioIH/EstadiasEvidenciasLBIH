const express = require('express');
const { query } = require('./DB');

const app = express();
app.use(express.json());

app.get('/api/productos', async (req, res) => {
    try {
        const sql = `
            SELECT 
                clave,
                nombre,
                categoria,
                precio,
                costo,
                stock,
                codigo_barras
            FROM productos
            LIMIT 20
        `;
        
        const productos = await query(sql);
        res.json({
            success: true,
            count: productos.length,
            data: productos
        });
    } catch (error) {
        console.error('Error al consultar SQLite:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener productos',
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});