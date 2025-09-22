-- CreateEnum
CREATE TYPE "public"."AtividadeProdutiva" AS ENUM ('AGRICULTURA', 'PECUARIA', 'AGRICULTURA_PECUARIA', 'SILVICULTURA', 'AQUICULTURA', 'HORTIFRUTI', 'AVICULTURA', 'SUINOCULTURA', 'OUTROS');

-- AlterTable
ALTER TABLE "public"."Propriedade" ADD COLUMN     "atividadeProdutiva" "public"."AtividadeProdutiva";
