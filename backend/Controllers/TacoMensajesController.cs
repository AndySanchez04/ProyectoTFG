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
    public class TacoMensajesController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public TacoMensajesController(U374392370ReservasContext context)
        {
            _context = context;
        }

        // GET: api/TacoMensajes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TacoMensaje>>> GetTacoMensajes()
        {
            return await _context.TacoMensajes.ToListAsync();
        }

        // POST: api/TacoMensajes
        [HttpPost]
        [Authorize(Roles = "jefe")]
        public async Task<ActionResult<TacoMensaje>> PostTacoMensaje(TacoMensaje mensaje)
        {
            _context.TacoMensajes.Add(mensaje);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTacoMensajes", new { id = mensaje.Id }, mensaje);
        }

        // DELETE: api/TacoMensajes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "jefe")]
        public async Task<IActionResult> DeleteTacoMensaje(int id)
        {
            var mensaje = await _context.TacoMensajes.FindAsync(id);
            if (mensaje == null)
            {
                return NotFound();
            }

            _context.TacoMensajes.Remove(mensaje);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
