using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriasController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public CategoriasController(U374392370ReservasContext context)
        {
            _context = context;
        }

        // GET: api/categorias
        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoriaMenu>>> GetCategorias()
        {
            return await _context.CategoriasMenu.ToListAsync();
        }

        // POST: api/categorias
        [HttpPost]
        [Authorize(Roles = "jefe,camarero")]
        public async Task<ActionResult<CategoriaMenu>> PostCategoria(CategoriaMenu categoria)
        {
            _context.CategoriasMenu.Add(categoria);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCategorias), new { id = categoria.Id }, categoria);
        }

        // DELETE: api/categorias/5
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
