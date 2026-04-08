# Plan y Alcance del Proyecto — Vision 2026 Dashboard
**Stencil Group / Promoselect**
**Fecha:** 8 de Abril, 2026
**Responsable:** Jeronimo Celis (CEO/Director)

---

## 1. Vision del Proyecto

Crear una plataforma web interna de planeacion estrategica que integre:
- **Control de gastos** con simulacion de presupuestos
- **Simulacion de ingresos** con modelos predictivos de ventas
- **Estado de resultados proyectado** (P&L) combinando ambos
- **OKRs y KPIs** por departamento (fase posterior)

El objetivo es tener una herramienta que permita al director tomar decisiones informadas sobre contratacion, inversion, metas de venta y asignacion de recursos.

---

## 2. Arquitectura Tecnica

| Componente | Tecnologia |
|---|---|
| Backend | FastAPI + SQLAlchemy 2.0 + Python 3.11 |
| Frontend | Vanilla JS (modulos) + React (dashboard) |
| Base de datos | Supabase (PostgreSQL) con SQLite fallback local |
| Deploy | Railway (produccion) |
| Repo | GitHub: Skatalites94/dashboard-q1-api |
| Design System | docs/design-system/ (tema claro, estilo Perdoo) |

**URL produccion:** https://dashboard-q1-api-production.up.railway.app

---

## 3. Modulos y Alcance

### 3.1 Dashboard Q1 (COMPLETADO)
**Ruta:** `#/dashboard`

- KPIs ejecutivos: Revenue, Utilidad, Ordenes, Margen
- Semaforo de areas (verde/amarillo/rojo)
- Tabla de deals por asesor
- Iniciativas estrategicas con avance
- Metas anuales 2026 vs 2025
- Selector de trimestre (Q1-Q4)

### 3.2 Configurador de Gastos (COMPLETADO)
**Ruta:** `#/gastos`

**Funcionalidades:**
- 5 categorias de gasto: Nomina, Operativos, Suscripciones, Consultorias, Financieros
- Sistema de categorias personalizables por modulo
- Edicion inline de todos los campos (nombre, nota, costo, departamento)
- Toggle cortar/no cortar por partida
- Columnas: Costo, Nuevo, Variacion, Nota en todas las tablas

**Nomina avanzada:**
- Sueldo neto (lo que percibe el empleado)
- Esquema de pago: Nomina GPP, Poder Global, Factura, Mixto, Otra Razon Social
- Costo empresa calculado automaticamente segun esquema y factor de carga (~35%)
- Simulacion: cambiar esquema de pago y ver impacto en costo empresa en tiempo real
- Datos reales de nominas GPP + sueldos de otras razones sociales

**Suscripciones avanzadas:**
- Cantidad de usuarios/licencias por suscripcion
- Costo por usuario (toggle por usuario vs general)
- Moneda MXN/USD con tipo de cambio configurable
- Costo MXN equivalente calculado automaticamente

**Presupuesto base:**
- Boton "Guardar como Base" para establecer el presupuesto actual
- Indicador visual del estado base guardado
- Los escenarios son simulaciones sobre la base

### 3.3 Escenarios de Gastos (COMPLETADO)
**Ruta:** `#/escenarios`

- Vista de presupuesto base destacado
- Lista de simulaciones (escenarios)
- Comparacion lado a lado: Base vs Simulacion
- Exportacion a CSV
- Aplicar escenario a datos vivos

### 3.4 Simulador de Ingresos (POR CONSTRUIR)
**Ruta:** `#/simulador`

#### Enfoque 1: Por Equipo de Ventas (Advisor-based)
**Variables por asesor:**
- Nombre, tipo (Rookie/Junior/Senior), fecha de inicio
- Cuota mensual: Rookie $600K, Junior $1.2M, Senior $2M
- Nivel de madurez (% de cuota que puede alcanzar): 30% → 60% → 90%
- Periodos de transicion: Rookie 6 meses, Junior 12 meses, Senior 24 meses

