// Importacion de librerias
const express = require('express');
const { MongoClient } = require('mongodb');
const router = express.Router();


// Manejo de variables de entorno
require('dotenv').config();

// Variables para la conexiona la base de datos
const bases = process.env.DATABASE;
/* console.log(bases); */
const nameDB = "farmaciaCampus";


// Ruta general
router.get('/hola', async(req, res) => {
    try {
        res.json('FARCMACIA CAMPUS');
    } catch (e) {
        res.json('NO!, ESTA MAL!');
    }
});

// *********** ENDPOINTS *********** //
// 1. Obtener todos los medicamentos con menos de 50 unidades en stock. 
router.get('/ejercicio1', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.find({"stock":{$lt:50}}).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});

// 2. Listar los proveedores con su información de contacto en medicamentos.
router.get('/ejercicio2', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.distinct('proveedor');
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 3. Medicamentos comprados al ‘Proveedor A’.
router.get('/ejercicio3', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.find({"proveedor.nombre":"ProveedorA"}).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 4. Obtener recetas médicas emitidas después del 1 de enero de 2023.
router.get('/ejercicio4', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.find({"fechaVenta":{$gt:new Date("2023-01-10T00:00:00.000+00:00")}}).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 5. Total de ventas del medicamento ‘Paracetamol’
router.get('/ejercicio5', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
            {
              $unwind: "$medicamentosVendidos" /* Descompone el array "medicamentosVendidos" en documentos separados para facilitar la búsqueda. */
            },
            {
              $match: {
                "medicamentosVendidos.nombreMedicamento": "Paracetamol" /*  */
              } /* Filtra los documentos donde el nombre del medicamento vendido sea 'Paracetamol' */
            },
            {
              $group: {
                _id: "Paracetamol",
                totalVentas: { $sum: "$medicamentosVendidos.cantidadVendida" }
              } /* Agrupa los documentos y calcula la suma de la cantidad vendida para obtener el total de ventas. */
            }
          ]).toArray();
          
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});

// 6. Medicamentos que caducan antes del 1 de enero de 2024.
router.get('/ejercicio6', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.find({"fechaExpiracion":{$lt:new Date("2025-01-10T00:00:00.000+00:00")}}).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 7. Total de medicamentos vendidos por cada proveedor.
/* router.get('/ejercicio7', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
            {
              $unwind: "$medicamentosVendidos" //Descompone el array "medicamentosVendidos" en documentos separados para facilitar la agregación.
            },
            {
              $lookup: {  
                from: "Compras",
                localField: "medicamentosVendidos.nombreMedicamento",
                foreignField: "medicamentosComprados.nombreMedicamento",
                as: "compras" 
              } // $lookup: Realiza una operación de unión con la colección "Compras" para obtener información sobre las compras relacionadas con los medicamentos vendidos.
            },
            {
              $unwind: "$compras" //Descompone el array resultante de la operación de unión.
            },
            {
              $group: {
                _id: "$compras.proveedor.nombre",
                totalMedicamentosVendidos: { $sum: "$medicamentosVendidos.cantidadVendida" }
              } //Agrupa los documentos por el nombre del proveedor y calcula la suma de la cantidad vendida de medicamentos para cada proveedor.
            }
          ]).toArray();
          
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
}); */

/* Mejor opcion del 7. */
router.get('/ejercicio7', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $lookup: {
            from: "Medicamentos",
            localField: "medicamentosVendidos.nombreMedicamento",
            foreignField: "nombre",
            as: "medicamento"
          }
        },
        {
          $unwind: "$medicamento"
        },
        {
          $group: {
            _id: "$medicamento.proveedor.nombre",
            totalMedicamentosVendidos: { $sum: "$medicamentosVendidos.cantidadVendida" }
          }
        },
        {
          $project: {
            proveedor: "$_id",
            totalMedicamentosVendidos: 1,
            _id: 0
          }
        }
      ]).toArray(); 
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});

// 8. Cantidad total de dinero recaudado por las ventas de medicamentos.
router.get('/ejercicio8', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
            {
                $unwind : "$medicamentosVendidos"
            },
            {
                $group: {
                  _id: "dineroVentasMedicamentos",
                  totalDineroRecaudado: { $sum: { $multiply: ["$medicamentosVendidos.cantidadVendida", "$medicamentosVendidos.precio"] } }
                }
            }
        ]).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});




