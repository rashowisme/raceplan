/**
 * Printable plan (A4 landscape) rendered with @react-pdf/renderer.
 * Uses the built-in Helvetica font (no network requests) and the same
 * formatter as the calendar, so units and language always match the screen.
 */
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { addDays } from "@/engine/dates";
import { PACE_ZONES, WEEKDAYS, type Effort, type Phase, type TrainingPlan } from "@/engine/types";
import {
  effortDescription,
  effortLabel,
  formatDateLong,
  formatDayShort,
  formatMessage,
  formatPace,
  formatWarning,
  zoneLabel,
  type Formatter,
} from "@/features/plan-calendar/format";
import { formatClock, formatDistance, formatDuration, formatElevation } from "@/lib/units";

/** Hex versions of the phase colours in globals.css. */
export const PHASE_HEX: Record<Phase, string> = {
  maintenance: "#8590a2",
  base: "#2a9db0",
  build: "#d39a2b",
  specific: "#d9573d",
  taper: "#8a5cc2",
};
const RACE_HEX = "#c93045";
const MUTED = "#6b7280";
const BORDER = "#e5e7eb";

const ZONE_EFFORT: Record<(typeof PACE_ZONES)[number], Effort> = {
  E: "easy",
  M: "marathon",
  T: "threshold",
  I: "interval",
  R: "repetition",
};

const s = StyleSheet.create({
  page: { padding: 28, paddingBottom: 44, fontFamily: "Helvetica", fontSize: 9, color: "#111827" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6, marginTop: 14 },
  muted: { color: MUTED },
  row: { flexDirection: "row" },
  stat: { flex: 1, border: `1 solid ${BORDER}`, borderRadius: 4, padding: 6, marginRight: 6 },
  statValue: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 2 },
  zoneRow: { flexDirection: "row", paddingVertical: 3, borderBottom: `1 solid ${BORDER}` },
  bullet: { flexDirection: "row", marginBottom: 2 },
  week: {
    flexDirection: "row",
    border: `1 solid ${BORDER}`,
    borderRadius: 3,
    marginBottom: 5,
    minHeight: 52,
  },
  weekHead: { width: 70, padding: 4, borderRight: `1 solid ${BORDER}` },
  day: { flex: 1, padding: 3, borderRight: `1 solid ${BORDER}` },
  dayTitle: { fontFamily: "Helvetica-Bold", fontSize: 7.5 },
  dayMeta: { fontSize: 6.5, color: MUTED, marginTop: 1 },
  footer: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 18,
    fontSize: 7,
    color: MUTED,
    flexDirection: "row",
  },
});

