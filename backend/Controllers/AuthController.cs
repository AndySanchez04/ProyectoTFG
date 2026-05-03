using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.ComponentModel.DataAnnotations;
// using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Authorization;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace backend.Controllers
{
    /// <summary>
    /// Controlador encargado de la autenticación de usuarios.
    /// Gestiona login, registro, invitaciones (B2B) y configuración de contraseñas.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(U374392370ReservasContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        /// <summary>
        /// Registra a un nuevo usuario con rol de cliente en el sistema.
        /// </summary>
        [HttpPost("registro")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var email = dto.Email.Trim().ToLower();
            if (await _context.Usuarios.AnyAsync(u => u.Email.ToLower() == email))
                return BadRequest("El usuario ya existe");

            var user = new Usuario
            {
                Nombre = dto.Nombre,
                Email = email,
                Telefono = dto.Telefono,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                Rol = "cliente",
                FechaRegistro = DateTime.UtcNow,
                IsActive = true
            };

            _context.Usuarios.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Usuario registrado correctamente" });
        }

        /// <summary>
        /// Inicia sesión verificando credenciales y devuelve un token JWT en una cookie.
        /// </summary>
        [HttpPost("login")]
        [EnableRateLimiting("LoginPolicy")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var email = dto.Email?.Trim().ToLower();
            
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (user == null) {
                return Unauthorized("Credenciales incorrectas");
            }
            
            if (!user.IsActive)
                return Unauthorized("Tu cuenta está pendiente de activación. Por favor, revisa tu correo electrónico para configurar tu contraseña.");

            bool isPasswordValid = false;
            try
            {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            }
            catch (Exception ex)
            {
                // Fallback para usuarios antiguos guardados en texto plano
                isPasswordValid = (user.PasswordHash == dto.Password);
            }

            if (!isPasswordValid) {
                return Unauthorized("Credenciales incorrectas");
            }

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Nombre),
                    new Claim(ClaimTypes.Role, user.Rol)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                Issuer = _configuration["Jwt:Issuer"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var jwtString = tokenHandler.WriteToken(token);

            Response.Cookies.Append("jwt", jwtString, new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(7)
            });

            return Ok(new { 
                token = jwtString,
                usuario = new { user.Id, user.Nombre, user.Email, user.FotoPerfil, user.Rol } 
            });
        }

        /// <summary>
        /// Obtiene el perfil del usuario autenticado a partir del token JWT.
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetMe()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var user = await _context.Usuarios.FindAsync(userId);
            if (user == null || !user.IsActive)
                return Unauthorized();

            return Ok(new { user.Id, user.Nombre, user.Email, user.FotoPerfil, user.Rol });
        }

        /// <summary>
        /// Cierra la sesión eliminando la cookie con el JWT.
        /// </summary>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Append("jwt", "", new CookieOptions
            {
                HttpOnly = true,
                Secure = true,
                SameSite = SameSiteMode.None,
                Expires = DateTime.UtcNow.AddDays(-1)
            });

            return Ok(new { message = "Sesión cerrada correctamente" });
        }

        /// <summary>
        /// (Solo Jefe) Envía un correo de invitación a un nuevo empleado (Magic Link) para configurar su cuenta.
        /// </summary>
        [Authorize(Roles = "jefe")]
        [HttpPost("invite")]
        public async Task<IActionResult> Invite([FromBody] InviteDto dto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("El usuario ya existe");

            var token = Guid.NewGuid().ToString("N");

            var user = new Usuario
            {
                Nombre = "Pendiente",
                Email = dto.Email,
                PasswordHash = "",
                Rol = dto.Rol,
                FechaRegistro = DateTime.UtcNow,
                IsActive = false,
                InvitationToken = token,
                TokenExpiration = DateTime.UtcNow.AddDays(7)
            };

            _context.Usuarios.Add(user);
            await _context.SaveChangesAsync();

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(_configuration["Email:SenderName"], _configuration["Email:SenderEmail"]));
                message.To.Add(new MailboxAddress(user.Email, user.Email));
                message.Subject = "Invitación a Mild & Limon";

                var magicLink = $"http://localhost:5173/setup-password?token={token}";

                message.Body = new TextPart("html")
                {
                    Text = $@"
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eab308; border-radius: 10px; background-color: #000000; color: #ffffff;'>
                            <h2 style='color: #eab308; text-align: center;'>Bienvenido a Mild & Limon</h2>
                            <p style='color: #cccccc;'>Hola,</p>
                            <p style='color: #cccccc;'>Has sido invitado a unirte al equipo como <strong>{dto.Rol.ToUpper()}</strong>.</p>
                            <p style='color: #cccccc;'>Por favor, haz clic en el siguiente botón para configurar tu nombre y contraseña y activar tu cuenta:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{magicLink}' style='background-color: #eab308; color: #000000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;'>Configurar mi cuenta</a>
                            </div>
                            <p style='color: #999999; font-size: 12px;'>Este enlace expirará en 24 horas.</p>
                        </div>
                    "
                };

                var smtpHost = _configuration["Email:SmtpHost"]!;
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"]!);
                var smtpUser = _configuration["Email:SenderEmail"]!;
                var smtpPass = _configuration["Email:AppPassword"]!;

                using var client = new SmtpClient();
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(smtpUser, smtpPass);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                // En caso de fallo de correo, eliminamos el usuario para permitir reintentos (o podríamos simplemente devolver un error)
                _context.Usuarios.Remove(user);
                await _context.SaveChangesAsync();
                return StatusCode(500, $"Error al enviar el correo de invitación: {ex.Message}");
            }

            return Ok(new { message = "Invitación enviada correctamente" });
        }

        /// <summary>
        /// Establece la contraseña de un usuario mediante el token de invitación enviado por correo.
        /// </summary>
        [HttpPost("setup-password")]
        public async Task<IActionResult> SetupPassword([FromBody] SetupPasswordDto dto)
        {
            var user = await _context.Usuarios.FirstOrDefaultAsync(u => u.InvitationToken == dto.Token);
            
            if (user == null || user.TokenExpiration < DateTime.UtcNow)
                return BadRequest("El enlace es inválido o ha expirado.");

            if (user.IsActive)
                return BadRequest("La cuenta ya está activa.");

            user.Nombre = dto.Nombre;
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            user.IsActive = true;
            user.InvitationToken = null;
            user.TokenExpiration = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cuenta configurada correctamente" });
        }
    }

    public class RegisterDto
    {
        public string Nombre { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        
        [RegularExpression(@"^(\+34|0034|34)?[6789]\d{8}$", ErrorMessage = "El teléfono debe ser un número válido español de 9 dígitos (ej. 600123456) con o sin prefijo +34")]
        public string? Telefono { get; set; }
    }

    public class LoginDto
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class InviteDto
    {
        public string Email { get; set; }
        public string Rol { get; set; }
    }

    public class SetupPasswordDto
    {
        public string Token { get; set; }
        public string Nombre { get; set; }
        public string Password { get; set; }
    }
}