// 9. Medicamentos que no han sido vendidos.
router.get('/ejercicio9', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        
        const coleccionVentas = dataBase.collection('Ventas');
        const nombresMedicamentosVendidos = await coleccionVentas.distinct('medicamentosVendidos.nombreMedicamento');
        
        const coleccionMedicamentos = dataBase.collection('Medicamentos');
        const result = await coleccionMedicamentos.find({
            "nombre": {
                $nin: nombresMedicamentosVendidos
            }
        }).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 10. Obtener el medicamento más caro.
router.get('/ejercicio10', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.find().sort({ precio: -1 }).limit(1).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 11. Número de medicamentos por proveedor.
router.get('/ejercicio11', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Medicamentos');
        const result = await coleccion.aggregate([
            {
                $group: {
                    _id: "$proveedor.nombre",
                    cantidadMedicamentos: { $sum: 1 }
                }
            }
        ]).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 12. Pacientes que han comprado Paracetamol.
router.get('/ejercicio12', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
            {
              $match: { "medicamentosVendidos.nombreMedicamento": "Paracetamol" }
            },
            {
              $group: {
                _id: "$paciente.nombre",
                direccion: { $first: "$paciente.direccion" },
              }
            }
          ]).toArray()
          
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 13. Pacientes que han comprado Paracetamol.
router.get('/ejercicio13', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Proveedores');
        const result = await coleccion.aggregate([
            {
              $lookup: {
                from: "Ventas",
                let: { proveedorNombre: "$nombre" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$$proveedorNombre", "$medicamentosVendidos.proveedor.nombre"] },
                          { $gte: ["$fechaVenta", new Date("2022-01-01T00:00:00.000Z")] } // Cambia esta fecha por la actual menos un año
                        ]
                      }
                    }
                  }
                ],
                as: "ventas"
              }
            },
            {
              $match: {
                ventas: { $size: 0 }
              }
            },
            {
              $project: {
                _id: 0,
                nombre: "$nombre"
              }
            }
          ]).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 14. Obtener el total de medicamentos vendidos en marzo de 2023.
router.get('/ejercicio14', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
            {
              $match: {
                fechaVenta: {
                  $gte: new Date("2023-03-01T00:00:00.000Z"),
                  $lt: new Date("2023-04-01T00:00:00.000Z")
                }
              }
            },
            {
              $unwind: "$medicamentosVendidos"
            },
            {
              $group: {
                _id: null,
                totalMedicamentosVendidos: {
                  $sum: "$medicamentosVendidos.cantidadVendida"
                }
              }
            }
          ]).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 15. Obtener el medicamento menos vendido en 2023.
