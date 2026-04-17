using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class MesasController : ControllerBase
{
    private readonly U374392370ReservasContext _context;

    public MesasController(U374392370ReservasContext context)
    {
        _context = context;
    }

    // GET: api/mesas
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MesasRestaurante>>> GetMesas()
    {
        var mesas = await _context.MesasRestaurantes.OrderBy(m => m.Zona).ThenBy(m => m.NumeroMesa).ToListAsync();
        return Ok(mesas);
    }
}
