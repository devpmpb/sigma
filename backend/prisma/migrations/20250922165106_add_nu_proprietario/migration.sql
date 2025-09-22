-- AlterTable
ALTER TABLE "public"."Propriedade" ADD COLUMN     "nuProprietarioId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."Propriedade" ADD CONSTRAINT "Propriedade_nuProprietarioId_fkey" FOREIGN KEY ("nuProprietarioId") REFERENCES "public"."Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
