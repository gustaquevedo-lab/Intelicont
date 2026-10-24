# Reglas Fiscales Paraguay — InteliCont

Fuente de verdad normativa y técnica para el cálculo tributario y generación de archivos oficiales para la **Dirección Nacional de Ingresos Tributarios (DNIT)**.

---

## 🧮 Convención y Cálculo del IVA

Los comprobantes en Paraguay se emiten tradicionalmente con **precios con IVA incluido**.
Para evitar discrepancias por redondeo en punto flotante, todos los importes se manejan en moneda entera (`bigint` en guaraníes PYG) aplicando las fórmulas oficiales de desglose:

* **IVA 10%**:
  $$\text{IVA}_{10} = \text{round}\left(\frac{\text{Total Gravado 10}}{11}\right)$$
  $$\text{Gravado Neto}_{10} = \text{Total Gravado 10} - \text{IVA}_{10}$$
* **IVA 5%**:
  $$\text{IVA}_{5} = \text{round}\left(\frac{\text{Total Gravado 5}}{21}\right)$$
  $$\text{Gravado Neto}_{5} = \text{Total Gravado 5} - \text{IVA}_{5}$$
* **Exento**: Aporte directo sin IVA.

---

## 📁 Registro de Comprobantes (RG 90 / Obligaciones 955 y 956)

El **Registro de Comprobantes Electrónico** reemplaza formalmente al antiguo aplicativo *Hechauka* para el registro de compras y ventas de contribuyentes paraguayos.

### Especificación Oficial Implementada
1. **Obligaciones**:
   * **955**: Registro Mensual de Comprobantes (compras y ventas).
   * **956**: Registro Anual de Comprobantes.
2. **Formato de Empaquetado**:
   * Archivo de texto plano comprimido en `.zip`.
   * Estructura del nombre de archivo: `[RUC]_[OBLIGACION]_[MMAAAA]_[PARTE].zip`.
   * Máximo **5.000 filas por archivo**. Si el período supera este límite, se divide en múltiples partes secuenciales (`part=1`, `part=2`, ...).
3. **Estructura de Columnas**:
   * **Ventas (19 campos)**: Tipo registro (1), Tipo identificación comprador, RUC/Identificación, DV, Razón social, Tipo comprobante (Tabla 4), Fecha emisión, Timbrado, Número comprobante, Gravado 10%, Gravado 5%, Exento, Total, Condición (1 contado, 2 crédito), Imputa IVA, Imputa IRE, Imputa IRP, etc.
   * **Compras (20 campos)**: Tipo registro (2), Tipo identificación proveedor (11 RUC, 12 Cédula), RUC/Identificación, DV, Razón social, Tipo comprobante (Tabla 4), Fecha emisión, Timbrado, Número comprobante, Gravado 10%, Gravado 5%, Exento, Total, Condición, Imputa IVA, Imputa IRE, Imputa IRP, No imputa, etc.
4. **Exclusiones Normativas**:
   * Los documentos electrónicos recibidos validados en **e-Kuatia / SIFEN** están formalmente excluidos del archivo de compras manuales, salvo que la normativa exija su inclusión por conciliación expresa.
5. **Casos Especiales por Tipo de Comprobante (Tabla 4)**:
   * Códigos `106` (Boleto de Transporte), `107` (Despacho de Importación), `112` (Boleta de Lotería): admiten particularidades en número y timbrado (ej. timbrado general o número simplificado).

### ⚠️ Elementos No Verificados contra el Sistema Marangatu
Los siguientes aspectos técnicos de la exportación se implementaron según la especificación técnica pero **aún no fueron verificados mediante una importación real en el portal Marangatu**:
* **Delimitador de campos**: Implementado con punto y coma (`;`). Existe variante tabulada según el manual técnico.
* **Fin de línea**: Se emite con salto de línea Unix (`\n`).
* **Regla de vencimientos DNIT**: Calculada como día 10 + último dígito del RUC en el mes subsiguiente, trasladando fines de semana al lunes siguiente (sin contemplar feriados bancarios específicos).

---

## ✂️ Motor de Retenciones

El sistema implementa el cálculo de retenciones tributarias asociadas a comprobantes:
1. **Base Imponible**:
   * Para **Retención de IVA**: La base es exactamente el **importe del IVA** (débito/crédito), no el total de la operación.
   * Para **Retención de IRE / IRP**: La base imponible es el importe total menos el IVA correspondiente.
2. **Perfiles Explícitos**:
   * Las retenciones no se aplican ciegamente; se ejecutan únicamente si el proveedor posee un perfil de retención asignado en la entidad.
   * **IVA**: Tasas habituales según agente (30% para compras generales, 100% para casos especiales).
   * **IRE / IRP**: Se aplican con la tasa configurada explícitamente en el perfil de retención del proveedor (*tablas de alícuotas automáticas marcadas como pendientes de verificación legal*).
3. **Exclusiones**: No se retiene sobre Notas de Crédito (`110`) ni sobre comprobantes de venta emitidos.

---

## 🔍 Validaciones Fiscales Implementadas en Código

1. **RUC Paraguayo**:
   * Algoritmo de validación del **Dígito Verificador (DV) Módulo 11** paraguayo (`mod11Dv`), con peso ponderado 2 a 9 y divisor 11.
2. **CDC SIFEN (Código de Control)**:
   * Validación estructural de 44 dígitos numéricos y cálculo del dígito verificador final (posición 44).
3. **Vigencia de Timbrado**:
   * Validación de fecha de emisión del comprobante dentro del rango de vigencia (`valid_from` a `valid_to`) si la empresa tiene timbrados configurados.
4. **Coherencia Numérica en Carga Manual**:
   * Validación estricta de que la suma de gravados (10% + 5% + Exento) o importes desglosados coincida con el total declarado del comprobante.
