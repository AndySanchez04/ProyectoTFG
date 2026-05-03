using System;
using System.Collections.Generic;

namespace backend.Models;

/// <summary>
/// Entidad principal para la gestión de acceso al sistema (autenticación).
/// Agrupa tanto a clientes como a trabajadores (camareros, cocineros, jefes).
/// </summary>
public partial class Usuario
{
    /// <summary>
    /// Identificador único del usuario.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Nombre completo o alias del usuario.
    /// </summary>
    public string Nombre { get; set; } = null!;

    /// <summary>
    /// Correo electrónico usado para iniciar sesión. Debe ser único.
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Contraseña encriptada mediante BCrypt. NUNCA se guarda en texto plano.
    /// </summary>
    public string PasswordHash { get; set; } = null!;

    /// <summary>
    /// Teléfono de contacto.
    /// </summary>
    public string? Telefono { get; set; }

    /// <summary>
    /// Nivel de privilegios ("jefe", "camarero", "cocinero", "cliente").
    /// </summary>
    public string Rol { get; set; } = null!;

    /// <summary>
    /// Ruta o URL a la imagen de perfil del usuario.
    /// </summary>
    public string? FotoPerfil { get; set; }

    /// <summary>
    /// Fecha en la que el usuario se registró en el sistema.
    /// </summary>
    public DateTime? FechaRegistro { get; set; }

    // Propiedades de navegación
    public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();

    // Propiedades para registro mediante invitación (Magic Link B2B)
    /// <summary>
    /// Token único enviado por email para que un empleado establezca su contraseña.
    /// </summary>
    public string? InvitationToken { get; set; }
    
    /// <summary>
    /// Fecha límite de validez del token de invitación.
    /// </summary>
    public DateTime? TokenExpiration { get; set; }
    
    /// <summary>
    /// Indica si la cuenta está habilitada.
    /// </summary>
    public bool IsActive { get; set; } = true;
}
