using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

/// <summary>
/// Controlador para la gestión de ingredientes y productos físicos del almacén.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class InventarioController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public InventarioController(U374392370ReservasContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Lista todos los artículos del inventario actual.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArticuloInventario>>> GetInventario()
    {
        var articulos = await _context.ArticulosInventario.ToListAsync();
        return Ok(articulos);
    }

    /// <summary>
    /// (Solo Jefe) Añade un nuevo artículo al catálogo del almacén.
    /// </summary>
    [Authorize(Roles = "jefe")]
    [HttpPost]
    public async Task<ActionResult<ArticuloInventario>> CreateArticulo([FromBody] ArticuloInventario articulo)
    {
        _context.ArticulosInventario.Add(articulo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInventario), new { id = articulo.Id }, articulo);
    }

    /// <summary>
    /// (Solo Jefe) Actualiza la cantidad o el coste de un artículo existente.
    /// </summary>
    [Authorize(Roles = "jefe")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateArticulo(int id, [FromBody] ArticuloInventario articulo)
    {
        if (id != articulo.Id) return BadRequest();

        _context.Entry(articulo).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!ArticuloExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    /// <summary>
    /// (Solo Jefe) Intenta eliminar un artículo. Contiene protección contra borrado en cascada
    /// si el artículo tiene un historial de movimientos financieros.
    /// </summary>
    [Authorize(Roles = "jefe")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArticulo(int id)
    {
        var articulo = await _context.ArticulosInventario.FindAsync(id);
        if (articulo == null) return NotFound();

        bool hasMovements = await _context.MovimientosInventario.AnyAsync(m => m.ArticuloInventarioId == id);
        if (hasMovements)
        {
            return BadRequest("No se puede eliminar este artículo porque tiene movimientos en el historial. Por favor, ajusta su stock a cero en lugar de borrarlo.");
        }

        _context.ArticulosInventario.Remove(articulo);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ArticuloExists(int id)
    {
        return _context.ArticulosInventario.Any(e => e.Id == id);
    }
}
