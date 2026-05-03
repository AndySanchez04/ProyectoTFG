using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

/// <summary>
/// Controlador para la gestión de los Platos y Bebidas ofrecidos en el menú público.
/// </summary>
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

    /// <summary>
    /// Obtiene todo el catálogo de productos disponibles en el restaurante.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProductoMenu>>> GetProductos()
    {
        var productos = await _context.ProductoMenus.ToListAsync();
        return Ok(productos);
    }

    /// <summary>
    /// (Solo Jefe) Crea un nuevo plato o bebida en el sistema.
    /// </summary>
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

    /// <summary>
    /// (Solo Jefe) Elimina un producto. Evita borrado en cascada si el producto ya fue pedido en alguna comanda histórica.
    /// </summary>
    [Authorize(Roles = "jefe")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProducto(int id)
    {
        var producto = await _context.ProductoMenus.FindAsync(id);
        if (producto == null) return NotFound();

        bool hasOrders = await _context.LineasComanda.AnyAsync(l => l.ProductoMenuId == id);
        if (hasOrders)
        {
            return BadRequest("No se puede eliminar el producto porque ya tiene pedidos asociados. Por favor, desmárcalo como 'Disponible' en lugar de borrarlo para mantener el historial.");
        }

        _context.ProductoMenus.Remove(producto);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
