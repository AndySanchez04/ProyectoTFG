using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un pedido o cuenta asociada a una mesa específica. Agrupa múltiples líneas de pedido (platos/bebidas).
/// </summary>
public class Comanda
{
    /// <summary>
    /// Identificador único de la comanda.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID de la mesa a la que pertenece la comanda.
    /// </summary>
    public int MesaId { get; set; }
    
    /// <summary>
    /// ID del usuario (camarero) que abrió la comanda.
    /// </summary>
    public int UsuarioId { get; set; }

    /// <summary>
    /// ID de la reserva asociada (opcional, si los clientes vinieron con reserva previa).
    /// </summary>
    public int? ReservaId { get; set; }

    /// <summary>
    /// Estado actual de la comanda. Valores típicos: "Abierta", "Cerrada".
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Abierta";

    /// <summary>
    /// Fecha y hora en la que se abrió la comanda.
    /// </summary>
    public DateTime FechaHora { get; set; } = DateTime.Now;

    // Propiedades de navegación (Relaciones con otras tablas)
    [ForeignKey("MesaId")]
    public virtual MesasRestaurante Mesa { get; set; } = null!;

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; } = null!; // Camarero

    [ForeignKey("ReservaId")]
    public virtual Reserva? Reserva { get; set; }

    public virtual ICollection<LineaComanda> Lineas { get; set; } = new List<LineaComanda>();
    public virtual Factura? Factura { get; set; }
}
