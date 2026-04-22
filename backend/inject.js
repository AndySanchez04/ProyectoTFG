const fs = require('fs');

let code = fs.readFileSync('Data/DbInitializer.cs', 'utf8');
const items = fs.readFileSync('items_to_insert.txt', 'utf8');

const injection = `
            // TAREA 4: Insertar Inventario Base de Cocina y Sala
            var articulosInventario = new List<ArticuloInventario>
            {
${items}
            };

            foreach (var articulo in articulosInventario)
            {
                if (!context.ArticulosInventario.Any(a => a.Nombre == articulo.Nombre))
                {
                    context.ArticulosInventario.Add(articulo);
                }
            }
`;

const marker = '            // Guardamos las nuevas inserciones y actualizaciones';
if (code.includes(marker)) {
    code = code.replace(marker, injection + '\n' + marker);
    fs.writeFileSync('Data/DbInitializer.cs', code);
    console.log('Injected successfully');
} else {
    console.log('Marker not found');
}
