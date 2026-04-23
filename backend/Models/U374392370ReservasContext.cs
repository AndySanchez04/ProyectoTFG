using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Pomelo.EntityFrameworkCore.MySql.Scaffolding.Internal;

namespace backend.Models;

public partial class U374392370ReservasContext : DbContext
{
    public U374392370ReservasContext()
    {
    }

    public U374392370ReservasContext(DbContextOptions<U374392370ReservasContext> options)
        : base(options)
    {
    }

    public virtual DbSet<MesasRestaurante> MesasRestaurantes { get; set; }

    public virtual DbSet<Reserva> Reservas { get; set; }

    public virtual DbSet<Usuario> Usuarios { get; set; }

    public virtual DbSet<ProductoMenu> ProductoMenus { get; set; }
    public virtual DbSet<CategoriaMenu> CategoriasMenu { get; set; }
    public virtual DbSet<Comanda> Comandas { get; set; }
    public virtual DbSet<LineaComanda> LineasComanda { get; set; }
    public virtual DbSet<ArticuloInventario> ArticulosInventario { get; set; }
    public virtual DbSet<RecetaProducto> RecetasProducto { get; set; }
    public virtual DbSet<MovimientoInventario> MovimientosInventario { get; set; }
    public virtual DbSet<Gasto> Gastos { get; set; }
    public virtual DbSet<Factura> Facturas { get; set; }
    public virtual DbSet<Empleado> Empleados { get; set; }
    public virtual DbSet<TacoMensaje> TacoMensajes { get; set; }
    public virtual DbSet<Resena> Resenas { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseMySql("server=92.113.22.50;database=u374392370_reservas;user=u374392370_admin;password=123456789Boomer", Microsoft.EntityFrameworkCore.ServerVersion.Parse("11.8.3-mariadb"));

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder
            .UseCollation("utf8mb4_unicode_ci")
            .HasCharSet("utf8mb4");

        modelBuilder.Entity<MesasRestaurante>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.ToTable("MesasRestaurante");

            entity.HasIndex(e => e.NumeroMesa, "NumeroMesa").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Capacidad).HasColumnType("int(11)");
            entity.Property(e => e.NumeroMesa).HasMaxLength(10);
            entity.Property(e => e.Zona).HasMaxLength(50);
        });

        modelBuilder.Entity<Reserva>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.UsuarioId, "UsuarioId");

            entity.HasIndex(e => new { e.MesaId, e.FechaReserva, e.HoraInicio }, "unique_reserva").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Estado)
                .HasMaxLength(20)
                .HasDefaultValueSql("'confirmada'");
            entity.Property(e => e.FechaExpiracionLock).HasColumnType("datetime");
            entity.Property(e => e.HoraFin).HasColumnType("time");
            entity.Property(e => e.HoraInicio).HasColumnType("time");
            entity.Property(e => e.MesaId).HasColumnType("int(11)");
            entity.Property(e => e.NumPersonas).HasColumnType("int(11)");
            entity.Property(e => e.StripePaymentId).HasMaxLength(100);
            entity.Property(e => e.UsuarioId).HasColumnType("int(11)");

            entity.HasOne(d => d.Mesa).WithMany(p => p.Reservas)
                .HasForeignKey(d => d.MesaId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Reservas_ibfk_2");

            entity.HasOne(d => d.Usuario).WithMany(p => p.Reservas)
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("Reservas_ibfk_1");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");

            entity.HasIndex(e => e.Email, "Email").IsUnique();

            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Email).HasMaxLength(150);
            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("current_timestamp()")
                .HasColumnType("datetime");
            entity.Property(e => e.Nombre).HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.Telefono).HasMaxLength(50);
            entity.Property(e => e.Rol)
                .HasMaxLength(20)
                .HasDefaultValueSql("'cliente'");
        });

        modelBuilder.Entity<Empleado>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PRIMARY");
            entity.Property(e => e.Id).HasColumnType("int(11)");
            entity.Property(e => e.Nombre).HasMaxLength(100);
            entity.Property(e => e.Apellidos).HasMaxLength(100);
            entity.Property(e => e.DNI).HasMaxLength(20);
            entity.Property(e => e.Correo).HasMaxLength(150);
            entity.Property(e => e.Telefono).HasMaxLength(50);
            entity.Property(e => e.Sueldo).HasColumnType("decimal(10,2)");
            entity.Property(e => e.Rango).HasMaxLength(50);
        });

        OnModelCreatingPartial(modelBuilder);

        modelBuilder.Entity<Comanda>(entity =>
        {
            entity.HasOne(d => d.Mesa)
                .WithMany()
                .HasForeignKey(d => d.MesaId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Comanda_Mesa");

            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.Restrict)
                .HasConstraintName("FK_Comanda_Usuario");

            entity.HasOne(d => d.Reserva)
                .WithMany()
                .HasForeignKey(d => d.ReservaId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Comanda_Reserva");
        });

        modelBuilder.Entity<Factura>(entity =>
        {
            entity.HasIndex(e => e.ComandaId).IsUnique();
            
            entity.HasOne(d => d.Comanda)
                .WithOne(p => p.Factura)
                .HasForeignKey<Factura>(d => d.ComandaId)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("FK_Factura_Comanda");
        });
        
        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.HasOne(d => d.Usuario)
                .WithMany()
                .HasForeignKey(d => d.UsuarioId)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("FK_Gasto_Usuario");
        });
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
