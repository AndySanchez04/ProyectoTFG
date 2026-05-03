using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un ítem vendible en la carta del restaurante (platos, bebidas, postres).
/// </summary>
public class ProductoMenu
{
    /// <summary>
    /// Identificador único del producto en el menú.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Nombre del plato o bebida (ej. "Hamburguesa Especial").
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = null!;

    /// <summary>
    /// Descripción para el cliente o lista de alérgenos.
    /// </summary>
    [MaxLength(255)]
    public string? Descripcion { get; set; }

    /// <summary>
    /// Precio de venta al público (PVP).
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Precio { get; set; }

    /// <summary>
    /// Clasificación del producto (ej. "Entrante", "Bebida").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Categoria { get; set; } = null!;

    /// <summary>
    /// Bandera que indica si el producto se puede pedir (no está agotado).
    /// </summary>
    public bool Disponible { get; set; } = true;

    // Propiedades de navegación
    public virtual ICollection<LineaComanda> LineasComanda { get; set; } = new List<LineaComanda>();
    public virtual ICollection<RecetaProducto> Recetas { get; set; } = new List<RecetaProducto>();
}
