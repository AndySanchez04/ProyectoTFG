using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Gasto
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Tipo { get; set; } = null!; // "Sueldo", "General"

    [Required]
    [MaxLength(255)]
    public string Descripcion { get; set; } = null!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }

    public DateTime Fecha { get; set; }

    public int? UsuarioId { get; set; } // Opcional, para sueldos

    // Navigation properties
    [ForeignKey("UsuarioId")]
    public virtual Usuario? Usuario { get; set; }
}
