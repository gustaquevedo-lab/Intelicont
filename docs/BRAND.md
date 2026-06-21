# InteliCont — Identidad de marca

Single source of truth para el logo, paleta y tipografía de InteliCont.
Cualquier touchpoint nuevo (UI, email, deck, paper, social) **debe** salir de acá.

Vista previa visual: [`/brand/index.html`](../apps/web/public/brand/index.html) (servido en `https://intelicont.vercel.app/brand/`).

---

## 1. Logo

El logo es un **loop infinito horizontal** con gradiente azul→verde y una chispa blanca de cuatro puntas al centro. Simboliza:

- **Ciclo contable continuo** — el loop nunca empieza ni termina.
- **Doble partida** — los dos lóbulos representan débito y crédito.
- **Inteligencia que une las dos mitades** — la chispa al centro es la IA cerrando el asiento.

### Archivos fuente

| Archivo | Uso |
|---|---|
| `apps/web/public/brand/logo-mark.svg` | Símbolo solo (∞ con chispa). Favicon, PWA icons, avatares, sellos. |
| `apps/web/public/brand/logo-horizontal.svg` | Logo + wordmark bicolor para **fondo claro**. Default en la mayoría de docs/landing. |
| `apps/web/public/brand/logo-horizontal-dark.svg` | Logo + wordmark bicolor para **fondo oscuro**. Login, OG, dark mode. |
| `apps/web/public/favicon.svg` | Espejo del `logo-mark.svg`. No editar directamente — copiar de `logo-mark.svg`. |

En código, importar desde el componente `<Logo />` ([`apps/web/src/components/logo.tsx`](../apps/web/src/components/logo.tsx)) — no inlinear el SVG en cada pantalla.

### Variantes

- **Tamaños**: `sm` (24px), `md` (32px), `lg` (42px), `xl` (64px). Definidos en el componente.
- **Solo símbolo**: prop `hideText`. Para botones cuadrados, favicons, app icons.
- **Con eslogan**: prop `showSlogan` → agrega "CONTABILIDAD INTELIGENTE" en uppercase tracking-wide debajo del wordmark.
- **Sobre fondo oscuro**: prop `dark` → wordmark cambia a azul/verde claros legibles.

### Reglas de uso

- **Zona de exclusión**: dejar margen igual a la altura de la "I" del wordmark en los cuatro lados. Nada toca el logo dentro de esa zona.
- **Tamaño mínimo**: 24px de altura del símbolo. Por debajo de eso, usar solo la chispa o nada.
- **Wordmark bicolor**: "Inteli" siempre azul, "Cont" siempre verde. No invertir ni alternar.
- **El loop nunca cambia de orientación**. Siempre horizontal.

### Mal uso (no hacer)

- ❌ Recolorear el gradiente del loop.
- ❌ Aplicar sombras, glows o efectos al loop o al wordmark.
- ❌ Estirar/comprimir verticalmente.
- ❌ Reemplazar la chispa por otro símbolo.
- ❌ Wordmark en un solo color (la versión histórica monocromática queda obsoleta).
- ❌ Insertar el wordmark sin el símbolo o el símbolo con el wordmark en otra tipografía.

---

## 2. Paleta

### Gradiente del loop (no usar como UI directamente)

| Stop | Hex | Posición |
|---|---|---|
| Azul profundo | `#1b63c4` | 0% |
| Azul medio | `#2f80ed` | 35% |
| Cian | `#33c1cc` | 50% |
| Verde-cian | `#1bbb75` | 70% |
| Verde profundo | `#08a14b` | 100% |

### Colores de marca (uso UI)

| Token | Hex | Rol |
|---|---|---|
| `--primary-dark` | `#0a2244` | Fondo oscuro principal (login, OG, splash) |
| `--primary` | `#104c91` | Color de marca primario, botones, links, theme_color PWA |
| `--primary-light` | `#256ebf` | Hovers, acentos secundarios |
| `--secondary` | `#00a651` | Confirmaciones, CTAs verdes, "Cont" wordmark fondo claro |
| `--secondary-dark` | `#00823e` | Hovers de verde |
| `--secondary-light` | `#00d46a` | Acentos brillantes |

### Wordmark bicolor

Para mantener consistencia en cualquier touchpoint:

