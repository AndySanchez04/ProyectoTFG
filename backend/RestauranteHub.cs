using Microsoft.AspNetCore.SignalR;

namespace backend
{
    /// <summary>
    /// Hub central de SignalR utilizado para emitir actualizaciones en tiempo real a los clientes conectados (paneles de cocina, barra, dashboard).
    /// </summary>
    public class RestauranteHub : Hub
    {
    }
}
