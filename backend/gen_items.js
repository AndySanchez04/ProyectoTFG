const fs = require('fs');

const list = `Cochinita
Pulled pork
Pastor
Chorizo
Costillas
Beicon
Jamón york
Birria
Entrecots
Entraña
Rabo
Hamburguesa grande
Hamburguesa smash
Chili carne
Solomillo ternera
Alambre
Solomillo pollo
Pollo árabe
Fingers
Hamburguesa pollo
Cachete
Oreja de cerdo
Frijoles negros cocidos
Gallo dulce
Carnitas
Atún
Gambón
Cola de langostinos
Zumo de naranja
Zumo de melocotón
Zumo de piña
Mantequilla
Harina de arroz
Leche entera
Carne huera (veganos)
Mix quesos
Brioche para torrija
Salsa barbacoa
Mostaza
Ketchup
Mayonesa
Aceite para cocinar
Aceite para freir
Soja
Nata para montar
Nata para cocinar
Tequeños de trigo
Salsa Maggi
Salsa Perrins
Leche condensada
Azúcar glass
Levadura Royal
Azúcar blanco
Azúcar moreno
Miel
Sal maldon
Lima verde botella
Sal fina
Vinagre
Comino
Cilantro seco
Pimentón dulce
Cayena
Pimienta negra
Orégano
Ajo en polvo
Sweet chili
Harina fingers
Cebolla en polvo
Queso crema
Queso en dados
Gouda para Hamburguesa
Cheddar para Hamburguesa
Rulo de cabra
Parmesano
Coulant de chocolate
Sirope chocolate
Sirope fresa
Sirope naranja
Brioche para rabo
Margarina
Pepinillos
Huevos
Fresas congeladas
Nachos amarillos
Nachos azules
Tortillas 12cm azul
Tortillas 12cm amarilla
Tortillas 25cm maíz
Tortillas 25cm trigo
Tomatillo verde
Maíz dulce
Frijoles negros
Frijoles pintos
Guacamole
Champiñones
Jalapeños
Chipotle adobado
Achiote
Chile ancho
Chile guajillo
Colorante rojo
Salsas picantes
Pulpas zumos
Clamato
Salsa Valentina
Aguas de tamarindo, guanabana y Jamaica
Tequeños de maíz
Helado de vainilla
Helado de fresa
Helado de chocolate
Salsa de ostras
Pan de Hamburguesa sin gluten
Picatostes
Pastillas knor de pollo
Cebolla frita
Tequeños de chocolate
Jalapeños rellenos
Pan de hamburguesa normal
Helado de pistacho
Canela molida
Salsa brava
Vainilla
Cerveza sol
Cerveza dos XX
Cerveza desperados
Cerveza Heineken
Cerveza Daura sin gluten
Cerveza freedam
Cerveza pacífico
Cerveza modelo
Cerveza modelo negra
Cerveza corona
Cerveza alhambra
Cerveza tostada 0,0
Cerveza Mahou 5 estrellas
Cerveza 1906
Cerveza estrella Galicia
Cerveza Mahou sin gluten
Botella vino Ramón Bilbao
Botella vino Protos Roble
Botella vino Pruno
Botella vino Habla del Silencia
Botella vino Protos
Botella vino Albariño
Botella vino Dulce María
Botella vino Godello
Refresco 33cl (Cocacola, Fanta, Nestea, Aquarius, Trina, sprite)
Tinto verano
Agua 500ml
Agua 1l
Agua con gas
Botella ginebra normal
Botella ginebra premium
Botella ron normal
Botella ron premium
Botella whisky normal
Botella whisky premium
Botella vodka normal
Botella vermut
Gaseosa
Tequila José Cuervo reposado
Tequila José Cuervo especial
Mezcal Gusano Rojo
Tequila El Jimador
Crema de tequila de mango
Hierbabuena
Limas
Hielo
Botella de granadina
Bote de Tajín
Limón`;

const items = list.split('\n').filter(Boolean).map(name => {
  name = name.trim();
  let unidad = 'Kg';
  let price = '10.00m';
  const nl = name.toLowerCase();
  
  if (nl.includes('zumo') || nl.includes('leche') || nl.includes('aceite') || nl.includes('salsa') || nl.includes('vinagre') || nl.includes('soja') || nl.includes('nata') || nl.includes('agua') || nl.includes('gaseosa') || nl.includes('colorante') || nl.includes('clamato') || nl.includes('helado')) {
    unidad = 'Litros';
    price = '3.50m';
  } else if (nl.includes('botella') || nl.includes('cerveza') || nl.includes('refresco') || nl.includes('tequila') || nl.includes('mezcal') || nl.includes('hamburguesa') || nl.includes('tequeño') || nl.includes('coulant') || nl.includes('brioche') || nl.includes('tortilla') || nl.includes('pastilla') || nl.includes('bote')) {
    unidad = 'Unidad';
    price = '1.50m';
    if(nl.includes('botella') || nl.includes('tequila') || nl.includes('mezcal') || nl.includes('vino')) {
       price = '15.00m';
    }
  }

  return `                new ArticuloInventario { Nombre = "${name.replace(/"/g, '\\"')}", CantidadActual = 10m, UnidadMedida = "${unidad}", PrecioCoste = ${price} },`;
});

fs.writeFileSync('items_to_insert.txt', items.join('\n'));
