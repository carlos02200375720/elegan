import { Request, Response } from "express";
import mongoose from "mongoose";
import { MongoInvitado, MongoUser } from "../models";
import { waitForMongoConnection } from "../utils/mongoConnection";

const ANALYTICS_TIME_ZONE = "America/Santo_Domingo";

type VisitorPlatform = "web" | "android";

function getDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(dateKey: string, amount: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return date.toISOString().slice(0, 10);
}

function getTimeZoneOffsetMs(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values: Record<string, string> = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );
  return representedAsUtc - date.getTime();
}

function getZonedMidnightUtc(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  const localMidnightRepresentedAsUtc = Date.UTC(year, month - 1, day);
  const offset = getTimeZoneOffsetMs(new Date(localMidnightRepresentedAsUtc));
  return new Date(localMidnightRepresentedAsUtc - offset);
}

function emptyPlatformStats() {
  return {
    visitors: 0,
    guests: 0,
    registeredVisitors: 0,
    registrations: 0,
    visits: 0,
  };
}

function emptyDayStats(date: string) {
  return {
    date,
    visitors: 0,
    guests: 0,
    registeredVisitors: 0,
    registrations: 0,
    visits: 0,
    web: emptyPlatformStats(),
    android: emptyPlatformStats(),
  };
}

/**
 * POST /api/analytics/visitors/track
 * Stores one anonymous daily visitor record in the "invitados" collection.
 * The same visitor/platform/day is updated on refresh instead of creating duplicates.
 */
export async function trackDailyVisitor(req: Request, res: Response): Promise<void> {
  try {
    if (!(await waitForMongoConnection())) {
      res.status(503).json({ error: "MongoDB no está disponible para registrar la visita." });
      return;
    }

    const rawVisitorId = String(
      req.body?.visitorId || req.headers["x-guest-token"] || ""
    ).trim();
    if (rawVisitorId.length < 8 || rawVisitorId.length > 160) {
      res.status(400).json({ error: "Identificador anónimo de visitante inválido." });
      return;
    }

    const rawPlatform = String(
      req.body?.platform ||
      req.headers["x-client-platform"] ||
      req.headers["x-platform"] ||
      "web"
    ).trim().toLowerCase();
    const platform: VisitorPlatform = rawPlatform === "android" ? "android" : "web";

    const suppliedUserId = String(req.body?.userId || "").trim();
    let visitorType: "guest" | "registered" = "guest";
    let resolvedUserId = "";

    if (
      req.body?.visitorType === "registered" &&
      suppliedUserId &&
      !["current_user", "user_guest", "guest", "invitado"].includes(suppliedUserId.toLowerCase())
    ) {
      const userCriteria: any[] = [{ id: suppliedUserId }];
      if (mongoose.isValidObjectId(suppliedUserId)) {
        userCriteria.push({ _id: suppliedUserId });
      }
      const registeredUser = await MongoUser.findOne({
        $or: userCriteria,
        isGuest: { $ne: true },
      }).select("id").lean();

      if (registeredUser) {
        visitorType = "registered";
        resolvedUserId = String(registeredUser.id || suppliedUserId);
      }
    }

    const now = new Date();
    const dateKey = getDateKey(now);
    const filter = { visitorId: rawVisitorId, dateKey, platform };
    const update = {
      $set: {
        visitorType,
        userId: resolvedUserId,
        lastVisitAt: now,
      },
      $setOnInsert: {
        visitorId: rawVisitorId,
        dateKey,
        platform,
        firstVisitAt: now,
      },
      $inc: { visitCount: 1 },
    };

    try {
      await MongoInvitado.findOneAndUpdate(filter, update, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: false,
      });
    } catch (writeError: any) {
      // Handle two simultaneous first requests from the same visitor safely.
      if (writeError?.code !== 11000) throw writeError;
      await MongoInvitado.updateOne(filter, {
        $set: { visitorType, userId: resolvedUserId, lastVisitAt: now },
        $inc: { visitCount: 1 },
      });
    }

    res.json({ success: true, dateKey, platform, visitorType });
  } catch (err: any) {
    console.error("❌ Error registrando visitante diario:", err);
    res.status(500).json({
      error: "No se pudo registrar la visita.",
      details: err?.message,
    });
  }
}

