"use client";

import { useState } from "react";

const P = {
  paper: "#efe7d2",
  paper2: "#e7dec9",
  ink: "#221d15",
  ink2: "#4a4031",
  faint: "#8a7d63",
  rule: "#3a3225",
  red: "#a8311f",
  navy: "#2d3a52",
  ochre: "#b8862f",
};

type Row = {
  id: number;
  name?: string;
  ticker?: string;
  token: string;
  deployer?: string;
  reason?: string;
  tags?: string[];
  solStolen?: number | null;
  confidence?: number | null;
  imageUrl?: string | null;
  date?: string;
};

function trunc(s?: string) {
  if (!s) return "—";
  return s.length > 16 ? `${s.slice(0, 6)}…${s.slice(-6)}` : s;
}

export default function Admin() {
  const [key, setKey] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = async () => {
    setMsg("Loading queue…");
    try {
      const res = await fetch("/api/admin/pending", { headers: { "x-admin-key": key } });
      if (res.status === 401) {
        setMsg("Wrong admin key.");
        setLoaded(false);
        return;
      }
      const data = await res.json();
      const list: Row[] = Array.isArray(data) ? data : [];
      setRows(list);
      setLoaded(true);
      setMsg(list.length ? "" : "Nothing pending — queue is clear.");
    } catch {
      setMsg("Couldn't reach the server.");
    }
  };

  const moderate = async (row: Row, status: string) => {
    setBusy(row.id);
    try {
      const res = await fetch("/api/admin/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": key },
        body: JSON.stringify({ id: row.id, token: row.token, status }),
      });
      if (res.ok) {
        setRows((r) => r.filter((x) => x.id !== row.id));
      } else {
        setMsg("That action failed — try reloading the queue.");
      }
    } catch {
      setMsg("That action failed — try reloading the queue.");
    }
    setBusy(null);
  };

  return (
    <div className="ad-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Special+Elite&display=swap');
        .ad-root{min-height:100vh;background:#cfc6ae;padding:28px 16px 60px;font-family:'Special Elite',ui-monospace,monospace;color:${P.ink};}
        .ad-sheet{max-width:880px;margin:0 auto;background:${P.paper};border:3px double ${P.rule};box-shadow:0 10px 30px rgba(0,0,0,.28);padding:24px;}
        .ad-h{font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:22px;margin:0 0 4px;}
        .ad-sub{font-size:12px;color:${P.faint};letter-spacing:.08em;text-transform:uppercase;margin-bottom:18px;}
        .ad-gate{display:flex;gap:10px;flex-wrap:wrap;align-items:center;border:2px solid ${P.rule};background:${P.paper2};padding:14px;}
        .ad-in{flex:1;min-width:200px;background:${P.paper};border:2px solid ${P.rule};padding:10px 12px;font-family:'Special Elite',monospace;font-size:13px;color:${P.ink};}
        .ad-btn{font-family:'Oswald',sans-serif;font-weight:700;letter-spacing:.08em;text-transform:uppercase;font-size:13px;border:none;padding:10px 18px;cursor:pointer;color:${P.paper};background:${P.ink};}
        .ad-msg{font-size:12px;color:${P.navy};margin:12px 2px;min-height:16px;}
        .ad-card{border:2px solid ${P.rule};background:${P.paper2};padding:16px;margin-top:16px;}
        .ad-name{font-family:'Oswald',sans-serif;font-weight:700;font-size:18px;text-transform:uppercase;}
        .ad-field{font-size:12px;color:${P.ink2};margin-top:5px;word-break:break-all;}
        .ad-field span{color:${P.faint};letter-spacing:.06em;display:inline-block;min-width:120px;font-size:10px;text-transform:uppercase;}
        .ad-tags{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;}
        .ad-tag{font-size:11px;border:1px solid ${P.ochre};color:${P.ink2};padding:2px 7px;}
        .ad-reason{font-size:12.5px;line-height:1.5;color:${P.ink2};border-left:3px solid ${P.ochre};padding-left:10px;margin-top:10px;}
        .ad-exh{margin-top:10px;}
        .ad-exh img{max-width:100%;border:2px solid ${P.rule};background:#0d0d0d;display:block;}
        .ad-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;border-top:1px dashed ${P.rule};padding-top:12px;}
        .ad-approve{background:#2e6b3a;}
        .ad-flag{background:${P.ochre};color:${P.ink};}
        .ad-reject{background:${P.red};}
        .ad-actions .ad-btn:disabled{opacity:.5;cursor:default;}
        .ad-foot{margin-top:22px;font-size:10.5px;color:${P.faint};letter-spacing:.06em;text-transform:uppercase;text-align:center;}
        .ad-root ::placeholder{color:${P.faint};}
      `}</style>

      <div className="ad-sheet">
        <div className="ad-h">R.B.I. — Review Queue</div>
        <div className="ad-sub">Pending claims · approve to publish · nothing is live until you say so</div>

        <div className="ad-gate">
          <input
            className="ad-in"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Admin key"
            onKeyDown={(e) => { if (e.key === "Enter") load(); }}
          />
          <button className="ad-btn" onClick={load}>Load queue</button>
        </div>

        <div className="ad-msg">{msg}</div>

        {loaded && rows.map((row) => (
          <div key={row.id} className="ad-card">
            <div className="ad-name">{row.name || "Unnamed token"}{row.ticker ? ` · $${row.ticker}` : ""}</div>
            <div className="ad-field"><span>Subject wallet</span>{trunc(row.deployer)}</div>
            <div className="ad-field"><span>Token mint</span>{trunc(row.token)}</div>
            {row.solStolen != null && <div className="ad-field"><span>Funds extracted</span>{row.solStolen} SOL</div>}
            {row.confidence != null && <div className="ad-field"><span>AI confidence</span>{Math.round(row.confidence * 100)}%</div>}
            {row.tags && row.tags.length > 0 && (
              <div className="ad-tags">{row.tags.map((t) => <span key={t} className="ad-tag">{t}</span>)}</div>
            )}
            {row.reason && <div className="ad-reason">{row.reason}</div>}
            {row.imageUrl && (
              <div className="ad-exh">
                <img src={row.imageUrl} alt="evidence screenshot" loading="lazy" />
              </div>
            )}
            <div className="ad-actions">
              <button className="ad-btn ad-approve" disabled={busy === row.id} onClick={() => moderate(row, "confirmed")}>Approve</button>
              <button className="ad-btn ad-flag" disabled={busy === row.id} onClick={() => moderate(row, "flagged")}>Flag</button>
              <button className="ad-btn ad-reject" disabled={busy === row.id} onClick={() => moderate(row, "rejected")}>Reject</button>
            </div>
          </div>
        ))}

        <div className="ad-foot">Approve → published · Flag → published as unverified · Reject → hidden</div>
      </div>
    </div>
  );
}