function Footer({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  return (
    <View style={s.footer} fixed>
      <Text style={{ flex: 1 }}>{f.t(plan.disclaimer.key)}</Text>
      <Text
        style={{ marginLeft: 12 }}
        render={({ pageNumber, totalPages }) =>
          f.t("pdf.page", { page: pageNumber, total: totalPages })
        }
      />
    </View>
  );
}

function SummaryPage({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  const sum = plan.summary;
  const race = plan.profile.race;
  const raceName =
    race.type === "custom" || race.type === "trail"
      ? `${f.t(`form.raceType.${race.type}`)} · ${formatDistance(sum.raceDistanceM, f.unit, f.locale)}`
      : f.t(`form.raceType.${race.type}`);
  const stats = [
    [f.t("plan.stats.weeks"), String(sum.totalWeeks)],
    [f.t("plan.stats.runsPerWeek"), String(sum.runningDaysPerWeek)],
    [f.t("plan.stats.peak"), formatDistance(sum.peakVolumeM, f.unit, f.locale, 0)],
    sum.fitness
      ? [f.t("plan.stats.prediction"), formatClock(sum.fitness.predictedRaceTimeS)]
      : [f.t("plan.stats.style"), f.t(`form.planStyle.${plan.profile.planStyle}`)],
  ];
  return (
    <Page size="A4" orientation="landscape" style={s.page}>
      <Text style={[s.muted, { fontSize: 10 }]}>RacePlan · {raceName}</Text>
      <Text style={s.h1}>{f.t("plan.title")}</Text>
      <Text style={[s.muted, { marginTop: 2 }]}>
        {formatDateLong(f.locale, plan.raceDate)} ·{" "}
        {f.t(`form.planStyle.${plan.profile.planStyle}`)} ·{" "}
        {f.t("pdf.generatedOn", { date: formatDayShort(f.locale, plan.generatedOn) })}
      </Text>

      <View style={[s.row, { marginTop: 12 }]}>
        {stats.map(([label, value]) => (
          <View key={label} style={s.stat}>
            <Text style={s.muted}>{label}</Text>
            <Text style={s.statValue}>{value}</Text>
          </View>
        ))}
      </View>

      <View style={s.row}>
        <View style={{ flex: 1.2, marginRight: 16 }}>
          <Text style={s.h2}>
            {sum.paceZones ? f.t("plan.zonesTitle") : f.t("plan.effortsTitle")}
          </Text>
          {!sum.paceZones && (
            <Text style={[s.muted, { marginBottom: 4 }]}>{f.t("plan.effortOnlyIntro")}</Text>
          )}
          {PACE_ZONES.map((z) => (
            <View key={z} style={s.zoneRow}>
              <Text style={{ width: 80, fontFamily: "Helvetica-Bold" }}>{zoneLabel(f, z)}</Text>
              <Text style={{ width: 90 }}>
                {sum.paceZones ? formatPace(f, sum.paceZones[z]) : effortLabel(f, ZONE_EFFORT[z])}
              </Text>
              <Text style={[s.muted, { flex: 1 }]}>
                {effortLabel(f, ZONE_EFFORT[z])} — {effortDescription(f, ZONE_EFFORT[z])}
              </Text>
            </View>
          ))}
          {sum.racePaceSPerKm !== null && (
            <View style={s.zoneRow}>
              <Text style={{ width: 80, fontFamily: "Helvetica-Bold" }}>
                {zoneLabel(f, "racePace")}
              </Text>
              <Text style={{ width: 90 }}>
                {formatPace(f, { fastSPerKm: sum.racePaceSPerKm, slowSPerKm: sum.racePaceSPerKm })}
              </Text>
              <Text style={[s.muted, { flex: 1 }]}>{effortDescription(f, "race")}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          {plan.warnings.length > 0 && (
            <>
              <Text style={s.h2}>{f.t("plan.warningsTitle")}</Text>
              {plan.warnings.map((w, i) => (
                <View key={i} style={s.bullet}>
                  <Text style={{ width: 8 }}>•</Text>
                  <Text style={{ flex: 1 }}>{formatWarning(f, w)}</Text>
                </View>
              ))}
            </>
          )}
          {plan.adviceNotes.length > 0 && (
            <>
              <Text style={s.h2}>{f.t("plan.adviceTitle")}</Text>
              {plan.adviceNotes.map((n) => (
                <View key={n.key} style={s.bullet}>
                  <Text style={{ width: 8 }}>•</Text>
                  <Text style={{ flex: 1 }}>{formatMessage(f, n)}</Text>
                </View>
              ))}
            </>
          )}
          <Text style={s.h2}>{f.t("plan.phasesTitle")}</Text>
          <View style={[s.row, { flexWrap: "wrap" }]}>
            {(Object.keys(PHASE_HEX) as Phase[])
              .filter((p) => plan.weeks.some((w) => w.phase === p))
              .map((p) => (
                <View
                  key={p}
                  style={[s.row, { alignItems: "center", marginRight: 10, marginBottom: 3 }]}
                >
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: PHASE_HEX[p],
                      marginRight: 3,
                    }}
                  />
                  <Text>{f.t(`phase.${p}`)}</Text>
                </View>
              ))}
          </View>
        </View>
      </View>
      <Footer f={f} plan={plan} />
    </Page>
  );
}

function WeeksPage({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  return (
    <Page size="A4" orientation="landscape" style={s.page} wrap>
      <View style={[s.row, { marginBottom: 4 }]} fixed>
        <View style={{ width: 70 }} />
        {WEEKDAYS.map((wd) => (
          <Text key={wd} style={{ flex: 1, paddingLeft: 3, fontFamily: "Helvetica-Bold" }}>
            {f.t(`common.weekdays.${wd}`)}
          </Text>
        ))}
      </View>
      {plan.weeks.map((w) => {
        const byDay = new Map(w.days.map((d) => [d.weekday, d]));
        return (
          <View
            key={w.index}
            style={[s.week, { borderLeft: `3 solid ${PHASE_HEX[w.phase]}` }]}
            wrap={false}
          >
            <View style={s.weekHead}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>
                {f.t("plan.week", { n: w.index + 1 })}
              </Text>
              <Text style={s.dayMeta}>
                {formatDayShort(f.locale, w.startDate)} –{" "}
                {formatDayShort(f.locale, addDays(w.startDate, 6))}
              </Text>
              <Text style={[s.dayMeta, { color: PHASE_HEX[w.phase] }]}>
                {f.t(`phase.${w.phase}`)}
                {w.isCutback ? ` · ${f.t("plan.cutback")}` : ""}
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", marginTop: 2 }}>
                {formatDistance(w.plannedVolumeM, f.unit, f.locale, 0)}
              </Text>
              <Text style={s.dayMeta}>{formatDuration(w.plannedDurationS)}</Text>
              {w.elevationGainM ? (
                <Text style={s.dayMeta}>
                  {f.t("plan.weekClimb", {
                    gainM: formatElevation(w.elevationGainM, f.unit, f.locale),
                  })}
                </Text>
              ) : null}
            </View>
            {WEEKDAYS.map((wd, i) => {
              const day = byDay.get(wd);
              const wk = day?.workout ?? null;
              const isRace = wk?.type === "race";
              return (
                <View
                  key={wd}
                  style={[
                    s.day,
                    i === 6 ? { borderRight: 0 } : {},
                    isRace ? { backgroundColor: "#fbe9ec" } : {},
                  ]}
                >
                  {!day ? null : wk ? (
                    <>
                      <Text style={[s.dayTitle, isRace ? { color: RACE_HEX } : {}]}>
                        {formatMessage(f, wk.title)}
                      </Text>
                      <Text style={s.dayMeta}>
                        {formatDistance(wk.estDistanceM, f.unit, f.locale)} ·{" "}
                        {formatDuration(wk.estDurationS)}
                        {wk.optional ? ` · ${f.t("plan.optional")}` : ""}
                      </Text>
                    </>
                  ) : (
                    <Text style={s.dayMeta}>{f.t("plan.rest")}</Text>
                  )}
                </View>
              );
            })}
          </View>
        );
      })}
      <Footer f={f} plan={plan} />
    </Page>
  );
}

export function PlanDocument({ f, plan }: { f: Formatter; plan: TrainingPlan }) {
  return (
    <Document title={`RacePlan — ${plan.raceDate}`} author="RacePlan" language={f.locale}>
      <SummaryPage f={f} plan={plan} />
      <WeeksPage f={f} plan={plan} />
    </Document>
  );
}
