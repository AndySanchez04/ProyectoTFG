using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class EmpleadosController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public EmpleadosController(U374392370ReservasContext context)
    {
        _context = context;
    }

    // GET: api/empleados
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Empleado>>> GetEmpleados()
    {
        return await _context.Empleados.ToListAsync();
    }

    // GET: api/empleados/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Empleado>> GetEmpleado(int id)
    {
        var empleado = await _context.Empleados.FindAsync(id);
        if (empleado == null) return NotFound();
        return empleado;
    }

    // POST: api/empleados
    [HttpPost]
    [Authorize(Roles = "jefe")]
    public async Task<ActionResult<Empleado>> PostEmpleado(Empleado empleado)
    {
        _context.Empleados.Add(empleado);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetEmpleado), new { id = empleado.Id }, empleado);
    }

    // PUT: api/empleados/5
    [HttpPut("{id}")]
    [Authorize(Roles = "jefe")]
    public async Task<IActionResult> PutEmpleado(int id, Empleado empleado)
    {
        if (id != empleado.Id) return BadRequest();

        _context.Entry(empleado).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EmpleadoExists(id)) return NotFound();
            else throw;
        }

        return NoContent();
    }

    // DELETE: api/empleados/5
    [HttpDelete("{id}")]
    [Authorize(Roles = "jefe")]
    public async Task<IActionResult> DeleteEmpleado(int id)
    {
        var empleado = await _context.Empleados.FindAsync(id);
        if (empleado == null) return NotFound();

        _context.Empleados.Remove(empleado);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool EmpleadoExists(int id)
    {
        return _context.Empleados.Any(e => e.Id == id);
    }
}
