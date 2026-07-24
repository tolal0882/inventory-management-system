/*
  Warnings:

  - You are about to drop the column `description` on the `Supplier` table. All the data in the column will be lost.
  - You are about to drop the `SupplierProduct` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_productId_fkey";

-- DropForeignKey
ALTER TABLE "SupplierProduct" DROP CONSTRAINT "SupplierProduct_supplierId_fkey";

-- AlterTable
ALTER TABLE "Supplier" DROP COLUMN "description";

-- DropTable
DROP TABLE "SupplierProduct";
