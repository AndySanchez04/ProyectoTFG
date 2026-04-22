using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class GastosController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public GastosController(U374392370ReservasContext context)
    {
        _context = context;
    }

    // GET: api/gastos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Gasto>>> GetGastos()
    {
        return await _context.Gastos.OrderByDescending(g => g.Fecha).ToListAsync();
    }

    // GET: api/gastos/resumen
    [HttpGet("resumen")]
    public async Task<ActionResult<object>> GetResumen()
    {
        var totalBruto = await _context.Empleados.SumAsync(e => e.Sueldo);
        var totalNeto = totalBruto * 0.82m; // Estimación del 82%
        var totalInventario = await _context.ArticulosInventario.SumAsync(a => a.CantidadActual * a.PrecioCoste);

        return Ok(new {
            totalBruto,
            totalNeto,
            totalInventario
        });
    }

    // POST: api/gastos
    [HttpPost]
    [Authorize(Roles = "jefe")]
    public async Task<ActionResult<Gasto>> PostGasto(Gasto gasto)
    {
        if (gasto.Fecha == default) gasto.Fecha = DateTime.UtcNow;
        _context.Gastos.Add(gasto);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetGastos), new { id = gasto.Id }, gasto);
    }

    // PUT: api/gastos/5
    [HttpPut("{id}")]
    [Authorize(Roles = "jefe")]
    public async Task<IActionResult> PutGasto(int id, Gasto gasto)
    {
        if (id != gasto.Id) return BadRequest();
        _context.Entry(gasto).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return NoContent();
    }

    // DELETE: api/gastos/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "jefe")]
    public async Task<IActionResult> DeleteGasto(int id)
    {
        var gasto = await _context.Gastos.FindAsync(id);
        if (gasto == null) return NotFound();
        _context.Gastos.Remove(gasto);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
