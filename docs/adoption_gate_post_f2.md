# Adoption Gate post-F2 — Módulo Comercial

**Estado:** proceso operativo, no código.
**Owner:** Jerónimo (CEO).
**Fecha objetivo:** una semana después de cerrar F2 (UI 3 ejes + drawer 8/8 + tipos de fricción + maestras).
**Trigger:** este checkpoint se corre **antes** de invertir en F3 a fondo (Wizard Motor de Confianza), F5 (Comercial AI) o F6 (Programa de mejora 2-2-2).

---

## 1. Propósito

F2 dejó el módulo Comercial con la base lista para que un humano *use* el sistema todos los días: Mapa Visual, drawer con 8 atributos, tipos de fricción, las 4 maestras, vista 3 ejes. Pero "usable" ≠ "se usa". Este gate decide si gastamos las próximas 2-3 semanas profundizando o si frenamos a corregir adopción.

Si el equipo no captura datos en F2, F3-F6 son humo: el wizard no tiene KPIs reales para comparar, la AI no tiene fricciones tipadas para clasificar, el 2-2-2 no tiene línea base para mover.

---

## 2. Criterios de paso (todos verdes para avanzar)

Medir con la base de datos a la fecha del gate (1 semana después de cerrar F2).

| # | Criterio | Umbral verde | Umbral amarillo | Cómo medir |
|---|---|---|---|---|
| 1 | **Touchpoints completos (8/8)** | ≥ 25% del total | 15-25% | `SELECT COUNT(*) FROM comercial_touchpoints WHERE responsable_id IS NOT NULL AND objective != '' AND moment_type IS NOT NULL AND ux_principles_brief != '' AND content_message != '' AND...` (los 8 atributos no nulos) |
| 2 | **Touchpoints usables (3/3 mínimo)** | ≥ 80% del total | 60-80% | Atributos nombre + canal + responsable presentes |
| 3 | **Fricciones tipadas** | ≥ 90% con `friction_type` definido | 70-90% | `SELECT COUNT(*) FILTER (WHERE friction_type IS NOT NULL) * 1.0 / COUNT(*) FROM comercial_frictions` |
| 4 | **KPIs maestros con dato del mes** | 4/4 maestras (Utilidad, LTV, CAC, Conversión) con al menos 1 driver con `current_value` ≠ null | 3/4 | `state.dashboard.master_metrics[m].drivers_with_data > 0` para los 4 |
| 5 | **Capturas vivas en Mapa Visual** | El usuario abrió `#/comercial` ≥ 5 días en la última semana | 3-4 días | Logs de acceso o auto-reporte del CEO |
| 6 | **Iniciativas con responsable real** | ≥ 80% de las iniciativas activas tienen `responsable_id` ≠ null | 60-80% | Query directo |
| 7 | **Fricciones movidas de estado** | Al menos 3 fricciones cambiaron de estado (`pending → analysis → in_progress → ...`) en la semana | 1-2 | Mirar `comercial_activity_log` |
| 8 | **CEO usa la vista 3 ejes** | El CEO marcó preferencia "compact" en `localStorage.cm.viewMode` o reporta haberla usado para una decisión | "la usé pero no la prefiero" | Auto-reporte |

**Decisión:**

- **Todos verdes:** avanzar a F3 (Wizard Motor de Confianza) con confianza.
- **1-2 amarillos, resto verdes:** avanzar a F3 pero sumar 1 sprint extra para cerrar los amarillos en paralelo.
- **3+ amarillos o 1+ rojo:** STOP. No avanzar a F3-F6. Correr el ciclo de corrección (sección 4).

---

## 3. Quién mide y cuándo

- **Jerónimo:** corre la query de adopción 1 vez por semana, los lunes 9am, durante las primeras 4 semanas post-F2.
- **Resultado:** registra en una tabla simple en `data/adopcion_log.md` (markdown manual, no merece BD).
- **Ritmo:** lunes 9am → 9:15am revisión rápida → decisión.

