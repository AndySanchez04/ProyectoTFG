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

            // TAREA 3: Limpieza inicial
            // Las mesas antiguas que no tienen el nuevo formato de prefijos y que no están en "Sala del fondo"
            // las reasignamos a "Sala del fondo" para que no interfieran con las nuevas distribuciones.
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
                    // Upsert: Si ya existe, actualizamos sus datos (Update)
                    mesaExistente.Capacidad = mesa.Capacidad;
                    mesaExistente.Zona = mesa.Zona;
                    context.MesasRestaurantes.Update(mesaExistente);
                }
                else
                {
                    // Upsert: Si no existe, la creamos (Insert)
                    context.MesasRestaurantes.Add(new MesasRestaurante
                    {
                        NumeroMesa = mesa.NumeroMesa,
                        Capacidad = mesa.Capacidad,
                        Zona = mesa.Zona
                    });
                }
            }

            // TAREA 3: Insertar Menú Real
            var productosNuevos = new List<ProductoMenu>
            {
                new ProductoMenu { Nombre = "Tacos al Pastor (3ud)", Precio = 8.50m, Categoria = "Tacos" },
                new ProductoMenu { Nombre = "Tacos de Cochinita", Precio = 9.00m, Categoria = "Tacos" },
                new ProductoMenu { Nombre = "Tacos Veganos", Precio = 8.00m, Categoria = "Tacos" },
                new ProductoMenu { Nombre = "Quesadilla Sincronizada", Precio = 6.50m, Categoria = "Quesadillas" },
                new ProductoMenu { Nombre = "Quesadilla de Pollo", Precio = 7.50m, Categoria = "Quesadillas" },
                new ProductoMenu { Nombre = "Quesadilla de Champiñones", Precio = 7.00m, Categoria = "Quesadillas" },
                new ProductoMenu { Nombre = "Burger Clásica", Precio = 10.00m, Categoria = "Hamburguesas" },
                new ProductoMenu { Nombre = "Burger Doble Smash", Precio = 13.50m, Categoria = "Hamburguesas" },
                new ProductoMenu { Nombre = "Nachos con Queso", Precio = 8.00m, Categoria = "Nachos" },
                new ProductoMenu { Nombre = "Nachos Machos Completos", Precio = 12.50m, Categoria = "Nachos" },
                new ProductoMenu { Nombre = "Enchiladas Verdes", Precio = 14.00m, Categoria = "Especialidades" },
                new ProductoMenu { Nombre = "Fajitas Mixtas", Precio = 16.50m, Categoria = "Especialidades" },
                new ProductoMenu { Nombre = "Patatas Bravas", Precio = 6.00m, Categoria = "Raciones" },
                new ProductoMenu { Nombre = "Calamares a la Andaluza", Precio = 10.00m, Categoria = "Raciones" },
                new ProductoMenu { Nombre = "Croquetas Caseras", Precio = 8.50m, Categoria = "Raciones" },
                new ProductoMenu { Nombre = "Tarta de Queso", Precio = 6.50m, Categoria = "Postres" },
                new ProductoMenu { Nombre = "Brownie con Helado", Precio = 6.00m, Categoria = "Postres" },
                
                new ProductoMenu { Nombre = "Caña", Precio = 2.00m, Categoria = "Cervezas" },
                new ProductoMenu { Nombre = "Doble", Precio = 3.00m, Categoria = "Cervezas" },
                new ProductoMenu { Nombre = "Tercio IPA", Precio = 4.50m, Categoria = "Cervezas" },
                new ProductoMenu { Nombre = "Coca-Cola", Precio = 2.50m, Categoria = "Refrescos" },
                new ProductoMenu { Nombre = "Fanta Naranja", Precio = 2.50m, Categoria = "Refrescos" },
                new ProductoMenu { Nombre = "Agua con Gas", Precio = 2.00m, Categoria = "Refrescos" },
                new ProductoMenu { Nombre = "Margarita Clásica", Precio = 8.00m, Categoria = "Cócteles" },
                new ProductoMenu { Nombre = "Mojito Cubano", Precio = 7.50m, Categoria = "Cócteles" },
                new ProductoMenu { Nombre = "Piña Colada", Precio = 8.00m, Categoria = "Cócteles" }
            };

            foreach (var producto in productosNuevos)
            {
                if (!context.ProductoMenus.Any(p => p.Nombre == producto.Nombre))
                {
                    context.ProductoMenus.Add(producto);
                }
            }

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

            // Guardamos las nuevas inserciones y actualizaciones
            context.SaveChanges();
        }
    }
}
