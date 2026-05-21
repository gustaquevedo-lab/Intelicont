import { loadEntidadesParaIVA } from "./actions";
import { LibroIVAClient } from "./_components/libro-iva-client";

export const metadata = { title: "Libro IVA" };

export default async function LibroIVAPage() {
  const entResult = await loadEntidadesParaIVA();
  const now       = new Date();

  return (
    <LibroIVAClient
      entities={entResult.ok ? entResult.data : []}
      defaultYear={now.getFullYear()}
      defaultMonth={now.getMonth() + 1}
      dbError={entResult.ok ? undefined : entResult.error}
    />
  );
}