---

## 4. Si falla el gate: ciclo de corrección

No avanzar a F3. Asumir que el sistema **no se está usando** y arreglar la causa raíz antes de seguir. Las causas posibles, en orden de probabilidad:

### 4.1 Causa: Captura es fricción para el equipo

**Síntoma:** Touchpoints usables OK, pero 8/8 baja. Tipos de fricción OK pero KPIs maestros sin dato.
**Acción:** sentarse 1 hora con el responsable de captura (no Jerónimo) y observar **dónde** se atora. Lo más común:
- Drawer demasiado largo → activar Tier A por default, no Tier C.
- "No sé qué poner en `ux_principles_brief`" → escribir 6 ejemplos en `data/uxp_brief_ejemplos.md` y enlazarlos desde el drawer.
- "No sé qué KPI mover" → simplificar a marcar 1 KPI maestro por fase, no 4.

### 4.2 Causa: el sistema no es parte del flujo de trabajo

**Síntoma:** "Capturas vivas" rojo. El CEO entra 1-2 veces, no 5+.
**Acción:** vincular el módulo a un ritual existente (no inventar uno nuevo):
- Junta de los lunes → primer punto en agenda: "abrir #/comercial, mostrar maestras". 5 min.
- Junta de viernes → "qué fricciones cerramos esta semana" abriendo la pestaña Trabajo.

Si no entra como ritual, el módulo se vuelve un cementerio de datos viejos.

### 4.3 Causa: el modelo del módulo no encaja con cómo Cris/Jerónimo piensan el negocio

**Síntoma:** "Fricciones tipadas" en rojo persistente, o el CEO dice "no es así como yo veo el journey".
**Acción:** abrir `/office-hours` con el equipo y revisar el manifesto. Si el modelo necesita ajuste (ej: agregar una fase nueva, renombrar maestras, cambiar tipos de fricción), hacerlo **antes** de F3. Cambiar el modelo después de F3 es 5x más caro porque el wizard, la AI y el programa 2-2-2 ya dependen de él.

### 4.4 Causa: bugs / UX issues bloquean uso real

**Síntoma:** el CEO entra al módulo, intenta editar algo, no funciona. Lo abandona.
**Acción:** sesión de QA con `/qa` (gstack) en `#/comercial` para encontrar bloqueadores. Triage: cualquier cosa que rompa la captura es P0, todo lo demás es P2.

---

## 5. Salidas del gate

Después de correr el gate, dejar registrado en `data/adopcion_log.md` una línea por semana:

```
2026-MM-DD | 8/8: 32% | usables: 87% | fricciones tipadas: 95% | maestras con dato: 4/4 | accesos/sem: 6 | DECISIÓN: AVANZA F3
2026-MM-DD | 8/8: 18% | usables: 75% | ...                                                | DECISIÓN: STOP — corregir 4.1
```

Esto da una línea de tiempo de adopción que sirve para:
- Justificar inversión en F3-F6 cuando llegue el momento.
- Ver patrones (ej: "siempre cae adopción la semana de cierre de mes").
- Entender qué tan rápido el equipo entra en ritmo.

---

## 6. Anti-patrones (no hacer)

- **No avanzar a F3 con datos amarillos "porque ya está el código casi listo".** El código no es el cuello de botella; la adopción sí.
- **No medir con encuestas.** Medir con queries y eventos, no con percepciones.
- **No "vender" el módulo al equipo.** Si necesitas convencerlos de usarlo, algo está mal en el modelo. Mejor quitar fricción que pedir adopción.
- **No saltar el gate "por esta vez".** El gate existe específicamente para los momentos en que parece innecesario.

---

## 7. Cuándo este gate deja de ser necesario

Cuando el módulo lleva 4 semanas seguidas con todos los criterios en verde, este gate pasa de "checkpoint obligatorio" a "métrica de salud" y se puede revisar mensual en lugar de semanal.

---

**Última actualización:** 2026-05-02. Revisar después del primer ciclo real.
