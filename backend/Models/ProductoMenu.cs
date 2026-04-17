using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class ProductoMenu
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    [MaxLength(255)]
    public string? Descripcion { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Precio { get; set; }

    [Required]
    [MaxLength(50)]
    public string Categoria { get; set; } = null!; // "Entrante", "Principal", "Bebida", "MenuDiario"

    public bool Disponible { get; set; } = true;

    // Navigation properties
    public virtual ICollection<LineaComanda> LineasComanda { get; set; } = new List<LineaComanda>();
    public virtual ICollection<RecetaProducto> Recetas { get; set; } = new List<RecetaProducto>();
}
