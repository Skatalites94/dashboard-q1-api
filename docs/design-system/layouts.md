# Layouts

## App Shell

```
+--------+-----------------------------------------------+
|        |  TOP BAR (56px height, white, border-bottom)  |
| SIDEBAR+-----------------------------------------------+
| 220px  |                                               |
| fixed  |  CONTENT AREA                                 |
|        |  background: var(--bg-page)                   |
|        |  padding: 24px                                |
|        |  overflow-y: auto                             |
|        |  height: calc(100vh - 56px)                   |
|        |                                               |
+--------+-----------------------------------------------+
```

### Sidebar (220px)
- Position: fixed, left: 0, top: 0, bottom: 0
- Width: 220px
- Background: var(--bg-sidebar)
- z-index: 50
- Display: flex, flex-direction: column

### Top Bar (56px)
- Position: fixed, top: 0, left: 220px, right: 0
- Height: 56px
- Background: white
- Border-bottom: 1px solid var(--border)
- z-index: 40
- Display: flex, align-items: center
- Padding: 0 24px

### Content Area
- Margin-left: 220px
- Margin-top: 56px
- Padding: 24px
- Min-height: calc(100vh - 56px)
- Background: var(--bg-page)

## Responsive Breakpoints

```css
/* Mobile: sidebar collapsa */
@media (max-width: 768px) {
  .sidebar { transform: translateX(-220px); }
  .sidebar.open { transform: translateX(0); }
  .topbar { left: 0; }
  .content { margin-left: 0; }
  /* Hamburger button visible */
  /* Overlay cuando sidebar abierto */
}

/* Tablet */
@media (min-width: 769px) and (max-width: 1024px) {
  .sidebar { width: 64px; } /* Solo iconos */
  .topbar { left: 64px; }
  .content { margin-left: 64px; }
}

/* Desktop (default) */
@media (min-width: 1025px) {
  /* Layout completo con sidebar 220px */
}
```

## Page Content Patterns

### KPI Strip
- Display: flex, gap: 16px, flex-wrap: wrap
- Cada KPI card: flex: 1, min-width: 160px

### Table Page
- Card contenedora con tabla inside
- Header con titulo + boton "+ Agregar"
- Search bar opcional debajo del header
- Footer con totales

### Tab Page
- Tabs arriba del contenido
- Cada tab carga su tabla/contenido
- Tab activa: underline azul
