using System;
using System.Collections.Generic;

namespace backend.Models;

/// <summary>
/// Representa una mesa física dentro del restaurante, disponible para asignación y reservas.
/// </summary>
public partial class MesasRestaurante
{
    /// <summary>
    /// Identificador único de la mesa en base de datos.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Etiqueta o número visual de la mesa (ej. "1", "12B", "VIP").
    /// </summary>
    public string NumeroMesa { get; set; } = null!;

    /// <summary>
    /// Cantidad máxima de comensales que pueden sentarse en esta mesa.
    /// </summary>
    public int Capacidad { get; set; }

    /// <summary>
    /// Zona del restaurante donde está ubicada (ej. "Salón", "Terraza").
    /// </summary>
    public string Zona { get; set; } = null!;

    public virtual ICollection<Reserva> Reservas { get; set; } = new List<Reserva>();
}
