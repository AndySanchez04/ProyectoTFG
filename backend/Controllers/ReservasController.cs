using Microsoft.AspNetCore.Mvc;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.IO;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.AspNetCore.SignalR;

namespace backend.Controllers
{
    /// <summary>
    /// Controlador principal para el manejo de Reservas de mesas.
    /// Incluye algoritmos de disponibilidad, bloqueos temporales, cancelaciones y notificaciones por correo.
    /// </summary>
    [Route("api/reservas")]
    [ApiController]
    public class ReservasController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;
        private readonly IConfiguration _configuration;
        private readonly IHubContext<RestauranteHub> _hubContext;

        public ReservasController(U374392370ReservasContext context, IConfiguration configuration, IHubContext<RestauranteHub> hubContext)
        {
            _context = context;
            _configuration = configuration;
            _hubContext = hubContext;
        }

        /// <summary>
        /// Busca mesas libres que cumplan los requisitos de capacidad y zona en una fecha/hora específicas.
        /// </summary>
        [HttpGet("disponibles")]
        public async Task<IActionResult> GetMesasLibres([FromQuery] int capacidad, [FromQuery] DateTime fecha, [FromQuery] TimeSpan horaInicio, [FromQuery] string zona)
        {
            var dateOnly = DateOnly.FromDateTime(fecha);
            var timeOnly = TimeOnly.FromTimeSpan(horaInicio);

            // 1. Obtener todas las reservas solapadas
            var reservasOcupadas = await _context.Reservas
                .Where(r => r.FechaReserva == dateOnly && r.HoraInicio == timeOnly)
                .Where(r => r.Estado == "Confirmada" || (r.Estado == "Pendiente" && r.FechaExpiracionLock > DateTime.UtcNow))
                .Select(r => r.MesaId)
                .ToListAsync();

            // 2. Obtener mesas que cumplan la zona y capacidad >= y no estén ocupadas
            var mesasPosibles = await _context.MesasRestaurantes
                .Where(m => m.Zona == zona && m.Capacidad >= capacidad)
                .ToListAsync();

            var mesasLibres = mesasPosibles.Where(m => !reservasOcupadas.Contains(m.Id)).ToList();

            if (!mesasLibres.Any())
                return Ok(mesasLibres);

            // 3. Regla de optimización: SOLO las mesas con la capacidad mínima posible que sirva para el grupo
            var minCapacidad = mesasLibres.Min(m => m.Capacidad);
            var mesasOptimizadas = mesasLibres.Where(m => m.Capacidad == minCapacidad).ToList();

            return Ok(mesasOptimizadas);
        }

        /// <summary>
        /// Bloquea una mesa temporalmente (5 minutos) mientras el usuario completa el proceso de reserva.
        /// Previene "Race conditions" (dos usuarios intentando reservar la misma mesa a la vez).
        /// </summary>
        [Authorize]
        [HttpPost("BloquearMesa")]
        public async Task<IActionResult> BloquearMesa([FromBody] CrearReservaDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var dateOnly = DateOnly.FromDateTime(dto.Fecha);
            var timeOnly = TimeOnly.FromTimeSpan(dto.HoraInicio);

            // Control de concurrencia: revisar si fue bloqueada hace milisegundos
            bool isTaken = await _context.Reservas.AnyAsync(r => 
                r.MesaId == dto.MesaId && 
                r.FechaReserva == dateOnly && 
                r.HoraInicio == timeOnly &&
                (r.Estado == "Confirmada" || (r.Estado == "Pendiente" && r.FechaExpiracionLock > DateTime.UtcNow)));

            if (isTaken)
                return BadRequest("La mesa acaba de ser reservada o bloqueada.");

            var horaFinTimeSpan = dto.HoraInicio.Add(TimeSpan.FromHours(2));
            if (horaFinTimeSpan.TotalDays >= 1)
            {
                horaFinTimeSpan = horaFinTimeSpan.Subtract(TimeSpan.FromDays(1));
            }

            var reserva = new Reserva
            {
                UsuarioId = userId,
                MesaId = dto.MesaId,
                FechaReserva = dateOnly,
                HoraInicio = timeOnly,
                HoraFin = TimeOnly.FromTimeSpan(horaFinTimeSpan),
                NumPersonas = dto.NumPersonas,
                Estado = "Pendiente",
                FechaExpiracionLock = DateTime.UtcNow.AddMinutes(5),
                CreatedAt = DateTime.UtcNow
            };

            _context.Reservas.Add(reserva);
            
            try 
            {
                await _context.SaveChangesAsync();
                await _hubContext.Clients.All.SendAsync("ActualizarDatos");
                return Ok(new { reservaId = reserva.Id });
            }
            catch (DbUpdateException)
            {
                // El Unique constraint falla si se cruzan las inserciones (MesaId, FechaReserva, HoraInicio)
                return BadRequest("La mesa acaba de ser reservada por otra persona.");
            }
        }

