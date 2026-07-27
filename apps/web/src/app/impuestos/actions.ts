"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

interface TaxData {
  type: "iva" | "ire" | "irp" | "retenciones";
  values: Record<string, string>;
  result: Record<string, number>;
}

export async function runTaxCopilotAction(data: TaxData) {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (!key) {
    // Fallback: rule-based response
    const suggestions: string[] = [];
    if (data.type === "iva") {
      suggestions.push("Verificá que las compras de bienes de capital permitan acreditar el 100% del IVA Crédito Fiscal en el mes de la adquisición (Art. 88 Ley 6380/19).");
      suggestions.push("Las exportaciones están exentas de IVA pero generan derecho a devolución del crédito fiscal correspondiente.");
    } else if (data.type === "ire") {
      suggestions.push("Recordá que el IRE admite deducción de gastos de representación hasta el 1% de los ingresos gravados.");
      suggestions.push("El remanente de pérdidas fiscales puede deducirse en los siguientes 5 ejercicios fiscales.");
    }
    return {
      success: true,
      analysis: `Análisis local completado.\n\n${suggestions.map(s => `• ${s}`).join("\n\n")}`,
      optimizations: suggestions,
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: `Sos un asesor fiscal experto en la legislación tributaria del Paraguay (Ley 6380/19, Ley 6359/19 y resoluciones DNIT).
Tu rol es analizar datos de una calculadora de impuestos y proporcionar optimizaciones fiscales legales, alertas de riesgo y consejos prácticos.
Responde SIEMPRE en español, de forma clara y concisa. Enfocate en datos específicos del cálculo presentado.
Formato: resumen ejecutivo (2-3 líneas), luego 3-4 bullets con optimizaciones o alertas específicas.`
    });

    const typeLabels: Record<string, string> = {
      iva: "IVA (Impuesto al Valor Agregado)",
      ire: "IRE (Impuesto a la Renta Empresarial)",
      irp: "IRP (Impuesto a la Renta Personal)",
      retenciones: "Retenciones en la Fuente",
    };

    const prompt = `Analiza el siguiente cálculo de ${typeLabels[data.type]}:

Datos ingresados: ${JSON.stringify(data.values, null, 2)}

Resultado calculado: ${JSON.stringify(data.result, null, 2)}

Proporciona:
1. Análisis del resultado y si es razonable para una empresa paraguaya
2. Posibles optimizaciones fiscales legales
3. Alertas de riesgo o errores potenciales
4. Consejos para minimizar la carga tributaria cumpliendo la ley`;

    const response = await model.generateContent(prompt);
    const text = response.response.text();

    return {
      success: true,
      analysis: text,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
