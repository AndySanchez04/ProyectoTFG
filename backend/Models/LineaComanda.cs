using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class LineaComanda
{
    [Key]
    public int Id { get; set; }

    public int ComandaId { get; set; }

    public int ProductoMenuId { get; set; }

    public int Cantidad { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal PrecioUnitario { get; set; }

    [MaxLength(255)]
    public string? Notas { get; set; }

    public bool Servida { get; set; } = false;

    // Navigation properties
    [ForeignKey("ComandaId")]
    public virtual Comanda Comanda { get; set; } = null!;

    [ForeignKey("ProductoMenuId")]
    public virtual ProductoMenu ProductoMenu { get; set; } = null!;
}