        /// <summary>
        /// Pasa la reserva del estado "Pendiente" (bloqueada) a "Confirmada".
        /// Se llama al finalizar el wizard de reserva.
        /// </summary>
        [Authorize]
        [HttpPost("ConfirmarReserva/{id}")]
        public async Task<IActionResult> ConfirmarReserva(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var reserva = await _context.Reservas.FirstOrDefaultAsync(r => r.Id == id && r.UsuarioId == userId);
            
            if (reserva == null)
                return NotFound("Reserva no encontrada.");

            if (reserva.Estado == "Pendiente" && reserva.FechaExpiracionLock < DateTime.UtcNow)
                return BadRequest("El tiempo de reserva ha expirado.");

            reserva.Estado = "Confirmada";
            reserva.FechaExpiracionLock = null; 

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ActualizarDatos");

            return Ok(new { message = "Reserva confirmada con éxito" });
        }

        /// <summary>
        /// Obtiene todas las reservas del usuario actualmente logueado.
        /// </summary>
        [Authorize]
        [HttpGet("mis-reservas")]
        public async Task<IActionResult> GetMisReservas()
        {
            // Intentar leer de NameIdentifier y luego de 'id' manual en caso de que cambien los claims
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("id");
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var currentDateTime = DateTime.Now;

            // Extraer solo los datos necesarios en un DTO anónimo para evitar JSON Reference Cycles
            var reservasData = await _context.Reservas
                .Include(r => r.Mesa)
                .Where(r => r.UsuarioId == userId)
                .OrderByDescending(r => r.FechaReserva).ThenByDescending(r => r.HoraInicio)
                .Select(r => new {
                    r.Id,
                    r.FechaReserva,
                    r.HoraInicio,
                    r.HoraFin,
                    r.NumPersonas,
                    r.Estado,
                    r.MesaId,
                    Mesa = new { r.Mesa.NumeroMesa, r.Mesa.Zona, r.Mesa.Capacidad }
                })
                .ToListAsync();

            // Evaluar EsActiva en memoria para evitar problemas de EF Core Translation
            var result = reservasData.Select(r => new
            {
                r.Id,
                r.FechaReserva,
                r.HoraInicio,
                r.HoraFin,
                r.NumPersonas,
                r.Estado,
                r.MesaId,
                r.Mesa,
                EsActiva = r.Estado == "Confirmada" && (r.FechaReserva.ToDateTime(r.HoraInicio) > currentDateTime)
            });

            return Ok(result);
        }



