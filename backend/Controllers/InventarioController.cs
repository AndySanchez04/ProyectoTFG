using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

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

    // GET: api/inventario
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ArticuloInventario>>> GetInventario()
    {
        var articulos = await _context.ArticulosInventario.ToListAsync();
        return Ok(articulos);
    }

    // POST: api/inventario
    [Authorize(Roles = "jefe")]
    [HttpPost]
    public async Task<ActionResult<ArticuloInventario>> CreateArticulo([FromBody] ArticuloInventario articulo)
    {
        _context.ArticulosInventario.Add(articulo);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetInventario), new { id = articulo.Id }, articulo);
    }

    // PUT: api/inventario/5
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

    // DELETE: api/inventario/5
    [Authorize(Roles = "jefe")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteArticulo(int id)
    {
        var articulo = await _context.ArticulosInventario.FindAsync(id);
        if (articulo == null) return NotFound();

        _context.ArticulosInventario.Remove(articulo);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool ArticuloExists(int id)
    {
        return _context.ArticulosInventario.Any(e => e.Id == id);
    }
}
