using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa un mensaje dinámico o sugerencia mostrada por la mascota "Taco" en la interfaz.
/// </summary>
public class TacoMensaje
{
    /// <summary>
    /// Identificador único del mensaje.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Contenido de texto que dirá el personaje Taco.
    /// </summary>
    [Required]
    [MaxLength(255)]
    public string Texto { get; set; } = string.Empty;
}