**Variables globales:**
- Indice de estacionalidad mensual (Ene 0.91, Feb 0.69, Mar 1.22, Jul 1.40, Dic 0.54, etc.)
- Margen bruto promedio: ~28-30%
- Overhead por asesor: ~$2,850/mes (CRM, Aircall, celular, correos, Roam)

**Modelo de comisiones por tipo:**
| | Senior | Junior | Rookie |
|---|---|---|---|
| Sueldo neto | $25,000 | $16,000 | $15,000 |
| Costo empresa | $33,750 | $21,600 | $20,250 |
| Meta mensual | $2,000,000 | $1,200,000 | $650-700K |
| Comision base | 6.5% utilidad | 5.5% utilidad | 5% utilidad |
| Acelerador | 1.5% excedente | 1.5% excedente | 1% excedente |
| Bonos (B1-B4) | $2.5K-$7K | $1.5K-$4.5K | $1K-$4K |

**Calculo:**
```
venta_proyectada[asesor][mes] = cuota * madurez% * estacionalidad[mes]
costo_asesor[mes] = sueldo + comisiones + bonos + overhead
```

**Capacidad:**
- Alertas cuando la demanda proyectada excede la capacidad del equipo
- # de tratos que puede atender un asesor por dia

#### Enfoque 2: Por Comportamiento de Clientes (Pipeline-based)
**3 tipos de cliente:**
| | AAAH (Alto Historico) | AAAC (Alto Cierre) | A (Regular) |
|---|---|---|---|
| Ticket promedio | $688,198 | $213,723 | $72,869 |
| Tiempo de cierre | 3 meses | 3 meses | 1 mes |
| Tasa de retencion | 80% | 80% | 70% |
| Tasa de cierre | 50% | 50% | 50% |
| Facturas/mes/cliente | 0.34 | 1.35 | 0.46 |

**Variables editables:**
- Leads mensuales por tipo
- Tasas de retencion y cierre
- Ticket promedio
- Tiempo de conversion

**Modelo de cohortes (mensual):**
```
leads_totales[tipo][mes] = leads_nuevos + leads_retenidos_del_pasado
clientes_nuevos[tipo][mes] = leads_totales[mes - tiempo_cierre] * tasa_cierre
clientes_activos[tipo][mes] = clientes_activos[mes-1] * retencion + clientes_nuevos
facturas[tipo][mes] = clientes_activos * facturas_por_cliente
ingreso[tipo][mes] = facturas * ticket_promedio
```

#### Escenarios de Ingresos
- Guardar proyecciones como escenarios nombrados
- Comparar escenarios de ingresos entre si
- Empatar escenario de ingresos + escenario de gastos = P&L proyectado

### 3.5 Estado de Resultados Integrado (POR CONSTRUIR)
**Dentro del modulo Simulador, Tab "Escenarios Integrados"**

- Seleccionar un escenario de ingresos + un escenario de gastos
- Ver P&L mensual proyectado a 12 meses:
  - Ingresos
  - Costo de ventas
  - Utilidad bruta
  - Gastos operativos
  - Utilidad operativa
  - Gastos financieros
  - Utilidad neta
- KPIs: Ingreso anual, Gasto anual, Utilidad, Margen %

### 3.6 OKRs / Balanced Scorecard / KPIs (FASE POSTERIOR)
**Ruta:** `#/okrs` (futuro)

- Definicion de OKRs por trimestre y por departamento
- KPIs por area con metas y avance
- Iniciativas estrategicas con responsable, prioridad, estatus
- Vinculacion: los escenarios integrados definen las capacidades necesarias → de ahi se derivan los OKRs

**Este modulo se construira DESPUES de que los simuladores de ingresos y gastos esten funcionando.**

---

## 4. Flujo de Uso (como Director)

