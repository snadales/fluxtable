import { db, schema } from './index';

export async function runSeed() {
  console.log('🌱 Iniciando Seed de demostración para BaserowLite...');

  // 1. Crear Usuario Principal
  const [adminUser] = await db
    .insert(schema.users)
    .values({
      email: 'snadales@gmail.com',
      name: 'Sebastián Nadales',
      role: 'superadmin',
      isActive: true,
    })
    .onConflictDoNothing()
    .returning();

  const userId = adminUser?.id || (await db.query.users.findFirst())?.id;
  if (!userId) throw new Error('No se pudo crear o recuperar el usuario inicial');

  // 2. Crear Workspace Principal
  const [workspace] = await db
    .insert(schema.workspaces)
    .values({
      name: 'Yarken Principal',
      slug: 'yarken-principal',
    })
    .onConflictDoNothing()
    .returning();

  const workspaceId = workspace?.id || (await db.query.workspaces.findFirst())?.id;
  if (!workspaceId) throw new Error('No se pudo crear el workspace inicial');

  // 3. Vincular miembro
  await db
    .insert(schema.workspaceMembers)
    .values({
      workspaceId,
      userId,
      role: 'owner',
    })
    .onConflictDoNothing();

  // 4. Crear Base
  const [base] = await db
    .insert(schema.bases)
    .values({
      workspaceId,
      name: 'Operaciones & Compras',
      icon: 'ship',
      color: 'blue',
      order: 1,
    })
    .returning();

  // 5. Crear Tabla
  const [table] = await db
    .insert(schema.tables)
    .values({
      baseId: base.id,
      name: 'Lotes de Importación',
      order: 1,
    })
    .returning();

  // 6. Crear Campos con Metadatos Ricos y Colores
  const fieldDefs = [
    { name: 'Código Contenedor', type: 'text' as const, isPrimary: true, order: 1, width: 180 },
    { 
      name: 'Estado Embarque', 
      type: 'select' as const, 
      order: 2, 
      width: 170,
      options: {
        options: [
          { id: 'opt_fabrica', value: 'En Fábrica', color: 'yellow' },
          { id: 'opt_transito', value: 'En Tránsito', color: 'blue' },
          { id: 'opt_aduana', value: 'En Aduana San Antonio', color: 'orange' },
          { id: 'opt_bodega', value: 'Recibido en Bodega', color: 'green' },
        ]
      }
    },
    { 
      name: 'Inversión FOB', 
      type: 'currency' as const, 
      order: 3, 
      width: 150,
      options: { currencySymbol: 'US$', precision: 2, thousandsSeparator: ',', decimalSeparator: '.' }
    },
    { 
      name: 'Costo Final Puesto', 
      type: 'currency' as const, 
      order: 4, 
      width: 160,
      options: { currencySymbol: '$', precision: 0, thousandsSeparator: '.', decimalSeparator: ',' }
    },
    { 
      name: 'Avance Logístico', 
      type: 'progress' as const, 
      order: 5, 
      width: 150 
    },
    { 
      name: 'Calificación Naviera', 
      type: 'rating' as const, 
      order: 6, 
      width: 160 
    },
    { 
      name: 'Fecha Estimada Arribo', 
      type: 'date' as const, 
      order: 7, 
      width: 160,
      options: { dateFormat: 'DD/MM/YYYY' }
    },
    { 
      name: 'Fórmula Margen', 
      type: 'formula' as const, 
      order: 8, 
      width: 160,
      options: { formulaExpression: '{Costo Final Puesto} * 1.35' }
    },
  ];

  const createdFields = [];
  for (const f of fieldDefs) {
    const [created] = await db
      .insert(schema.fields)
      .values({
        tableId: table.id,
        name: f.name,
        type: f.type,
        isPrimary: f.isPrimary ?? false,
        order: f.order,
        width: f.width,
        options: f.options ?? {},
      })
      .returning();
    createdFields.push(created);
  }

  // Asignar campo primario
  await db
    .update(schema.tables)
    .set({ primaryFieldId: createdFields[0].id })
    .where(db.schema ? undefined : undefined); // placeholder

  // 7. Crear Vistas Canónicas
  await db.insert(schema.views).values([
    {
      tableId: table.id,
      name: 'Todos los Lotes',
      type: 'grid',
      order: 1,
      config: {
        frozenColumnCount: 1,
      },
    },
    {
      tableId: table.id,
      name: 'Por Estado (Kanban)',
      type: 'kanban',
      order: 2,
      config: {
        kanbanGroupByFieldId: createdFields[1].id,
      },
    },
    {
      tableId: table.id,
      name: 'Formulario de Captura',
      type: 'form',
      order: 3,
      isPublic: true,
      publicToken: 'form_demo_compras_2026',
      config: {
        formTitle: 'Registro de Nuevo Embarque',
        submitButtonText: 'Guardar Lote',
      },
    },
  ]);

  // 8. Crear Registros de Demostración
  const fCode = createdFields[0].id;
  const fStatus = createdFields[1].id;
  const fFob = createdFields[2].id;
  const fClp = createdFields[3].id;
  const fProgress = createdFields[4].id;
  const fRating = createdFields[5].id;
  const fDate = createdFields[6].id;

  const recordsData = [
    {
      [fCode]: 'MSKU-892147-9',
      [fStatus]: 'opt_transito',
      [fFob]: 45200.50,
      [fClp]: 42800000,
      [fProgress]: 65,
      [fRating]: 5,
      [fDate]: '2026-11-28',
    },
    {
      [fCode]: 'TCLU-419082-1',
      [fStatus]: 'opt_aduana',
      [fFob]: 32150.00,
      [fClp]: 30540000,
      [fProgress]: 90,
      [fRating]: 4,
      [fDate]: '2026-11-18',
    },
    {
      [fCode]: 'CMAU-109238-4',
      [fStatus]: 'opt_bodega',
      [fFob]: 18900.00,
      [fClp]: 17950000,
      [fProgress]: 100,
      [fRating]: 5,
      [fDate]: '2026-11-05',
    },
    {
      [fCode]: 'HLXU-772910-3',
      [fStatus]: 'opt_fabrica',
      [fFob]: 58000.00,
      [fClp]: 55100000,
      [fProgress]: 20,
      [fRating]: 3,
      [fDate]: '2026-12-15',
    },
  ];

  for (let i = 0; i < recordsData.length; i++) {
    await db.insert(schema.records).values({
      tableId: table.id,
      order: i + 1,
      version: 1,
      data: recordsData[i],
      content: `## Bitácora de Embarque ${recordsData[i][fCode]}\n- Proveedor confirmado.\n- Documentación BL recibida sin observaciones.`,
      createdBy: 'snadales@gmail.com',
    });
  }

  console.log('✅ Seed completado con éxito: 1 workspace, 1 base, 1 tabla, 8 campos, 3 vistas y 4 registros.');
}

if (process.env.NODE_ENV !== 'test') {
  runSeed().catch((err) => {
    console.error('Error en seed:', err);
    process.exit(1);
  });
}