/**
 * GET /api/analytics/visitors/daily?days=7
 * Returns daily unique visitors by platform, anonymous visitors, registered visitors,
 * and new registrations. The day boundary follows America/Santo_Domingo.
 */
export async function getDailyVisitorAnalytics(req: Request, res: Response): Promise<void> {
  try {
    if (!(await waitForMongoConnection())) {
      res.status(503).json({ error: "MongoDB no está disponible para consultar las métricas." });
      return;
    }

    const requestedDays = Number.parseInt(String(req.query.days || "7"), 10);
    const daysCount = Number.isFinite(requestedDays)
      ? Math.min(31, Math.max(1, requestedDays))
      : 7;

    const now = new Date();
    const todayKey = getDateKey(now);
    const startKey = shiftDateKey(todayKey, -(daysCount - 1));
    const endExclusiveKey = shiftDateKey(todayKey, 1);
    const startDate = getZonedMidnightUtc(startKey);
    const endDate = getZonedMidnightUtc(endExclusiveKey);

    const [visitorRecords, registeredUsers] = await Promise.all([
      MongoInvitado.find({
        dateKey: { $gte: startKey, $lt: endExclusiveKey },
      }).select("dateKey platform visitorType visitCount").lean(),
      MongoUser.find({
        registeredAt: { $gte: startDate, $lt: endDate },
        isGuest: { $ne: true },
      }).select("registeredAt registrationPlatform").lean(),
    ]);

    const dailyMap = new Map<string, any>();
    for (let i = 0; i < daysCount; i += 1) {
      const key = shiftDateKey(startKey, i);
      dailyMap.set(key, emptyDayStats(key));
    }

    for (const record of visitorRecords as any[]) {
      const day = dailyMap.get(String(record.dateKey));
      if (!day) continue;
      const platform: VisitorPlatform = record.platform === "android" ? "android" : "web";
      const type = record.visitorType === "registered" ? "registeredVisitors" : "guests";
      day.visitors += 1;
      day[type] += 1;
      day.visits += Number(record.visitCount) || 1;
      day[platform].visitors += 1;
      day[platform][type] += 1;
      day[platform].visits += Number(record.visitCount) || 1;
    }

    for (const user of registeredUsers as any[]) {
      const dateKey = getDateKey(new Date(user.registeredAt));
      const day = dailyMap.get(dateKey);
      if (!day) continue;
      const platform: VisitorPlatform = user.registrationPlatform === "android" ? "android" : "web";
      day.registrations += 1;
      day[platform].registrations += 1;
    }

    const daily = Array.from(dailyMap.values());
    const today = daily[daily.length - 1] || emptyDayStats(todayKey);
    const period = daily.reduce((sum, day) => {
      sum.visitors += day.visitors;
      sum.guests += day.guests;
      sum.registeredVisitors += day.registeredVisitors;
      sum.registrations += day.registrations;
      sum.visits += day.visits;
      sum.web.visitors += day.web.visitors;
      sum.web.guests += day.web.guests;
      sum.web.registeredVisitors += day.web.registeredVisitors;
      sum.web.registrations += day.web.registrations;
      sum.web.visits += day.web.visits;
      sum.android.visitors += day.android.visitors;
      sum.android.guests += day.android.guests;
      sum.android.registeredVisitors += day.android.registeredVisitors;
      sum.android.registrations += day.android.registrations;
      sum.android.visits += day.android.visits;
      return sum;
    }, emptyDayStats("period"));

    res.json({
      success: true,
      timezone: ANALYTICS_TIME_ZONE,
      today,
      period,
      daily,
      updatedAt: now.toISOString(),
    });
  } catch (err: any) {
    console.error("❌ Error consultando métricas de visitantes:", err);
    res.status(500).json({
      error: "Error obteniendo métricas diarias de visitantes.",
      details: err?.message,
    });
  }
}
