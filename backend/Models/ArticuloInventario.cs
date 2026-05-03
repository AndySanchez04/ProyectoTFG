using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un ingrediente o artículo físico almacenado en el inventario del restaurante.
/// </summary>
public class ArticuloInventario
{
    /// <summary>
    /// Identificador único del artículo.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Nombre del artículo (ej. "Tomate", "Harina").
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    /// <summary>
    /// Cantidad disponible actualmente en el inventario.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal CantidadActual { get; set; }

    /// <summary>
    /// Unidad en la que se mide el artículo (ej. "Kg", "Litros", "Unidades").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string UnidadMedida { get; set; } = null!;

    /// <summary>
    /// Precio de coste por unidad del artículo, utilizado para calcular márgenes de beneficio.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioCoste { get; set; }

    // Propiedades de navegación (Relaciones con otras tablas)
    public virtual ICollection<RecetaProducto> Recetas { get; set; } = new List<RecetaProducto>();
    public virtual ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
}
