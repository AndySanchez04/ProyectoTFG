using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace backend.Models;

/// <summary>
/// Representa una valoración o reseña dejada por un cliente sobre su experiencia en el restaurante.
/// </summary>
public class Resena
{
    /// <summary>
    /// Identificador único de la reseña.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// Nombre del cliente que dejó la reseña.
    /// </summary>
    [Required]
    [JsonPropertyName("usuarioNombre")]
    public string UsuarioNombre { get; set; } = string.Empty;

    /// <summary>
    /// Correo electrónico del cliente (opcional).
    /// </summary>
    [JsonPropertyName("usuarioEmail")]
    public string? UsuarioEmail { get; set; }

    /// <summary>
    /// Enlace a la foto de perfil del usuario (opcional).
    /// </summary>
    [JsonPropertyName("usuarioFoto")]
    public string? UsuarioFoto { get; set; }

    /// <summary>
    /// Calificación otorgada, de 1 a 5 estrellas.
    /// </summary>
    [Required]
    [Range(1, 5)]
    [JsonPropertyName("estrellas")]
    public int Estrellas { get; set; }

    /// <summary>
    /// Texto con la opinión detallada del cliente.
    /// </summary>
    [Required]
    [MaxLength(1000)]
    [JsonPropertyName("comentario")]
    public string Comentario { get; set; } = string.Empty;

    /// <summary>
    /// Respuesta oficial por parte del restaurante/gerencia (opcional).
    /// </summary>
    [JsonPropertyName("respuestaJefe")]
    public string? RespuestaJefe { get; set; }

    /// <summary>
    /// Fecha y hora en que se publicó la reseña.
    /// </summary>
    [JsonPropertyName("fecha")]
    public DateTime Fecha { get; set; } = DateTime.Now;
}
