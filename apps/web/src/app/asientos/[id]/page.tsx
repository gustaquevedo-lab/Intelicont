import { notFound } from "next/navigation";
import { loadAsientoDetail } from "../actions";
import { AsientoDetailClient } from "./_components/asiento-detail-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const result = await loadAsientoDetail(id);
  const title  = result.ok ? `Asiento ${result.data.number}` : "Asiento";
  return { title: `${title} — InteliCont` };
}

export default async function AsientoDetailPage({ params }: Props) {
  const { id } = await params;
  const result = await loadAsientoDetail(id);

  if (!result.ok) notFound();

  return <AsientoDetailClient asiento={result.data} />;
}
