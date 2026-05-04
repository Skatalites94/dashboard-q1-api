# Mapa rediseño UX — Specificity Pass post-F2

**Estado:** mocks de referencia, pendiente de implementación.
**Aplica a:** `static/comercial.js` — pestañas Mapa Visual, Mapa de Procesos.
**Depende de:** `docs/design-system/tokens.md`, `docs/design-system/components.md`.

---

## 1. Diagnóstico actual (post-F2)

Lo que ya entrega el módulo:
- Canvas con pan/zoom, fullscreen, 4 anchors por nodo, Bezier suave.
- Edge widgets HTML (label inline + delete).
- Phase frames Miro-style (header HTML, drag de grupo, color picker).
- Indicador "⏱ paralelo" en touchpoints sin flechas en su fase.
- Tabla Mapa de Procesos con drag-handle, badges (`→ Bifurca a 2`, `← Une desde 3`, `🔁 Bucle`).
- Drawer con 8 atributos, two-tier completeness, tipos de fricción.

Dónde duele todavía:

1. **Densidad visual del nodo:** el rectángulo del touchpoint muestra el nombre y poco más; el responsable, el badge de completeness, los KPIs vinculados y la fricción más urgente quedan dentro del drawer. Para un CEO escaneando el journey, hay que abrir un drawer por touchpoint, lo que rompe el flujo.
2. **Jerarquía tipográfica plana en la tabla Mapa de Procesos:** todas las celdas usan el mismo tamaño/peso, lo que hace difícil distinguir "esto es lo importante" vs "esto es metadata".
3. **Phase header HTML "lavado":** el header es blanco translúcido, casi invisible sobre fondo claro. Cuesta ver dónde empieza/termina cada fase a primera vista.
4. **Maestras strip arriba del canvas:** correcta funcionalmente, pero compite visualmente con los KPIs por fase dentro del drawer. No queda claro cuál es la fuente de verdad para "cómo va el negocio".
5. **Drawer demasiado largo en Tier C:** secciones apiladas (8 atributos + KPIs + fricciones + iniciativas + secuencia + comentarios) hacen scroll cansado. Falta navegación interna o secciones colapsables.

---

## 2. Principios del rediseño

Aplicar estos en orden de prioridad:

1. **Mostrar lo importante en el canvas, esconder el resto en el drawer.** El nodo debe responder a "¿está vivo? ¿quién lo cuida? ¿está completo?" sin abrir nada.
2. **Jerarquía tipográfica = jerarquía de decisión.** Lo que el CEO usa para decidir va más grande/más oscuro. Lo que es metadata va `--text-muted` y más pequeño.
3. **Una fuente de verdad por pregunta.** Maestras = "cómo va el negocio". KPIs por fase = "qué mueve cada etapa". No mezclar.
4. **Espaciado generoso pero consistente.** Todo en múltiplos de 4px (`--space-*`). Componentes no se tocan; siempre `--space-3` o `--space-4` mínimo.
5. **Menos color, más contraste estructural.** El color es para semáforos (rojo/amarillo/verde) y `--primary` para acción. Nada decorativo.

---

## 3. Mocks HTML — Mapa Visual

### 3.1 Nodo touchpoint redensificado

Antes:
```html
<div class="cm-canvas-node">
  <div class="cm-canvas-node-name">Llamada inicial</div>
  <div class="cm-canvas-node-meta">Atracción · 45m</div>
</div>
```

Después (referencia tokens):
```html
<div class="cm-canvas-node" data-key="touchpoint:42">
  <!-- Línea 1: nombre + completeness -->
  <div class="cm-canvas-node-row" style="display:flex;align-items:center;gap:6px">
    <span style="
      font-size: var(--text-md);
      font-weight: var(--font-semibold);
      color: var(--text-primary);
      line-height: var(--leading-tight);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    ">Llamada inicial</span>
    <!-- Badge two-tier completeness -->
    <span class="cm-comp-badge cm-comp-badge--complete" title="8/8 atributos completos">
      <span aria-hidden="true">●</span>
      <span class="cm-sr-only">Completo</span>
    </span>
  </div>

  <!-- Línea 2: responsable -->
  <div class="cm-canvas-node-row" style="
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 4px;
    font-size: var(--text-xs);
    color: var(--text-secondary);
  ">
    <span class="cm-avatar cm-avatar-xs" style="background:#FDE68A;color:#92400E">JC</span>
    <span>Jerónimo</span>
  </div>

  <!-- Línea 3: KPI más relevante de la fase + fricción más urgente -->
  <div class="cm-canvas-node-row" style="
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid var(--border);
    font-size: var(--text-xs);
  ">
    <!-- KPI -->
    <span style="display:flex;align-items:center;gap:4px;color:var(--text-secondary)">
      <span class="cm-sem-dot-sm cm-sem-green" aria-hidden="true"></span>
      <span style="font-weight:var(--font-semibold);color:var(--text-primary)">68%</span>
      <span>tasa contacto</span>
    </span>
    <!-- Fricción urgente (si existe) -->
    <span style="
      margin-left: auto;
      background: var(--danger-light);
      color: var(--danger);
      padding: 1px 6px;
      border-radius: 9999px;
      font-weight: var(--font-semibold);
      font-size: 10px;
    " title="2 fricciones, la más urgente: tiempo de espera">⚠ 2</span>
  </div>
</div>
```

