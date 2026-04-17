# 🍔 TheFork Restaurante - Documentación Técnica y Arquitectura (FullStack)

¡Hola! Este documento está pensado para explicar cómo está construido este proyecto de principio a fin. Tanto si tienes un perfil muy técnico y quieres saber dónde encontrar la lógica de negocio en el código, como si no tienes mucha experiencia programando y simplemente quieres entender cómo funciona todo "por debajo", estás en el lugar correcto.

Este proyecto es una aplicación **FullStack**. Esto significa que está dividida en varias partes que trabajan juntas para formar un sistema informático profundo de reservas de mesas y gestión de un restaurante real (con panel para camareros, comandas y pantalla interactiva para la cocina).

---

## 🏗️ 1. Las Tres Piezas Clave (Arquitectura a Vista de Pájaro)

Todo sistema moderno se divide en capas (tiers) para que el código no sea un caos y para poder escalarlo sin romperlo todo a la vez. Nosotros tenemos tres pilares:

### 🎨 1. El Frontend (La "Cara" de la App)
El *Frontend* es lo que el usuario final ve en la pantalla y con lo que interactúa tocando botones y rellenando formularios. Piénsalo como el escaparate y la decoración del restaurante.
- **Tecnologías que usamos:**
  - **React.js**: Es una librería inteligente creada por Facebook. En lugar de diseñar una página estática gigante, React nos permite construir la web uniendo pequeños bloques reutilizables llamados "Componentes" (como si fueran piezas de Lego, por ejemplo, un bloque "Botón" se puede usar 50 veces). Hace que la web sea una SPA (*Single Page Application*), es decir, tú navegas fluidamente de una pantalla a otra sin que el navegador tenga que ponerse en blanco o recargar toda la página.
  - **Vite**: Es el motor interno que arranca React. Su trabajo es "empaquetar" todo nuestro código súper rápido para que mientras nosotros programamos, veamos los cambios al instante en el monitor, optimizando la experiencia del programador al máximo.
  - **Tailwind CSS**: El CSS suele ser un dolor de cabeza, requiriendo archivos larguísimos para dibujar bordes verdes o sombras grises. Nosotros evitamos eso usando Tailwind, que es un sistema donde podemos dictar los estilos (colores, sombras, márgenes grandes) escribiendo "clases" cortas e intuitivas directamente en el código de la pantalla HTML. Nos facilita hacer la interfaz **mobile-first** (que esté pensada primero y antes que nada para verse impecable y no romperse al abrirse en pantallas pequeñas de un móvil de manera responsiva).
- **¿Dónde encontrar los archivos en el código?**
  - Todo esto vive en la carpeta principal `frontend/src/`.
  - El archivo `App.jsx` es tu "mapa de rutas" principal. Ahí el código actúa de árbitro y decide: *«Si entran por la URL /login, enséñales la pantalla de entrada, si entran por /reservas enséñales las mesas»*.
  - Encontrarás componentes concretos, por ejemplo, archivos vitales como `Login.jsx` o `Registro.jsx` que dictaminan la seguridad pública.
  - El gran monolito visual vive en `Reservas.jsx`, en él encapsulamos y orquestamos visualmente todo el proceso paso a paso (desde elegir fecha, hasta ver una miniatura del plano del restaurante).

