# Design Tokens

## Colores

```css
:root {
  /* Fondos */
  --bg-page: #F5F7FA;
  --bg-white: #FFFFFF;
  --bg-hover: #F0F2F5;

  /* Sidebar */
  --bg-sidebar: #1B2A4A;
  --sidebar-active: #2D4A7A;
  --sidebar-hover: #243556;
  --sidebar-text: #8FA4C4;
  --sidebar-text-active: #FFFFFF;

  /* Primario (azul) */
  --primary: #4C6EF5;
  --primary-hover: #3B5BDB;
  --primary-light: #EDF2FF;

  /* Semanticos */
  --success: #22C55E;
  --success-light: #F0FDF4;
  --warning: #F59E0B;
  --warning-light: #FFFBEB;
  --danger: #EF4444;
  --danger-light: #FEF2F2;
  --info: #3B82F6;
  --info-light: #EFF6FF;

  /* Texto */
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --text-muted: #94A3B8;
  --text-inverse: #FFFFFF;

  /* Bordes */
  --border: #E2E8F0;
  --border-hover: #CBD5E1;
  --border-focus: #4C6EF5;
}
```

## Tipografia

```css
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;

  /* Tamanos */
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --text-lg: 16px;
  --text-xl: 20px;
  --text-2xl: 24px;

  /* Pesos */
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;

  /* Line height */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
}
```

## Espaciado

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

## Sombras

```css
:root {
  --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.08), 0 4px 6px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04);
}
```

## Bordes

```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;
}
```

## Transiciones

```css
:root {
  --transition-fast: 0.15s ease;
  --transition-base: 0.2s ease;
  --transition-slow: 0.3s ease;
}
```
