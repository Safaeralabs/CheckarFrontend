// Ítems de checklist compartidos entre el wizard de inspección y el reporte impreso.

export const PRE_EVAL_ITEMS = [
  { key: 'soat_vigente',          label: 'SOAT vigente',                              critical: true,  hasNA: false },
  { key: 'licencia_transito',     label: 'Presentó licencia de tránsito',              critical: true,  hasNA: false },
  { key: 'identificacion',        label: 'Presentó identificación',                   critical: false, hasNA: false },
  { key: 'vehiculo_limpio',       label: 'Vehículo limpio',                           critical: false, hasNA: false },
  { key: 'vehiculo_vacio',        label: 'Vehículo vacío',                            critical: false, hasNA: false },
  { key: 'dispositivos_seguridad',label: 'Dispositivos de seguridad deshabilitados',  critical: false, hasNA: false },
  { key: 'sin_tapacubos',         label: 'Inexistencia de tapacubos',                 critical: false, hasNA: true  },
  { key: 'preparado_inspeccion',  label: 'Vehículo preparado para la inspección',     critical: false, hasNA: false },
]

export const VISUAL_ITEMS = [
  { key: 'carroceria_danos',       category: 'carroceria',   label: 'Sin daños visibles en carrocería' },
  { key: 'carroceria_oxidacion',   category: 'carroceria',   label: 'Sin oxidación severa' },
  { key: 'luces_frontales',        category: 'luces',        label: 'Luces frontales funcionando' },
  { key: 'luces_traseras',         category: 'luces',        label: 'Luces traseras y stop funcionando' },
  { key: 'luces_direccionales',    category: 'luces',        label: 'Direccionales (4 vías) funcionando' },
  { key: 'llantas_desgaste',       category: 'llantas',      label: 'Desgaste uniforme y dentro del límite' },
  { key: 'vidrios_parabrisas',     category: 'vidrios',      label: 'Parabrisas sin fisuras ni daños críticos' },
  { key: 'vidrios_laterales',      category: 'vidrios',      label: 'Vidrios laterales en buen estado' },
  { key: 'cinturones',             category: 'seguridad',    label: 'Cinturones de seguridad funcionando' },
  { key: 'espejos_retrovisores',   category: 'seguridad',    label: 'Espejos retrovisores completos y ajustados' },
]

export const MECH_ITEMS = [
  { key: 'motor_ruidos',           category: 'motor',        label: 'Sin ruidos anormales en motor' },
  { key: 'motor_humo',             category: 'motor',        label: 'Sin emisión de humo visible anormal' },
  { key: 'motor_fugas',            category: 'motor',        label: 'Sin fugas de aceite o refrigerante' },
  { key: 'frenos_pedal',           category: 'frenos',       label: 'Pedal de freno firme y sin juego excesivo' },
  { key: 'frenos_eficiencia',      category: 'frenos',       label: 'Frenado eficiente en línea recta' },
  { key: 'frenos_mano',            category: 'frenos',       label: 'Freno de mano / estacionamiento funcional' },
  { key: 'direccion_juego',        category: 'dirección',    label: 'Sin juego excesivo en volante' },
  { key: 'suspension_estado',      category: 'suspensión',   label: 'Suspensión sin holguras anormales' },
  { key: 'transmision_cambios',    category: 'transmisión',  label: 'Cambios de marcha sin anomalías' },
  { key: 'escape_emisiones',       category: 'escape',       label: 'Sistema de escape sin fugas' },
]