```
1. Definir presupuesto base de gastos
   └→ Configurador de Gastos → Guardar como Base

2. Simular ingresos con ambos enfoques
   └→ Simulador → Equipo de Ventas (ajustar asesores, metas, madurez)
   └→ Simulador → Pipeline de Clientes (ajustar leads, tickets, conversion)
   └→ Guardar como Escenario de Ingresos

3. Crear escenarios de gastos (simulaciones)
   └→ Configurador → modificar → Guardar Escenario

4. Empatar ingresos + gastos
   └→ Simulador → Escenarios Integrados → ver P&L

5. Tomar decisiones:
   - Cuantos asesores contratar y de que tipo
   - Que gastos recortar
   - Que metas son realistas
   - Que capacidades se necesitan

6. (Futuro) Definir OKRs del trimestre basado en los escenarios
```

---

## 5. Datos de Referencia

### Archivos fuente
| Archivo | Contenido |
|---|---|
| `Nomina Grupo Publicitario (1).xlsx` | Nominas reales ENE-MAR 2026, quincenales |
| `sueldos..xlsx` | Sueldos de empleados en otras razones sociales |
| `Archivo Analisis Ventas + proyecciones PS.xlsx` | Simulador de ventas (por asesor + por pipeline) |
| `Simulador de comisiones Vendedores y objetivos diarios..xlsx` | Esquemas de comisiones, objetivos, costos por vendedor |

### Equipo de ventas actual
- 1 Senior (Ivette)
- 3-4 Juniors (Ulises, Margarita, Gabriel Loyola, Elba Karina)
- 2-3 Rookies (Lorena, Irma, nuevos)
- 1 Sr CDMX (Vanesa, en etapa 1)

### Estacionalidad mensual (indice)
| Mes | Indice | Tipo |
|---|---|---|
| Ene | 0.91 | Normal |
| Feb | 0.69 | BAJO |
| Mar | 1.22 | ALTO |
| Abr | 0.98 | Normal |
| May | 1.04 | Normal |
| Jun | 1.35 | ALTO |
| Jul | 1.40 | MUY ALTO |
| Ago | 0.93 | Normal-bajo |
| Sep | 0.71 | BAJO |
| Oct | 1.04 | Normal |
| Nov | 0.86 | Bajo |
| Dic | 0.54 | MUY BAJO |

---

## 6. Prioridades de Implementacion

| # | Modulo | Estado | Prioridad |
|---|---|---|---|
| 1 | Dashboard Q1 | Completado | - |
| 2 | Configurador de Gastos | Completado | - |
| 3 | Escenarios de Gastos | Completado | - |
| 4 | **Simulador de Ingresos** | **En construccion** | **Alta** |
| 5 | **Escenarios Integrados (P&L)** | **Pendiente** | **Alta** |
| 6 | OKRs / Balanced Scorecard | Pendiente | Media (fase posterior) |

---

## 7. Principios de Diseno

- **Simplicidad:** No sobre-complicar los simuladores. Variables clave, no todas las posibles.
- **Interactividad:** Cambiar una variable y ver el impacto en tiempo real.
- **Congruencia:** Todo debe verse y sentirse como una sola app (design system).
- **Persistencia:** Los escenarios se guardan como snapshots JSON para comparacion futura.
- **Actuarial:** El modelo matematico debe ser lo mas cercano posible a la realidad para predecir ventas.

---

## 8. Modelo Matematico Completo del Simulador

### La Cadena Completa: Inversion → Leads → Ventas → Ingresos → P&L

```
MARKETING (Inversion)
  └→ genera LEADS por canal
       └→ se califican en tipos (AAAH, AAAC, A)
            └→ entran al PIPELINE
                 └→ se asignan al EQUIPO DE VENTAS
                      └→ se convierten en CLIENTES
                           └→ generan INGRESOS
                                └→ menos GASTOS = UTILIDAD
```

### 8.1 Capa de Marketing (NUEVO — faltaba en el plan original)

**El problema:** Los leads no aparecen magicamente. Hay una inversion de marketing que los genera, y distintos canales tienen distinto costo por lead (CPL) y distinta calidad.

**Variables editables:**

