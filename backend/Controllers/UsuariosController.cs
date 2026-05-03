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
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    /// <summary>
    /// Controlador para la gestión de Perfiles de usuario, roles de empleados y subida de avatares.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class UsuariosController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;

        public UsuariosController(U374392370ReservasContext context)
        {
            _context = context;
        }

        /// <summary>
        /// (Solo Jefe) Lista todos los usuarios registrados en el sistema para gestión de roles B2B.
        /// </summary>
        [Authorize(Roles = "jefe")]
        [HttpGet]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Select(u => new { u.Id, u.Nombre, u.Email, u.Rol })
                .ToListAsync();
            return Ok(usuarios);
        }

        /// <summary>
        /// (Solo Jefe) Cambia el rol de otro usuario (ej. de Cliente a Camarero). Previene quitarse el rol a uno mismo.
        /// </summary>
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

        /// <summary>
        /// Obtiene el perfil completo del usuario que hace la petición.
        /// </summary>
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

        /// <summary>
        /// Actualiza los datos personales básicos (nombre, teléfono) del perfil activo.
        /// </summary>
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

        /// <summary>
        /// Sube un archivo de imagen al servidor (wwwroot/images/perfiles) para usarlo como avatar.
        /// Valida la extensión permitida para evitar inyección de código.
        /// </summary>
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
            var url = $"{Request.Scheme}://{Request.Host}/images/perfiles/{nombreArchivo}";
            return Ok(new { url });
        }
    }

    public class UpdatePerfilDto
    {
        public string Nombre { get; set; } = null!;
        
        [RegularExpression(@"^(\+34|0034|34)?[6789]\d{8}$", ErrorMessage = "El teléfono debe ser un número válido español de 9 dígitos (ej. 600123456) con o sin prefijo +34")]
        public string? Telefono { get; set; }
        public string? FotoPerfil { get; set; }
    }

    public class UpdateRolDto
    {
        public string Rol { get; set; } = null!;
    }
}
