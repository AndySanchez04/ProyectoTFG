using System;
using MySqlConnector;

var connString = "Server=92.113.22.50;Database=u374392370_reservas;User=u374392370_admin;Password=123456789Boomer";
using var conn = new MySqlConnection(connString);
conn.Open();

// 1. Añadir Teléfono a Usuarios
try {
    var cmdTel = new MySqlCommand("ALTER TABLE Usuarios ADD COLUMN Telefono VARCHAR(50) NULL;", conn);
    cmdTel.ExecuteNonQuery();
    Console.WriteLine("Columna Telefono añadida.");
} catch (Exception ex) {
    Console.WriteLine("Telefono ya existía o error: " + ex.Message);
}

// 2. Unificar zonas a "Salón" y estandarizar prefijo "S-"
try {
    // Primero aseguramos la zona Salón
    var cmdUpdateZonas = new MySqlCommand("UPDATE MesasRestaurante SET Zona = 'Salón' WHERE Zona IN ('Sala del fondo', 'Parte Frontal');", conn);
    cmdUpdateZonas.ExecuteNonQuery();

    // Luego estandarizamos el prefijo: F- -> S-, y los que no tienen prefijo se les añade S-
    var cmdUpdatePrefijos = new MySqlCommand(@"
        UPDATE MesasRestaurante 
        SET NumeroMesa = CASE 
            WHEN NumeroMesa LIKE 'F-%' THEN REPLACE(NumeroMesa, 'F-', 'S-')
            WHEN NumeroMesa NOT LIKE 'T-%' AND NumeroMesa NOT LIKE 'S-%' THEN CONCAT('S-', NumeroMesa)
            ELSE NumeroMesa 
        END
        WHERE Zona = 'Salón';", conn);
    cmdUpdatePrefijos.ExecuteNonQuery();
    
    Console.WriteLine("Zonas unificadas y prefijos 'S-' aplicados correctamente.");
} catch (Exception ex) {
    Console.WriteLine("Error unificando zonas o prefijos: " + ex.Message);
}

// 3. Insertar nuevas mesas (sólo si no existen para no duplicar en re-ejecuciones, pero para simplificar lo insertamos directamente verificando si existen)
try {
    var checkCmd = new MySqlCommand("SELECT COUNT(*) FROM MesasRestaurante WHERE Zona = 'Terraza';", conn);
    var count = Convert.ToInt32(checkCmd.ExecuteScalar());
    
    if (count == 0) {
        var insertSql = @"
            INSERT INTO MesasRestaurante (NumeroMesa, Capacidad, Zona) VALUES 
            ('5', 2, 'Terraza'), ('10', 2, 'Terraza'), ('15', 2, 'Terraza'), ('20', 2, 'Terraza'),
            ('1-2', 4, 'Terraza'), ('3-4', 4, 'Terraza'), ('6-7', 4, 'Terraza'), ('8-9', 4, 'Terraza'), 
            ('11-12', 4, 'Terraza'), ('13-14', 4, 'Terraza'), ('16-17', 4, 'Terraza'), ('18-19', 4, 'Terraza'),
            ('1', 4, 'Parte Frontal'), ('2', 4, 'Parte Frontal'), ('3', 4, 'Parte Frontal'), ('4', 4, 'Parte Frontal'), 
            ('6', 4, 'Parte Frontal'), ('8', 4, 'Parte Frontal'), ('10', 4, 'Parte Frontal'),
            ('5', 2, 'Parte Frontal'), ('7', 2, 'Parte Frontal'), ('9', 2, 'Parte Frontal');
        ";
        var cmdInsert = new MySqlCommand(insertSql, conn);
        cmdInsert.ExecuteNonQuery();
        Console.WriteLine("Mesas de Terraza y Parte Frontal insertadas correctamente.");
    } else {
        Console.WriteLine("Las mesas ya fueron insertadas previamente.");
    }
} catch (Exception ex) {
    Console.WriteLine("Error insertando mesas: " + ex.Message);
}
