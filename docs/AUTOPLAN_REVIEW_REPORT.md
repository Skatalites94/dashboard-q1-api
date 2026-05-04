# Autoplan Review Report — Plan Maestro Sistema Arquitectura Comercial

**Generado:** 2026-05-01 14:18 UTC
**Branch:** main
**Plan revisado:** `docs/PLAN_MAESTRO_SISTEMA.md`
**Modo:** `[subagent-only]` (codex no disponible)
**Restore point:** `~/.gstack/projects/Skatalites94-dashboard-q1-api/main-autoplan-restore-20260501-141833.md`

---

## Resumen ejecutivo

Plan revisado por 3 voces independientes (Claude main + Claude subagents adversariales × 3 fases). Veredicto: **APPROVE_WITH_CHANGES**.

Strategy & scope (CEO) sólida pero con 2 user challenges abiertos. Design completeness baja (4-5/10) en hierarchy/specificidad/cognitive-load/a11y. Engineering plumbing underspecified — 5 must-fix antes de F1.

**Premisas confirmadas:** A=BUILD (rechazo Mapley, control interno), B=pending, C=pending.

---

## Decisiones auto-aplicadas (mecánicas, ya decididas)

| # | Decisión | Principio | Razón |
|---|---|---|---|
| C5 | Añadir export endpoint en F1 | P2 boil lakes | <1d, in blast radius, mitiga vendor lock |
| D2 | Pin sticky strip de 4 maestras arriba en todas las tabs | P5+P1 | CEO necesita verlas siempre, simple fix |
| D5 | F2 incluye "Specificity Pass" — mocks HTML referenciando design-system | P5 | Sin mocks = 3 engineers = 3 apps |
| D4 | Spec mobile + a11y básica añadida a F7 polish | P1 | Vendedor mobile + WCAG mínimo |
| D6 | Notificación "tu fricción se convirtió en iniciativa X" al reporter | P1 | Feedback loop indispensable |
| D7 | Wizard Motor de Confianza = drawer overlay lateral, no en canvas | P5 | Decidir explícitamente |
| E1 | Definir §6.1 "Rollup contract" para 4 maestras antes de F1 | P1 | Sin esto la pestaña Mediciones es ficción |
| E2 | Migration v13/v14: single-tx + rollback scripts + `schema_migrations` table + pg_dump pre-deploy | P1 | Riesgo de partial apply en prod inaceptable |
| E4 | Wizard sub-pasos → tabla `comercial_trust_pillar_steps` (NO json column) | P5 | 30 min ahora vs 2 días en 3 meses |
| E5 | Optimistic concurrency: `If-Match` header en PATCH TP/Friction → 409 mismatch | P5 | Two-tab edits con 6 personas inevitable |
| E6 | `delete_friction` cascade explícito en kpi_friction + initiative_friction | P1 | Sin esto datos huérfanos silenciosos |
| E7 | §3.2.1 "Completeness contract" — 8 predicados boolean exactos | P5 | "TP 7/8" debe significar algo concreto |

**Total auto-decididas: 12**

---

## Phase 1 — CEO Review

**Recomendación:** REQUEST_REWORK (subagent) → REVISADO a APPROVE_WITH_CHANGES tras Premise A confirmada (BUILD).

**Premisas evaluadas:** 6 (P1 single-tenant, P2 8 atributos contrato, P3 3 tabs, P4 wizard motor, P5 F1-F7 secuencial, P6 6 personas)
- 4 marcadas DUDOSAS por al menos una voz
- P1 (build vs Mapley) confirmada por usuario

**User Challenges abiertos:** 2 (ver final gate abajo)

**Outputs:**
- "NOT in scope" registrado
- "What already exists" map: 24 tablas + drawer + canvas reusables
- Failure modes registry: 4 modes
- Dream state delta: hoy → plan deja → 12-month ideal

---

## Phase 2 — Design Review

**Recomendación:** APPROVE_WITH_CHANGES con 3 must-fix.

**Litmus scorecard:**
- Inevitable vs arbitrario: 5/10
- 30s explainability: 4/10
- Honra "menos es más": 4/10

