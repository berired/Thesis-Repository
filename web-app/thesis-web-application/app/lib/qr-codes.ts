import { prisma } from "./prisma";
import { deleteQrImage } from "./storage";

export type DeleteQrResult = "deleted" | "claimed" | "not-found";

// A code linked to a pet can't be deleted; the status alone doesn't matter.
export async function deleteQrCode(id: string): Promise<DeleteQrResult> {
  const qr = await prisma.qrCode.findUnique({ where: { id } });
  if (!qr) return "not-found";

  const { count } = await prisma.qrCode.deleteMany({
    where: { id, pet: null },
  });
  if (count === 0) return "claimed";

  if (qr.imageKey) {
    await deleteQrImage(qr.imageKey).catch(() => {});
  }
  return "deleted";
}
