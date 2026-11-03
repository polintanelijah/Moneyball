def build_trade_prompt(trade):

    team_a_players = "\n".join(
        f"- {p.name}, {p.position}, cap hit ${p.capHit:,}"
        for p in trade.teamAPlayers
    )

    team_b_players = "\n".join(
        f"- {p.name}, {p.position}, cap hit ${p.capHit:,}"
        for p in trade.teamBPlayers
    )

    cap_a = sum(p.capHit for p in trade.teamAPlayers) / 1e6
    cap_b = sum(p.capHit for p in trade.teamBPlayers) / 1e6
    
    # Net cap change = (Incoming Cap) - (Outgoing Cap)
    net_a = cap_b - cap_a  # Positive means taking on cap hit (losing cap space)
    net_b = cap_a - cap_b  # Negative means saving money (gaining cap space)

    return f"""
You are an NFL general manager assistant.

Analyze this proposed trade.

<VERIFIED_TRADE_DATA>
- TEAM 1 ({trade.teamA.name}) GIVES UP: {team_a_players}. {trade.teamA.name} RECEIVES {team_b_players}.
- TEAM 2 ({trade.teamB.name}) GIVES UP: {team_b_players}. {trade.teamB.name} RECEIVES {team_a_players}.

Current cap space and financial status:

CAP IMPACT DATA (Use these exact facts):
- TEAM 1 {trade.teamA.name}: Takes on ${net_a:+.1f}M in net cap hit ({"reduces available cap space" if net_a > 0 else "frees up available cap space"}).
- TEAM 2 {trade.teamB.name}: Takes on ${net_b:+.1f}M in net cap hit ({"reduces available cap space" if net_b > 0 else "frees up available cap space"}).

</VERIFIED_TRADE_DATA>

<UNIVERSAL_GM_RULES>
1. POSITION SCARCITY: Elite positions (especially starting Quarterbacks) carry extreme value. Trading away a proven starting-caliber QB without receiving a starting-caliber QB or elite draft capital in return is organizational malpractice and must be REJECTED.
2. ROSTER REDUNDANCY: Teams will not trade significant assets to acquire a high-priced starting player at a position where they already have an entrenched elite starter, as it ties up unneeded cap space.
3. VALUE EQUIVALENCE: Cap relief alone does not justify trading away an elite positional cornerstone unless the compensation matches.
</UNIVERSAL_GM_RULES>

<STRICT_RULES>
- Do not invent contract numbers or statistics that were not provided.
- Remember that {trade.teamA.name} IS RECEIVING {team_b_players} to replace {team_a_players}.
- Remember that {trade.teamB.name} IS RECEIVING {team_a_players} to replace {team_b_players}.
- Do not make the decision solely based on cap hits. You must consider real-world player value, particularly for starting quarterbacks.
- Keep bullet points concise and easy to skim.
- Use bold text for team names and key player names.
- Do not skip any of the 5 sections outlined below. Do not skip any of the bullet points within each section.
- Must make final decision, either ACCEPTABLE or REJECTED.
</STRICT_RULES>

Format your response using the exact markdown headings below: 

### Executive Verdict
- **VERDICT: [Choose EXACTLY ONE: ACCEPTABLE | REJECTED]**
- **Summary**: Provide a 1-2 sentence summary declaring whether this trade is balanced, realistic, or heavily favors one side.

### Salary Cap Impact
- **{trade.teamA.name}**: [Analyze immediate cap hits and long-term financial viability]
- **{trade.teamB.name}**: [Analyze immediate cap hits and long-term financial viability]

### Player & Positional Value
- {trade.teamA.name}: [Roster impact of losing {team_a_players}]
- {trade.teamB.name}: [Roster impact of losing {team_b_players}] 

### Benefits & Risks
- **{trade.teamA.name} Benefits**: 
- **{trade.teamA.name} Risks**: 
- **{trade.teamB.name} Benefits**: 
- **{trade.teamB.name} Risks**: 

### Final Conclusion
- **FINAL DECISION: [Choose exactly ONE: ACCEPTABLE | REJECTED]**
- **Conclusion**: Then, provide a 3 sentence summary on final thoughts.


"""