**Por qué cambia:**
- Quien escanea el canvas ve **dueño**, **completitud**, **KPI clave** y **fricciones abiertas** sin abrir drawer.
- Tipografía respeta `tokens.md`: `--text-md` para el nombre (importante), `--text-xs` para metadata.
- Border-top antes de la línea de KPI/fricción crea jerarquía estructural sin meter colores extra.

### 3.2 Phase header con presencia

Antes: barra blanca translúcida con el nombre.
Después:

```html
<div class="cm-phase-frame-header" data-phase-id="2" style="
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: linear-gradient(180deg, rgba(99,102,241,.08), rgba(99,102,241,.02));
  border: 1px solid rgba(99,102,241,.25);
  border-bottom: 2px solid #6366F1;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
">
  <span class="cm-phase-drag" style="
    cursor: grab;
    color: var(--text-muted);
    font-size: var(--text-md);
    line-height: 1;
  " aria-label="Arrastrar fase">⠿</span>

  <span style="
    font-size: var(--text-sm);
    font-weight: var(--font-bold);
    color: var(--text-primary);
    text-transform: uppercase;
    letter-spacing: .4px;
    flex: 1;
  ">Atracción</span>

  <!-- Counters por fase -->
  <span style="
    font-size: var(--text-xs);
    color: var(--text-secondary);
    display: flex;
    gap: var(--space-2);
  ">
    <span title="touchpoints">8 TPs</span>
    <span title="fricciones abiertas" style="color:var(--danger)">3 ⚠</span>
  </span>

  <!-- Color picker + menú -->
  <button class="cm-phase-color-btn" style="
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #6366F1;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px var(--border);
    cursor: pointer;
  " aria-label="Cambiar color de fase"></button>
  <button class="cm-phase-menu-btn" aria-label="Menú de fase">⋯</button>
</div>
```

**Por qué cambia:**
- Borde inferior de 2px en el color de la fase ancla la fase al canvas; ya no se "pierde".
- Counters en el header dan sentido al grupo (8 TPs / 3 fricciones) sin abrir cada uno.
- Tipografía uppercase + tracking `.4px` distingue el nivel "fase" del nivel "touchpoint" sin gritar.

### 3.3 Strip de maestras refinada

La strip actual ya cumple, pero el rediseño la integra con el contexto del canvas:

```html
<div class="cm-maestras-strip" style="
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--bg-white);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-4);
">
  <div class="cm-maestra-card cm-maestra-card--green" data-maestra="utility">
    <div style="
      font-size: var(--text-xs);
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: .4px;
      font-weight: var(--font-semibold);
      display: flex;
      align-items: center;
      gap: 4px;
    ">
      <span class="cm-sem-dot-sm cm-sem-green" aria-hidden="true"></span>
      Utilidad
    </div>
    <div style="
      font-size: 28px;
      font-weight: var(--font-bold);
      color: var(--text-primary);
      line-height: 1.1;
      margin: 4px 0 2px;
      font-variant-numeric: tabular-nums;
    ">94%</div>
    <div style="font-size: var(--text-xs); color: var(--text-secondary)">
      2/3 maestros con dato
    </div>
  </div>
  <!-- LTV, CAC, Conversión iguales -->
</div>
```

**Por qué cambia:**
- `font-variant-numeric: tabular-nums` evita que los porcentajes "salten" entre cards.
- Tipografía 28px para el número clave, contraste fuerte vs. el meta en `--text-xs --text-secondary`.
- Sombra y border consistente con el resto de las cards del módulo.

---

## 4. Mocks HTML — Mapa de Procesos (tabla)

### 4.1 Fila densa con jerarquía clara

