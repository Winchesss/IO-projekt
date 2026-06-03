import Link from "next/link";
import { formatChessCategory } from "@/lib/constants/chess";

type StandingRow = {
  rank: number;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  forfeits: number;
  buchholz: number | null;
  medianBuchholz: number | null;
  sonnebornBerger: number | null;
  progressiveScore: number | null;
  registration: {
    id: string;
    firstName: string;
    lastName: string;
    clubOrCity: string;
    birthYear: number | null;
    rating: number;
    chessCategory: string;
  };
};

export function StandingsTable({
  standings,
  playerHrefBase
}: {
  standings: StandingRow[];
  playerHrefBase?: string;
}) {
  if (standings.length === 0) {
    return <p className="rounded-lg border border-dashed bg-white p-8 text-center text-slate-600">Tabela nie została jeszcze utworzona.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[1040px] text-left text-sm">
        <thead className="border-b text-slate-500">
          <tr>
            <th className="py-2 pl-4 pr-3">Miejsce</th>
            <th className="py-2 pr-3">Zawodnik</th>
            <th className="py-2 pr-3">Klub / miasto</th>
            <th className="py-2 pr-3">Rok urodzenia</th>
            <th className="py-2 pr-3">Ranking</th>
            <th className="py-2 pr-3">Kategoria</th>
            <th className="py-2 pr-3">Punkty</th>
            <th className="py-2 pr-3">Buchholz</th>
            <th className="py-2 pr-3">Median Buchholz</th>
            <th className="py-2 pr-3">Sonneborn-Berger</th>
            <th className="py-2 pr-4">Progres</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((standing) => (
            <tr key={standing.registration.id} className="border-b last:border-0">
              <td className="py-3 pl-4 pr-3 font-semibold">{standing.rank}</td>
              <td className="py-3 pr-3 font-medium">
                {playerHrefBase ? (
                  <Link className="text-amber-700 hover:underline" href={`${playerHrefBase}/${standing.registration.id}`}>
                    {standing.registration.firstName} {standing.registration.lastName}
                  </Link>
                ) : (
                  <>
                    {standing.registration.firstName} {standing.registration.lastName}
                  </>
                )}
              </td>
              <td className="py-3 pr-3">{standing.registration.clubOrCity}</td>
              <td className="py-3 pr-3">{standing.registration.birthYear ?? "Brak"}</td>
              <td className="py-3 pr-3">{standing.registration.rating}</td>
              <td className="py-3 pr-3">{formatChessCategory(standing.registration.chessCategory)}</td>
              <td className="py-3 pr-3 font-semibold">{formatPoints(standing.points)}</td>
              <td className="py-3 pr-3">{formatPoints(standing.buchholz ?? 0)}</td>
              <td className="py-3 pr-3">{formatPoints(standing.medianBuchholz ?? 0)}</td>
              <td className="py-3 pr-3">{formatPoints(standing.sonnebornBerger ?? 0)}</td>
              <td className="py-3 pr-4">{formatPoints(standing.progressiveScore ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatPoints(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