### 🧠 2. El Backend (El "Cerebro" de la App)
Al Frontend jamás se le puede creer, no deberíamos fiarnos de lo que envía un navegador porque la gente puede hacer trampas. El Frontend no puede hacer nada inteligente por su cuenta ni hacer consultas profundas sobre cuántas lechugas tenemos en el almacén. Para eso está el *Backend*. Actúa como el mánager omnisciente del restaurante que valida absolutamente todo.
- **Tecnologías que usamos:**
  - **C# y .NET 8 Web API**: C# (`C-Sharp`) es un lenguaje de programación de servidor extremadamente robusto, rápido y seguro hecho por Microsoft; mientras que .NET 8 es la última plataforma de moda sobre la que se ejecuta. Con C# nuestro backend actúa como una **"API REST"**. Una API es como un menú o listado de recepciones para el Frontend: el Frontend pide educadamente (*"Peticiones HTTP"*), dictando cosas como un `GET /api/mesas` ("Pásame un listado de mesas") o un `POST /api/reservas` ("Guarda firmemente esta nueva reserva por favor"), y el Servidor de C# hace las operaciones matemáticas puras o las validaciones de negocio antes de devolver una respuesta final.
  - **Entity Framework Core (EF Core)**: Al mismo tiempo, C# no habla en lenguaje de bases de datos. Necesita un traductor en medio. Usamos la inmensa tecnología referencial `EF Core`. Esto es un **ORM** (Mapeador Objeto-Relacional). Su trabajo, aunque suena muy raro, te soluciona la vida: traduce nuestras cajitas transparentes del lenguaje de C# (los *Models*, la orientación a objetos) directamente a complejas líneas y comandos SQL que le manda automáticamente y sin errores a la base de datos sin que ninguno lo haya tenido que escribir de la nada a mano.
- **¿Dónde encontrar los archivos en el código?**
  - Todo vive al otro lado de la barrera de internet: bajo la carpeta principal `backend/`.
  - En la micro-carpeta `backend/Controllers/` tienes los guardias o controladores, como su nombre indica. Por ejemplo, `ReservasController.cs` se dedica única y exclusivamente a atender el teléfono cuando piden reservas, y `AuthController.cs` maneja todos los temas escabrosos de cuentas de usuario, validaciones y hackeos en torno al login.
  - Dentro de `backend/Models/` tienes cómo está estructurada atómicamente la naturaleza del restaurante: los pilares en `Factura.cs`, `Comanda.cs` o `RecetaProducto.cs` en donde programamos exactamente de qué está construida o se compone las entidades físicas de nuestro universo base de negocio.

### 🗄️ 3. La Base de Datos (La "Memoria" Incorruptible)
Por mucho poder que tenga el Backend en memoria virtual, si se va la luz, todos los pedazos numéricos desaparecen. Nos hace falta persistencia y un disco profundo estructurable.
- **Tecnologías que usamos:**
  - Estrictamente montamos y le hablamos desde el servidor a una base **MySQL**: el gestor y guardián relacional más antiguo, famosillo y seguro para alojarlo sin grandes problemas en cualquier infraestructura (como Hostinger o cualquier nube paralela). Guarda la información agrupadamente por Tablas y Cuadros rígidos, evitando que metas información con otro formato.
- **Detalle de Diseño y Arquitectura**:
  - Toda ella está pulcramente normalizada hasta 3NF. El concepto teórico viene a ser la regla número 1 contra la pérdida y los sobrecostes: intentar evitar duplicar inútilmente datos que van enlazados para que sea el modelo relacional quién trabaje para nosotros.
  - Y no es ni mucho menos en absoluto simple: nuestro inventario tiene calado empresarial profundo por el que en DB por ejemplo, si alguien vende en barra una hamburguesa (la cual llamamos `ProductoMenu`), esto nos descuenta de facto las sub-piezas a las que está atada internamente hacia otras tablas infinitas que contienen su manual de `RecetaProducto.cs`, que su vez nos deducirá individualmente insumos unitarios restables con trazabilidad hacia el bloque central de `ArticuloInventario`. Nivel industrial del sistema TheFork pero montando infraestructura back-office compleja en casa pura.

---

## 🔌 2. ¿Cómo se comunican el Frontend con ese Backend? (Seguridad y Trucos JWT)

