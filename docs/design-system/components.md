# Componentes

## Buttons

### Primary
- Background: var(--primary), hover: var(--primary-hover)
- Color: white, font-weight: 600, font-size: 13px
- Padding: 8px 16px, border-radius: var(--radius-md)
- Shadow: var(--shadow-xs)

### Secondary (Ghost)
- Background: transparent, hover: var(--bg-hover)
- Color: var(--text-secondary), border: 1px solid var(--border)
- Mismos padding y radius que primary

### Danger
- Background: var(--danger), hover: darken 10%
- Color: white

### Small
- Padding: 4px 10px, font-size: 12px

## Cards

- Background: var(--bg-white)
- Border: 1px solid var(--border)
- Border-radius: var(--radius-lg)
- Shadow: var(--shadow-sm)
- Padding: var(--space-5) (20px)
- Hover (interactive): shadow-md + border-hover

## KPI Cards

- Igual que Card pero con layout:
  - Label: text-xs, uppercase, letter-spacing 0.5px, color text-muted
  - Value: text-2xl, font-bold, color text-primary
  - Subtitle: text-xs, color text-secondary

## Tables

- Header: bg #F8FAFC, text text-muted, uppercase, text-xs, font-semibold
- Rows: border-bottom 1px solid var(--border)
- Row hover: bg var(--bg-hover)
- Cell padding: 10px 12px
- Font-size: var(--text-base) (13px)

## Badges

- Padding: 2px 8px, border-radius: var(--radius-full), font-size: 11px, font-weight: 600
- Variantes:
  - Success: bg var(--success-light), color #15803D
  - Warning: bg var(--warning-light), color #B45309
  - Danger: bg var(--danger-light), color #DC2626
  - Info: bg var(--primary-light), color var(--primary)
  - Neutral: bg #F1F5F9, color var(--text-secondary)

## Tabs

Estilo Perdoo (underline):
- Container: border-bottom 2px solid var(--border)
- Tab item: padding 10px 16px, color text-secondary, font-weight 500
- Tab active: color var(--primary), border-bottom 2px solid var(--primary)
- Tab hover: color text-primary

## Modals

- Overlay: rgba(0, 0, 0, 0.4), backdrop-filter: blur(4px)
- Container: bg white, radius var(--radius-xl), shadow-xl, max-width 500px
- Header: padding 20px 24px, border-bottom, font-size text-lg, font-weight 600
- Body: padding 24px
- Footer: padding 16px 24px, border-top, flex justify-end, gap 8px

## Forms

### Inputs
- Background: white, border: 1px solid var(--border)
- Padding: 8px 12px, radius: var(--radius-md)
- Focus: border-color var(--border-focus), box-shadow 0 0 0 3px rgba(76,110,245,0.1)
- Font-size: var(--text-md) (14px)

### Labels
- Font-size: var(--text-sm), font-weight: 500, color: var(--text-primary)
- Margin-bottom: 4px

### Select
- Mismos estilos que input + dropdown arrow

### Toggle Switch
- Width: 40px, height: 22px
- Off: bg #CBD5E1
- On: bg var(--primary)
- Knob: white circle 18px

## Toast Notifications

- Position: fixed bottom-right
- Background: white, shadow-lg, border-left 4px solid (color segun tipo)
- Padding: 12px 16px
- Auto-dismiss: 3 seconds
- Tipos: success (green), error (red), info (blue)

## Sidebar

- Width: 220px fixed
- Background: var(--bg-sidebar)
- Logo area: padding 20px, border-bottom rgba(255,255,255,0.1)
- Nav items: padding 10px 16px, color var(--sidebar-text), font-size 13px
- Active item: bg var(--sidebar-active), color white, border-left 3px solid var(--primary)
- Hover: bg var(--sidebar-hover)
- Section headers: text-xs, uppercase, color rgba(255,255,255,0.4), padding 20px 16px 8px
- Collapsible: chevron icon que rota 90deg al expandir