**7-pass scores:** 4, 3, 5, 3, 1, 2, 3 (de 10) — todos bajos

**User Challenges abiertos:** 2 (drawer wall of forms, cognitive load tiers)

---

## Phase 3 — Eng Review

**Recomendación:** APPROVE_WITH_CHANGES con 5 must-fix (todos auto-decididos).

**Critical/High concerns:** 7 identificados, 6 auto-decididos arriba, 1 a final gate (bootstrap split).

**Test debt:** 0 tests existen, ~8 archivos pytest necesarios. Plan incluirlos en F4 o defer.

**Security:** no-auth defensible HOY, rompe en 6 meses si se onboardea contratista o se mueve a mobile. Hardening 1 día (bearer token + Cloudflare Access) recomendado pero opcional.

---

## Cross-phase themes (concerns que aparecieron en 2+ fases)

| Tema | Phases | Severity |
|---|---|---|
| **Adoption risk vs feature completeness** | CEO + Design | HIGH — plan optimiza tool capability, no team adoption |
| **Specificity gap (concept-rich, pixel-poor)** | CEO + Design + Eng | HIGH — F1-F7 ejecutables sin spec adicional fork en 3 productos |
| **Cognitive overload (25+ conceptos)** | CEO (6 personas) + Design (Tier A/B/C) | MEDIUM — relacionado con simplificación de personas |

---

## User Challenges (ambas voces de 2+ fases recomiendan cambio)

### UC-1: Adoption gate post-F2 (CEO Phase 1)

**Tu dijiste:** F1-F7 secuenciales sin checkpoint intermedio.
**Ambos modelos recomiendan:** insertar gate después de F2 (Mapa rediseñado + drawer 8 atributos completos): un líder que NO seas tú debe cerrar **1 fricción real** en la herramienta antes de pasar a F3.
**Por qué:** sin esto, F3-F7 pueden ser features que nadie usa. Validación temprana > especulación tardía.
**Lo que podríamos estar omitiendo:** quizás Jero ya tiene compromiso explícito de algún líder a probar la herramienta — eso cambia el cálculo.
**Si nos equivocamos, el costo es:** 2-3 sesiones extra de F3-F4 que después hay que ajustar por feedback retrasado.

### UC-2: 6 personas → 3 personas (CEO Phase 1)

**Tu dijiste:** plan asume 6 personas distintas (CEO, Líder Mkt, Líder Comercial, Líder Ops, Vendedor, Asistente PM).
**Ambos modelos recomiendan:** reducir a 3 (CEO, Líder de Área, Ejecutor). Marcar Asistente PM como "futuro si se contrata". Drop "Vendedor con vista propia" hasta que un vendedor haya hecho login dos veces.
**Por qué:** en 50 personas esos roles colapsan en 2-3 humanos reales. UI diseñada para usuarios que no van a abrir la app.
**Lo que podríamos estar omitiendo:** quizás tienes plan de hire de Asistente PM próximo, o vendedores específicos que SÍ van a usarlo.
**Si nos equivocamos, el costo es:** menos cobertura de user stories, podríamos descubrir gaps cuando contrate a alguien nuevo.

### UC-3: Drawer wall of forms — softening 8 atributos (Design Phase 2)

**Tu dijiste:** principio §3 "8 atributos por TP son contrato. Si falta uno, marcado incompleto".
**Ambos modelos recomiendan:** Two-tier completeness:
- **TP usable** = 3 fields (nombre, fase, responsable) — suficiente para crear y empezar
- **TP completo** = 8 atributos — métrica aspiracional, no bloqueante
- Sectional collapse: solo Identidad+Secuencia abiertos por defecto en drawer
- Inline canvas edit para los 3 fields mínimos (no requiere drawer)
- Autosave con indicador

**Por qué:** 20-30 input surfaces en un drawer = wall = abandono. La presión "incompleto" choca con "menos es más" §28.
**Lo que podríamos estar omitiendo:** quizás la fidelidad estricta al workbook es más importante que la adopción ergonómica para tu caso.
**Si nos equivocamos, el costo es:** TPs marcados "completos" sin ser completos en el sentido del Manifiesto. Reportes menos rigurosos.

