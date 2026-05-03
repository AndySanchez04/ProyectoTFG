using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa la cantidad exacta de un ingrediente que se requiere para elaborar un producto del menú.
/// </summary>
public class RecetaProducto
{
    /// <summary>
    /// Identificador único del vínculo ingrediente-producto.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID del producto del menú que se va a elaborar.
    /// </summary>
    public int ProductoMenuId { get; set; }

    /// <summary>
    /// ID del artículo del inventario (ingrediente) necesario.
    /// </summary>
    public int ArticuloInventarioId { get; set; }

    /// <summary>
    /// Cantidad del artículo de inventario que se descuenta al vender una unidad del producto de menú.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal CantidadUsada { get; set; }

    // Propiedades de navegación
    [ForeignKey("ProductoMenuId")]
    public virtual ProductoMenu ProductoMenu { get; set; } = null!;

    [ForeignKey("ArticuloInventarioId")]
    public virtual ArticuloInventario ArticuloInventario { get; set; } = null!;
}
