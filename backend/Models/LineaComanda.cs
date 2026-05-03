using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un artículo específico (plato o bebida) dentro de un pedido (Comanda).
/// </summary>
public class LineaComanda
{
    /// <summary>
    /// Identificador único de la línea de pedido.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID de la comanda a la que pertenece este artículo.
    /// </summary>
    public int ComandaId { get; set; }

    /// <summary>
    /// ID del producto del menú solicitado.
    /// </summary>
    public int ProductoMenuId { get; set; }

    /// <summary>
    /// Cantidad de unidades de este producto en el pedido.
    /// </summary>
    public int Cantidad { get; set; }

    /// <summary>
    /// Precio por unidad en el momento en que se tomó la comanda (por si cambia en el futuro).
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioUnitario { get; set; }

    /// <summary>
    /// Notas especiales para cocina o barra (ej. "Sin cebolla", "Muy hecho").
    /// </summary>
    [MaxLength(255)]
    public string? Notas { get; set; }

    /// <summary>
    /// Indica si el plato ya ha sido preparado y entregado al cliente.
    /// </summary>
    public bool Servida { get; set; } = false;

    // Propiedades de navegación
    [ForeignKey("ComandaId")]
    public virtual Comanda Comanda { get; set; } = null!;

    [ForeignKey("ProductoMenuId")]
    public virtual ProductoMenu ProductoMenu { get; set; } = null!;
}