| Variable | Ejemplo | Editable |
|---|---|---|
| Presupuesto mensual de MKT | $77,745 (actual) | Si |
| Distribucion por canal | Pautas 30%, Eventos 40%, SEO 15%, Referidos 15% | Si |
| CPL por canal | Pautas $500, Eventos $2,000, SEO $200, Referidos $0 | Si |
| Tasa de calificacion MQL→SQL | 40% | Si |
| Distribucion de calidad | 10% AAAH, 20% AAAC, 70% A | Si |

**Calculo:**
```
leads_brutos[canal][mes] = presupuesto_canal / CPL_canal
leads_calificados[mes] = sum(leads_brutos) * tasa_calificacion
leads_AAAH[mes] = leads_calificados * 10%
leads_AAAC[mes] = leads_calificados * 20%
leads_A[mes] = leads_calificados * 70%
```

**Esto conecta Marketing con Pipeline:** en vez de poner leads manualmente, el simulador los CALCULA a partir de la inversion de MKT. Pero tambien puedes override los leads manualmente si quieres.

**KPIs de Marketing derivados:**
- CPL promedio ponderado
- CAC (Costo de Adquisicion de Cliente) = Inversion MKT / Clientes nuevos
- ROI de MKT = (Ingreso por clientes nuevos - Inversion MKT) / Inversion MKT
- Leads necesarios para cumplir meta de ventas (calculo inverso)

### 8.2 Como se empatan los 2 enfoques (Supply vs Demand)

**No se suman. Se comparan para encontrar el cuello de botella:**

```
Capacidad_equipo[mes] = suma(cuota * madurez% * estacionalidad) por cada asesor activo
Demanda_pipeline[mes] = suma(facturas * ticket) por cada tipo de cliente
Proyeccion_real[mes] = min(Capacidad, Demanda) * factor_friccion(0.85)
```

**Cuello de botella por mes:**
- Si Demanda > Capacidad → CONTRATAR (equipo insuficiente)
- Si Capacidad > Demanda → MAS LEADS/MKT (equipo ocioso)
- Si estan balanceados → OPTIMIZADO

### 8.3 Madurez del asesor (curva S logistica)

```
madurez(dias) = meta / (1 + e^(-k * (dias - punto_medio)))

Rookie: meta=70%, punto_medio=120 dias, k=0.025
Junior: meta=85%, punto_medio=180 dias, k=0.02
Senior: meta=95%, punto_medio=90 dias, k=0.03
```

### 8.4 P&L Integrado (12 meses)

```
INGRESOS
  Ventas brutas (proyeccion integrada)
  (-) Descuentos y devoluciones (% configurable)
  = Ventas netas

COSTO DE VENTAS
  (-) Costo de producto (1 - margen%)
  = UTILIDAD BRUTA

GASTOS OPERATIVOS (del escenario de gastos)
  (-) Nomina
  (-) Operativos
  (-) Suscripciones
  (-) Consultorias
  (-) Marketing (ya incluido arriba como inversion)
  = UTILIDAD OPERATIVA (EBITDA)

GASTOS FINANCIEROS
  (-) Intereses, comisiones bancarias, seguros
  = UTILIDAD ANTES DE IMPUESTOS

  (-) ISR estimado (~30%)
  (-) PTU estimado (~10%)
  = UTILIDAD NETA
```

---

## 9. Gap Analysis — Que mas falta para un simulador completo

### Lo que YA tenemos:
- [x] Gastos fijos por categoria con edicion completa
- [x] Nomina con esquemas de pago y costo empresa
- [x] Suscripciones con moneda y usuarios
- [x] Escenarios de gastos con comparacion
- [x] Dashboard Q1 con datos reales

### Lo que FALTA construir (Fase actual):
- [ ] **Marketing simulator** — inversion, canales, CPL, generacion de leads
- [ ] **Pipeline simulator** — modelo de cohortes por tipo de cliente
- [ ] **Team simulator** — roster de asesores, madurez, capacidad
- [ ] **Proyeccion integrada** — Supply vs Demand, cuello de botella
- [ ] **Escenarios de ingresos** — guardar, comparar
- [ ] **P&L integrado** — combinar ingresos + gastos

