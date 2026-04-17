using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class RecetaProducto
{
    [Key]
    public int Id { get; set; }

    public int ProductoMenuId { get; set; }

    public int ArticuloInventarioId { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal CantidadUsada { get; set; }

    // Navigation properties
    [ForeignKey("ProductoMenuId")]
    public virtual ProductoMenu ProductoMenu { get; set; } = null!;

    [ForeignKey("ArticuloInventarioId")]
    public virtual ArticuloInventario ArticuloInventario { get; set; } = null!;
}
