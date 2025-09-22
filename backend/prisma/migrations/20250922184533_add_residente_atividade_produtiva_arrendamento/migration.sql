-- AlterTable
ALTER TABLE "public"."Arrendamento" ADD COLUMN     "atividadeProdutiva" "public"."AtividadeProdutiva",
ADD COLUMN     "residente" BOOLEAN NOT NULL DEFAULT false;
