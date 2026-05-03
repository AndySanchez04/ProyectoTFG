using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa a un trabajador del restaurante. Usado para gestión interna y nóminas.
/// Nota: Los accesos al sistema se controlan mediante la clase Usuario, no Empleado.
/// </summary>
public class Empleado
{
    /// <summary>
    /// Identificador único del empleado.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Nombre(s) del empleado.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    /// <summary>
    /// Apellidos del empleado.
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Apellidos { get; set; } = null!;

    /// <summary>
    /// Documento Nacional de Identidad del empleado.
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string DNI { get; set; } = null!;

    /// <summary>
    /// Correo electrónico de contacto del empleado.
    /// </summary>
    [Required]
    [MaxLength(150)]
    public string Correo { get; set; } = null!;

    /// <summary>
    /// Teléfono de contacto.
    /// </summary>
    [MaxLength(50)]
    public string? Telefono { get; set; }

    /// <summary>
    /// Salario base mensual del empleado, utilizado en el cálculo de gastos fijos.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Sueldo { get; set; }

    /// <summary>
    /// Cargo o puesto que ocupa (ej. camarero, jefe de sala, jefe de cocina, etc).
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Rango { get; set; } = null!; 
}
