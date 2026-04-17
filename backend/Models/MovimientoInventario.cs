using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class MovimientoInventario
{
    [Key]
    public int Id { get; set; }

    public int ArticuloInventarioId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Tipo { get; set; } = null!; // "Entrada", "Salida"

    [Column(TypeName = "decimal(10,2)")]
    public decimal Cantidad { get; set; }

    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    [MaxLength(255)]
    public string? Detalles { get; set; }

    // Navigation properties
    [ForeignKey("ArticuloInventarioId")]
    public virtual ArticuloInventario ArticuloInventario { get; set; } = null!;
}