| Fondo | "Inteli" | "Cont" |
|---|---|---|
| Claro | `#104c91` | `#08a14b` |
| Oscuro | `#60a5fa` | `#34d399` |

### Acentos

| Hex | Uso |
|---|---|
| `#a3e635` | Chip "IA · 98%" — siempre con texto `#052e16` |
| `#ffffff` | Chispa del símbolo |
| `#f1f5f9` / `#cbd5e1` / `#94a3b8` | Texto sobre fondos oscuros (primario / secundario / muted) |
| `#1e293b` / `#475569` | Texto sobre fondos claros (primario / muted) |

---

## 3. Tipografía

**Inter** (Google Fonts). Cargada en:

- Landing (`fonts.googleapis.com`)
- OG image (jsdelivr CDN — pesos 500/700/800)
- Componente `<Logo />` vía Tailwind config

### Escala y pesos

| Rol | Peso | Tracking | Ejemplo |
|---|---|---|---|
| Wordmark | 800 (ExtraBold) | -0.05em | InteliCont |
| Headlines | 700 (Bold) | -0.02em | "Contabilidad inteligente" |
| Subtítulos | 600 (SemiBold) | normal | "Factura 001-001-0012345" |
| Cuerpo | 500 (Medium) | normal | Texto largo |
| Eslogan/badge | 800 uppercase | +0.2em | "CONTABILIDAD INTELIGENTE" |

No usar pesos por debajo de 500. No usar otras familias salvo para datos tabulares en monoespaciada (Inter no tiene mono → usar `ui-monospace`).

---

## 4. Inventario de touchpoints

| Touchpoint | Asset usado | Estado |
|---|---|---|
| Landing nav + footer | SVG inline, wordmark bicolor | ✅ |
| App sidebar / login / top-bar | `<Logo />` desde `components/logo.tsx` | ✅ |
| Favicon | `public/favicon.svg` = espejo de `logo-mark.svg` | ✅ |
| PWA icons (72→512 px) | Generados dinámicamente en `/api/brand/icon/[size]` | ✅ |
| OG image | `app/opengraph-image.tsx` — loop canónico + Inter + bicolor | ✅ |
| Manifest `theme_color` | `#104c91` | ✅ |
| Schema.org / structured data | Apunta a logo en `intelicont.com.py` | ⚠️ pendiente subir asset al dominio principal |

---

## 5. Cómo regenerar / agregar assets

### PWA icons

Se generan **on-demand** desde `apps/web/src/app/api/brand/icon/[size]/route.tsx`. No hay PNGs estáticos en el repo. Para agregar un tamaño:

1. Agregarlo a `ALLOWED` en `route.tsx`.
2. Agregar la entrada en `manifest.json` apuntando a `/api/brand/icon/<size>`.

### Favicon

Editar `public/brand/logo-mark.svg`. Después copiar a `public/favicon.svg`. **Nunca** edites `favicon.svg` directamente.

### OG image

Editar `apps/web/src/app/opengraph-image.tsx`. El SVG del loop está inlineado — copiá del `logo-mark.svg` y ajustá `viewBox` si hace falta.

### Logo en pantallas nuevas

```tsx
import { Logo } from "@/components/logo";

<Logo size="lg" dark={false} showSlogan />
```

No copies/pegues SVG en componentes — usá `<Logo />`.

### Wordmark inline en headings o copy

Cuando "InteliCont" aparece **adentro de un heading o un párrafo**, no metas el símbolo — usá el helper `<Wordmark />` para mantener el split bicolor:

```tsx
import { Wordmark } from "@/components/logo";

<h1 className="text-2xl font-bold">Bienvenido a <Wordmark /></h1>
<p>... <Wordmark dark /> está listo para vos.</p>
```

Hereda `font-size`, `font-weight`, `letter-spacing` del padre — solo aplica los dos colores. **No** usar `<span>Inteli</span><span>Cont</span>` a mano: si cambiamos los hex de marca, hay que poder hacerlo en un solo archivo.

---

## 6. Voz (resumen)

Profesional, directa, en español rioplatense con uso PY (`comprobante`, `contribuyente`, `RUC`, `timbrado`, `RG 90`). Evitar tecnicismos innecesarios. Tono: "tu contador inteligente, no tu profesor de contabilidad".

Detalle completo: [`docs/UX_PRINCIPLES.md`](./UX_PRINCIPLES.md).
