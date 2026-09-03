import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { todayStart } from "@/lib/dates";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string | number) {
  const text = String(value);
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user || user.role !== "MEDICAL_SHOP") {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  const today = todayStart();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [medicineHistory, bloodDispenseHistory, bloodReportHistory] = await Promise.all([
    prisma.medicineDispense.findMany({
      where: { createdAt: { gte: today, lt: tomorrow } },
      include: {
        appointment: { include: { patient: true } },
        serviceBooking: { include: { patient: true } },
        inventoryItem: true,
        dispensedBy: true
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.bloodRequest.findMany({
      where: {
        status: "DISPENSED",
        updatedAt: { gte: today, lt: tomorrow }
      },
      include: { patient: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.serviceBooking.findMany({
      where: {
        serviceType: "BLOOD_REPORT",
        status: "COMPLETED",
        updatedAt: { gte: today, lt: tomorrow }
      },
      include: { patient: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  const csvLines = [
    "Category,Item,Quantity,Unit,Patient,Reference,Dispensed By,Reason,Time",
    ...medicineHistory.map((entry) =>
      [
        entry.dispenseCategory.replaceAll("_", " "),
        entry.inventoryItem.name,
        entry.quantity,
        entry.inventoryItem.unit,
        entry.appointment?.patient.name ?? entry.serviceBooking?.patient.name ?? "",
        `Serial #${entry.appointment?.serialNumber ?? entry.serviceBooking?.serialNumber ?? ""}`,
        entry.dispensedBy.name,
        entry.note ?? "",
        entry.createdAt.toISOString()
      ]
        .map(escapeCsv)
        .join(",")
    ),
    ...bloodDispenseHistory.map((entry) =>
      [
        "Blood",
        entry.bloodType,
        entry.pouches,
        "pouch(es)",
        entry.patient.name,
        `Blood serial #${entry.serialNumber}`,
        "Medical shop",
        entry.reason,
        entry.updatedAt.toISOString()
      ]
        .map(escapeCsv)
        .join(",")
    ),
    ...bloodReportHistory.map((entry) =>
      [
        "Blood Report",
        "Blood report handled",
        1,
        "entry",
        entry.patient.name,
        `Blood report serial #${entry.serialNumber}`,
        "Medical shop",
        entry.adminTimingNote ?? "",
        entry.updatedAt.toISOString()
      ]
        .map(escapeCsv)
        .join(",")
    )
  ];

  return new NextResponse(csvLines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="daily-dispense-history-${today.toISOString().slice(0, 10)}.csv"`
    }
  });
}
