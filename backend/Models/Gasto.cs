using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un gasto económico registrado en el restaurante (ej. pago de nóminas, compra de suministros, facturas de luz).
/// </summary>
public class Gasto
{
    /// <summary>
    /// Identificador único del gasto.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Categoría o tipo de gasto (ej. "Sueldo", "General", "Suministros").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Tipo { get; set; } = null!; // "Sueldo", "General"

    /// <summary>
    /// Descripción detallada del gasto.
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Descripcion { get; set; } = null!;

    /// <summary>
    /// Cantidad de dinero gastada.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Monto { get; set; }

    /// <summary>
    /// Fecha en la que se incurrió o se registró el gasto.
    /// </summary>
    public DateTime Fecha { get; set; }

    /// <summary>
    /// ID del usuario o empleado asociado (opcional, útil para pagos de nóminas).
    /// </summary>
    public int? UsuarioId { get; set; } // Opcional, para sueldos

    // Propiedades de navegación
    [ForeignKey("UsuarioId")]
    public virtual Usuario? Usuario { get; set; }
}
