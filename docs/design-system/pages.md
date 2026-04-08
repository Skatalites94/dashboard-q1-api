# Especificaciones por Modulo

## Dashboard Q1

**Ruta:** `#/dashboard`

- Page header: "Dashboard Q1 2026" (text-2xl, font-bold)
- Selector de trimestre: botones pill (Q1 activo azul, Q2-Q4 ghost)
- Tabs: Resumen Ejecutivo, Areas, Iniciativas, KPIs, Deals
- KPI cards (4): Revenue, Utilidad, Ordenes, Margen
- Tabla semaforo: badges verde/amarillo/rojo por area
- Tabla de areas con responsables

**CSS Overrides (desde index.html, sin tocar app.js):**
- Forzar fondo blanco en cards
- Forzar texto oscuro
- Tables con header gris claro
- Badges adaptados al tema claro

## Configurador de Gastos

**Ruta:** `#/gastos`

### Header
- Titulo: "Configurador de Gastos Fijos" (text-xl)
- Subtitulo: "Grupo Select 2026" (text-secondary)
- Boton "Guardar Escenario" (primary, esquina derecha)

### KPI Strip (6 cards)
1. Gasto Fijo Actual — valor grande, label muted
2. Gasto Fijo Nuevo — valor verde si hay ahorro
3. Ahorro Total — valor + porcentaje
4. Objetivo $200K — progress bar
5. Nomina Actual
6. Nomina Nueva

### Budget por Categoria (5 mini-cards debajo de KPIs)
- Nomina, Operativos, Suscripciones, Consultorias, Financieros
- Cada uno: icono + label + monto mensual

### Tabs (5)
- Nomina (Personas)
- Gastos Operativos
- Suscripciones
- Consultorias
- Gastos Financieros

### Tabla por Tab
- Header: titulo + boton "+ Agregar"
- Columnas por categoria (ver HTML original)
- Toggle switch por fila (cortar/no cortar)
- Input editable para costo
- Boton eliminar (X) por fila
- Footer con totales
- Cut rows: fondo rojo pastel, texto tachado

## Escenarios

**Ruta:** `#/escenarios`

### Header
- Titulo: "Escenarios de Presupuesto"
- Subtitulo: "Guarda, compara y exporta configuraciones"

### Lista de Escenarios (cards grid)
- Card por escenario:
  - Nombre (font-semibold)
  - Descripcion (text-muted, 2 lineas max)
  - Fecha creacion
  - 3 metricas: Original, Nuevo, Ahorro
  - Badge de ahorro (% verde)
  - Botones: Ver Detalle, Comparar, Exportar CSV, Aplicar, Eliminar

### Vista Detalle
- Breadcrumb: Escenarios > {nombre}
- Resumen financiero arriba (3 KPI cards)
- 5 tablas (una por categoria) read-only
- Subtotales por categoria

### Vista Comparacion
- Lado a lado: "Estado Actual" vs "{Escenario}"
- Por categoria: tabla con columnas Nombre, Actual, Escenario, Diferencia
- Filas diferentes resaltadas (fondo warning-light)
- Resumen arriba con delta total

### Empty State
- Icono grande centrado
- "No hay escenarios guardados"
- "Ve al Configurador y guarda tu primer escenario"
- Boton "Ir al Configurador" (primary)
