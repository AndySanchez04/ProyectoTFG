# 🗄️ Diccionario y Relaciones de Base de Datos - TheFork FullStack

Este documento detalla la estructura principal de la base de datos relacional (MySQL) del proyecto, diseñada en **3ª Forma Normal (3NF)** para evitar redundancias y mantener la máxima integridad de los datos a nivel arquitectónico.

A continuación se listan las **Tablas Principales**, todas sus **Columnas** detalladas y cómo están **Interconectadas** lógicamente entre sí.

---

## 👤 1. Gestión de Usuarios y Accesos

### Tabla: `Usuarios`
Centraliza a todas las personas que interactúan con el sistema mediante Control de Acceso Basado en Roles (RBAC). No aloja texto plano de contraseñas.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `Nombre` *(String, Obligatorio)*
  - `Email` *(String, Obligatorio, Único)*
  - `PasswordHash` *(String, Contraseña encriptada por BCrypt)*
  - `Telefono` *(String, Opcional)*
  - `Rol` *(String, ej: 'cliente', 'camarero', 'cocinero', 'admin')*
  - `FotoPerfil` *(String, Opcional, URL)*
  - `FechaRegistro` *(DateTime)*
- **Relaciones**:
  - **1:N con `Reservas`**: Un usuario (cliente) puede registrar históricamente múltiples reservas.
  - **1:N con `Comandas`**: Un camarero (usuario) tiene asociadas o atendidas múltiples comandas para auditar su desempeño y abrir tickets.
  - **1:N con `Gastos`**: Un administrador (usuario) puede haber registrado múltiples salidas de caja o gastos en los libros.

---

## 🪑 2. El Core del Restaurante y Reservas

### Tabla: `MesasRestaurante`
Almacena la capacidad y ubicación física inmutable de las mesas del local.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `NumeroMesa` *(String, Índice Único, ej. T-1, F-1)*
  - `Capacidad` *(Int)*
  - `Zona` *(String, ej. Terraza Frontal, Salon Fondo)*
- **Relaciones**:
  - **1:N con `Reservas`**: Una mesa es sujeto de infinitas reservas distribuidas lógicamente en su propio calendario de horarios.
  - **1:N con `Comandas`**: A cada mesa física se le adjudican infinitos "tickets abiertos" durante su vida útil.

### Tabla: `Reservas`
El núcleo público web del motor y fiel gestor de doble reservas (Soft-Locking temporal).
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `UsuarioId` *(Int, Foreign Key hacia Usuarios)*
  - `MesaId` *(Int, Foreign Key hacia MesasRestaurante)*
  - `FechaReserva` *(DateOnly)*
  - `HoraInicio` *(TimeOnly)*
  - `HoraFin` *(TimeOnly)*
  - `NumPersonas` *(Int)*
  - `Estado` *(String, ej: 'confirmada', 'cancelada', 'pendiente')*
  - `FechaExpiracionLock` *(DateTime, Opcional, Campo temporal invisible usado para bloquear su estado 5 minutos exactos del servidor contra el Client)*
  - `StripePaymentId` *(String, Opcional, para fianzas de no-show futuras)*
  - `CreatedAt` *(DateTime)*
- **Relaciones**:
  - **1:N con `Comandas`**: (*Restringido pero Opcional*) Si el cliente se presenta a comer, la comanda en vivo que captura el camarero puede quedar enganchada y ligada al ticket matriz de su reserva inicial por analíticas.

---

## 🍔 3. Back-Office Comercial: El Menú, Comandas y Tickets

### Tabla: `ProductoMenus`
El catálogo de comida y bebida visible tanto para el frontend de cliente (Carta web) como para el TPV Móvil operativo.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `Nombre` *(String, Obligatorio)*
  - `Descripcion` *(String, Opcional)*
  - `Precio` *(Decimal)*
  - `Categoria` *(String, ej: 'Entrante', 'Principal', 'Bebida', 'Postre')*
  - `Disponible` *(Boolean, Activo/Inactivo de apagado rápido para no borrarlo)*
- **Relaciones**:
  - **1:N con `LineasComanda`**: Un único plato final (como "Costillas") figura replicado físicamente en infinitas bandejas y tickets comandados por la noche.
  - **1:N con `RecetasProducto`**: Un plato de cara comercial cuelga de un listado interno atado a componentes crudos reales.

### Tabla: `Comandas` (Cabecera Viva de la Mesa)
Cabecera fundamental "Madre" del pedido u ocupación actual de una mesa (El pilar principal donde trabaja el TPV Móvil).
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `MesaId` *(Int, Foreign Key hacia MesasRestaurante en la que se origina)*
  - `UsuarioId` *(Int, Foreign Key Camarero/Responsable operativo)*
  - `ReservaId` *(Int, Opcional, Foreign Key hacia Reservas en caso originario prepago)*
  - `Estado` *(String, ej. 'Abierta', 'Cerrada')*
  - `FechaHora` *(DateTime)*
- **Relaciones**:
  - **1:N con `LineasComanda`**: Almacena de facto y asocia todos los platillos separados que fueron demandados en la mesa para esa ronda.
  - **1:1 Única con `Facturas`**: Toda comanda finiquitada culmina bloqueando un recibo financiero base único (Factura Irrepetible).

### Tabla: `LineasComanda` (Detalle del Ticket / Base del KDS Kanban Cocina)
Cada ítem unitario dentro de una macro comanda. Esta es la tabla nuclear **que se dibuja instantáneamente como miniatura-KDS** a la pantalla táctil de los cocineros al vuelo.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `ComandaId` *(Int, Foreign Key Padre Cabecera)*
  - `ProductoMenuId` *(Int, Foreign Key Elemento a Preparar)*
  - `Cantidad` *(Int)*
  - `PrecioUnitario` *(Decimal, fotografiado en el momento exacto, previniendo que la deuda cambie si el Menú global sube de costo el mes que viene)*
  - `Notas` *(String, Opcional, Aclaraciones del cliente ej: "Sin cebolla" o "Asado al punto")*
  - `EstadoCocina` *(String, ej: 'Pendiente', 'Preparando', 'Listo')*