### UC-4: Progressive disclosure (Tier A/B/C) (Design Phase 2)

**Tu dijiste:** todos los conceptos del Manifiesto surgen en la UI día 1.
**Ambos modelos recomiendan:**
- **Tier A día 1**: Touchpoint, Fase, KPI, Fricción, Iniciativa (5 conceptos)
- **Tier B semana 2**: Clasificación, Apalancamiento, Predecesor/Sucesor, 8 atributos formales, Checklist, Canal (6)
- **Tier C en F4 (gobernanza)**: Motor de Confianza wizard, Ciclo 30-60-90, Carta de Gobernanza, Registro de Huecos, Pruebas de validación, KPI maestro, Health overlay (8)

**Por qué:** 25+ conceptos día 1 garantiza bounce de personas que no leyeron el workbook (vendedor, asistente).
**Lo que podríamos estar omitiendo:** quizás planeas un workshop de inducción donde todo el equipo se entrena en la metodología antes de usar la herramienta.
**Si nos equivocamos, el costo es:** UX más simple día 1 pero feature unhide ceremony cuando promueves Tier B/C.

---

## Taste Decisions (recomendaciones con tradeoff legítimo)

### TD-1: Bootstrap split now or defer? (Eng Phase 3)

**Recomendación:** defer hasta que la latencia duela (P3 pragmatic). Hoy ~24 colecciones bootstrap sigue cargando rápido. Cuando lleguen los 4 governance + 100+ TPs, dolerá. Diferir a F4 o cuando un smoke test mida >800ms.

**Otra opción:** split desde F1 (más limpio arquitectónicamente, pero premature optimization).

### TD-2: Security hardening (bearer token + Cloudflare Access) (Eng Phase 3)

**Recomendación:** posponer 1 mes. Por ahora "single-tenant + Railway URL no indexada" es defensible. **PERO** marcar deadline: si pasas de equipo de 3 personas usándolo a 5+, OR si onboardas un externo, OR si agregas vendedor mobile, el hardening pasa de opcional a obligatorio.

**Otra opción:** hacer el bearer token YA en F1 (1 día). Es barato y elimina exposición pública.

### TD-3: Test plan timing (Eng Phase 3)

**Recomendación:** crear `tests/` directory en F1 con SOLO 2 tests críticos: `test_migrations.py` + `test_comercial_master_kpis.py`. Resto deferred a F4-F5. Esto evita test theater pero asegura que migraciones y rollups son correctos antes de producción.

**Otra opción:** todos los 8 tests en F4 como bloque (más completo pero retrasa adoption).

---

## Tu llamada en el final gate

Para cerrar el autoplan necesito que decidas las 7 que quedan abiertas:

| # | Decisión | Recomiendo | Override? |
|---|---|---|---|
| UC-1 | Adoption gate post-F2 | SÍ añadir gate | □ override |
| UC-2 | 6 personas → 3 personas | REDUCIR a 3 | □ override |
| UC-3 | Drawer two-tier completeness | SOFTEN (3 usable + 8 completo) | □ override |
| UC-4 | Progressive disclosure Tier A/B/C | APLICAR tiers | □ override |
| TD-1 | Bootstrap split | DEFER hasta F4 | □ split-ya |
| TD-2 | Security hardening | DEFER 1 mes con deadline | □ hardening-ya-en-F1 |
| TD-3 | Test plan timing | F1=2 tests, F4=resto | □ todos-en-F4 |

---

## Logs

- ✅ CEO review log → `gstack-review-log` con consensus 4/6 confirmed, 2 disagree (resueltas en gate)
- ✅ Design review log → 7/7 confirmed
- ✅ Eng review log → 6/6 confirmed
- ✅ Audit trail: 12 auto-decisiones registradas en este reporte
- ✅ Restore point capturado

**Cuando aprobes el final gate, las decisiones se aplican al `PLAN_MAESTRO_SISTEMA.md` original como Apéndice A "Cambios post-autoplan".**
