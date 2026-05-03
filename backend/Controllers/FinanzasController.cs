using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

/// <summary>
/// Controlador para el cálculo y exposición de los datos financieros del restaurante.
/// Provee información de ingresos, gastos y beneficios para los gráficos administrativos.
/// </summary>
[Route("api/[controller]")]
[ApiController]
[Authorize]
public class FinanzasController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public FinanzasController(U374392370ReservasContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Devuelve un resumen mensual agrupado (Ingresos, Gastos, Balance) para un año determinado.
    /// Combina ingresos por comandas cobradas, gastos manuales y sueldos recurrentes.
    /// </summary>
    [HttpGet("resumen-anual")]
    public async Task<ActionResult<IEnumerable<object>>> GetResumenAnual(int year)
    {
        // 1. Obtener ingresos mensuales directamente de las Comandas (sumando sus líneas)
        // Usamos rangos de fecha para mayor compatibilidad con proveedores de DB
        var startDate = new DateTime(year, 1, 1);
        var endDate = startDate.AddYears(1);

        var ingresosMensuales = await _context.LineasComanda
            .Include(l => l.Comanda)
            .Where(l => l.Comanda.FechaHora >= startDate && l.Comanda.FechaHora < endDate)
            .GroupBy(l => l.Comanda.FechaHora.Month)
            .Select(g => new 
            { 
                Mes = g.Key, 
                Total = g.Sum(l => (double)l.Cantidad * (double)l.PrecioUnitario) 
            })
            .ToListAsync();

        // 2. Obtener gastos mensuales manuales
        var gastosMensualesManuales = await _context.Gastos
            .Where(g => g.Fecha.Year == year)
            .GroupBy(g => g.Fecha.Month)
            .Select(g => new { Mes = g.Key, Total = g.Sum(x => x.Monto) })
            .ToListAsync();

        // 3. Obtener sueldo total mensual de Empleados (se asume constante para el año)
        var sueldosMensuales = await _context.Empleados.SumAsync(e => e.Sueldo);

        // 4. Construir array de 12 meses
        var meses = new string[] { "Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic" };
        var resultado = new List<object>();

        int mesActual = DateTime.Now.Month;
        int añoActual = DateTime.Now.Year;

        for (int i = 1; i <= 12; i++)
        {
            // Si el año solicitado es mayor al actual, no mostramos nada aún
            if (year > añoActual) break;

            // Si es el año actual, solo mostramos hasta el mes actual
            if (year == añoActual && i > mesActual) break;

            // El usuario indica que empezaron en Abril de 2026. 
            // Si el año es 2026 y el mes es anterior a Abril, lo tratamos como sin actividad.
            bool sinActividad = (year == 2026 && i < 4);

            double ingresos = 0;
            double gastosTotales = 0;

            if (!sinActividad)
            {
                ingresos = ingresosMensuales.FirstOrDefault(x => x.Mes == i)?.Total ?? 0;
                var gastosManuales = gastosMensualesManuales.FirstOrDefault(x => x.Mes == i)?.Total ?? 0;
                gastosTotales = (double)(gastosManuales + sueldosMensuales);
            }

            resultado.Add(new
            {
                mes = meses[i - 1],
                ingresos = Math.Round(ingresos, 2),
                gastos = Math.Round(gastosTotales, 2),
                balance = Math.Round(ingresos - gastosTotales, 2)
            });
        }

        return Ok(resultado);
    }
}
