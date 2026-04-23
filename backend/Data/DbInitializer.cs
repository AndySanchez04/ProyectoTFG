using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Linq;
using System.Collections.Generic;

namespace backend.Data
{
    public static class DbInitializer
    {
        public static void Initialize(IServiceProvider serviceProvider)
        {
            using var context = new U374392370ReservasContext(
                serviceProvider.GetRequiredService<DbContextOptions<U374392370ReservasContext>>());

            // Asegurar que la base de datos y las tablas existen
            context.Database.EnsureCreated();

            // Crear tabla Empleados si no existe porque EnsureCreated no la crea si la BD ya existía
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS Empleados (
                    Id INT AUTO_INCREMENT PRIMARY KEY,
                    Nombre VARCHAR(100) NOT NULL,
                    Apellidos VARCHAR(100) NOT NULL,
                    DNI VARCHAR(20) NOT NULL,
                    Correo VARCHAR(150) NOT NULL,
                    Telefono VARCHAR(50),
                    Sueldo DECIMAL(10,2) NOT NULL,
                    Rango VARCHAR(50) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS TacoMensajes (
                    Id INT AUTO_INCREMENT PRIMARY KEY,
                    Texto VARCHAR(255) NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS Resenas (
                    Id INT AUTO_INCREMENT PRIMARY KEY,
                    UsuarioNombre VARCHAR(255) NOT NULL,
                    UsuarioEmail VARCHAR(255),
                    UsuarioFoto TEXT,
                    Estrellas INT NOT NULL,
                    Comentario TEXT NOT NULL,
                    RespuestaJefe TEXT,
                    Fecha DATETIME NOT NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            ");

            // TAREA 3: Limpieza inicial
            var todasLasMesas = context.MesasRestaurantes.ToList();
            
            foreach (var mesa in todasLasMesas)
            {
                if (!mesa.NumeroMesa.StartsWith("T-") && !mesa.NumeroMesa.StartsWith("S-") && mesa.Zona != "Salón")
                {
                    mesa.Zona = "Salón";
                    if (!mesa.NumeroMesa.StartsWith("S-")) 
                        mesa.NumeroMesa = "S-" + mesa.NumeroMesa;
                    context.MesasRestaurantes.Update(mesa);
                }
            }
            context.SaveChanges();

            // TAREA 1 y 2: Definir con prefijos únicos y usar lógica de Upsert
            var mesasAInsertar = new List<(string NumeroMesa, int Capacidad, string Zona)>
            {
                // Terraza (Prefijo T-) de 2 y 4 pax
                ("T-5", 2, "Terraza"), ("T-10", 2, "Terraza"), ("T-15", 2, "Terraza"), ("T-20", 2, "Terraza"),
                ("T-1", 4, "Terraza"), ("T-3", 4, "Terraza"), ("T-6", 4, "Terraza"), ("T-8", 4, "Terraza"),
                ("T-11", 4, "Terraza"), ("T-13", 4, "Terraza"), ("T-16", 4, "Terraza"), ("T-18", 4, "Terraza"),
                
                // Salón (Prefijo S-) de 4 y 2 pax
                ("S-1", 4, "Salón"), ("S-2", 4, "Salón"), ("S-3", 4, "Salón"), 
                ("S-4", 4, "Salón"), ("S-6", 4, "Salón"), ("S-8", 4, "Salón"), 
                ("S-10", 4, "Salón"), ("S-5", 2, "Salón"), ("S-7", 2, "Salón"), 
                ("S-9", 2, "Salón")
            };

            foreach (var mesa in mesasAInsertar)
            {
                var mesaExistente = context.MesasRestaurantes.FirstOrDefault(m => m.NumeroMesa == mesa.NumeroMesa);
                if (mesaExistente != null)
                {
                    mesaExistente.Capacidad = mesa.Capacidad;
                    mesaExistente.Zona = mesa.Zona;
                    context.MesasRestaurantes.Update(mesaExistente);
                }
                else
                {
                    context.MesasRestaurantes.Add(new MesasRestaurante
                    {
                        NumeroMesa = mesa.NumeroMesa,
                        Capacidad = mesa.Capacidad,
                        Zona = mesa.Zona
                    });
                }
            }

            // TAREA: Insertar Categorías del Menú
            var categoriasBasicas = new[] {
                "Cervezas", "Vinos", "Refrescos", "MenuDiario", "Postres", 
                "Tacos", "Quesadillas", "Hamburguesas", "Nachos", 
                "Raciones", "Zumos y Batidos", "Copas", "Ensaladas", "Especialidades", "Cócteles",
                "Otros", "Tequila y Mezcal"
            };

            // TAREA: Renombrar categorías erróneas en productos antes de limpiar
            var productosConEntrante = context.ProductosMenus.Where(p => p.Categoria == "Entrante" || p.Categoria == "Entrantes").ToList();
            foreach (var p in productosConEntrante)
            {
                p.Categoria = "Postres";
                context.ProductosMenus.Update(p);
            }
            context.SaveChanges();

            var categoriasActuales = context.CategoriasMenu.ToList();
            foreach (var catActual in categoriasActuales)
            {
                if (!categoriasBasicas.Contains(catActual.Nombre))
                {
                    context.CategoriasMenu.Remove(catActual);
                }
            }

            foreach (var cat in categoriasBasicas)
            {
                if (!context.CategoriasMenu.Any(c => c.Nombre == cat))
                {
                    context.CategoriasMenu.Add(new CategoriaMenu { Nombre = cat });
                }
            }
            context.SaveChanges();

            // TAREA 3: Los productos se gestionan desde el panel de control.

            // TAREA 3: Insertar Usuarios de Prueba para Testing de Roles
            var usuariosPrueba = new List<Usuario>
            {
                new Usuario { Nombre = "Jefe", Email = "jefe@restaurante.com", Telefono = "111111111", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), Rol = "jefe", FechaRegistro = DateTime.UtcNow },
                new Usuario { Nombre = "Camarero", Email = "camarero@restaurante.com", Telefono = "222222222", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), Rol = "camarero", FechaRegistro = DateTime.UtcNow },
                new Usuario { Nombre = "Cocinero", Email = "cocinero@restaurante.com", Telefono = "333333333", PasswordHash = BCrypt.Net.BCrypt.HashPassword("123456"), Rol = "cocinero", FechaRegistro = DateTime.UtcNow }
            };

            foreach (var u in usuariosPrueba)
            {
                if (!context.Usuarios.Any(x => x.Email == u.Email))
                {
                    context.Usuarios.Add(u);
                }
            }

            // TAREA 4: Insertar Inventario Base de Cocina y Sala
            var articulosInventario = new List<ArticuloInventario>
            {
                new ArticuloInventario { Nombre = "Cochinita", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pulled pork", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pastor", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Chorizo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Costillas", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Beicon", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Jamón york", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Birria", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Entrecots", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Entraña", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Rabo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Hamburguesa grande", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Hamburguesa smash", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Chili carne", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Solomillo ternera", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Alambre", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Solomillo pollo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pollo árabe", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Fingers", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Hamburguesa pollo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cachete", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Oreja de cerdo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Frijoles negros cocidos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Gallo dulce", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Carnitas", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Atún", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Gambón", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Cola de langostinos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Zumo de naranja", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Zumo de melocotón", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Zumo de piña", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Mantequilla", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Harina de arroz", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Leche entera", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Carne huera (veganos)", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Mix quesos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Brioche para torrija", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Salsa barbacoa", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Mostaza", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Ketchup", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Mayonesa", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Aceite para cocinar", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Aceite para freir", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Soja", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Nata para montar", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Nata para cocinar", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Tequeños de trigo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Salsa Maggi", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Salsa Perrins", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Leche condensada", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Azúcar glass", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Levadura Royal", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Azúcar blanco", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Azúcar moreno", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Miel", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Sal maldon", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Lima verde botella", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Sal fina", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Vinagre", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Comino", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Cilantro seco", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pimentón dulce", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Cayena", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pimienta negra", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Orégano", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Ajo en polvo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Sweet chili", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Harina fingers", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Cebolla en polvo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Queso crema", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Queso en dados", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Gouda para Hamburguesa", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cheddar para Hamburguesa", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Rulo de cabra", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Parmesano", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Coulant de chocolate", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Sirope chocolate", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Sirope fresa", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Sirope naranja", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Brioche para rabo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Margarina", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pepinillos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Huevos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Fresas congeladas", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Nachos amarillos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Nachos azules", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Tortillas 12cm azul", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Tortillas 12cm amarilla", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Tortillas 25cm maíz", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Tortillas 25cm trigo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Tomatillo verde", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Maíz dulce", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Frijoles negros", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Frijoles pintos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Guacamole", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Champiñones", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Jalapeños", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Chipotle adobado", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Achiote", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Chile ancho", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Chile guajillo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Colorante rojo", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Salsas picantes", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Pulpas zumos", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Clamato", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Salsa Valentina", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Aguas de tamarindo, guanabana y Jamaica", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Tequeños de maíz", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Helado de vainilla", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Helado de fresa", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Helado de chocolate", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Salsa de ostras", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Pan de Hamburguesa sin gluten", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Picatostes", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pastillas knor de pollo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cebolla frita", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Tequeños de chocolate", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Jalapeños rellenos", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Pan de hamburguesa normal", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Helado de pistacho", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Canela molida", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Salsa brava", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Vainilla", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Cerveza sol", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza dos XX", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza desperados", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza Heineken", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza Daura sin gluten", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza freedam", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza pacífico", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza modelo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza modelo negra", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza corona", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza alhambra", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza tostada 0,0", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza Mahou 5 estrellas", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza 1906", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza estrella Galicia", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Cerveza Mahou sin gluten", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Botella vino Ramón Bilbao", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Protos Roble", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Pruno", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Habla del Silencia", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Protos", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Albariño", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Dulce María", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vino Godello", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Refresco 33cl (Cocacola, Fanta, Nestea, Aquarius, Trina, sprite)", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Tinto verano", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Agua 500ml", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Agua 1l", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Agua con gas", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Botella ginebra normal", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella ginebra premium", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella ron normal", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella ron premium", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella whisky normal", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella whisky premium", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vodka normal", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Botella vermut", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Gaseosa", CantidadActual = 10m, UnidadMedida = "Litros", PrecioCoste = 3.50m },
                new ArticuloInventario { Nombre = "Tequila José Cuervo reposado", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Tequila José Cuervo especial", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Mezcal Gusano Rojo", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Tequila El Jimador", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Crema de tequila de mango", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Hierbabuena", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Limas", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Hielo", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
                new ArticuloInventario { Nombre = "Botella de granadina", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 15.00m },
                new ArticuloInventario { Nombre = "Bote de Tajín", CantidadActual = 10m, UnidadMedida = "Unidad", PrecioCoste = 1.50m },
                new ArticuloInventario { Nombre = "Limón", CantidadActual = 10m, UnidadMedida = "Kg", PrecioCoste = 10.00m },
            };

            foreach (var articulo in articulosInventario)
            {
                if (!context.ArticulosInventario.Any(a => a.Nombre == articulo.Nombre))
                {
                    context.ArticulosInventario.Add(articulo);
                }
            }

            // Guardamos las nuevas inserciones y actualizaciones
            context.SaveChanges();
        }
    }
}
