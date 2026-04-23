using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models;

public class Resena
{
    [Key]
    public int Id { get; set; }

    [Required]
    public string UsuarioNombre { get; set; } = string.Empty;

    public string? UsuarioEmail { get; set; }

    public string? UsuarioFoto { get; set; }

    [Required]
    [Range(1, 5)]
    public int Estrellas { get; set; }

    [Required]
    [MaxLength(1000)]
    public string Comentario { get; set; } = string.Empty;

    public string? RespuestaJefe { get; set; }

    public DateTime Fecha { get; set; } = DateTime.Now;
}
