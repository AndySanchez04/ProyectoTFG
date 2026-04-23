using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Authorization;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Microsoft.Extensions.Configuration;

namespace backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ResenasController : ControllerBase
    {
        private readonly U374392370ReservasContext _context;
        private readonly IConfiguration _configuration;

        public ResenasController(U374392370ReservasContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // GET: api/Resenas
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Resena>>> GetResenas()
        {
            return await _context.Resenas.OrderByDescending(r => r.Fecha).ToListAsync();
        }

        // POST: api/Resenas
        [HttpPost]
        public async Task<ActionResult<Resena>> PostResena(Resena resena)
        {
            resena.Fecha = DateTime.Now;
            _context.Resenas.Add(resena);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetResenas", new { id = resena.Id }, resena);
        }

        // POST: api/Resenas/responder/{id}
        [Authorize(Roles = "jefe")]
        [HttpPost("responder/{id}")]
        public async Task<IActionResult> Responder(int id, [FromBody] string respuesta)
        {
            var resena = await _context.Resenas.FindAsync(id);
            if (resena == null) return NotFound();

            resena.RespuestaJefe = respuesta;
            await _context.SaveChangesAsync();

            // Enviar correo si hay email de usuario
            if (!string.IsNullOrEmpty(resena.UsuarioEmail))
            {
                try
                {
                    var message = new MimeMessage();
                    message.From.Add(new MailboxAddress(_configuration["Email:SenderName"], _configuration["Email:SenderEmail"]));
                    message.To.Add(new MailboxAddress(resena.UsuarioNombre, resena.UsuarioEmail));
                    message.Subject = "Mild & Limon respondió tu comentario...";

                    message.Body = new TextPart("html")
                    {
                        Text = $@"
                            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eab308; border-radius: 15px; background-color: #000000; color: #ffffff;'>
                                <div style='text-align: center; margin-bottom: 20px;'>
                                    <h2 style='color: #eab308; margin: 0; font-size: 24px;'>Mild & Limon</h2>
                                    <p style='color: #888; font-size: 12px; margin-top: 5px;'>Respuesta a tu reseña</p>
                                </div>
                                <div style='background-color: #111; padding: 15px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #eab308;'>
                                    <p style='color: #aaa; font-size: 13px; margin: 0;'>Tu comentario:</p>
                                    <p style='font-style: italic; margin-top: 5px;'>""{resena.Comentario}""</p>
                                </div>
                                <div style='padding: 5px 15px;'>
                                    <p style='font-size: 16px; line-height: 1.6;'>{respuesta}</p>
                                </div>
                                <div style='text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #333;'>
                                    <p style='color: #999; font-size: 12px;'>¡Gracias por visitarnos!</p>
                                </div>
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
                    // Log error but don't fail the response
                    Console.WriteLine($"Error enviando correo: {ex.Message}");
                }
            }

            return Ok(new { message = "Respuesta guardada y correo enviado." });
        }
    }
}