Imaginaos que el Frontend es huésped caminando y el Backend de C# es un portero paranoico del hotel. Debemos inventar una manera de en la que, cada vez el huésped pise el pasillo y mande una nueva solicitud o paso en la página, pudiese justificar instantáneamente el que tuviera "la Llave de Acceso y Reserva de la propia habitación", ¡Pero sin obligar al Pobre Portero (el BackEnd) a revisar obsesivamente en un libro gordo en recepción o base de datos sus credenciales todo el tiempo consumiendo energía en la página!

Para hacer todo *Stateless* (sin guardar "Sesiones" pasadas y caducas en medio) usamos un sistema maestro criptográfico contemporáneo llamado **JWT (JSON Web Tokens)**:
1. **La Puerta (Hashing de Inicio de sesión)**: En el instante en que el usuario normal toca en el teclado la contraseña visible, e igual para todos y pincha loggearse, React lo cede. C# recibe esa contraseñas y las compara pero el backend avisa de que **nunca lo conservará por si un Hacker accede a tu host**; lo pasa por otro molino picador (El legendario algoritmo **BCrypt**) que devuelve un churro ilegible crudo hash o revuelto matemático (`3R#211$E!AS@@#QAS`) lo coteja, y lo descodifica contra ese, permitiéndole y certificando el acceso del cliente.
2. **"El Pase Oculto de Seguridad" (Nacimiento del Token)**: Acto seguido (en ese instante del login en `AuthController.cs`), el Servidor nos compila y rubrica algo llamado `Token JWT`. Para ser infalsificable asocia, en base a una súper-contraseña del sistema del programador oculta y confidencial (presente en un fichero `backend/appsettings.json`), unas firmas extrañas que React recibe la orden y mandato absoluto e irrevocable de tragárselo sin preguntar y meterlo directo hacia una gaveta o baúl oculto en el navegador suyo: su almacén interno permanente llamado `localStorage`.
3. **Mecánica Automática**: Toda vez que el propio usuario vuelve en la web de Vite queriendo clickear `Facturas` o `Hacer Reservas`, entonces antes siquiera de partir la información para C#, React le adjunta grapado en las esquinas por encima sin que nadie lo vea una cabecera u *header* HTTP con las mágicas palabras: `Authorization: Bearer <ElTokenFísiCoConCriptografía>`.
4. **Barreras (RBAC basado en Roles)**: De cara al programador de C#, los ficheros y Controladores tales como (`Controllers/ReservasController.cs`), para prevenir que alguien no entre han sido capados con una frase: `[Authorize(Roles = "camarero,admin")]`. Si detecta que ese Token le llegó con perfil solo o base de "usuario", le cuelga el teléfono emitiendo el desolador Error *403 Forbidden / Prohibido*. Seguridad absoluta certificada antes tan siquiera en un *milisegundo* si alguien osa hackear endpoints escondidos de las API o hacer peticiones sin derecho y permiso al rol. Y sin tener siquiera que tocar con la mirada o preguntar por latencias o consultar nunca el MySQL de la Base de datos: C# "lee" en crudo el Token en sí mismo, viendo ahí mismo los identificadores.

---

## 🔒 3. Desafíos Técnicos de Altísima Capacidad Resueltos Meticulosamente

### 🕰️ A. El "Soft Lock" de Reservas (Concurrencia con 5 Minutos de Bloqueo Espejismo)
Sencillamente sin este muro, cualquier app o restaurante tendría fallos en tiempo vivo insalvables llamados **Double Booking** (dar físicamente las claves digitales o reserva para que entren y se sienten el mismo día en la propia Mesa "2A" a dos familias dispares, chocando a horas idénticas).

