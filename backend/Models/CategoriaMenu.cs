using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class CategoriaMenu
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Nombre { get; set; } = null!;
}
