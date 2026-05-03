using System;
using System.Collections.Generic;

namespace backend.Models;

/// <summary>
/// Representa una reserva de mesa realizada por un cliente para una fecha y hora específicas.
/// </summary>
public partial class Reserva
{
    /// <summary>
    /// Identificador único de la reserva.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// ID del usuario (cliente) que realiza la reserva.
    /// </summary>
    public int UsuarioId { get; set; }

    /// <summary>
    /// ID de la mesa asignada a esta reserva.
    /// </summary>
    public int MesaId { get; set; }

    /// <summary>
    /// Día en que se espera a los comensales.
    /// </summary>
    public DateOnly FechaReserva { get; set; }

    /// <summary>
    /// Hora estimada de llegada.
    /// </summary>
    public TimeOnly HoraInicio { get; set; }

    /// <summary>
    /// Hora estimada de finalización del turno.
    /// </summary>
    public TimeOnly HoraFin { get; set; }

    /// <summary>
    /// Número de personas que acudirán.
    /// </summary>
    public int NumPersonas { get; set; }

    /// <summary>
    /// Estado actual ("Pendiente", "Confirmada", "Cancelada", "Finalizada").
    /// </summary>
    public string Estado { get; set; } = null!;

    /// <summary>
    /// Tiempo límite en el que la mesa queda bloqueada mientras el usuario confirma la reserva (evita sobre-reservas).
    /// </summary>
    public DateTime? FechaExpiracionLock { get; set; }

    /// <summary>
    /// Referencia al pago de señal mediante Stripe (si se implementa depósito).
    /// </summary>
    public string? StripePaymentId { get; set; }

    /// <summary>
    /// Momento en el que se creó el registro.
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    // Propiedades de navegación
    public virtual MesasRestaurante Mesa { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
