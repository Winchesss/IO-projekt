import Link from "next/link";
import { GameResult } from "@prisma/client";
import { CompleteRoundButton } from "@/components/tournament-engine/round-actions";
import { ResultForm } from "@/components/tournament-engine/result-form";
import { Badge } from "@/components/ui/badge";
import { gameResultLabels, roundStatusLabels } from "@/lib/constants/tournaments";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  rating: number;
  startNumber: number | null;
} | null;

type RoundWithGames = {
  id: string;
  roundNumber: number;
  status: string;
  games: Array<{
    id: string;
    boardNumber: number;
    result: string;
    whiteRegistration: Player;
    blackRegistration: Player;
  }>;
};

export function RoundsTable({
  tournamentId,
  rounds,
  editable,
  playerHrefBase
}: {
  tournamentId: string;
  rounds: RoundWithGames[];
  editable: boolean;
  playerHrefBase?: string;
}) {
  if (rounds.length === 0) {
    return <p className="rounded-lg border border-dashed bg-white p-8 text-center text-slate-600">Nie utworzono jeszcze rund.</p>;
  }

  return (
    <div className="space-y-6">
      {rounds.map((round) => {
        const roundOpen = round.status === "PAIRINGS_PUBLISHED" || round.status === "IN_PROGRESS";
        const completeDisabled = !roundOpen || round.games.length === 0 || round.games.some((game) => game.result === GameResult.NOT_PLAYED);
        return (
          <section key={round.id} id={`runda-${round.roundNumber}`} className="rounded-lg border bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">Runda {round.roundNumber}</h2>
                <Badge variant={round.status === "COMPLETED" ? "success" : roundOpen ? "secondary" : "muted"}>
                  {roundStatusLabels[round.status as keyof typeof roundStatusLabels]}
                </Badge>
              </div>
              {editable ? <CompleteRoundButton tournamentId={tournamentId} roundId={round.id} disabled={completeDisabled || round.status === "COMPLETED"} /> : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b text-slate-500">
                  <tr>
                    <th className="py-2 pl-4 pr-3">Szach.</th>
                    <th className="py-2 pr-3">Białe</th>
                    <th className="py-2 pr-3">Wynik</th>
                    <th className="py-2 pr-3">Czarne</th>
                    {editable ? <th className="py-2 pr-4">Akcje</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {round.games.map((game) => {
                    const bye = !game.blackRegistration || !game.whiteRegistration;
                    return (
                      <tr key={game.id} className="border-b last:border-0">
                        <td className="py-3 pl-4 pr-3 font-medium">{game.boardNumber}</td>
                        <td className="py-3 pr-3">{playerLabel(game.whiteRegistration, playerHrefBase)}</td>
                        <td className="py-3 pr-3 font-semibold">{gameResultLabels[game.result as keyof typeof gameResultLabels]}</td>
                        <td className="py-3 pr-3">{playerLabel(game.blackRegistration, playerHrefBase) ?? "Pauza"}</td>
                        {editable && roundOpen ? (
                          <td className="py-3 pr-4">
                            <ResultForm tournamentId={tournamentId} gameId={game.id} defaultResult={game.result} bye={bye} />
                          </td>
                        ) : editable ? (
                          <td className="py-3 pr-4 text-sm text-slate-500">{round.status === "COMPLETED" ? "Runda zakończona" : "Oczekuje"}</td>
                        ) : null}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

function playerLabel(player: Player, playerHrefBase?: string) {
  if (!player) {
    return null;
  }

  const label = `${player.startNumber ? `${player.startNumber}. ` : ""}${player.firstName} ${player.lastName} (${player.rating})`;
  if (!playerHrefBase) {
    return label;
  }

  return (
    <Link className="text-amber-700 hover:underline" href={`${playerHrefBase}/${player.id}`}>
      {label}
    </Link>
  );
}
