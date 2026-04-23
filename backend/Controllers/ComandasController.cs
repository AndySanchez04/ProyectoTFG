using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ComandasController : ControllerBase
{
    private readonly U374392370ReservasContext _context;
    private readonly IHubContext<RestauranteHub> _hubContext;

    public ComandasController(U374392370ReservasContext context, IHubContext<RestauranteHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // GET: api/comandas/bebidas-pendientes
    [HttpGet("bebidas-pendientes")]
    public async Task<ActionResult<IEnumerable<object>>> GetBebidasPendientes()
    {
        // Categorías que consideramos bebidas
        var categoriasBebida = new[] { "Bebidas", "Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros" };

        var bebidasPendientes = await _context.LineasComanda
            .Include(l => l.Comanda)
                .ThenInclude(c => c.Usuario)
            .Include(l => l.ProductoMenu)
            .Where(l => l.Servida == false && 
                   categoriasBebida.Contains(l.ProductoMenu.Categoria)) // Asumiendo que existe ProductoMenu.Categoria
            .Select(l => new 
            {
                IdPedido = l.Id,
                Mesa = l.Comanda.Mesa.NumeroMesa, // ✅ Fix: Solo el string del número de la mesa, no el objeto entero
                Cantidad = l.Cantidad,
                NombreBebida = l.ProductoMenu.Nombre,
                Camarero = l.Comanda.Usuario.Nombre
            })
            .ToListAsync();

        return Ok(bebidasPendientes);
    }

    // GET: api/comandas/cocina
    [HttpGet("cocina")]
    public async Task<ActionResult<IEnumerable<object>>> GetComandasCocina()
    {
        var categoriasBebida = new[] { "Bebidas", "Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros" };

        // 1. Obtener los IDs de las comandas que tienen al menos un plato (no bebida) por servir
        var comandaIdsActivas = await _context.LineasComanda
            .Include(l => l.ProductoMenu)
            .Where(l => !l.Servida && !categoriasBebida.Contains(l.ProductoMenu.Categoria))
            .Select(l => l.ComandaId)
            .Distinct()
            .ToListAsync();

        // 2. Obtener todas las líneas (que no sean bebidas) de esas comandas activas
        var lineasDeInteres = await _context.LineasComanda
            .Include(l => l.Comanda)
                .ThenInclude(c => c.Mesa)
            .Include(l => l.ProductoMenu)
            .Where(l => comandaIdsActivas.Contains(l.ComandaId) && 
                   !categoriasBebida.Contains(l.ProductoMenu.Categoria))
            .ToListAsync();

        var ticketsPorMesa = lineasDeInteres
            .GroupBy(l => new { l.Comanda.Mesa.NumeroMesa, l.Comanda.FechaHora })
            .Select(g => new
            {
                Mesa = g.Key.NumeroMesa,
                FechaHora = g.Key.FechaHora, 
                Platos = g.Select(l => new 
                {
                    IdLinea = l.Id,
                    Cantidad = l.Cantidad,
                    NombrePlato = l.ProductoMenu.Nombre,
                    Notas = l.Notas,
                    Servida = l.Servida
                }).ToList()
            })
            .OrderBy(t => t.FechaHora)
            .ToList();

        return Ok(ticketsPorMesa);
    }

    // GET: api/comandas/barra
    [HttpGet("barra")]
    public async Task<ActionResult<IEnumerable<object>>> GetComandasBarra()
    {
        var categoriasBebida = new[] { "Bebidas", "Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros" };

        var comandaIdsActivas = await _context.LineasComanda
            .Include(l => l.ProductoMenu)
            .Where(l => !l.Servida && categoriasBebida.Contains(l.ProductoMenu.Categoria))
            .Select(l => l.ComandaId)
            .Distinct()
            .ToListAsync();

        var lineasDeInteres = await _context.LineasComanda
            .Include(l => l.Comanda)
                .ThenInclude(c => c.Mesa)
            .Include(l => l.Comanda)
                .ThenInclude(c => c.Usuario)
            .Include(l => l.ProductoMenu)
            .Where(l => comandaIdsActivas.Contains(l.ComandaId) && 
                   categoriasBebida.Contains(l.ProductoMenu.Categoria))
            .ToListAsync();

        var ticketsPorMesa = lineasDeInteres
            .GroupBy(l => new { l.Comanda.Mesa.NumeroMesa, l.Comanda.FechaHora, l.Comanda.Usuario.Nombre })
            .Select(g => new
            {
                Mesa = g.Key.NumeroMesa,
                FechaHora = g.Key.FechaHora,
                Camarero = g.Key.Nombre,
                Bebidas = g.Select(l => new 
                {
                    IdLinea = l.Id,
                    Cantidad = l.Cantidad,
                    NombreBebida = l.ProductoMenu.Nombre,
                    Notas = l.Notas,
                    Servida = l.Servida
                }).ToList()
            })
            .OrderBy(t => t.FechaHora)
            .ToList();

        return Ok(ticketsPorMesa);
    }

    // GET: api/comandas/historial-cocina
    [HttpGet("historial-cocina")]
    public async Task<ActionResult<IEnumerable<object>>> GetHistorialCocina()
    {
        var categoriasBebida = new[] { "Bebidas", "Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros" };
        
        var ahora = DateTime.Now;
        var primerDiaMes = new DateTime(ahora.Year, ahora.Month, 1);
        var ultimoDiaMes = primerDiaMes.AddMonths(1).AddTicks(-1);

        var historial = await _context.Comandas
            .Include(c => c.Mesa)
            .Include(c => c.Usuario)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.ProductoMenu)
            .Where(c => c.FechaHora >= primerDiaMes && c.FechaHora <= ultimoDiaMes)
            // Comandas que tienen platos (no bebidas) y todos ellos están servidos
            .Where(c => c.Lineas.Any(l => !categoriasBebida.Contains(l.ProductoMenu.Categoria)) &&
                        c.Lineas.Where(l => !categoriasBebida.Contains(l.ProductoMenu.Categoria)).All(l => l.Servida))
            .OrderByDescending(c => c.FechaHora)
            .Select(c => new
            {
                IdComanda = c.Id,
                Mesa = c.Mesa.NumeroMesa,
                FechaHora = c.FechaHora,
                Camarero = c.Usuario.Nombre,
                Platos = c.Lineas
                    .Where(l => !categoriasBebida.Contains(l.ProductoMenu.Categoria))
                    .Select(l => new
                    {
                        Nombre = l.ProductoMenu.Nombre,
                        Cantidad = l.Cantidad,
                        PrecioUnitario = l.PrecioUnitario,
                        Subtotal = l.Cantidad * l.PrecioUnitario,
                        Notas = l.Notas
                    }).ToList(),
                TotalComanda = c.Lineas
                    .Where(l => !categoriasBebida.Contains(l.ProductoMenu.Categoria))
                    .Sum(l => (double)l.Cantidad * (double)l.PrecioUnitario)
            })
            .ToListAsync();

        return Ok(historial);
    }

    // GET: api/comandas/historial-barra
    [HttpGet("historial-barra")]
    public async Task<ActionResult<IEnumerable<object>>> GetHistorialBarra()
    {
        var categoriasBebida = new[] { "Bebidas", "Cervezas", "Vinos", "Refrescos", "Zumos y Batidos", "Copas", "Cócteles", "Tequila y Mezcal", "Otros" };
        
        var ahora = DateTime.Now;
        var primerDiaMes = new DateTime(ahora.Year, ahora.Month, 1);
        var ultimoDiaMes = primerDiaMes.AddMonths(1).AddTicks(-1);

        var historial = await _context.Comandas
            .Include(c => c.Mesa)
            .Include(c => c.Usuario)
            .Include(c => c.Lineas)
                .ThenInclude(l => l.ProductoMenu)
            .Where(c => c.FechaHora >= primerDiaMes && c.FechaHora <= ultimoDiaMes)
            // Comandas que tienen bebidas y todas ellas están servidas
            .Where(c => c.Lineas.Any(l => categoriasBebida.Contains(l.ProductoMenu.Categoria)) &&
                        c.Lineas.Where(l => categoriasBebida.Contains(l.ProductoMenu.Categoria)).All(l => l.Servida))
            .OrderByDescending(c => c.FechaHora)
            .Select(c => new
            {
                IdComanda = c.Id,
                Mesa = c.Mesa.NumeroMesa,
                FechaHora = c.FechaHora,
                Camarero = c.Usuario.Nombre,
                Bebidas = c.Lineas
                    .Where(l => categoriasBebida.Contains(l.ProductoMenu.Categoria))
                    .Select(l => new
                    {
                        Nombre = l.ProductoMenu.Nombre,
                        Cantidad = l.Cantidad,
                        PrecioUnitario = l.PrecioUnitario,
                        Subtotal = l.Cantidad * l.PrecioUnitario,
                        Notas = l.Notas
                    }).ToList(),
                TotalBebidas = c.Lineas
                    .Where(l => categoriasBebida.Contains(l.ProductoMenu.Categoria))
                    .Sum(l => (double)l.Cantidad * (double)l.PrecioUnitario)
            })
            .ToListAsync();

        return Ok(historial);
    }

    // PUT: api/comandas/linea/{id}/servir
    [HttpPut("linea/{id}/servir")]
    public async Task<IActionResult> MarcarComoServida(int id)
    {
        var linea = await _context.LineasComanda.FindAsync(id);

        if (linea == null)
        {
            return NotFound(new { mensaje = "Línea de comanda no encontrada." });
        }

        linea.Servida = true;

        try
        {
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ActualizarDatos");
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!LineaComandaExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return Ok(new { mensaje = "Bebida marcada como servida correctamente." });
    }

    // POST: api/comandas
    [HttpPost]
    public async Task<ActionResult<Comanda>> PostComanda([FromBody] CrearComandaDto comandaDto)
    {
        // 1. Obtener el ID del Usuario (Camarero) desde el token JWT
        var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int usuarioId))
        {
            return Unauthorized("Token inválido o no contiene el ID del usuario.");
        }

        // 2. Buscar la ID de la Mesa por su Numero (ej. "T-1")
        var mesa = await _context.MesasRestaurantes.FirstOrDefaultAsync(m => m.NumeroMesa == comandaDto.Mesa);
        if (mesa == null)
        {
            return BadRequest($"La mesa {comandaDto.Mesa} no existe en la base de datos.");
        }

        // 2.5 Buscar si hay una reserva activa AHORA MISMO para esta mesa
        // (Asumimos que si la hora cae entra HoraInicio y HoraFin de hoy, es válida)
        var horaActual = TimeOnly.FromDateTime(DateTime.Now);
        var fechaActual = DateOnly.FromDateTime(DateTime.Today);
        var reservaVigente = await _context.Reservas
            .Where(r => r.MesaId == mesa.Id && 
                        r.FechaReserva == fechaActual &&
                        r.HoraInicio <= horaActual && r.HoraFin >= horaActual &&
                        r.Estado == "confirmada")
            .FirstOrDefaultAsync();

        // 3. Crear la cabecera de la Comanda
        var nuevaComanda = new Comanda
        {
            MesaId = mesa.Id,
            UsuarioId = usuarioId,
            ReservaId = reservaVigente?.Id, // Asignar la reserva si existe
            Estado = "Abierta"
        };

        _context.Comandas.Add(nuevaComanda);
        await _context.SaveChangesAsync();

        // 4. Añadir las Líneas de la Comanda
        foreach (var item in comandaDto.Items)
        {
            // Obtener el precio para guardarlo histórico en la línea
            var producto = await _context.ProductoMenus.FindAsync(item.ProductoId);
            if (producto == null) continue; // Ignorar si el producto no existe

            var linea = new LineaComanda
            {
                ComandaId = nuevaComanda.Id,
                ProductoMenuId = item.ProductoId,
                Cantidad = item.Cantidad,
                PrecioUnitario = producto.Precio,
                Notas = item.Notas,
                Servida = false
            };
            
            _context.LineasComanda.Add(linea);
        }

        await _context.SaveChangesAsync();
        await _hubContext.Clients.All.SendAsync("ActualizarDatos");

        return CreatedAtAction(nameof(GetBebidasPendientes), new { id = nuevaComanda.Id }, new { mensaje = "Comanda creada exitosamente", comandaId = nuevaComanda.Id });
    }

    private bool LineaComandaExists(int id)
    {
        return _context.LineasComanda.Any(e => e.Id == id);
    }
}

// DTOs para la lectura del JSON del body
public class CrearComandaDto
{
    public string Mesa { get; set; } = null!;
    public List<CrearLineaComandaDto> Items { get; set; } = new List<CrearLineaComandaDto>();
}

public class CrearLineaComandaDto
{
    public int ProductoId { get; set; }
    public int Cantidad { get; set; }
    public string? Notas { get; set; }
}
