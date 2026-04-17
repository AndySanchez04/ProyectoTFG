using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class ArticuloInventario
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal CantidadActual { get; set; }

    [Required]
    [MaxLength(50)]
    public string UnidadMedida { get; set; } = null!;

    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioCoste { get; set; }

    // Navigation properties
    public virtual ICollection<RecetaProducto> Recetas { get; set; } = new List<RecetaProducto>();
    public virtual ICollection<MovimientoInventario> Movimientos { get; set; } = new List<MovimientoInventario>();
}
