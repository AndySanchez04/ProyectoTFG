using backend;
using backend.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

// CORS Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowSpecificOrigin",
        b =>
        {
            b.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
             .AllowAnyMethod()
             .AllowAnyHeader()
             .AllowCredentials();
        });
});

// DbContext Configuration
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<U374392370ReservasContext>(options =>
{
    // Try to connect, but fallback to a default version if connection string is just placeholder
    try 
    {
        options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString));
    }
    catch
    {
        options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 31)));
    }
});

// Authentication JWT Configuration
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                context.Token = context.Request.Cookies["jwt"];
                return Task.CompletedTask;
            }
        };
    });

// Rate Limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("LoginPolicy", opt =>
    {
        opt.PermitLimit = 5;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

builder.Services.AddControllers();
builder.Services.AddSignalR();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Ejecutar DbInitializer para validar y crear mesas
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var context = services.GetRequiredService<U374392370ReservasContext>();
    try
    {
        backend.Data.DbInitializer.Initialize(services);
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("Base de datos inicializada correctamente con DbInitializer.");
        
        // Listar tablas para depuración
        using (var command = context.Database.GetDbConnection().CreateCommand())
        {
            command.CommandText = "SHOW TABLES;";
            context.Database.OpenConnection();
            using (var reader = command.ExecuteReader())
            {
                var tables = new List<string>();
                while (reader.Read()) tables.Add(reader.GetString(0));
                logger.LogInformation("Tablas en DB: " + string.Join(", ", tables));
            }
            
                // Describe Resenas
                command.CommandText = "DESCRIBE Resenas;";
                using (var reader = command.ExecuteReader())
                {
                    logger.LogInformation("Estructura de Resenas:");
                    while (reader.Read())
                    {
                        logger.LogInformation($"- {reader.GetString(0)} ({reader.GetString(1)})");
                    }
                }

                // Log Reservas de Hoy detallado
                var hoy = DateOnly.FromDateTime(DateTime.Now);
                command.CommandText = $"SELECT COUNT(*) FROM Reservas WHERE FechaReserva = '{hoy:yyyy-MM-dd}';";
                var count = command.ExecuteScalar();
                logger.LogInformation($"Reservas encontradas para hoy ({hoy:yyyy-MM-dd}): {count}");

                if (Convert.ToInt32(count) > 0)
                {
                    command.CommandText = $"SELECT Id, FechaReserva, HoraInicio, Estado, UsuarioId, MesaId FROM Reservas WHERE FechaReserva = '{hoy:yyyy-MM-dd}';";
                    using (var reader = command.ExecuteReader())
                    {
                        logger.LogInformation("Detalles de las reservas de HOY:");
                        while (reader.Read())
                        {
                            logger.LogInformation($"- ID: {reader.GetInt32(0)}, Fecha: {reader.GetDateTime(1):yyyy-MM-dd}, Hora: {reader.GetValue(2)}, Estado: {reader.GetString(3)}, UsuarioId: {reader.GetInt32(4)}, MesaId: {reader.GetInt32(5)}");
                        }
                    }
                }

                // PRUEBA: Imprimir TODAS las reservas
                command.CommandText = $"SELECT Id, FechaReserva, HoraInicio, Estado, UsuarioId, MesaId FROM Reservas;";
                using (var reader = command.ExecuteReader())
                {
                    logger.LogInformation("==== TODAS LAS RESERVAS ====");
                    while (reader.Read())
                    {
                        logger.LogInformation($"- ID: {reader.GetInt32(0)}, Fecha: {reader.GetDateTime(1):yyyy-MM-dd}, Hora: {reader.GetValue(2)}, Estado: {reader.GetString(3)}, UsuarioId: {reader.GetInt32(4)}, MesaId: {reader.GetInt32(5)}");
                    }
                    logger.LogInformation("============================");
                }
            }
        }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Un error ocurrió inicializando la base de datos.");
    }
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    await next();
});

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("AllowSpecificOrigin");

app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<RestauranteHub>("/restauranteHub");

app.Run();
