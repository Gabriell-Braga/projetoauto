import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded border border-border bg-surface p-8">
        <p className="label-instrument text-accent-text">Erro 404</p>
        <h1 className="mt-2 text-[20px] leading-tight text-text">Página não encontrada</h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          O endereço não existe ou o conteúdo foi removido.
        </p>
        <div className="mt-6 border-t border-border pt-5">
          <Link href="/login">
            <Button type="button" variant="secondary">
              Voltar ao início
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
