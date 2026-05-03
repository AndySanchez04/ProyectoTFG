using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    /// <summary>
    /// Controlador para la gestión de las Categorías del menú (ej. Postres, Bebidas).
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public CategoriasController(U374392370ReservasContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtiene todas las categorías disponibles.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoriaMenu>>> GetCategorias()
        {
            return await _context.CategoriasMenu.ToListAsync();
        }

        /// <summary>
        /// Crea una nueva categoría (Solo Jefe y Camareros).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "jefe,camarero")]
        public async Task<ActionResult<CategoriaMenu>> PostCategoria(CategoriaMenu categoria)
        {
            _context.CategoriasMenu.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategorias), new { id = categoria.Id }, categoria);
        }

        /// <summary>
        /// Elimina una categoría por su ID (Solo Jefe).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "jefe")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.CategoriasMenu.FindAsync(id);
            if (categoria == null)
            {
                return NotFound(new { message = "Categoría no encontrada" });
            }

            _context.CategoriasMenu.Remove(categoria);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
