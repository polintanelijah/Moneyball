def build_trade_prompt(trade):

    team_a_players = "\n".join(
        f"- {p.name}, {p.position}, cap hit ${p.capHit:,}"
        for p in trade.teamAPlayers
    )

    team_b_players = "\n".join(
        f"- {p.name}, {p.position}, cap hit ${p.capHit:,}"
        for p in trade.teamBPlayers
    )

    return f"""
You are an NFL general manager assistant.

Analyze this proposed trade.

{trade.teamA.name} trades:
{team_a_players}

{trade.teamB.name} trades:
{team_b_players}

Current cap space:

{trade.teamA.name}: ${trade.teamA.capSpace:,}
{trade.teamB.name}: ${trade.teamB.capSpace:,}

Analyze:

1. Player value
2. Positional value
3. Salary cap impact
4. Benefits for each team
5. Risks for each team

Do not invent contract numbers or statistics that were not provided.
"""