- **El Problema Masivo Abierto**: ¿Cómo gestionas miles de usuarios por minuto o tan sólo si el Cliente Alfa y un Cliente Beta ven un mapa plano mostrando ahora mismo la idéntica *Mesa de Cuatro* libres, y le fuesen a propinar el milisegundo de Confirmar Reserva sin querer los dos simultáneamente y al dedillo exactos hacia el Base de Datos en ese preciso momento final sin refrescar nunca con la rueda antes la pantallita final?
- **La Salida (Avanzado Algoritmo de Soft Lock)**:
  1. En las entrañas del código de `frontend/src/Reservas.jsx`, si Cliente A adelanta e irrumpe metiendo fechas hasta aterrizar en el ultimísimo paso "Reserva final (Validar Tarjeta/Correo)", hacemos que el frontend ejecute furtiva un peticion de rescate de fondo invisible llamado (`/BloquearMesa`).
  2. En la sombra, el backend bloquea ese pupitre para ti, creando momentáneamente en MySql tu entrada con Estado en status **"Pendiente o Bloqueada Temporal"**. A ello sumándole extraoficialmente en secreto entre tú y el servidor una caducidad por hardware temporal y estricta bautizada en base de datos `FechaExpiracionLock` de cronometraje sumando artificialmente **5 Minutos de prórroga extras a la base o reloj atómico principal del propio servidor backend**.
  3. Desaparición: El Cliente "Beta" de repente verá u obtendrá que misteriosamente o la mesa no arroja información disponible ni saldrá bajo las visualizaciones masivas limpiantes porque desaparece físicamente ante cualquier "Get Mesas".
  4. Del lado nuestro de Frente "Cliente A", de pronto visualiza pintado muy limpio por las librerías React un contador de la muerte "Timer 05:00... 04:59...".
  5. ¿Pero Qué pasa con Servidor si Abandona la Página Clicando la `X` y El C# no sabe o espera sin poder dar confirmaciones de mesa en milésimas de vuelta para anular?
     Pues nada, ni parches locos: C# ejecuta silenciosamente filtros auto-limpiantes, a la próxima búsqueda "ignorará automáticamente por inercia selectiva MySQL toda reserva inhabilitada por estar caducada o rebasada pasada esa fecha inmovilizada" limpiando por efecto pasivo los campos, recuperándose una disponibilidad pasiva nítida sin requerir pesados mantenimientos (Demonios *Cron* constantes del servidor saturando las tablas) u operaciones sucias sobre C#.

### 🪑 B. Conflictos de Zonas y Resoluciones: Nombres de Mesas y Keys (Problemas Claves de T- y F-)
- **Un problema que destruía la BDD Original**: La estructura rígida o pura del SQL es tener todo controlado por restricciones de que ningún identificador se repita nunca de "Claves o identificadores primarios ("Keys"): tú no vas y puedes en teoría bajo ningún paradigma estamental MySQL guardar una mesa denominada "MESA-1", e inyectar del mismo luego un salón aledaño de otra Zona distinta ("La Terraza Exterior Salvaje") queriendo también un asiento con "Mesa 1". La consola MySql lo vetará de cuajo gritándote (Duplicidad en Columna Única del ID - Constraint Error Crash). Pero en la vida de un gerente de bar eso es del todo lógico y factible.
- **La Adaptación Inteligente de Semántica**: Así que la ingeniería fue forjada en un rincón vital del C# en `backend/Data/DbInitializer.cs` que, mediante un motor de sembrado, inyecta siempre configuraciones "Semilla o Patrones Fijos" anti caídas por si hay que arrancar desde 0 base la máquina. Allí introducimos pre-fijos para esquivar las trabas bajo demanda en bruto y de una manera muy audaz; Enmascarando Terraza bajo los vocablos `T-1`, `T-2`, englobando al Frente mediante `F-1`.
  Dota una soltura de escalabilidad infinita y salvamos de todos los choques puros a MySQL inidentificando como valores genuinamente diversos para C# las `T` de `F` (Y por el lado visual, a nuestro React en el FronEnd ni un código espagueti y extra, sabiendo separar velozmente visualidades estéticas de colores con un pequeño substring/corte base con `slice` detectando las regiones instantáneas).

---

## 👨‍🍳 4. Más allá de lo básico: Las Tripas Corporativas del Panel Interno (Back-Office)

