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
                gastos = Math.Round((double)gastosTotales, 2),
                balance = Math.Round(ingresos - (double)gastosTotales, 2)
            });
        }

        return Ok(resultado);
    }
}