```html
<tr class="cm-tp-row" data-tp-id="42">
  <!-- Drag handle -->
  <td style="width:24px;cursor:grab;color:var(--text-muted);text-align:center;padding-right:0">⠿</td>

  <!-- Orden (display only) -->
  <td style="
    width: 40px;
    color: var(--text-muted);
    font-size: var(--text-xs);
    font-variant-numeric: tabular-nums;
    text-align: center;
  ">3</td>

  <!-- Nombre + badges journey -->
  <td>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="
        font-size: var(--text-md);
        font-weight: var(--font-semibold);
        color: var(--text-primary);
      ">Llamada inicial</span>
      <!-- Badges journey (auto del grafo) -->
      <span class="cm-badge-fork" style="
        font-size: 10px;
        background: var(--info-light);
        color: var(--info);
        padding: 1px 6px;
        border-radius: 9999px;
        font-weight: var(--font-semibold);
      " title="Bifurca a 2 touchpoints">→ 2</span>
    </div>
    <div style="
      font-size: var(--text-xs);
      color: var(--text-secondary);
      margin-top: 2px;
    ">Llamada en frío para calificar prospect</div>
  </td>

  <!-- Fase pill -->
  <td style="width:120px">
    <span class="cm-phase-pill" style="
      display: inline-block;
      padding: 2px 8px;
      background: rgba(99,102,241,.12);
      color: #4338CA;
      border-radius: 9999px;
      font-size: var(--text-xs);
      font-weight: var(--font-semibold);
    ">Atracción</span>
  </td>

  <!-- Responsable -->
  <td style="width:140px">
    <div style="display:flex;align-items:center;gap:6px">
      <span class="cm-avatar cm-avatar-xs">JC</span>
      <span style="font-size:var(--text-sm)">Jerónimo</span>
    </div>
  </td>

  <!-- Completeness -->
  <td style="width:100px;text-align:center">
    <span class="cm-comp-badge cm-comp-badge--complete">8/8 ●</span>
  </td>

  <!-- Acción -->
  <td style="width:60px;text-align:right">
    <button class="cm-icon-btn" aria-label="Abrir ficha">›</button>
  </td>
</tr>
```

**Por qué cambia:**
- Anchura fija para drag-handle / orden / fase / responsable / completeness → escaneo predecible.
- El nombre tiene su descripción en una línea secundaria; el ojo encuentra el TP por nombre, confirma con descripción.
- Badges de journey (`→ 2`, `← 3`, `⏱`, `🔁`) están en línea con el nombre, no en columna aparte.
- `font-variant-numeric: tabular-nums` en el orden mantiene alineación.

### 4.2 Header de tabla con sticky

```html
<thead>
  <tr style="
    background: #F8FAFC;
    border-bottom: 2px solid var(--border);
  ">
    <th style="width:24px"></th>
    <th style="width:40px">#</th>
    <th>Touchpoint</th>
    <th style="width:120px">Fase</th>
    <th style="width:140px">Responsable</th>
    <th style="width:100px;text-align:center">Estado</th>
    <th style="width:60px"></th>
  </tr>
</thead>
```

Headers heredan `text-transform: uppercase; letter-spacing: .5px; font-size: var(--text-xs); color: var(--text-muted)` ya definido en `.cm-table th` global.

---

## 5. Drawer — secciones colapsables (Tier C)

Tier C apila demasiado. Convertir cada sección post-Tier-B en `<details>` colapsable:

```html
<details class="cm-drawer-section" open>
  <summary style="
    cursor: pointer;
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: .4px;
    font-weight: var(--font-bold);
    padding: var(--space-2) 0;
    list-style: none;
    display: flex;
    align-items: center;
    gap: 6px;
  ">
    <span class="cm-disclosure-arrow" aria-hidden="true">▾</span>
    Diagnóstico (Tier C)
  </summary>
  <div style="padding:var(--space-2) 0">
    <!-- contenido de diagnóstico -->
  </div>
</details>
```

CSS:
```css
.cm-drawer-section[open] .cm-disclosure-arrow{transform:rotate(0deg)}
.cm-drawer-section .cm-disclosure-arrow{transition:transform .15s ease}
.cm-drawer-section:not([open]) .cm-disclosure-arrow{transform:rotate(-90deg)}
```

**Beneficio:** el usuario llega al drawer, ve los 8 atributos abiertos por default, y abre solo las secciones que necesita (Diagnóstico, KPIs, Fricciones, Comentarios). Reduce scroll de ~2000px a ~600px en estado por defecto.

---

## 6. Migración propuesta

Por etapas, cada una un PR pequeño:

| Etapa | Cambio | Archivos | Verificable con |
|---|---|---|---|
| 1 | Nodo redensificado (responsable + KPI + fricción badge) | `static/comercial.js` (`renderCanvasTouchpointNode`) | Inspección visual del canvas |
| 2 | Phase header con presencia + counters | `static/comercial.js` (`renderPhaseHeader` o equivalente) | Counters reflejan estado real |
| 3 | Strip maestras refinada (tipografía tabular) | CSS dentro del archivo | Numeritos no saltan |
| 4 | Tabla Mapa de Procesos con anchuras fijas + 2-line description | `renderProceso` | Filas tienen jerarquía clara |
| 5 | Drawer secciones `<details>` colapsables | render del drawer | Tier C inicia colapsado |

Ninguna etapa rompe estado existente; todas son visuales/CSS + reorganización de markup ya generado.

---

## 7. Anti-patrones a evitar

- **No agregar más colores decorativos al nodo.** Solo semáforo y `--primary`.
- **No "esponjar" el nodo (>120px de alto).** El canvas pierde densidad útil.
- **No mezclar tipografías nuevas.** Solo `Inter` + tokens existentes.
- **No animar el rediseño "porque queda bonito".** Cualquier animación >150ms agota.

---

**Última actualización:** 2026-05-02. Revisar después de implementar etapa 1.