### Lo que falta para FUTURO (no ahora):
- [ ] **Presupuesto por area/departamento** — asignar presupuesto a cada area y trackear gasto real vs presupuesto
- [ ] **Plan de contrataciones** — timeline de cuando contratar, con impacto en gastos y en capacidad de ventas
- [ ] **Plan de infraestructura** — bodega, equipo, vehiculos, con depreciacion
- [ ] **Plan de eventos** — calendario de eventos con inversion y ROI esperado
- [ ] **Presupuesto de publicidad** — por canal, por mes, con objetivos de leads
- [ ] **OKRs/KPIs** — derivados de los escenarios: metas por area, iniciativas
- [ ] **Cashflow** — proyeccion de flujo de caja (no solo P&L sino timing de cobros/pagos)
- [ ] **Analisis de sensibilidad automatico** — "si el cierre baja 10%, que pasa?" con graficas tornado

### Consideraciones que no quiero olvidar:
- **Inflacion:** ajuste anual en costos (~5% Mexico)
- **Tipo de cambio:** ya lo tenemos en suscripciones, considerar para importaciones
- **Costo de ventas variable:** comisiones + talleres + fletes dependen del volumen
- **Working capital:** los clientes pagan a credito (30-60 dias), el cashflow no es igual al P&L

---

## 10. Flujo de Uso Actualizado (como Director)

```
1. DEFINIR PRESUPUESTO BASE
   └→ Configurador de Gastos → ajustar → Guardar como Base

2. DEFINIR INVERSION DE MARKETING
   └→ Simulador → Marketing → presupuesto por canal → ver leads proyectados

3. SIMULAR PIPELINE
   └→ Los leads de MKT alimentan el pipeline automaticamente
   └→ Ajustar tasas de cierre, tickets, retencion

4. SIMULAR EQUIPO DE VENTAS
   └→ Definir roster actual + contrataciones planeadas
   └→ Ver capacidad del equipo vs demanda del pipeline

5. VER PROYECCION INTEGRADA
   └→ Ingreso proyectado = min(Capacidad, Demanda) * 0.85
   └→ Identificar cuellos de botella por mes
   └→ Guardar como Escenario de Ingresos

6. VER P&L
   └→ Escenario de Ingresos + Escenario de Gastos = P&L mensual
   └→ Ver utilidad, margen, punto de equilibrio

7. ITERAR
   └→ "Que pasa si contrato 2 juniors en mayo?"
   └→ "Que pasa si subo la inversion en pautas 30%?"
   └→ "Que pasa si el cierre mejora a 60%?"
   └→ Guardar cada version como escenario, comparar

8. DECIDIR
   └→ Elegir el escenario que mejor balancea riesgo/retorno
   └→ (Futuro) Derivar OKRs y metas por area
```

---

## 11. Prioridades Actualizadas

| # | Componente | Estado | Prioridad |
|---|---|---|---|
| 1 | Dashboard Q1 | Completado | - |
| 2 | Configurador de Gastos | Completado | - |
| 3 | Escenarios de Gastos | Completado | - |
| 4 | **Simulador MKT** | Por construir | **Alta** |
| 5 | **Simulador Pipeline** | Por construir | **Alta** |
| 6 | **Simulador Equipo** | Por construir | **Alta** |
| 7 | **Proyeccion Integrada** | Por construir | **Alta** |
| 8 | **Escenarios de Ingresos** | Por construir | **Alta** |
| 9 | **P&L Integrado** | Por construir | **Alta** |
| 10 | Ppto por area | Futuro | Media |
| 11 | Plan de contrataciones | Futuro | Media |
| 12 | OKRs / BSC | Futuro | Media |
| 13 | Cashflow | Futuro | Baja |
| 14 | Sensibilidad automatica | Futuro | Baja |
