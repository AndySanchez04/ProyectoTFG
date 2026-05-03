using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

/// <summary>
/// Representa el comprobante de pago generado al cerrar una Comanda.
/// Almacena los importes finales para propósitos contables e históricos.
/// </summary>
public class Factura
{
    /// <summary>
    /// Identificador único de la factura.
    /// </summary>
    [Key]
    public int Id { get; set; }

    /// <summary>
    /// ID de la comanda cerrada que originó esta factura.
    /// </summary>
    public int ComandaId { get; set; }

    /// <summary>
    /// Suma del precio de todos los artículos antes de impuestos o descuentos.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Subtotal { get; set; }

    /// <summary>
    /// Importe total de impuestos aplicados (IVA).
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Impuestos { get; set; }

    /// <summary>
    /// Importe restado al subtotal, si aplica algún descuento.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Descuento { get; set; }

    /// <summary>
    /// Cantidad final pagada por el cliente.
    /// </summary>
    [Column(TypeName = "decimal(10,2)")]
    public decimal Total { get; set; }

    /// <summary>
    /// Método por el cual se abonó la factura (ej. "Efectivo", "Tarjeta").
    /// </summary>
    [Required]
    [MaxLength(50)]
    public string MetodoPago { get; set; } = null!;

    /// <summary>
    /// Fecha y hora de generación de la factura.
    /// </summary>
    public DateTime FechaEmision { get; set; } = DateTime.UtcNow;

    // Propiedades de navegación
    [ForeignKey("ComandaId")]
    public virtual Comanda Comanda { get; set; } = null!;
}
