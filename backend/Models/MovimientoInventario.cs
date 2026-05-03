using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Registra las entradas y salidas (consumo, compras, mermas) de los ingredientes en el almacén.
/// </summary>
public class MovimientoInventario
{
    /// <summary>
    /// Identificador único del movimiento.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID del artículo de inventario afectado por este movimiento.
    /// </summary>
    public int ArticuloInventarioId { get; set; }

    /// <summary>
    /// Determina si se añadió stock ("Entrada") o se restó stock ("Salida").
    /// </summary>
    [Required]
    [MaxLength(20)]
    public string Tipo { get; set; } = null!; // "Entrada", "Salida"

    /// <summary>
    /// Cantidad que fue sumada o restada.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Cantidad { get; set; }

    /// <summary>
    /// Fecha y hora en que se registró el movimiento de stock.
    /// </summary>
    public DateTime Fecha { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Explicación del movimiento (ej. "Recepción de proveedor", "Consumo automático en comanda").
    /// </summary>
    [MaxLength(255)]
    public string? Detalles { get; set; }

    // Propiedades de navegación
    [ForeignKey("ArticuloInventarioId")]
    public virtual ArticuloInventario ArticuloInventario { get; set; } = null!;
}
