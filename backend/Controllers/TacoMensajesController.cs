using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;

namespace backend.Controllers
{
    /// <summary>
    /// Controlador para la gestión de las frases mostradas por la mascota "Taco".
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class TacoMensajesController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public TacoMensajesController(U374392370ReservasContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Obtiene todas las frases posibles que "Taco" puede decir en la interfaz.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<TacoMensaje>>> GetTacoMensajes()
        {
            return await _context.TacoMensajes.ToListAsync();
        }

        /// <summary>
        /// (Solo Jefe) Añade una nueva frase o curiosidad al repertorio de Taco.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "jefe")]
        public async Task<ActionResult<TacoMensaje>> PostTacoMensaje(TacoMensaje mensaje)
        {
            _context.TacoMensajes.Add(mensaje);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetTacoMensajes", new { id = mensaje.Id }, mensaje);
        }

        /// <summary>
        /// (Solo Jefe) Elimina un mensaje del repertorio de Taco.
        /// </summary>
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
