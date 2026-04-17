using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class ProductosController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public ProductosController(U374392370ReservasContext context)
    {
        _context = context;
    }

    // GET: api/productos
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoMenu>>> GetProductos()
    {
        var productos = await _context.ProductoMenus.ToListAsync();
        return Ok(productos);
    }

    [Authorize(Roles = "jefe")]
    [HttpPost]
    public async Task<ActionResult<ProductoMenu>> CreateProducto([FromBody] ProductoMenu producto)
    {
        _context.ProductoMenus.Add(producto);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProductos), new { id = producto.Id }, producto);
    }

    [Authorize(Roles = "jefe")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProducto(int id, [FromBody] ProductoMenu producto)
    {
        if (id != producto.Id) return BadRequest();

        _context.Entry(producto).State = EntityState.Modified;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [Authorize(Roles = "jefe")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProducto(int id)
    {
        var producto = await _context.ProductoMenus.FindAsync(id);
        if (producto == null) return NotFound();

        _context.ProductoMenus.Remove(producto);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