router.get('/ejercicio15', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Ventas');
        const result = await coleccion.aggregate([
          {
            $match: {
              fechaVenta: {
                $gte: new Date("2023-01-01"),
                $lt: new Date("2024-01-01")
              }
            }
          },
          {
            $unwind: "$medicamentosVendidos"
          },
          {
            $group: {
              _id: "$medicamentosVendidos.nombreMedicamento",
              totalVentas: { $sum: "$medicamentosVendidos.cantidadVendida" }
            }
          },
          {
            $sort: { totalVentas: 1 }
          },
          {
            $group: {
              _id: null,
              medicamentos: {
                $push: {
                  nombreMedicamento: "$_id",
                  totalVentas: "$totalVentas"
                }
              },
              minVentas: { $first: "$totalVentas" }
            }
          },
          {
            $project: {
              _id: 0,
              medicamentos: {
                $filter: {
                  input: "$medicamentos",
                  as: "medicamento",
                  cond: { $eq: ["$$medicamento.totalVentas", "$minVentas"] }
                }
              }
            }
          }
        ]).toArray();  
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 16. Obtener el medicamento menos vendido en 2023.
router.get('/ejercicio16', async (req, res) => {
    try {
        const client = new MongoClient(bases);
        await client.connect();
        const dataBase = client.db('farmaciaCampus');
        const coleccion = dataBase.collection('Compras');
        const result = await coleccion.aggregate([
            {
              $match: {
                fechaCompra: {
                  $gte: new Date("2023-01-01"),
                  $lt: new Date("2024-01-01")
                }
              }
            },
            {
              $unwind: "$medicamentosComprados"
            },
            {
              $group: {
                _id: "$proveedor.nombre",
                gananciaTotal: {
                  $sum: { $multiply: ["$medicamentosComprados.precioCompra", "$medicamentosComprados.cantidadComprada"]}
                }
              }
            }
          ]).toArray();
        res.json(result);
        client.close();
    } catch (e) {
        res.status(404).json("No se encontro los datos");
    }
});


// 17. Promedio de medicamentos comprados por venta.
router.get('/ejercicio17', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: null,
            totalMedicamentosComprados: { $sum: "$medicamentosVendidos.cantidadVendida" },
            totalVentas: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            promedioMedicamentosPorVenta: { $divide: ["$totalMedicamentosComprados", "$totalVentas"] }
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 18. Cantidad de ventas realizadas por cada empleado en 2023.
router.get('/ejercicio18', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $group: {
            _id: "$empleado.nombre",
            totalVentas: { $sum: 1 }
          }
        },
        {
          $project: {
            empleado: "$_id",
            totalVentas: 1,
            _id: 0
          }
        }
      ]).toArray();
      
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 19. Obtener todos los medicamentos que expiren en 2024.
router.get('/ejercicio19', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Medicamentos');
      const result = await coleccion.find({
        fechaExpiracion: {
          $gte: new Date("2024-01-01"),
          $lt: new Date("2025-01-01")
        }
      }).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 20. Empleados que hayan hecho más de 5 ventas en total.
router.get('/ejercicio20', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $group: {
            _id: "$empleado.nombre",
            totalVentas: { $sum: 1 }
          }
        },
        {
          $match: {
            totalVentas: { $gt: 5 } 
          }
        },
        {
          $project: {
            empleado: "$_id",
            totalVentas: 1,
            _id: 0
          }
        }
      ]).toArray();

      if(result.length === 0){
        res.json({
          msg: 'NINGUNO'
        });
      }else{
        res.json(result);
      }
      
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 21. Medicamentos que no han sido vendidos nunca.
router.get('/ejercicio21', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Medicamentos');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "medicamentosVendidos.nombreMedicamento",
            as: "ventas"
          }
        },
        {
          $match: {
            ventas: { $size: 0 } 
          }
        },
        {
          $project: {
            _id: 0,
            nombre: 1
          }
        }
      ]).toArray();   
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 22. Paciente que ha gastado más dinero en 2023.
router.get('/ejercicio22', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: "$paciente.nombre",
            totalGastado: { $sum: { $multiply: ["$medicamentosVendidos.cantidadVendida", "$medicamentosVendidos.precio"] } }
          }
        },
        {
          $sort: {
            totalGastado: -1
          }
        },
        {
          $limit: 1
        },
        {
          $project: {
            paciente: "$_id",
            totalGastado: 1,
            _id: 0
          }
        }
      ]).toArray();
      
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 23. Empleados que no han realizado ninguna venta en 2023. 
router.get('/ejercicio23', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Empleados');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "empleado.nombre",
            as: "ventas"
          }
        },
        {
          $match: {
            "ventas.fechaVenta": { $not: { $gte: new Date("2023-01-01"), $lt: new Date("2024-01-01") } }
          }
        },
        {
          $project: {
            _id: 0,
            nombre: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 24. Proveedor que ha suministrado más medicamentos en 2023.
router.get('/ejercicio24', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Compras');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaCompra: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosComprados"
        },
        {
          $group: {
            _id: "$proveedor.nombre",
            totalSuministrado: { $sum: "$medicamentosComprados.cantidadComprada" }
          }
        },
        {
          $sort: {
            totalSuministrado: -1
          }
        },
        {
          $limit: 1
        },
        {
          $project: {
            proveedor: "$_id",
            totalSuministrado: 1,
            _id: 0
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 25. Pacientes que compraron el medicamento “Paracetamol” en 2023.
router.get('/ejercicio25', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $match: {
            "medicamentosVendidos.nombreMedicamento": "Paracetamol"
          }
        },
        {
          $lookup: {
            from: "Pacientes",
            localField: "paciente.nombre",
            foreignField: "nombre",
            as: "pacienteInfo"
          }
        },
        {
          $project: {
            _id: 0,
            paciente: "$pacienteInfo.nombre"
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 26. Total de medicamentos vendidos por mes en 2023.
router.get('/ejercicio26', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m",
                date: "$fechaVenta"
              }
            },
            totalMedicamentosVendidos: { $sum: { $size: "$medicamentosVendidos" } }
          }
        },
        {
          $sort: {
            _id: 1
          }
        },
        {
          $project: {
            _id: 0,
            mes: "$_id",
            totalMedicamentosVendidos: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 27. Empleados con menos de 5 ventas en 2023.
router.get('/ejercicio27', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Empleados');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Ventas",
            let: { empleadoNombre: "$nombre" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$empleado.nombre", "$$empleadoNombre"] },
                  fechaVenta: {
                    $gte: new Date("2023-01-01"),
                    $lt: new Date("2024-01-01")
                  }
                }
              }
            ],
            as: "ventas"
          }
        },
        {
          $match: {
            ventas: { $size: 0 } // Filtra empleados sin ventas en 2023
          }
        },
        {
          $project: {
            _id: 0,
            empleado: "$nombre",
            totalVentas: { $size: "$ventas" }
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 28. Número total de proveedores que suministraron medicamentos en 2023.
router.get('/ejercicio28', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Compras');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaCompra: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $group: {
            _id: "$proveedor.nombre"
          }
        },
        {
          $group: {
            _id: null,
            totalProveedores: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            totalProveedores: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 29. Proveedores de los medicamentos con menos de 50 unidades en stock.
router.get('/ejercicio29', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Medicamentos');
      const result = await coleccion.aggregate([
        {
          $match: {
            stock: { $lt: 50 }
          }
        },
        {
          $lookup: {
            from: "Proveedores",
            localField: "proveedor.nombre",
            foreignField: "nombre",
            as: "proveedores"
          }
        },
        {
          $project: {
            _id: 0,
            nombreMedicamento: "$nombre",
            proveedores: "$proveedores.nombre"
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 30. Pacientes que no han comprado ningún medicamento en 2023.
router.get('/ejercicio30', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Pacientes');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Compras",
            localField: "nombre",
            foreignField: "paciente.nombre",
            as: "compras"
          }
        },
        {
          $match: {
            "compras": { $eq: [] }, // Filtra pacientes sin compras en 2023
          }
        },
        {
          $project: {
            _id: 0,
            paciente: "$nombre"
          }
        }
      ]).toArray();   
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 31. Medicamentos que han sido vendidos cada mes del año 2023.
router.get('/ejercicio31', async (req, res) => {
  try {
    const meses = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio", 
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const resultados = [];

    const client = new MongoClient(bases);
    await client.connect();
    const dataBase = client.db('farmaciaCampus');
    const coleccion = dataBase.collection('Ventas');

    for (let indice = 0; indice < meses.length; indice++) {
      const mes = meses[indice];
      const primerDia = new Date(2023, indice, 1);
      const ultimoDia = new Date(2023, indice + 1, 0);

      const consulta = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: primerDia,
              $lte: ultimoDia
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: "$medicamentosVendidos.nombreMedicamento"
          }
        },
        {
          $project: {
            _id: 0,
            mes: mes,
            medicamento: "$_id"
          }
        }
      ]).toArray();

      resultados.push(consulta);
    }

    res.json(resultados);
    client.close();
  } catch (e) {
    res.status(404).json("No se encontraron los datos");
  }
});



// 32. Empleado que ha vendido la mayor cantidad de medicamentos distintos en 2023.
router.get('/ejercicio32', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: {
              empleadoNombre: "$empleado.nombre",
              nombreMedicamento: "$medicamentosVendidos.nombreMedicamento"
            }
          }
        },
        {
          $group: {
            _id: "$_id.empleadoNombre",
            totalMedicamentosDistintos: { $sum: 1 }
          }
        },
        {
          $sort: {
            totalMedicamentosDistintos: -1
          }
        },
        {
          $limit: 1
        },
        {
          $project: {
            _id: 0,
            empleado: "$_id",
            totalMedicamentosDistintos: 1
          }
        }
      ]).toArray();     
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 33. Total gastado por cada paciente en 2023.
router.get('/ejercicio33', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2024-01-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: {
              pacienteNombre: "$paciente.nombre",
            },
            totalGastado: { $sum: { $multiply: ["$medicamentosVendidos.cantidadVendida", "$medicamentosVendidos.precio"] } }
          }
        },
        {
          $project: {
            _id: 0,
            paciente: "$_id.pacienteNombre",
            totalGastado: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 34. Medicamentos que no han sido vendidos en 2023.  /* COMPARAR CON EL ENDPOINT 21 */
router.get('/ejercicio34', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Medicamentos');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Ventas",
            localField: "nombre",
            foreignField: "medicamentosVendidos.nombreMedicamento",
            as: "ventas"
          }
        },
        {
          $match: {
            ventas: { $eq: [] } 
          }
        },
        {
          $project: {
            _id: 0,
            nombreMedicamento: "$nombre"
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 35. Proveedores que han suministrado al menos 5 medicamentos diferentes en 2023.
router.get('/ejercicio35', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Proveedores');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Compras",
            localField: "nombre",
            foreignField: "proveedor.nombre",
            as: "compras"
          }
        },
        {
          $unwind: "$compras"
        },
        {
          $unwind: "$compras.medicamentosComprados"
        },
        {
          $group: {
            _id: {
              proveedorNombre: "$nombre",
              medicamentoNombre: "$compras.medicamentosComprados.nombreMedicamento"
            }
          }
        },
        {
          $group: {
            _id: "$_id.proveedorNombre",
            medicamentosDiferentes: { $push: "$_id.medicamentoNombre" }
          }
        },
        {
          $match: {
            medicamentosDiferentes: { $gte: ["$medicamentosDiferentes", 5] }
          }
        },
        {
          $project: {
            _id: 0,
            proveedor: "$_id",
            medicamentosDiferentes: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 36. Total de medicamentos vendidos en el primer trimestre de 2023.
router.get('/ejercicio36', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Ventas');
      const result = await coleccion.aggregate([
        {
          $match: {
            fechaVenta: {
              $gte: new Date("2023-01-01"),
              $lt: new Date("2023-04-01")
            }
          }
        },
        {
          $unwind: "$medicamentosVendidos"
        },
        {
          $group: {
            _id: null,
            totalMedicamentosVendidos: { $sum: "$medicamentosVendidos.cantidadVendida" }
          }
        },
        {
          $project: {
            _id: 0,
            totalMedicamentosVendidos: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 37. Empleados que no realizaron ventas en abril de 2023.
router.get('/ejercicio37', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Empleados');
      const result = await coleccion.aggregate([
        {
          $lookup: {
            from: "Ventas",
            let: { empleadoNombre: "$nombre" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$empleado.nombre", "$$empleadoNombre"] },
                      { $gte: ["$fechaVenta", new Date("2023-04-01")] },
                      { $lt: ["$fechaVenta", new Date("2023-05-01")] }
                    ]
                  }
                }
              }
            ],
            as: "ventasAbril"
          }
        },
        {
          $match: {
            ventasAbril: { $size: 0 }
          }
        },
        {
          $project: {
            _id: 0,
            nombre: 1,
            cargo: 1
          }
        }
      ]).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});


// 38. Medicamentos con un precio mayor a 50 y un stock menor a 100.
router.get('/ejercicio38', async (req, res) => {
  try {
      const client = new MongoClient(bases);
      await client.connect();
      const dataBase = client.db('farmaciaCampus');
      const coleccion = dataBase.collection('Medicamentos');
      const result = await coleccion.find({
        precio: { $gt: 50 },
        stock: { $lt: 100 }
      }).toArray();
      res.json(result);
      client.close();
  } catch (e) {
      res.status(404).json("No se encontro los datos");
  }
});

module.exports = router;