### Tabla: `Facturas`
El marco contable legal definitivo y blindado (ticket financiero resuelto) nacido de abatir o cobrar una mesa.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `ComandaId` *(Int, Foreign Key originaria, de Restricción 1 a 1 Exclusiva Única)*
  - `Subtotal` *(Decimal)*
  - `Impuestos` *(Decimal)*
  - `Descuento` *(Decimal)*
  - `Total` *(Decimal, valor exacto final del cómputo puro de ventas)*
  - `MetodoPago` *(String, Obligatorio, ej: 'Efectivo', 'Tarjeta')*
  - `FechaEmision` *(DateTime)*

---

## 📦 4. Back-Office Industrial Estratégico: Inventario Crudo

### Tabla: `ArticulosInventario`
La materia física base con la que vive y sufre el frigorífico del local. Totalmente independiente inyectada de la carta (Litros, Tomeles, Sacos de Pan).
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `Nombre` *(String, Obligatorio)*
  - `CantidadActual` *(Decimal)*
  - `UnidadMedida` *(String, ej: 'Unidades', 'Kilogramos', 'Litros', 'Gramos')*
  - `PrecioCoste` *(Decimal, Opcional, usado para calcular ratios de margen e mermas en negro)*
- **Relaciones**:
  - **1:N con `RecetasProducto`**: Un mismo cubo de salsa barbacoa será descompuesto formando parte vital en multitud de variaciones de Hamburguesas u otros Platos.
  - **1:N con `MovimientosInventario`**: Trazabilidad y árbol de árbol maestro indicativo de cómo ha subido (recibos mercadona) y bajado este insumo.

### Tabla: `RecetasProducto` (Escandallo Intermedio N:M Magistral)
*El puente analítico perfecto logístico.* Mapea exactamente *qué consume físicamente* la receta de un platillo final al mandarse digitalmente a marchar a cocina por el camarero en sala.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `ProductoMenuId` *(Int, Foreign Key al Plato Finito Vistoso)*
  - `ArticuloInventarioId` *(Int, Foreign Key a la Materia Prima Sucia Desglosada)*
  - `CantidadUsada` *(Decimal, ejemplo claro vital: "15" [Gramos de Mostaza en 1 Perrito Caliente])*
- **Uso Crítico e Impacto en DB**: Esta tabla fuerza en diferido cruces deduciendo montos masivos contra el stock total en milisegundos sin fallo humano.

### Tabla: `MovimientosInventario` (Histórico de Auditoría Logística Inmutable)
Diario auditable puramente numérico e inborrable para certificar y acorralar quién, cuánto, y por qué factor salta y varía el volumen físico bruto por día de cualquier almacén de fondo o congeladores.
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `ArticuloInventarioId` *(Int, Foreign Key del Insumo Evaluado)*
  - `Tipo` *(String, Restringido ej: 'Entrada' puramente positiva en recepción camión, / 'Salida' descontada o restada al tirarse/consumirse)*
  - `Cantidad` *(Decimal)*
  - `Fecha` *(DateTime)*
  - `Detalles` *(String, Opcional, Log de seguridad, Ej: "Ajuste Caducado: Mermas del Vienes noche pautadas" o "Compra de reposición rápida")*

---

## 💸 5. Contabilidad Externa Pura

### Tabla: `Gastos`
El control independiente lateral para modelar fugas y salidas de capital fijo del saldo mercantil del negocio ajeno a compra de artículos. (Electricidad, Cuotas TPV, Seguros, Sueldos del Admin).
- **Columnas**:
  - `Id` *(Int, Primary Key)*
  - `Tipo` *(String, Obligatorio, Ej: 'Sueldo Nomina', 'General Inmovilizado')*
  - `Descripcion` *(String, Obligatorio textual, ej. "Fibra Internet", "Limpieza Industrial")*
  - `Monto` *(Decimal)*
  - `Fecha` *(DateTime)*
  - `UsuarioId` *(Int, Opcional, Foreign Key hacia al usuario encargado que firma en ese acto la retirada de caja del sistema o a quien imputan su suelo)*

***
> 📌 **Anotación Avanzada de Restricciones (Entity Framework Core Cascada y Nulidad)**:  
> Todo este laberinto inmenso de relaciones, llaves unificadas transaccionales (Foreign Keys), restricciones de campos únicos vitales e índices y estrategias perennes de borrado cascada en cadena (`OnDelete.Cascade`, `OnDelete.Restrict` o `OnDelete.SetNull`) están configuradas y aseguradas estrictamente en la infraestructura del código servidor en el contexto primario (`backend/Models/ReservasContext.cs`), modelado con la *Fluent API* inquebrantable de **C#**.  
> Gracias a este muro anti-caos, se previenen colapsos destructivos de cascada infinita en caso de la manipulación. Por ejemplo absoluto e imprescindible: Si se depidiera amargamente y se diece drásticamente borrón en BDD a un cocinero o camarero borrándolo de tabla `Usuarios`, todo el sistema relacional DB `EF Core` pone en barrera blindada una interposicion fortelecion *restringida o nulificada*, en la que previene de destruir el usuario general si con él se llevase a los abismos en cascada en las tinieblas de la mesa todas y cada una de las gigantes `Comandas` que históricamente pasaron en la historia por ese empleado contables de la hacienda. Frenado de base.
