using System.ComponentModel.DataAnnotations;

namespace backend.Models;

/// <summary>
/// Representa una categoría del menú para agrupar platos o bebidas (ej. "Entrantes", "Postres", "Cervezas").
/// </summary>
public class CategoriaMenu
{
    /// <summary>
    /// Identificador único de la categoría.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Nombre visible de la categoría.
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string Nombre { get; set; } = null!;
}
