using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class Reserva
{
    public int Id { get; set; }

    public int UsuarioId { get; set; }

    public int MesaId { get; set; }

    public DateOnly FechaReserva { get; set; }

    public TimeOnly HoraInicio { get; set; }

    public TimeOnly HoraFin { get; set; }

    public int NumPersonas { get; set; }

    public string Estado { get; set; } = null!;

    public DateTime? FechaExpiracionLock { get; set; }

    public string? StripePaymentId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual MesasRestaurante Mesa { get; set; } = null!;

    public virtual Usuario Usuario { get; set; } = null!;
}
