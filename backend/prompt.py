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

TRADE DETAILS:
- {trade.teamA.name} trades: {team_a_players}
- {trade.teamB.name} trades: {team_b_players}

Current cap space and financial status:

{trade.teamA.name}: ${trade.teamA.capSpace:,}
{trade.teamB.name}: ${trade.teamB.capSpace:,}

Analyze:

1. Player value
2. Positional value
3. Salary cap impact
4. Benefits for each team
5. Risks for each team

Do not invent contract numbers or statistics that were not provided.

Format your response using the exact markdown headings below: 

### Executive Verdict
- **VERDICT: [Choose EXACTLY ONE: ACCEPTABLE | REJECTED] **
- **Summary**: Provide a 1-2 sentence quick summary declaring whether this trade is balanced, realistic, or heavily favors one side, to justify the decision of ACCEPTABLE or REJECTED.

### Salary Cap Impact
- **{trade.teamA.name}**: [Analyze immediate cap hits and long-term financial viability]
- **{trade.teamB.name}**: [Analyze immediate cap hits and long-term financial viability]

### Player & Positional Value
- [Evaluate player talents, age, and position priority for the assets swapped]

### Benefits & Risks
- **{trade.teamA.name} Benefits**: 
- **{trade.teamA.name} Risks**: 
- **{trade.teamB.name} Benefits**: 
- **{trade.teamB.name} Risks**: 

### Final Conclusion
- **FINAL DECISION: [Choose exactly ONE: ACCEPTABLE | REJECTED]**
- **Conclusion**: Then, provide a 3 sentence summary on final thoughts.

RULES:
- Do not invent contract numbers or statistics that were not provided.
- Keep bullet points concise and easy to skim.
- Use bold text for team names and key player names.
- Do not skip any of the 5 sections outlined above.
- Must make final decision, either ACCEPTABLE or REJECTED.
"""
