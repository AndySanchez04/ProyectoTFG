using Microsoft.AspNetCore.Mvc;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using System.IO;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public UsuariosController(U374392370ReservasContext context)
        {
            _context = context;
        }

        // TODO: En un futuro, añadir aquí un endpoint (ej: [Authorize(Roles = "jefe")])
        // o validación manual del rol para gestionar roles y empleados.
        // Solo el rol 'jefe' tendrá permisos para crear o modificar empleados.

        [Authorize(Roles = "jefe")]
        [HttpGet]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Select(u => new { u.Id, u.Nombre, u.Email, u.Rol })
                .ToListAsync();
            return Ok(usuarios);
        }

        [Authorize(Roles = "jefe")]
        [HttpPut("{id}/rol")]
        public async Task<IActionResult> UpdateRol(int id, [FromBody] UpdateRolDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (id.ToString() == userIdStr)
            {
                return BadRequest(new { message = "No puedes cambiarte tu propio rol" });
            }

            var user = await _context.Usuarios.FindAsync(id);
            if (user == null) return NotFound(new { message = "Usuario no encontrado" });

            user.Rol = dto.Rol;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Rol actualizado correctamente" });
        }

        [Authorize]
        [HttpGet("perfil")]
        public async Task<IActionResult> GetPerfil()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Usuarios.FindAsync(userId);
            if (user == null) return NotFound();

            return Ok(new { user.Nombre, user.Email, user.Telefono, user.FotoPerfil });
        }

        [Authorize]
        [HttpPut("perfil")]
        public async Task<IActionResult> UpdatePerfil([FromBody] UpdatePerfilDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Usuarios.FindAsync(userId);
            if (user == null) return NotFound();

            user.Nombre = dto.Nombre;
            user.Telefono = dto.Telefono;
            user.FotoPerfil = dto.FotoPerfil;
            
            await _context.SaveChangesAsync();
            return Ok(new { message = "Perfil actualizado" });
        }

        [Authorize]
        [HttpPost("upload-foto")]
        public async Task<IActionResult> UploadFoto([FromForm] IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No se ha seleccionado ningún archivo.");

            // Validar extensión
            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".gif" };
            var extension = Path.GetExtension(file.FileName).ToLower();
            if (!extensionesPermitidas.Contains(extension))
                return BadRequest("Extensión de archivo no permitida. Solo se admiten JPG, PNG y GIF.");

            // Crear directorio si no existe (en wwwroot)
            var pathRaiz = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "perfiles");
            if (!Directory.Exists(pathRaiz))
            {
                Directory.CreateDirectory(pathRaiz);
            }

            // Nombre único para el archivo
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";
            var pathCompleto = Path.Combine(pathRaiz, nombreArchivo);

            using (var stream = new FileStream(pathCompleto, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Retornar la URL relativa para que el frontend la use
            // Asumiendo que el backend corre en el puerto configurado y sirve estáticos de wwwroot
            var url = $"http://localhost:5105/images/perfiles/{nombreArchivo}";
            return Ok(new { url });
        }
    }

    public class UpdatePerfilDto
    {
        public string Nombre { get; set; } = null!;
        public string? Telefono { get; set; }
        public string? FotoPerfil { get; set; }
    }

    public class UpdateRolDto
    {
        public string Rol { get; set; } = null!;
    }
}
