using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models;

public class Resena
{
    [Key]
    public int Id { get; set; }

    [Required]
    [JsonPropertyName("usuarioNombre")]
    public string UsuarioNombre { get; set; } = string.Empty;

    [JsonPropertyName("usuarioEmail")]
    public string? UsuarioEmail { get; set; }

    [JsonPropertyName("usuarioFoto")]
    public string? UsuarioFoto { get; set; }

    [Required]
    [Range(1, 5)]
    [JsonPropertyName("estrellas")]
    public int Estrellas { get; set; }

    [Required]
    [MaxLength(1000)]
    [JsonPropertyName("comentario")]
    public string Comentario { get; set; } = string.Empty;

    [JsonPropertyName("respuestaJefe")]
    public string? RespuestaJefe { get; set; }

    [JsonPropertyName("fecha")]
    public DateTime Fecha { get; set; } = DateTime.Now;
}
