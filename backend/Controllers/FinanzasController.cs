using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

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

    [HttpGet("resumen-anual")]
    public async Task<ActionResult<IEnumerable<object>>> GetResumenAnual(int year)
    {
        // 1. Obtener ingresos mensuales de Facturas
        var ingresosMensuales = await _context.Facturas
            .Where(f => f.FechaEmision.Year == year)
            .GroupBy(f => f.FechaEmision.Month)
            .Select(g => new { Mes = g.Key, Total = g.Sum(f => f.Total) })
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

        for (int i = 1; i <= 12; i++)
        {
            var ingresos = ingresosMensuales.FirstOrDefault(x => x.Mes == i)?.Total ?? 0;
            var gastosManuales = gastosMensualesManuales.FirstOrDefault(x => x.Mes == i)?.Total ?? 0;
            
            // Si el mes es futuro respecto a hoy, quizás no queramos mostrar gastos de sueldos todavía, 
            // pero para la analítica proyectada los incluimos.
            var gastosTotales = gastosManuales + sueldosMensuales;

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
