using System;
using System.Collections.Generic;

namespace backend.Models;

public partial class MesasRestaurante
{
    public int Id { get; set; }

    public string NumeroMesa { get; set; } = null!;

    public int Capacidad { get; set; }

    public string Zona { get; set; } = null!;

    public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}
