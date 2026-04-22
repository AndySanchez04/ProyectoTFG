using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class Empleado
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    [Required]
    [MaxLength(100)]
    public string Apellidos { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string DNI { get; set; } = null!;

    [Required]
    [MaxLength(150)]
    public string Correo { get; set; } = null!;

    [MaxLength(50)]
    public string? Telefono { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Sueldo { get; set; }

    [Required]
    [MaxLength(50)]
    public string Rango { get; set; } = null!; // camarero, jefe de sala, jefe de cocina, ayudante de cocina, cocinero, jefe
}
