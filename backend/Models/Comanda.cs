using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Comanda
{
    [Key]
    public int Id { get; set; }

    public int MesaId { get; set; }
    
    public int UsuarioId { get; set; }

    public int? ReservaId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Abierta"; // "Abierta", "Cerrada"

    public DateTime FechaHora { get; set; } = DateTime.Now;

    // Navigation properties
    [ForeignKey("MesaId")]
    public virtual MesasRestaurante Mesa { get; set; } = null!;

    [ForeignKey("UsuarioId")]
    public virtual Usuario Usuario { get; set; } = null!; // Camarero

    [ForeignKey("ReservaId")]
    public virtual Reserva? Reserva { get; set; }

    public virtual ICollection<LineaComanda> Lineas { get; set; } = new List<LineaComanda>();
    public virtual Factura? Factura { get; set; }
}
