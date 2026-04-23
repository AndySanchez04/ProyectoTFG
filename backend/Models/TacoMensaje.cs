using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class TacoMensaje
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Texto { get; set; } = string.Empty;
}
