using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Factura
{
    [Key]
    public int Id { get; set; }

    public int ComandaId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Subtotal { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Impuestos { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Descuento { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Total { get; set; }

    [Required]
    [MaxLength(50)]
    public string MetodoPago { get; set; } = null!;

    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("ComandaId")]
    public virtual Comanda Comanda { get; set; } = null!;
}