        /// <summary>
        /// Obtiene la lista completa de reservas confirmadas para el día de hoy o una fecha dada (Solo Staff).
        /// </summary>
        [Authorize(Roles = "camarero,jefe")]
        [HttpGet("hoy")]
        public async Task<IActionResult> GetReservasHoy([FromQuery] string? fecha = null)
        {
            DateOnly fechaConsulta;
            if (string.IsNullOrEmpty(fecha) || !DateOnly.TryParseExact(fecha, "yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture, System.Globalization.DateTimeStyles.None, out fechaConsulta))
            {
                fechaConsulta = DateOnly.FromDateTime(DateTime.Now);
            }
            
            var reservasHoy = await _context.Reservas
                .AsNoTracking()
                .Include(r => r.Usuario)
                .Include(r => r.Mesa)
                .Where(r => r.FechaReserva == fechaConsulta)
                .OrderBy(r => r.HoraInicio)
                .Select(r => new {
                    r.Id,
                    r.HoraInicio,
                    r.NumPersonas,
                    r.Estado,
                    Cliente = r.Usuario.Nombre,
                    Mesa = r.Mesa.NumeroMesa,
                    Zona = r.Mesa.Zona
                })
                .ToListAsync();

            return Ok(reservasHoy);
        }

        [Authorize(Roles = "camarero,jefe")]
        [HttpPut("{id}/estado")]
        public async Task<IActionResult> CambiarEstadoReserva(int id, [FromBody] CambiarEstadoDto dto)
        {
            var reserva = await _context.Reservas.FirstOrDefaultAsync(r => r.Id == id);
            if (reserva == null)
                return NotFound("Reserva no encontrada.");

            var estadosValidos = new[] { "Pendiente", "Confirmada", "Sentados", "Finalizada", "Cancelada" };
            if (!estadosValidos.Contains(dto.Estado))
                return BadRequest("Estado inválido.");

            reserva.Estado = dto.Estado;
            // Si la marcan como Cancelada o Finalizada, limpiamos el lock
            if (dto.Estado == "Cancelada" || dto.Estado == "Finalizada") {
                reserva.FechaExpiracionLock = null;
            }

            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ActualizarDatos");
            return Ok(new { message = "Estado actualizado", estado = reserva.Estado });
        }

        /// <summary>
        /// Permite a un cliente cancelar su propia reserva.
        /// </summary>
        [Authorize]
        [HttpDelete("{id}")]
        public async Task<IActionResult> CancelarReserva(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var reserva = await _context.Reservas.FirstOrDefaultAsync(r => r.Id == id && r.UsuarioId == userId);
            if (reserva == null)
                return NotFound("Reserva no encontrada.");

            _context.Reservas.Remove(reserva);
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ActualizarDatos");

            return Ok(new { message = "Reserva cancelada con éxito." });
        }

        [Authorize]
        [HttpDelete("liberar-lock/{id}")]
        public async Task<IActionResult> LiberarLock(int id)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var reserva = await _context.Reservas.FirstOrDefaultAsync(r => r.Id == id && r.UsuarioId == userId && r.Estado == "Pendiente");
            if (reserva != null)
            {
                _context.Reservas.Remove(reserva);
                await _context.SaveChangesAsync();
                await _hubContext.Clients.All.SendAsync("ActualizarDatos");
            }

            return Ok(new { message = "Mesa liberada correctamente" });
        }

        [Authorize]
        [HttpPut("{id}")]
        public async Task<IActionResult> ModificarReserva(int id, [FromBody] CrearReservaDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var reserva = await _context.Reservas.FirstOrDefaultAsync(r => r.Id == id && r.UsuarioId == userId);
            if (reserva == null)
                return NotFound("Reserva no encontrada.");

            var dateOnly = DateOnly.FromDateTime(dto.Fecha);
            var timeOnly = TimeOnly.FromTimeSpan(dto.HoraInicio);

            // Verificar si la nueva mesa está ocupada por OTRA reserva
            bool isTaken = await _context.Reservas.AnyAsync(r => 
                r.Id != id && // Excluir la reserva actual
                r.MesaId == dto.MesaId && 
                r.FechaReserva == dateOnly && 
                r.HoraInicio == timeOnly &&
                (r.Estado == "Confirmada" || (r.Estado == "Pendiente" && r.FechaExpiracionLock > DateTime.UtcNow)));

            if (isTaken)
                return BadRequest("La nueva mesa o franja horaria no está disponible.");

            var horaFinModTimeSpan = dto.HoraInicio.Add(TimeSpan.FromHours(2));
            if (horaFinModTimeSpan.TotalDays >= 1)
            {
                horaFinModTimeSpan = horaFinModTimeSpan.Subtract(TimeSpan.FromDays(1));
            }

            reserva.MesaId = dto.MesaId;
            reserva.FechaReserva = dateOnly;
            reserva.HoraInicio = timeOnly;
            reserva.HoraFin = TimeOnly.FromTimeSpan(horaFinModTimeSpan);
            reserva.NumPersonas = dto.NumPersonas;
            
            // Si la reserva era Confirmada, la mantenemos Confirmada.
            // (La regla de negocio puede variar, pero asumimos que el usuario ya validó su identidad)
            // Si era Pendiente y la modifica, también la pasaremos a confirmada si ya completó su pago original, o la dejamos igual
            
            await _context.SaveChangesAsync();
            await _hubContext.Clients.All.SendAsync("ActualizarDatos");
            return Ok(new { message = "Reserva modificada con éxito", reservaId = reserva.Id });
        }

        /// <summary>
        /// Envía un correo de confirmación de reserva al cliente, opcionalmente adjuntando un PDF justificante.
        /// </summary>
        [Authorize]
        [HttpPost("enviar-justificante")]
        public async Task<IActionResult> EnviarJustificante([FromBody] EmailDocDto dto)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized();

            var reserva = await _context.Reservas
                .Include(r => r.Usuario)
                .Include(r => r.Mesa)
                .FirstOrDefaultAsync(r => r.Id == dto.IdReserva && r.UsuarioId == userId);

            if (reserva == null) return NotFound("Reserva no encontrada");

            try
            {
                // Leer configuración de Gmail
                var smtpHost = _configuration["Email:SmtpHost"]!;
                var smtpPort = int.Parse(_configuration["Email:SmtpPort"]!);
                var senderEmail = _configuration["Email:SenderEmail"]!;
                var senderName = _configuration["Email:SenderName"]!;
                var appPassword = _configuration["Email:AppPassword"]!;

                // Construir el mensaje con MimeKit
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(senderName, senderEmail));
                message.To.Add(new MailboxAddress(reserva.Usuario.Nombre, reserva.Usuario.Email));
                message.Subject = $"¡Confirmación de Reserva #{reserva.Id} - Mild & Limon!";

                var builder = new BodyBuilder();

                builder.HtmlBody = $@"
                    <div style='font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px;background:#111;color:#fff;border-radius:12px;'>
                        <div style='text-align:center;padding:20px 0;border-bottom:2px solid #eab308;'>
                            <h1 style='color:#eab308;margin:0;letter-spacing:3px;'>MILD & LIMON</h1>
                            <p style='color:#aaa;margin:5px 0;'>Restaurante Mexicano</p>
                        </div>
                        <div style='padding:30px 0;'>
                            <h2 style='color:#fff;'>¡Hola, {reserva.Usuario.Nombre}!</h2>
                            <p style='color:#ccc;'>Tu reserva ha sido confirmada. Aquí tienes todos los detalles:</p>
                            <table style='width:100%;border-collapse:collapse;margin:20px 0;'>
                                <tr style='border-bottom:1px solid #333;'>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Código de Reserva</td>
                                    <td style='padding:12px;color:#eab308;font-family:monospace;font-size:18px;'>#{reserva.Id}</td>
                                </tr>
                                <tr style='border-bottom:1px solid #333;'>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Fecha</td>
                                    <td style='padding:12px;color:#fff;'>{reserva.FechaReserva:dd/MM/yyyy}</td>
                                </tr>
                                <tr style='border-bottom:1px solid #333;'>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Hora</td>
                                    <td style='padding:12px;color:#fff;'>{reserva.HoraInicio:hh\:mm}</td>
                                </tr>
                                <tr style='border-bottom:1px solid #333;'>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Zona</td>
                                    <td style='padding:12px;color:#fff;'>{reserva.Mesa.Zona}</td>
                                </tr>
                                <tr style='border-bottom:1px solid #333;'>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Mesa</td>
                                    <td style='padding:12px;color:#fff;'>{reserva.Mesa.NumeroMesa}</td>
                                </tr>
                                <tr>
                                    <td style='padding:12px;color:#888;font-weight:bold;'>Personas</td>
                                    <td style='padding:12px;color:#fff;'>{reserva.NumPersonas}</td>
                                </tr>
                            </table>
                            <p style='color:#ccc;'>Adjuntamos tu <strong style='color:#eab308;'>justificante en PDF</strong> para que lo presentes a tu llegada. También puedes enseñar el código QR del documento.</p>
                        </div>
                        <div style='text-align:center;padding:20px;border-top:1px solid #333;color:#666;font-size:12px;'>
                            <p>¡Te esperamos! &bull; Mild & Limon &bull; Calle Ficticia 123, Madrid</p>
                        </div>
                    </div>";

                // Adjuntar el PDF si viene en la petición
                if (!string.IsNullOrEmpty(dto.PdfBase64))
                {
                    var base64Data = dto.PdfBase64.Contains(',') ? dto.PdfBase64.Split(',')[1] : dto.PdfBase64;
                    var pdfBytes = Convert.FromBase64String(base64Data);
                    builder.Attachments.Add($"Reserva_MildLimon_{reserva.Id}.pdf", pdfBytes, ContentType.Parse("application/pdf"));
                }

                message.Body = builder.ToMessageBody();

                // Enviar via Gmail SMTP con MailKit
                using var client = new SmtpClient();
                await client.ConnectAsync(smtpHost, smtpPort, SecureSocketOptions.StartTls);
                await client.AuthenticateAsync(senderEmail, appPassword);
                await client.SendAsync(message);
                await client.DisconnectAsync(true);

                return Ok(new { message = $"Email enviado correctamente a {reserva.Usuario.Email}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Error al enviar el email: {ex.Message}");
            }
        }
    }

    public class CrearReservaDto
    {
        public int MesaId { get; set; }
        public DateTime Fecha { get; set; }
        public TimeSpan HoraInicio { get; set; }
        public int NumPersonas { get; set; }
    }

    public class CambiarEstadoDto
    {
        public string Estado { get; set; }
    }

    public class EmailDocDto
    {
        public int IdReserva { get; set; }
        public string PdfBase64 { get; set; }
    }
}