El Front no va dirigido simplemente a alguien de paso en un portal de TheFork para reservar y olvidarse y apárteme la silla. Está enraizado como el programa y el motor primario y matriz del local interno.
Especialmente lo demuestran todos los últimos sistemas modulares anexos en un entorno paralelo para Administradores, que está desarrollado como algo totalmente autónomo aunque corra dentro en el ecosistema principal e hibridado.

- **POS (El TPV Terminal - La Libreta del Camarero Electrónica)**:
  - **¿Dónde Ubicamos estos códigos del lado Cliente Frontend?**: En `frontend/src/PanelCamarero.jsx` (y en carpetas asociadas a Dashboard).
  - **¿Su labor Táctica?**: Normalmente un camarero con prisa extrema no lleva portátiles pesados cargando entre comensales al servir por los lares en barra, sino PDA o *Móviles en bolsillo reducidos*. Así que ese punto específico ha sido redibujado meticulosamente y concebido sobre TailwindCSS usando estrategias natales del desarrollo Mobile-Primero (*Mobile-First*) garantizado e inyectando que todos sus "Botones en la pantallita de elegir la comida" y tarjetas en grillas se vuelvan más táctiles y sobredimensionados para atrapar en pantallas del celular sin equivocarte en pleno ajetreo del sábado noche. Allí engarzamos "Abrir Caja en `Factura.cs` C#", mandar platos nuevos `POST LineaComanda` directitos y recalcular totalidades matemáticas de Ivas sin intervención del papelero todo volando en tiempo virtual asíncrono hacia base remota de API.

- **La joya KDS del Cocinero - Pantallas del Sistema de Transmisión (Kitchen Display System)**:
  - **¿Dónde encontramos dicho engranaje y control total en nuestro entorno Vite de React?**: Tienes dicho tesoro principal sobre `frontend/src/PanelCocina.jsx` o `DashboardKitchen.jsx`.
  - **Función en Activo**: Conlleva que los delantal blancos olviden el papel a mano sucio y tengan un gigantesco panel anclado táctil en la pared donde todo esto converge mágicamente por debajo del sistema de cable. Nuestra potente aplicación hace llamadas por bucles (`GET /api/comandas/cocina`) por debajo y nos da devueltas con listas crudas pero separadas de mesas agrupadas en la DB gracias a unas "Queries o solicitudes SQL" aterradoras detrás del telón con EntiftyFramework en C#. Y el Frontend usa Tailwind dibujando las cosas pendientes al instante con unas cuadrículas y Post-ITs de tarjetas Kanban o tableros de Trello súper limpios sobre colores cálidos y amigables y un botón GOLPEABLE "LISTO O FIN". Pinchándolo el C# mata o completa el estatus original alterándolo firmemente y se evapora o extingue de esa pantalla del monitor automáticamente finalizando su rol del ciclo perfecto e integrándolo como ticket completado por arte cibernético.

### 📝 Resiliencia y Epílogo Recapitulado Final (TL;DR)
No pienses en él como un "Blog montado sobre WordPress arrastrando módulos básicos por plugins", Todo es **pura ingeniería y código a las entrañas y pulso**, desarrollado pieza a pieza de abajo a arriba de la mano.

El **React** renderiza cada frame a 60fps sin pestañear mandando comandos por Axios; Tras la internet como guardaespaldas un **Backend C# fuertemente tipado en .Net 8** maneja la orquesta bloqueando transacciones fraudulentas o hackers o evitando un error vital resolviendo algoritmos de convalidaciones en las reservas (con los Token invisibles JWT garantizando tus accesos en el acto); Y por debajo sosteniendo toneladas y las estructuras complejas subyace el inmutable gigante dormidito e integral de memoria en el MySQL del Host registrando qué platos se cobran o cómo caen matemáticamente o deducen una lonfa de pan restada del sistema backoffice tras hacer la comanda de Cocinas en línea paralela... Simplemente Fascinante y Moderno.
